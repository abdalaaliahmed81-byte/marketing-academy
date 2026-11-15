import Dexie,{type Table} from 'dexie'
import {z} from 'zod'
import {lessons} from './lessons'
import {artifactFields,attemptSchema,baghdadDay,capstoneSchema,chooseMission,daySchema,emptyLesson,lessonStateSchema,missionSchema,ready,scoreQuestions,settingsSchema,type Attempt,type Capstone,type LessonState,type Mission,type Settings} from './domain'
import type {Lesson} from './curriculum'
import {encryptedStorage} from './vault'

export const v1Stores={settings:'id',lessonStates:'id',attempts:'id,lessonId,at',missions:'date',projects:'id',lessons:'id,module'}
const projectRow=capstoneSchema.extend({id:z.literal('portfolio')})
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
export let db=new AcademyDB()
export function activateDatabase(next:AcademyDB){db.close();db=next}
export const seed = (database=db)=>database.lessons.bulkPut(lessons)
export async function openLesson(id:string,section:NonNullable<Settings['resume']>['section'],database=db) {
  await database.settings.update('local',{resume:{lessonId:id,section}})
}
export function isUnlocked(id:string,states:LessonState[]){
  const index=lessons.findIndex(l=>l.id===id)
  return index>=0 && lessons.slice(0,index).every(l=>states.some(s=>s.id===l.id&&s.completed))
}
export async function saveLesson(id:string,patch:Partial<Omit<LessonState,'id'|'completed'>>,database=db){
  return database.transaction('rw',database.lessonStates,async()=>{
    const saved=await database.lessonStates.get(id)??emptyLesson(id)
    await database.lessonStates.put({...saved,...patch})
  })
}
export async function submitQuiz(lesson:Lesson,answers:Record<string,string>,database=db){
  const attempt:Attempt={id:crypto.randomUUID(),lessonId:lesson.id,at:new Date().toISOString(),answers,...scoreQuestions(lesson.questions,answers)}
  await database.transaction('rw',database.attempts,database.lessonStates,database.activity,async()=>{
    if(!isUnlocked(lesson.id,await database.lessonStates.toArray()))throw new Error('أكمل الدروس السابقة أولًا.')
    await database.attempts.add(attempt)
    await database.activity.put({date:baghdadDay()})
  })
  return attempt
}
export async function completeLesson(lesson:Lesson,database=db){
  await database.transaction('rw',database.lessonStates,database.attempts,database.activity,async()=>{
    const states=await database.lessonStates.toArray()
    const draft=states.find(s=>s.id===lesson.id)??emptyLesson(lesson.id)
    const attempts=await database.attempts.where('lessonId').equals(lesson.id).toArray()
    if(!isUnlocked(lesson.id,states)||!attempts.some(a=>a.passed)||!ready(draft.assignment,draft.checked,lesson.rubric))throw new Error('اجتز الاختبار واحفظ التطبيق وأكمل المراجعة الذاتية أولًا.')
    await database.lessonStates.put({...draft,completed:true})
    await database.activity.put({date:baghdadDay()})
  })
}
export async function getMission(date:string,database=db){
  return database.transaction('rw',database.missions,database.lessonStates,async()=>{
    const existing=await database.missions.get(date)
    if(existing)return existing
    const learned=new Set((await database.lessonStates.toArray()).filter(s=>s.completed).map(s=>s.id))
    const next=chooseMission(date,lessons.filter(l=>learned.has(l.id)))
    if(next)await database.missions.add(next)
    return next
  })
}
export async function saveMission(date:string,response:string,checked:number[],complete:boolean,database=db){
  return database.transaction('rw',database.missions,database.activity,async()=>{
    const current=await database.missions.get(date)
    if(!current)throw new Error('تعذّر العثور على المهمة.')
    const valid=ready(response,checked,current.rubric)
    if(complete&&!valid)throw new Error('اكتب إجابتك وأكمل جميع بنود المراجعة.')
    await database.missions.put({...current,response,checked,completed:valid&&(complete||current.completed)})
    if(complete)await database.activity.put({date})
  })
}
export async function saveProject(draft:Capstone,baseline:Capstone,database=db){
  await database.transaction('rw',database.projects,async()=>{
    const current=await database.projects.get('portfolio')??{id:'portfolio',...baseline}
    const changed=Object.fromEntries(Object.entries(draft.fields).filter(([id,value])=>baseline.fields[id]!==value))
    await database.projects.put({
      ...current,
      name:draft.name===baseline.name?current.name:draft.name,
      business:draft.business===baseline.business?current.business:draft.business,
      fields:{...current.fields,...changed}
    })
  })
}

const moduleProjectSchema=z.object({id:z.string().regex(/^module-(?:[1-9]|1[0-2])$/),response:z.string().max(50000),checked:z.array(z.number().int().min(0).max(3)).max(4),completed:z.boolean()}).strict()
export type ModuleProject=z.infer<typeof moduleProjectSchema>
export async function saveModuleProject(value:ModuleProject,database=db){
  const checked=moduleProjectSchema.parse(value)
  if(checked.completed&&(!checked.response.trim()||new Set(checked.checked).size!==4))throw new Error('أكمل المشروع والمراجعة الذاتية أولًا.')
  await database.moduleProjects.put(checked)
}
const activitySchema=z.object({date:daySchema}).strict()
const backupSchema=z.object({
  version:z.union([z.literal(1),z.literal(2),z.literal(3)]),
  settings:z.array(settingsSchema).max(1),
  lessonStates:z.array(lessonStateSchema).max(60),
  attempts:z.array(attemptSchema).max(20000),
  missions:z.array(missionSchema).max(10000),
  projects:z.array(projectRow).max(1),
  activity:z.array(activitySchema).max(20000).optional(),moduleProjects:z.array(moduleProjectSchema).max(12).optional()
}).strict().superRefine((data,ctx)=>{
  const check=(ids:string[])=>new Set(ids).size===ids.length
  const reject=(message:string)=>ctx.addIssue({code:'custom',message})
  if(data.version===3&&!data.moduleProjects)reject('سجل مشروعات الوحدات مفقود.')
  if(data.projects.some(p=>Object.keys(p.fields).some(key=>!artifactFields.some(([id])=>id===key))))reject('حقل مشروع غير معروف.')
  if(data.version>=2&&!data.activity)reject('سجل النشاط مفقود.')
  if(!check(data.lessonStates.map(s=>s.id))||!check(data.attempts.map(a=>a.id))||!check(data.missions.map(m=>m.date))||!check((data.activity??[]).map(a=>a.date)))reject('يحتوي الملف على سجلات مكررة.')
  if(!check((data.moduleProjects??[]).map(p=>p.id)))reject('مشروعات مكررة.')
  if((data.moduleProjects??[]).some(p=>p.completed&&(!p.response.trim()||new Set(p.checked).size!==4)))reject('إكمال مشروع غير صالح.')
  const ids=new Set(lessons.map(l=>l.id))
  if(data.lessonStates.some(s=>!ids.has(s.id)||s.checked.some(n=>n>2))||data.missions.some(m=>!ids.has(m.lessonId)))reject('معرّف درس غير معروف.')
  if(data.settings[0]?.resume&&!ids.has(data.settings[0].resume.lessonId))reject('درس المتابعة غير معروف.')
  for(const a of data.attempts){
    const l=lessons.find(l=>l.id===a.lessonId)
    if(!l){reject('محاولة لدرس مجهول.');continue}
    if(Object.keys(a.answers).some(id=>!l.questions.some(q=>q.id===id)))reject('معرّف سؤال غير معروف.')
    try{const actual=scoreQuestions(l.questions,a.answers);if(actual.score!==a.score||JSON.stringify(actual.missed)!==JSON.stringify(a.missed))reject('درجة الاختبار لا تطابق الإجابات.')}catch{reject('إجابات غير صالحة.')}
  }
  for(const state of data.lessonStates.filter(s=>s.completed)){
    const l=lessons.find(l=>l.id===state.id)
    if(!l||!ready(state.assignment,state.checked,l.rubric)||!data.attempts.some(a=>a.lessonId===state.id&&a.passed))reject('إكمال درس غير صالح.')
    const prior=lessons.slice(0,lessons.findIndex(l=>l.id===state.id));if(prior.some(l=>!data.lessonStates.some(s=>s.id===l.id&&s.completed)))reject('تسلسل التقدم غير صالح.')
  }
  if(data.missions.some(m=>m.completed&&!ready(m.response,m.checked,m.rubric)))reject('بيانات إكمال المهمة غير صالحة.')
  if(data.attempts.some(a=>a.passed!==(a.score>=70)))reject('بيانات درجات الاختبار غير صالحة.')
})
export async function exportBackup(database=db){
  return database.transaction('r',[database.settings,database.lessonStates,database.attempts,database.missions,database.projects,database.activity,database.moduleProjects],async()=>({
    version:3,moduleProjects:await database.moduleProjects.toArray(),settings:await database.settings.toArray(),lessonStates:await database.lessonStates.toArray(),attempts:await database.attempts.toArray(),
    missions:await database.missions.toArray(),projects:await database.projects.toArray(),activity:await database.activity.toArray()
  }))
}
export async function restoreBackup(raw:unknown,database=db){
  if(JSON.stringify(raw).length>10_000_000)throw new Error('النسخة أكبر من الحد المسموح.')
  const data=backupSchema.parse(raw)
  const activity=data.activity??data.missions.filter(m=>m.completed).map(m=>({date:m.date}))
  await database.transaction('rw',[database.settings,database.lessonStates,database.attempts,database.missions,database.projects,database.activity,database.moduleProjects],async()=>{
    await database.settings.clear()
    await database.lessonStates.clear()
    await database.attempts.clear()
    await database.missions.clear()
    await database.projects.clear()
    await database.activity.clear()
    await database.moduleProjects.clear()
    await database.settings.bulkPut(data.settings)
    await database.lessonStates.bulkPut(data.lessonStates)
    await database.attempts.bulkPut(data.attempts)
    await database.missions.bulkPut(data.missions)
    await database.projects.bulkPut(data.projects)
    await database.activity.bulkPut(activity)
    await database.moduleProjects.bulkPut(data.moduleProjects??[])
  })
}
