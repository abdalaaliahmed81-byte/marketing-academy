import {activitiesFor,validInteraction} from './interactive/content'
import {activityResult,activityOutput,interactionSchema,type Interaction} from './interactive/model'
import {reviewQueue,reviewSchedule} from './interactive/review'
import {SQLiteRepository,type StoreView} from './storage/repository'
import {notifyStore} from './storage/events'
import {backupSchema,moduleProjectSchema,type ModuleProject} from './data-schema'
import Dexie,{type Table} from 'dexie'
import {lessons} from './lessons'
import {artifactFields,attemptSchema,baghdadDay,capstoneSchema,chooseMission,daySchema,emptyLesson,lessonStateSchema,missionSchema,ready,scoreQuestions,settingsSchema,type Attempt,type Capstone,type LessonState,type Mission,type Settings} from './domain'
import type {Lesson} from './curriculum'
import {encryptedStorage} from './vault'

export const v1Stores={settings:'id',lessonStates:'id',attempts:'id,lessonId,at',missions:'date',projects:'id',lessons:'id,module'}
export class AcademyDB extends Dexie {
  settings!:Table<Settings,string>
  lessonStates!:Table<LessonState,string>
  attempts!:Table<Attempt,string>
  missions!:Table<Mission,string>
  projects!:Table<Capstone&{id:'portfolio'},string>
  lessons!:Table<Lesson,string>
  activity!:Table<{date:string},string>
  moduleProjects!:Table<ModuleProject,string>
  constructor(name='marketing-academy',key?:Uint8Array){
    super(name)
    if(key)this.use(encryptedStorage(key))
    this.version(1).stores(v1Stores)
    this.version(2).stores({...v1Stores,activity:'date'}).upgrade(async tx=>{
      const history=await tx.table<Mission>('missions').toArray()
      await tx.table('activity').bulkPut(history.filter(m=>m.completed).map(m=>({date:m.date})))
    })
    this.version(3).stores({...v1Stores,activity:'date',moduleProjects:'id'})
  }
}
export type LearningDatabase=AcademyDB|SQLiteRepository
export let db:LearningDatabase=new AcademyDB()
export function activateDatabase(next:LearningDatabase){db.close();db=next;notifyStore()}
export async function transaction<T>(database:LearningDatabase,mode:'r'|'rw',scope:(store:StoreView)=>Promise<T>):Promise<T>{
 if(database instanceof SQLiteRepository)return database.transact(mode,scope)
 return database.transaction(mode,[database.settings,database.lessonStates,database.attempts,database.missions,database.projects,database.activity,database.moduleProjects],()=>scope(database))
}
export const seed = (database=db)=>database instanceof SQLiteRepository?Promise.resolve():database.lessons.bulkPut(lessons)
export async function openLesson(id:string,section:NonNullable<Settings['resume']>['section'],database=db) {
  await database.settings.update('local',{resume:{lessonId:id,section}})
}
export function isUnlocked(id:string,states:LessonState[]){
  const index=lessons.findIndex(l=>l.id===id)
  return index>=0 && lessons.slice(0,index).every(l=>states.some(s=>s.id===l.id&&s.completed))
}
export async function saveLesson(id:string,patch:Partial<Omit<LessonState,'id'|'completed'>>,database=db){
  return transaction(database,'rw',async store=>{
    const saved=await store.lessonStates.get(id)??emptyLesson(id)
    const next=lessonStateSchema.parse({...saved,...patch,...(patch.notes!==undefined&&patch.notes!==saved.notes?{notesUpdatedAt:new Date().toISOString()}:{})})
    const lesson=lessons.find(l=>l.id===id)
    if(!lesson)throw new Error('الدرس غير معروف.')
    if(saved.completed&&!ready(next.assignment,next.checked,lesson.rubric))throw new Error('الدرس مكتمل. أبقِ التطبيق وبنود مراجعته مكتملة لحفظ تعديله؛ بقيت النسخة السابقة محفوظة.')
    await store.lessonStates.put(next)
  })
}
export async function submitQuiz(lesson:Lesson,answers:Record<string,string>,database=db,now=new Date()){
  const attempt:Attempt={id:crypto.randomUUID(),lessonId:lesson.id,at:now.toISOString(),answers,...scoreQuestions(lesson.questions,answers)}
  await transaction(database,'rw',async store=>{
    if(!isUnlocked(lesson.id,await store.lessonStates.toArray()))throw new Error('أكمل الدروس السابقة أولًا.')
    await store.attempts.add(attempt)
    const state=await store.lessonStates.get(lesson.id)??emptyLesson(lesson.id)
    await store.lessonStates.put({...state,quizDraft:{answers,active:false,round:state.quizDraft?.round??0,updatedAt:attempt.at}})
    await store.activity.put({date:baghdadDay(now)})
  })
  return attempt
}
export async function completeLesson(lesson:Lesson,database=db){
  await transaction(database,'rw',async store=>{
    const states=await store.lessonStates.toArray()
    const draft=states.find(s=>s.id===lesson.id)??emptyLesson(lesson.id)
    const attempts=await store.attempts.where('lessonId').equals(lesson.id).toArray()
    if(!isUnlocked(lesson.id,states)||!attempts.some(a=>a.passed)||!ready(draft.assignment,draft.checked,lesson.rubric))throw new Error('اجتز الاختبار واحفظ التطبيق وأكمل المراجعة الذاتية أولًا.')
    await store.lessonStates.put({...draft,completed:true})
    await store.activity.put({date:baghdadDay()})
  })
}
export async function getMission(date:string,database=db){
  daySchema.parse(date)
  return transaction(database,'rw',async store=>{
    const existing=await store.missions.get(date)
    if(existing)return existing
    const learned=new Set((await store.lessonStates.toArray()).filter(s=>s.completed).map(s=>s.id))
    const next=chooseMission(date,lessons.filter(l=>learned.has(l.id)))
    if(next)await store.missions.add(next)
    return next
  })
}
export async function saveMission(date:string,response:string,checked:number[],complete:boolean,database=db){
  return transaction(database,'rw',async store=>{
    daySchema.parse(date)
    const current=await store.missions.get(date)
    if(!current)throw new Error('تعذّر العثور على المهمة.')
    const valid=ready(response,checked,current.rubric)
    if(complete&&!valid)throw new Error('اكتب إجابتك وأكمل جميع بنود المراجعة.')
    await store.missions.put(missionSchema.parse({...current,response,checked,completed:valid&&(complete||current.completed)}))
    if(complete)await store.activity.put({date})
  })
}
export async function saveProject(draft:Capstone,baseline:Capstone,database=db){
  draft=capstoneSchema.parse(draft)
  if(Object.keys(draft.fields).some(key=>!artifactFields.some(([id])=>id===key)))throw new Error('حقل مشروع غير معروف.')
  await transaction(database,'rw',async store=>{
    const current=await store.projects.get('portfolio')??{id:'portfolio',...baseline}
    const changed=Object.fromEntries(Object.entries(draft.fields).filter(([id,value])=>baseline.fields[id]!==value))
    await store.projects.put({
      ...current,
      name:draft.name===baseline.name?current.name:draft.name,
      business:draft.business===baseline.business?current.business:draft.business,
      fields:{...current.fields,...changed}
    })
  })
}

export type {ModuleProject} from './data-schema'
export async function saveModuleProject(value:ModuleProject,database=db){
  const checked=moduleProjectSchema.parse(value)
  if(checked.completed&&(!checked.response.trim()||new Set(checked.checked).size!==4))throw new Error('أكمل المشروع والمراجعة الذاتية أولًا.')
  await database.moduleProjects.put(checked)
}
export async function exportBackup(database=db){
  const data=await transaction(database,'r',async store=>({
    version:3,moduleProjects:await store.moduleProjects.toArray(),settings:await store.settings.toArray(),lessonStates:await store.lessonStates.toArray(),attempts:await store.attempts.toArray(),
    missions:await store.missions.toArray(),projects:await store.projects.toArray(),activity:await store.activity.toArray()
  }))
  return backupSchema.parse(data)
}
export async function restoreBackup(raw:unknown,database=db){
  if(typeof JSON.stringify(raw)!=='string'||JSON.stringify(raw).length>10_000_000)throw new Error('النسخة أكبر من الحد المسموح.')
  const data=backupSchema.parse(raw)
  const activity=data.activity??data.missions.filter(m=>m.completed).map(m=>({date:m.date}))
  await transaction(database,'rw',async store=>{
    await store.settings.clear()
    await store.lessonStates.clear()
    await store.attempts.clear()
    await store.missions.clear()
    await store.projects.clear()
    await store.activity.clear()
    await store.moduleProjects.clear()
    await store.settings.bulkPut(data.settings)
    await store.lessonStates.bulkPut(data.lessonStates)
    await store.attempts.bulkPut(data.attempts)
    await store.missions.bulkPut(data.missions)
    await store.projects.bulkPut(data.projects)
    await store.activity.bulkPut(activity)
    await store.moduleProjects.bulkPut(data.moduleProjects??[])
  })
}

export async function initializeSettings(settings:Settings,database=db){
 const valid=settingsSchema.parse(settings)
 await transaction(database,'rw',async store=>{
  if(!(await store.projects.get('portfolio')))await store.projects.add({id:'portfolio',name:'',business:valid.business,fields:{}})
  await store.settings.put(valid)
 })
}

export async function saveInteraction(lessonId:string,activityId:string,value:Interaction,database=db){
 const lesson=lessons.find(l=>l.id===lessonId),activity=lesson&&activitiesFor(lesson).find(a=>a.id===activityId)
 const checked=interactionSchema.parse(value)
 if(!lesson||!activity||!validInteraction(activity,checked))throw new Error('نشاط غير صالح.')
 await transaction(database,'rw',async store=>{
  const all=await store.lessonStates.toArray();if(!isUnlocked(lessonId,all))throw new Error('أكمل الدروس السابقة أولًا.')
  const current=all.find(s=>s.id===lessonId)??emptyLesson(lessonId)
  await store.lessonStates.put({...current,interactions:{...current.interactions,[activityId]:checked}})
  await store.activity.put({date:baghdadDay()})
 })
}
export async function saveQuizAnswer(lessonId:string,questionId:string,answer:string,database=db){
 const lesson=lessons.find(l=>l.id===lessonId)
 if(!lesson?.questions.some(q=>q.id===questionId&&q.options.some(o=>o.id===answer)))throw new Error('إجابة غير معروفة.')
 await transaction(database,'rw',async store=>{
  const states=await store.lessonStates.toArray();if(!isUnlocked(lessonId,states))throw new Error('الدرس مقفل.')
  const current=states.find(s=>s.id===lessonId)??emptyLesson(lessonId),draft=current.quizDraft
  await store.lessonStates.put({...current,quizDraft:{answers:{...(draft?.active?draft.answers:{}),[questionId]:answer},active:true,round:draft?.round??0,updatedAt:new Date().toISOString()}})
 })
}
export async function saveQuizDraftAnswers(lessonId:string,answers:Record<string,string>,database=db){
 const lesson=lessons.find(l=>l.id===lessonId)
 if(!lesson||Object.entries(answers).some(([id,answer])=>!lesson.questions.some(q=>q.id===id&&q.options.some(o=>o.id===answer))))throw new Error('إجابات مسودة غير صالحة.')
 await transaction(database,'rw',async store=>{
  const states=await store.lessonStates.toArray();if(!isUnlocked(lessonId,states))throw new Error('الدرس مقفل.')
  const current=states.find(s=>s.id===lessonId)??emptyLesson(lessonId)
  await store.lessonStates.put({...current,quizDraft:{answers,active:true,round:current.quizDraft?.round??0,updatedAt:new Date().toISOString()}})
 })
}
export async function retryQuiz(lessonId:string,database=db){
 return transaction(database,'rw',async store=>{
  const states=await store.lessonStates.toArray();if(!isUnlocked(lessonId,states))throw new Error('الدرس مقفل.')
  const current=states.find(s=>s.id===lessonId)??emptyLesson(lessonId)
  const draft={answers:{},active:true,round:(current.quizDraft?.round??0)+1,updatedAt:new Date().toISOString()}
  await store.lessonStates.put({...current,quizDraft:draft});return draft
 })
}
export async function saveReview(questionId:string,answer:string,database=db,now=new Date()){
 const lesson=lessons.find(l=>l.questions.some(q=>q.id===questionId)),question=lesson?.questions.find(q=>q.id===questionId)
 if(!lesson||!question?.options.some(o=>o.id===answer))throw new Error('مراجعة غير صالحة.')
 return transaction(database,'rw',async store=>{
  const states=await store.lessonStates.toArray(),attempts=await store.attempts.toArray()
  if(!reviewQueue(lessons,attempts,states,now).some(item=>item.question.id===questionId))throw new Error('هذا السؤال غير مستحق الآن.')
  const current=states.find(s=>s.id===lesson.id)??emptyLesson(lesson.id)
  const next={...current,reviews:[...(current.reviews??[]),{questionId,answer,at:now.toISOString()}]}
  await store.lessonStates.put(next)
  await store.activity.put({date:baghdadDay(now)});return {correct:answer===question.answer,why:question.why,nextDue:reviewSchedule(lessons,attempts,[...states.filter(s=>s.id!==lesson.id),next],now).find(item=>item.question.id===questionId)!.due}
 })
}
export async function exportActivity(lessonId:string,activityId:string,database=db){
 const lesson=lessons.find(l=>l.id===lessonId),activity=lesson&&activitiesFor(lesson).find(a=>a.id===activityId)
 if(!lesson||!activity?.target||!artifactFields.some(([id])=>id===activity.target))throw new Error('لا يوجد حقل مشروع لهذا النشاط.')
 await transaction(database,'rw',async store=>{
  const state=await store.lessonStates.get(lessonId),work=state?.interactions?.[activityId]
  if(!work||!activityResult(activity,work).complete)throw new Error('أكمل النشاط وراجعه قبل نقله.')
  const settings=await store.settings.get('local'),project=await store.projects.get('portfolio')??{id:'portfolio' as const,name:'',business:settings?.business??'مشروع مخصص' as const,fields:{}}
  const output=activityOutput(activity,work);if(output.length>50000)throw new Error('الناتج يتجاوز سعة حقل المشروع؛ اختصره.')
  const additions=activity.kind==='plan'?Object.fromEntries(activity.fields!.map(f=>[f.id,work.values[f.id]])):{[activity.target!]:output}
  await store.projects.put({...project,fields:{...project.fields,...additions}})
  await store.activity.put({date:baghdadDay()})
 })
}
