import Dexie from 'dexie'
import {afterEach,beforeEach,describe,expect,it} from 'vitest'
import {AcademyDB,completeLesson,exportBackup,getMission,isUnlocked,openLesson,restoreBackup,saveLesson,saveMission,saveProject,seed,submitQuiz,v1Stores} from './db'
import {baghdadDay,chooseMission,emptyCapstone,markdown,scoreQuestions,shuffleOptions,studyStreak,type Settings} from './domain'
import {lessons} from './lessons'

const first=lessons[0]
const settings:Settings={id:'local',goal:'مشروع',minutes:30,business:'مطعم',theme:'light'}
const answers=(wrong:number)=>Object.fromEntries(first.questions.map((q,i)=>[q.id,q.options[i<wrong?1:0].id]))
let db:AcademyDB
beforeEach(()=>{db=new AcademyDB('test-'+crypto.randomUUID())})
afterEach(async()=>{await db.delete()})
describe('curriculum and quiz',()=>{
  it('ships sixty complete lessons with unique question and answer IDs',()=>{
    expect(lessons).toHaveLength(60)
    const ids=lessons.flatMap(l=>[l.id,...l.questions.flatMap(q=>[q.id,...q.options.map(o=>o.id)])])
    expect(new Set(ids).size).toBe(ids.length)
    for(const l of lessons){
      expect(l.questions).toHaveLength(5)
      expect(l.reading.join(' ').split(/\s+/).length).toBeGreaterThan(140)
      expect(l.refs.length).toBeGreaterThan(0)
      expect(l.online.length).toBeGreaterThan(0)
      expect(l.rubric).toHaveLength(3)
    }
  })
  it('scores by ID, rejects incomplete answers and keeps retries',async()=>{
    const shuffled=first.questions.map(q=>({...q,options:shuffleOptions(q.options,q.id)}))
    expect(scoreQuestions(shuffled,answers(1))).toMatchObject({score:80,passed:true})
    await expect(submitQuiz(first,{},db)).rejects.toThrow()
    await expect(submitQuiz(first,answers(2),db)).resolves.toMatchObject({score:60,passed:false})
    await expect(submitQuiz(first,answers(1),db)).resolves.toMatchObject({score:80,passed:true})
    expect(await db.attempts.count()).toBe(2)
    await expect(submitQuiz(lessons[1],{},db)).rejects.toThrow()
  })
  it('requires a passed attempt and self-check before unlocking',async()=>{
    await expect(completeLesson(first,db)).rejects.toThrow()
    await submitQuiz(first,answers(0),db)
    await saveLesson(first.id,{assignment:'تطبيق عملي',checked:[0,1,2]},db)
    await completeLesson(first,db)
    await expect(saveLesson(first.id,{assignment:''},db)).rejects.toThrow()
    await expect(saveLesson(first.id,{checked:[]},db)).rejects.toThrow()
    expect((await db.lessonStates.get(first.id))?.completed).toBe(true)
    const states=await db.lessonStates.toArray()
    expect(isUnlocked(lessons[1].id,states)).toBe(true)
    expect(isUnlocked(lessons[2].id,states)).toBe(false)
  })
})
describe('local state',()=>{
  it('keeps the saved lesson section and notes after close and reseed',async()=>{
    await db.settings.put(settings)
    await openLesson(first.id,'quiz',db)
    await saveLesson(first.id,{notes:'تذكير'},db)
    db.close()
    await db.open()
    await seed(db)
    expect(await db.settings.get('local')).toMatchObject({resume:{lessonId:first.id,section:'quiz'}})
    expect(await db.lessonStates.get(first.id)).toMatchObject({notes:'تذكير'})
    expect(await db.lessons.count()).toBe(60)
  })
  it('switches at Baghdad midnight and keeps a selected mission after refresh',async()=>{
    const before=baghdadDay(new Date('2026-11-13T20:59:59Z'))
    const after=baghdadDay(new Date('2026-11-13T21:00:00Z'))
    expect([before,after]).toEqual(['2026-11-13','2026-11-14'])
    expect(await getMission(before,db)).toBeUndefined()
    await db.lessonStates.add({id:first.id,notes:'',assignment:'تطبيق',bookmarked:false,completed:true,checked:[0,1,2]})
    const mission=await getMission(before,db)
    await db.lessonStates.add({id:lessons[1].id,notes:'',assignment:'تطبيق',bookmarked:false,completed:true,checked:[0,1,2]})
    db.close()
    await db.open()
    expect(await getMission(before,db)).toEqual(mission)
    expect(await getMission(after,db)).toEqual(chooseMission(after,lessons.slice(0,2)))
  })
  it('requires a response and all mission rubric checks',async()=>{
    const date='2026-11-14'
    await db.lessonStates.add({id:first.id,notes:'',assignment:'تطبيق',bookmarked:false,completed:true,checked:[0,1,2]})
    await getMission(date,db)
    await expect(saveMission(date,'',[0,1,2],true,db)).rejects.toThrow()
    await expect(saveMission(date,'إجابة',[0,1],true,db)).rejects.toThrow()
    await saveMission(date,'إجابة',[0,1,2],true,db)
    expect(await db.missions.get(date)).toMatchObject({completed:true,response:'إجابة'})
    expect(studyStreak('2026-11-15',await db.activity.toArray())).toBe(1)
  })
  it('migrates v1 data and restores only a valid backup',async()=>{
    const legacy=new Dexie(db.name)
    legacy.version(1).stores(v1Stores)
    const mission=chooseMission('2026-11-14',[first])!
    await legacy.table('settings').add(settings)
    await legacy.table('missions').add({...mission,response:'عمل',checked:[0,1,2],completed:true})
    legacy.close()
    await db.open()
    expect(await db.activity.count()).toBe(1)
    const snapshot=await exportBackup(db)
    await expect(restoreBackup({...snapshot,settings:[{...settings,minutes:99}]},db)).rejects.toThrow()
    expect(await exportBackup(db)).toEqual(snapshot)
    await db.settings.clear()
    await restoreBackup(snapshot,db)
    expect(await db.settings.get('local')).toEqual(settings)
  })
  it('persists capstone sections and merges separate edits before backup and export',async()=>{
    const blank=emptyCapstone('مطعم')
    await Promise.all([
      saveProject({...blank,name:'كرسبي الجامعة',fields:{market:'طلبة الجامعة'}},blank,db),
      saveProject({...blank,fields:{report:'تقرير محاكاة'}},blank,db)
    ])
    const backup=await exportBackup(db)
    await db.projects.clear()
    await restoreBackup(backup,db)
    const project=(await db.projects.get('portfolio'))!
    expect(project.fields).toEqual({market:'طلبة الجامعة',report:'تقرير محاكاة'})
    expect(markdown(project)).toContain('تقرير محاكاة')
    expect(markdown(project,true)).toContain('طلبة الجامعة')
    expect(markdown(project,true)).not.toContain('تقرير محاكاة')
  })
})
