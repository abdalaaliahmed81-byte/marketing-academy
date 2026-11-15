import {z} from './validation'
import type {Lesson,Question} from './curriculum'

export const businesses = ['مطعم','متجر محلي','متجر إلكتروني','خدمة','مشروع مخصص'] as const
export const stages = [
  {name:'قبل الشراء',fields:[['market','السوق المستهدف'],['message','الرسالة التسويقية'],['media','وسائل الوصول']]},
  {name:'أثناء الشراء',fields:[['capture','تسجيل اهتمام العملاء بإذنهم'],['nurture','متابعة المهتمين'],['conversion','تحويل الاهتمام إلى شراء']]},
  {name:'بعد الشراء',fields:[['experience','تجربة العميل'],['value','زيادة القيمة على مدى العلاقة'],['referral','تشجيع الإحالات']]}
] as const
export const sections = [
  {name:'البحث والاستراتيجية',fields:[['research','البحث والأدلة والفرضيات'],['persona','شخصية العميل'],['story','قصة العلامة القابلة للتحقق'],['goals','الأهداف SMART'],['position','التموضع والعرض']]},
  ...stages,
  {name:'المحتوى والإعلان',fields:[['calendar','خطة محتوى لمدة أسبوعين'],['post1','المنشور الأول'],['post2','المنشور الثاني'],['post3','المنشور الثالث'],['post4','المنشور الرابع'],['post5','المنشور الخامس'],['ad1','نسخة الإعلان أ'],['ad2','نسخة الإعلان ب'],['budget','ميزانية المحاكاة بالدينار العراقي']]},
  {name:'القياس والتقرير',fields:[['kpis','لوحة مؤشرات الأداء'],['analysis','تفسير البيانات الافتراضية'],['report','التقرير النهائي للعميل']]}
] as const
export const artifactFields = sections.flatMap(({fields})=>Array.from<[string,string]>(fields.map(([key,title])=>[key,title])))
export const capstoneSchema = z.object({name:z.string().max(200),business:z.enum(businesses),fields:z.record(z.string(),z.string().max(50000))}).strict()
export const settingsSchema = z.object({id:z.literal('local'),goal:z.string().trim().min(1).max(200),minutes:z.number().int().min(20).max(40),business:z.enum(businesses),theme:z.enum(['light','dark']),resume:z.object({lessonId:z.string(),section:z.enum(['read','quiz','practice'])}).optional()}).strict()
export const lessonStateSchema = z.object({id:z.string(),notes:z.string().max(50000),notesUpdatedAt:z.string().datetime().optional(),bookmarked:z.boolean(),assignment:z.string().max(50000),checked:z.array(z.number().int().min(0).max(2)).max(3).refine(v=>new Set(v).size===v.length),completed:z.boolean()}).strict()
export const attemptSchema = z.object({id:z.string(),lessonId:z.string(),at:z.string().datetime(),answers:z.record(z.string(),z.string().max(50000)),score:z.number().int().min(0).max(100),passed:z.boolean(),missed:z.array(z.string())}).strict()
export const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value=>{
  const date = new Date(value+'T00:00:00Z')
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0,10)===value
})
export const missionSchema = z.object({date:daySchema,lessonId:z.string(),prompt:z.string().min(1).max(10000),rubric:z.array(z.string().min(1).max(1000)).min(1).max(10),response:z.string().max(50000),checked:z.array(z.number().int().min(0).max(9)).max(10).refine(v=>new Set(v).size===v.length),completed:z.boolean()}).strict()
export type Settings=z.infer<typeof settingsSchema>
export type Capstone=z.infer<typeof capstoneSchema>
export type LessonState=z.infer<typeof lessonStateSchema>
export type Attempt=z.infer<typeof attemptSchema>
export type Mission=z.infer<typeof missionSchema>
export const emptyLesson = (id:string):LessonState=>({id,notes:'',bookmarked:false,assignment:'',checked:[],completed:false})
export const emptyCapstone = (business:Capstone['business']):Capstone=>({name:'',business,fields:{}})
export function scoreQuestions(questions:Question[],answers:Record<string,string>) {
  if (!questions.length || questions.some(q=>!q.options.some(o=>o.id===answers[q.id]))) throw new Error('أجب عن كل الأسئلة قبل التسليم.')
  const missed=questions.filter(q=>q.answer!==answers[q.id]).map(q=>q.id)
  const score=Math.round(100*(questions.length-missed.length)/questions.length)
  return {score,passed:score>=70,missed}
}
export function shuffleOptions<T>(items:T[], seed:string):T[] {
  const result=[...items]
  let state=Array.from(seed).reduce((n,c)=>Math.imul(n,31)+c.charCodeAt(0)|0,5381)
  for(let i=result.length-1;i>0;i--){
    state=(Math.imul(1664525,state)+1013904223)>>>0
    const j=state%(i+1)
    ;[result[i],result[j]]=[result[j],result[i]]
  }
  return result
}
export function baghdadDay(now=new Date()) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Baghdad',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]))
  return parts.year+'-'+parts.month+'-'+parts.day
}
export function studyStreak(date:string,activity:{date:string}[]){
  const days=new Set(activity.map(row=>row.date))
  let cursor=Date.parse(date+'T00:00:00Z')
  if(!days.has(date))cursor-=86400000
  let count=0
  while(days.has(new Date(cursor).toISOString().slice(0,10))){
    count++
    cursor-=86400000
  }
  return count
}
export function chooseMission(date:string, learned:Lesson[]):Mission|undefined {
  const choices=[...learned].sort((a,b)=>a.id.localeCompare(b.id))
  if(!choices.length)return
  const dayNumber=Math.floor(Date.parse(date+'T00:00:00Z')/86400000)
  const selected=choices[((dayNumber%choices.length)+choices.length)%choices.length]
  return {date,lessonId:selected.id,prompt:selected.mission,rubric:[...selected.rubric],response:'',checked:[],completed:false}
}
export function ready(response:string,checked:number[],rubric:string[]) {
  return !!response.trim() && rubric.every((_,i)=>checked.includes(i))
}
export function markdown(project:Capstone,onlyPlan=false){
  const selected=onlyPlan?stages:sections
  return ['# '+(project.name.trim()||'مشروع التسويق'),project.business,...selected.flatMap(s=>['## '+s.name,...s.fields.flatMap(([id,title])=>['### '+title,project.fields[id]?.trim()||'—'])])].join('\n\n')+'\n'
}
