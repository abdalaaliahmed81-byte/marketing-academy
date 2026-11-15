import {z} from './validation'
import {lessons} from './lessons'
import {artifactFields,attemptSchema,capstoneSchema,daySchema,lessonStateSchema,missionSchema,ready,scoreQuestions,settingsSchema} from './domain'
const projectRow=capstoneSchema.extend({id:z.literal('portfolio')})
export const moduleProjectSchema=z.object({id:z.string().regex(/^module-(?:[1-9]|1[0-2])$/),response:z.string().max(50000),checked:z.array(z.number().int().min(0).max(3)).max(4).refine(v=>new Set(v).size===v.length),completed:z.boolean()}).strict()
export type ModuleProject=z.infer<typeof moduleProjectSchema>
const activitySchema=z.object({date:daySchema}).strict()
export const backupSchema=z.object({
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
  if(data.missions.some(m=>m.checked.some(i=>i>=m.rubric.length)))reject('مؤشر مراجعة مهمة خارج النطاق.')
  if(data.missions.some(m=>m.completed&&!ready(m.response,m.checked,m.rubric)))reject('بيانات إكمال المهمة غير صالحة.')
  if(data.attempts.some(a=>a.passed!==(a.score>=70)))reject('بيانات درجات الاختبار غير صالحة.')
})

export type LearnerState=z.infer<typeof backupSchema> & {version:3;activity:{date:string}[];moduleProjects:ModuleProject[]}
export const collections=['settings','lessonStates','attempts','missions','projects','activity','moduleProjects'] as const
export type Collection=typeof collections[number]
export const MAX_STATE_BYTES=9_000_000
export function normalizeState(raw:unknown):LearnerState{
 const data=backupSchema.parse(raw)
 return {...data,version:3,activity:data.activity??data.missions.filter(m=>m.completed).map(m=>({date:m.date})),moduleProjects:data.moduleProjects??[]}
}
export function emptyState():LearnerState{return {version:3,settings:[],lessonStates:[],attempts:[],missions:[],projects:[],activity:[],moduleProjects:[]}}
