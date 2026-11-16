import {afterEach,expect,it} from 'vitest'
import {lessons} from './lessons'
import previous from './lessons/assessment-v2-snapshot.json'
import {assessmentQuestions,CURRENT_ASSESSMENT} from './lessons/assessment-history'
import {AcademyDB,restoreBackup,retryQuiz,submitQuiz} from './db'
import {emptyState,normalizeState} from './data-schema'
import {emptyLesson,scoreQuestions} from './domain'
import {workedArtifacts} from './projectArtifacts'
let database:AcademyDB|undefined
afterEach(async()=>{await database?.delete();database=undefined})
it('keeps all published v2 wording and all versions of answer identities stable',()=>{
 expect(CURRENT_ASSESSMENT).toBe(3)
 for(const lesson of lessons){
  expect(assessmentQuestions(lesson,2)).toEqual(previous[lesson.id as keyof typeof previous])
  for(const v of [1,2] as const)expect(assessmentQuestions(lesson,v).map(q=>[q.id,q.answer,...q.options.map(o=>o.id)])).toEqual(lesson.questions.map(q=>[q.id,q.answer,...q.options.map(o=>o.id)]))
 }
})
it('preserves a v2 draft/score, notes and completion through restore, retry and reopening',async()=>{
 database=new AcademyDB('content-v3-'+crypto.randomUUID());const lesson=lessons[0],answers=Object.fromEntries(lesson.questions.map(q=>[q.id,q.answer])),old=assessmentQuestions(lesson,2)
 const attempt={id:'preserved-v2',lessonId:lesson.id,assessmentVersion:2 as const,at:'2026-11-16T00:00:00Z',answers,...scoreQuestions(old,answers)}
 const state={...emptyLesson(lesson.id),notes:'ملاحظة لا تحذف',assignment:'تطبيق متعلم محفوظ من النسخة السابقة دون حذف أو تغيير',checked:[0,1,2],completed:true,quizDraft:{answers,assessmentVersion:2 as const,active:true,round:1,updatedAt:attempt.at}}
 await restoreBackup({...emptyState(),lessonStates:[state],attempts:[attempt]},database)
 expect(await submitQuiz(lesson,answers,database)).toMatchObject({assessmentVersion:2,score:100})
 await retryQuiz(lesson.id,database);expect(await submitQuiz(lesson,answers,database)).toMatchObject({assessmentVersion:3,score:100})
 database.close();await database.open();expect(await database.lessonStates.get(lesson.id)).toMatchObject({notes:state.notes,assignment:state.assignment,completed:true})
 expect((await database.attempts.toArray()).find(a=>a.id===attempt.id)).toEqual(attempt)
 expect(normalizeState({...emptyState(),attempts:[attempt]}).attempts[0]).toEqual(attempt)
})
it('corrects ambiguous inference, privacy, dimension and project-count examples',()=>{
 const q=(id:string)=>lessons.flatMap(l=>l.questions).find(q=>q.id===id)!
 expect(q('m02-l03-q1').prompt).toContain('غير مباشر')
 expect(q('m03-l01-q3').options[0].label).not.toContain('تحسن')
 expect(q('m06-l02-q3').prompt).toContain('العرض المتبقي')
 expect(q('m10-l02-q2').options[1].label).toContain('دون عنوان شخصي')
 expect(q('m05-l04-q3').why).toContain('30٪')
 expect(JSON.stringify(workedArtifacts)).not.toContain('26 حقل')
})
