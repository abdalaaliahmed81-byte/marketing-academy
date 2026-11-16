import {z} from '../validation'
const values=z.record(z.string().min(1).max(80),z.string().max(20000)).refine(v=>Object.keys(v).length<=40)
export const interactionSchema=z.object({values,order:z.array(z.string().max(80)).max(12),path:z.array(z.string().max(80)).max(12),step:z.number().int().min(0).max(30),submitted:z.boolean(),updatedAt:z.string().datetime()}).strict()
export type Interaction=z.infer<typeof interactionSchema>
export const interactionsSchema=z.record(z.string().max(40),interactionSchema).refine(v=>Object.keys(v).length<=12)
export const quizDraftSchema=z.object({assessmentVersion:z.union([z.literal(1),z.literal(2)]).optional(),answers:values,active:z.boolean(),round:z.number().int().min(0).max(100000),updatedAt:z.string().datetime()}).strict()
export const reviewEventSchema=z.object({questionId:z.string().max(100),answer:z.string().max(100),at:z.string().datetime()}).strict()
export const blankInteraction=():Interaction=>({values:{},order:[],path:[],step:0,submitted:false,updatedAt:new Date().toISOString()})
export type Kind='guide'|'match'|'sequence'|'blank'|'scenario'|'persona'|'value'|'copy'|'budget'|'calendar'|'plan'|'campaign'
export interface Field {id:string;label:string;hint:string;min?:number;type?:'date'|'text'|'textarea'}
export interface Branch {id:string;text:string;choices?:{id:string;label:string;next:string}[];success?:boolean;explanation?:string}
export interface Activity {id:string;kind:Kind;title:string;prompt:string;fields?:Field[];target?:string;items?:{id:string;label:string;definition?:string}[];answer?:string;steps?:string[];requiredStepCount?:number;nodes?:Branch[]}
export const normalized=(s:string)=>s.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US')
export function moveItem(items:string[],from:number,to:number){if(from<0||to<0||from>=items.length||to>=items.length)return [...items];const next=[...items];next.splice(to,0,next.splice(from,1)[0]);return next}
function validCalendarDay(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value??'')&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value}
export function readMetric(value:string|undefined){return value?.trim()?Number(value.replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replaceAll('٫','.').replaceAll('٬','')):NaN}
export function campaignMetrics(values:Record<string,string>){
 const names=['impressions','clicks','orders','price','unitCost','budget'] as const
 const raw=Object.fromEntries(names.map(k=>[k,readMetric(values[k])])) as Record<typeof names[number],number>
 if(names.some(k=>!Number.isFinite(raw[k])||raw[k]<0||raw[k]>1e9)||!Number.isInteger(raw.impressions)||!Number.isInteger(raw.clicks)||!Number.isInteger(raw.orders)||raw.clicks>raw.impressions||raw.orders>raw.clicks)return undefined
 const {impressions,clicks,orders,price,unitCost,budget}=raw
 if(orders*price>Number.MAX_SAFE_INTEGER||orders*unitCost>Number.MAX_SAFE_INTEGER)return undefined
 return {...raw,ctr:impressions?100*clicks/impressions:null,cpc:clicks?budget/clicks:null,cpa:orders?budget/orders:null,revenue:orders*price,roas:budget?orders*price/budget:null,contribution:orders*(price-unitCost)-budget}
}
export function branchPosition(activity:Activity,state:Interaction){let node=activity.nodes?.[0];for(const choice of state.path){const option=node?.choices?.find(c=>c.id===choice);if(!option)return undefined;node=activity.nodes?.find(n=>n.id===option.next)}return node}
export function activityResult(a:Activity,s:Interaction):{complete:boolean;feedback:string}{
 if(!s.submitted)return {complete:false,feedback:'مسودة محفوظة؛ راجعها ثم تحقّق من نشاطك.'}
 let ok=false,feedback=''
 if(a.kind==='guide')ok=!!a.steps?.slice(0,a.requiredStepCount??a.steps.length).every((_,i)=>s.values['ack-'+i]==='yes')&&(s.values.reflection?.trim().length??0)>=10
 else if(a.kind==='match')ok=!!a.items?.every(item=>s.values[item.id]===item.id)
 else if(a.kind==='sequence')ok=JSON.stringify(s.order)===JSON.stringify(a.items?.map(i=>i.id))
 else if(a.kind==='blank')ok=normalized(s.values.answer??'')===normalized(a.answer??'')
 else if(a.kind==='scenario'){const node=branchPosition(a,s);ok=node?.success===true;feedback=node?.explanation??'أكمل القرارات حتى نتيجة السيناريو.'}
 else if(a.kind==='budget'){const m=campaignMetrics(s.values);ok=!!m&&(s.values.decision?.trim().length??0)>=20;feedback=m?'الحسابات مبنية على مدخلاتك؛ تفسير القرار مراجعة ذاتية، ولا يثبت جدوى حملة فعلية.':'أدخل أعدادًا غير سالبة: الطلبات لا تتجاوز النقرات والنقرات لا تتجاوز الظهور. لا تُستبدل القسمة على صفر بنتيجة صفر.'}
 else {ok=!!a.fields?.every(f=>(s.values[f.id]?.trim().length??0)>=(f.min??10)&&(f.type!=='date'||validCalendarDay(s.values[f.id])));if(a.kind==='copy')ok=ok&&s.values.ethics==='yes';feedback='اكتمال حقول مبني على مراجعتك الذاتية؛ لا يوجد تصحيح بشري أو ضمان أداء.'}
 return {complete:ok,feedback:feedback||(ok?'أحسنت؛ طابقت الإجابة المعيار المحدد.':'لم يتحقق المعيار بعد. راجع التغذية الراجعة وحاول من جديد.')}
}
export function activityOutput(a:Activity,s:Interaction){
 if(a.kind==='budget'){const m=campaignMetrics(s.values);return ['محاكاة ميزانية وقياس؛ ليست نتائج حملة فعلية',...Object.entries(s.values).map(([k,v])=>`${budgetLabels[k]??k}: ${v}`),m?`CTR: ${m.ctr??'غير معرّف'}٪ · CPC: ${m.cpc??'غير معرّف'} · CPA: ${m.cpa??'غير معرّف'} · ROAS: ${m.roas??'غير معرّف'} · مساهمة بعد الإعلان: ${m.contribution}`:'مدخلات غير صالحة'].join('\n')}
 return [a.title,...(a.fields??[]).map(f=>f.label+': '+(s.values[f.id]??''))].join('\n\n')
}
export const budgetLabels:Record<string,string>={impressions:'مرات الظهور',clicks:'النقرات',orders:'الطلبات',price:'سعر الطلب بالدينار',unitCost:'التكلفة المتغيرة للطلب بالدينار',budget:'الإنفاق الإعلاني بالدينار',decision:'قرارك وحدوده',alternativeBudget:'ميزانية بديلة للمحاكاة'}

export function simulateBudget(values:Record<string,string>,alternative:number){
 const m=campaignMetrics(values)
 if(!m||m.cpc===null||m.cpc<=0||!Number.isFinite(alternative)||alternative<0||alternative>1e9)return undefined
 const clicks=alternative/m.cpc,orders=clicks*(m.orders/m.clicks)
 return {clicks,orders,contribution:orders*(m.price-m.unitCost)-alternative}
}
