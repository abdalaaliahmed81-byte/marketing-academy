/** @vitest-environment node */
import {beforeEach,afterEach,it,expect} from 'vitest'
import {mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {AcademyEngine,type AuthResponse} from './engine'
import {SQLiteRepository} from '../src/storage/repository'
import {activitiesFor} from '../src/interactive/content'
import {blankInteraction} from '../src/interactive/model'
import {lessons} from '../src/lessons'
import {baghdadDay} from '../src/domain'
import {initializeSettings,saveInteraction,saveQuizAnswer,retryQuiz,submitQuiz,saveReview,getMission,saveLesson,completeLesson,exportActivity,exportBackup,restoreBackup} from '../src/db'
let folder:string,engine:AcademyEngine,auth:AuthResponse,repo:SQLiteRepository
const password='interactive-long-password',lesson=lessons[0],answers=(wrong=false)=>Object.fromEntries(lesson.questions.map((q,i)=>[q.id,wrong&&i===0?q.options.find(o=>o.id!==q.answer)!.id:q.answer]))
const repository=()=>new SQLiteRepository(auth.snapshot,{kind:'desktop-sqlite',request:(command,payload)=>engine.request(command,payload,auth.token)})
beforeEach(async()=>{folder=await mkdtemp(join(tmpdir(),'academy-interactive-'));engine=new AcademyEngine(join(folder,'academy.sqlite'));auth=await engine.request('register',{name:'Interactive Alice',password}) as AuthResponse;repo=repository();await initializeSettings({id:'local',goal:'تطبيق تفاعلي',minutes:30,business:'مطعم',theme:'light'},repo)})
afterEach(async()=>{repo.close();engine.close();await rm(folder,{recursive:true,force:true})})
it('saves activity and quiz drafts across real SQLite reopen, validates state, retries and isolates accounts',async()=>{
 const branch=activitiesFor(lesson).find(a=>a.kind==='scenario')!,state={...blankInteraction(),submitted:true,path:['safe','test']}
 await saveInteraction(lesson.id,branch.id,state,repo)
 await saveQuizAnswer(lesson.id,lesson.questions[0].id,lesson.questions[0].answer,repo)
 const before=await exportBackup(repo)
 await expect(saveInteraction(lesson.id,branch.id,{...state,path:['bad']},repo)).rejects.toThrow()
 expect(await exportBackup(repo)).toEqual(before)
 repo.close();engine.close();engine=new AcademyEngine(join(folder,'academy.sqlite'));auth=await engine.request('login',{name:'Interactive Alice',password}) as AuthResponse;repo=repository()
 expect((await exportBackup(repo)).lessonStates[0]).toMatchObject({interactions:{[branch.id]:state},quizDraft:{active:true,answers:{[lesson.questions[0].id]:lesson.questions[0].answer}}})
 await submitQuiz(lesson,answers(),repo);await retryQuiz(lesson.id,repo)
 const saved=await exportBackup(repo);expect(saved.attempts).toHaveLength(1);expect(saved.lessonStates[0].quizDraft).toMatchObject({answers:{},active:true,round:1})
 const bob=await engine.request('register',{name:'Interactive Bob',password}) as AuthResponse
 expect(bob.snapshot.state.lessonStates).toEqual([])
 await restoreBackup(saved,repo);expect(await exportBackup(repo)).toEqual(saved)
})
it('exports the nine-field one-page plan atomically without replacing unrelated portfolio fields',async()=>{
 await repo.projects.update('portfolio',{fields:{story:'قصة سابقة محفوظة'}})
 const a=activitiesFor(lesson).find(a=>a.kind==='plan')!,work={...blankInteraction(),submitted:true,values:Object.fromEntries(a.fields!.map(f=>[f.id,'تطبيق واضح خاص بهذا الحقل '+f.label]))}
 await saveInteraction(lesson.id,a.id,work,repo);await exportActivity(lesson.id,a.id,repo)
 const project=(await exportBackup(repo)).projects[0]
 expect(project.fields.story).toBe('قصة سابقة محفوظة');for(const f of a.fields!)expect(project.fields[f.id]).toBe(work.values[f.id])
})
it('persists incorrect-answer review schedules and stable progress-aware Baghdad missions',async()=>{
 const now=new Date('2026-11-16T20:59:59Z')
 await submitQuiz(lesson,answers(true),repo,now)
 const response=await saveReview(lesson.questions[0].id,lesson.questions[0].answer,repo,now)
 expect(response).toMatchObject({correct:true,nextDue:'2026-11-17'})
 await expect(saveReview(lesson.questions[0].id,lesson.questions[0].answer,repo,now)).rejects.toThrow()
 await saveLesson(lesson.id,{assignment:'تطبيق فعلي للمفهوم مع دليل وحدود',checked:[0,1,2]},repo);await completeLesson(lesson,repo)
 const day=baghdadDay(now),first=await getMission(day,repo)
 expect(first?.lessonId).toBe(lesson.id)
 const second=lessons[1];await submitQuiz(second,Object.fromEntries(second.questions.map(q=>[q.id,q.answer])),repo);await saveLesson(second.id,{assignment:'نشاط ثان مكتمل للمراجعة الذاتية',checked:[0,1,2]},repo);await completeLesson(second,repo)
 expect(await getMission(day,repo)).toEqual(first)
 const tomorrow=await getMission(baghdadDay(new Date('2026-11-16T21:00:00Z')),repo)
 expect([lesson.id,second.id]).toContain(tomorrow?.lessonId)
 const saved=await exportBackup(repo);await restoreBackup(saved,repo)
 expect(await getMission(day,repo)).toEqual(first)
})
