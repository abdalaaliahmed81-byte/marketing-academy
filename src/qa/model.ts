import {lessons} from '../lessons'
import {modules} from '../curriculum'
import {emptyLesson,scoreQuestions,type Settings} from '../domain'
import {backupSchema} from '../data-schema'
import {CURRENT_ASSESSMENT} from '../lessons/assessment-history'
import {activitiesFor} from '../interactive/content'
export function preset(count:number){
 if(![0,5,30,60].includes(count))throw new Error('قالب غير معروف')
 const settings:Settings={id:'local',goal:'بيانات QA مصطنعة — ليست إنجاز متعلم',minutes:20,business:'مطعم',theme:'light'}
 const selected=lessons.slice(0,count)
 return backupSchema.parse({version:3,settings:[settings],lessonStates:selected.map(l=>({...emptyLesson(l.id),notes:'QA · ملاحظة مصطنعة',notesUpdatedAt:new Date().toISOString(),assignment:'محاكاة اختبار آلية وليست تسليم متعلم أو أداء عميل حقيقي. '.repeat(5),checked:[0,1,2],completed:true})),attempts:selected.map(l=>{const answers=Object.fromEntries(l.questions.map(q=>[q.id,q.answer]));return {id:crypto.randomUUID(),lessonId:l.id,assessmentVersion:CURRENT_ASSESSMENT,at:new Date().toISOString(),answers,...scoreQuestions(l.questions,answers)}}),missions:[],projects:[],activity:[],moduleProjects:[]})
}
export function diagnostics(){return {modules:modules.length,lessons:lessons.length,questions:lessons.reduce((n,l)=>n+l.questions.length,0),activities:lessons.reduce((n,l)=>n+activitiesFor(l).length,0),issues:lessons.flatMap(l=>{const issues=[];if(l.questions.length<5)issues.push('أقل من٥ أسئلة');if(l.questions.some(q=>!q.why.trim()||!q.options.some(o=>o.id===q.answer)))issues.push('سؤال أو شرح غير صالح');if(!activitiesFor(l).length)issues.push('نشاط مفقود');return issues.map(message=>({id:l.id,message}))})}}
