/** @vitest-environment node */
import {beforeEach,afterEach,it,expect} from 'vitest'
import {AcademyEngine,publicError,type AuthResponse} from './engine'
import {SQLiteRepository} from '../src/storage/repository'
import {TransportError,type Transport} from '../src/storage/protocol'
import {lessons} from '../src/lessons'
import {initializeSettings,saveLesson,submitQuiz,completeLesson,getMission,saveMission,saveProject,saveModuleProject,exportBackup,restoreBackup} from '../src/db'
import {emptyCapstone} from '../src/domain'
let engine:AcademyEngine,auth:AuthResponse,transport:Transport,repo:SQLiteRepository
beforeEach(async()=>{
 engine=new AcademyEngine(':memory:');auth=await engine.request('register',{name:'Repository Student',password:'repository-long-password'}) as AuthResponse
 transport={kind:'desktop-sqlite',request:async(command,payload)=>{try{return await engine.request(command,payload,auth.token)}catch(error){const detail=publicError(error);throw new TransportError(detail.code,detail.message)}}}
 repo=new SQLiteRepository(auth.snapshot,transport)
})
afterEach(()=>{repo.close();engine.close()})
it('preserves the existing learning, mission, portfolio and backup business logic over SQLite',async()=>{
 await initializeSettings({id:'local',goal:'مشروع SQLite',minutes:30,business:'مطعم',theme:'light'},repo)
 await Promise.all([saveLesson('m01-l01',{notes:'SQLite note'},repo),saveLesson('m01-l01',{bookmarked:true},repo)])
 const lesson=lessons[0],answers=Object.fromEntries(lesson.questions.map(q=>[q.id,q.answer]))
 await submitQuiz(lesson,answers,repo)
 await saveLesson(lesson.id,{assignment:'تطبيق عملي محفوظ',checked:[0,1,2]},repo)
 await completeLesson(lesson,repo)
 const day='2026-11-15',mission=await getMission(day,repo)
 expect(mission).toBeDefined();await saveMission(day,'إجابة مهمة',[0,1,2],true,repo)
 const blank=emptyCapstone('مطعم');await saveProject({...blank,name:'مشروع',fields:{market:'سوق واضح'}},blank,repo)
 await saveModuleProject({id:'module-1',response:'تسليم مشروع',checked:[0,1,2,3],completed:true},repo)
 const snapshot=await exportBackup(repo)
 expect(snapshot.lessonStates[0]).toMatchObject({notes:'SQLite note',bookmarked:true,completed:true})
 expect(snapshot.missions[0].completed).toBe(true)
 await restoreBackup(snapshot,repo)
 expect(await exportBackup(repo)).toEqual(snapshot)
 await expect(saveLesson(lesson.id,{assignment:''},repo)).rejects.toThrow()
 expect((await exportBackup(repo)).lessonStates[0].completed).toBe(true)
})
it('does not show an unacknowledged write and keeps the committed view after a storage failure',async()=>{
 let unlock!:()=>void
 const barrier=new Promise<void>(resolve=>{unlock=resolve}),base=transport.request.bind(transport)
 transport.request=async(command,payload)=>{if(command==='commit')await barrier;return base(command,payload)}
 const pending=saveLesson('m01-l01',{notes:'only after durable commit'},repo)
 await Promise.resolve();await Promise.resolve()
 expect(await repo.lessonStates.get('m01-l01')).toBeUndefined()
 unlock();await pending
 expect((await repo.lessonStates.get('m01-l01'))?.notes).toBe('only after durable commit')
 transport.request=async()=>{throw new TransportError('STORAGE','injected failure')}
 await expect(saveLesson('m01-l01',{notes:'must not appear'},repo)).rejects.toThrow()
 expect((await repo.lessonStates.get('m01-l01'))?.notes).toBe('only after durable commit')
})
it('rejects a stale tab revision and refreshes without overwriting a newer saved note',async()=>{
 const other=new SQLiteRepository(auth.snapshot,transport)
 await saveLesson('m01-l01',{notes:'first committed'},repo)
 await expect(saveLesson('m01-l01',{notes:'stale replacement'},other)).rejects.toMatchObject({code:'CONFLICT'})
 expect((await other.lessonStates.get('m01-l01'))?.notes).toBe('first committed')
 await saveLesson('m01-l01',{bookmarked:true},other)
 const actual=await engine.request('read',{ownerId:auth.session.id},auth.token) as {state:{lessonStates:{notes:string;bookmarked:boolean}[]}}
 expect(actual.state.lessonStates[0]).toMatchObject({notes:'first committed',bookmarked:true})
 other.close()
})
