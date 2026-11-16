import {readFileSync} from 'node:fs'
import {assertEducationalReadiness,assertPublicationReadiness} from '../scripts/educational-gate.mjs'
import {afterEach,describe,expect,it} from 'vitest'
import {lessons} from './lessons'
import {assessmentQuestions} from './lessons/assessment-history'
import {sourceRegistry} from './content/References'
import {AcademyDB,retryQuiz,saveLesson,saveQuizDraftAnswers,submitQuiz} from './db'
import {emptyLesson,scoreQuestions,type Attempt} from './domain'
import {emptyState,normalizeState} from './data-schema'
import {activitiesFor,validInteraction} from './interactive/content'
import {activityResult,blankInteraction} from './interactive/model'
let database:AcademyDB|undefined
afterEach(async()=>{await database?.delete();database=undefined})
describe('editorial revision and learner-history compatibility',()=>{
 it('blocks stable professional completion while permitting an explicitly limited preview',()=>{
  const readiness={...JSON.parse(readFileSync('docs/EDUCATIONAL_READINESS.json','utf8')),independentArabicReview:'open',learnerValidation:'open',professionalApproval:false,independentReviewEvidence:null};expect(()=>assertEducationalReadiness(readiness)).toThrow(/G12/);expect(()=>assertPublicationReadiness(readiness,'stable')).toThrow(/G12/);expect(()=>assertPublicationReadiness(readiness,'preview')).not.toThrow();expect(()=>assertPublicationReadiness(readiness,'unknown')).toThrow();expect(()=>assertPublicationReadiness({...readiness,reviewedLessons:59},'preview')).toThrow()
 })
 it('maps all sixty lessons to bounded sources without claiming human approval',()=>{
  expect(sourceRegistry.lessons.map(l=>l.id)).toEqual(lessons.map(l=>l.id))
  expect(new Set(sourceRegistry.sources.map(s=>s.id)).size).toBe(sourceRegistry.sources.length)
  for(const lesson of lessons){
   const record=sourceRegistry.lessons.find(r=>r.id===lesson.id)!
   expect(record.independentHumanReview).toBe(false)
   expect(record.references.length).toBeGreaterThan(0)
   for(const ref of record.references){const s=sourceRegistry.sources.find(s=>s.id===ref.sourceId)!;expect(s).toBeDefined();expect(s.use).not.toContain('رابط فقط');expect(new URL(s.rightsURL).protocol).toBe('https:')}
   expect(lesson.reading.join(' ').trim().split(/\s+/).length,lesson.id).toBeGreaterThan(250)
   expect(lesson.miniCase,lesson.id).toMatch(/حل|الحل/)
   expect(lesson.miniCase).not.toMatch(/^قبل قراءة الحل/)
   expect(lesson.summary).not.toBe(lesson.goal)
   expect(lesson.example).toMatch(/^محاكاة تعليمية عراقية/)
   const old=assessmentQuestions(lesson,1)
   expect(lesson.questions.map(q=>[q.id,q.answer,...q.options.map(o=>o.id)])).toEqual(old.map(q=>[q.id,q.answer,...q.options.map(o=>o.id)]))
   expect(lesson.questions).toHaveLength(5)
   const answers=Object.fromEntries(old.map(q=>[q.id,q.answer]))
   expect(scoreQuestions(old,answers)).toEqual(scoreQuestions(lesson.questions,answers))
  }
 })
 it('accepts legacy results unchanged while rejecting falsified grades and unknown versions',()=>{
  const lesson=lessons[0],old=assessmentQuestions(lesson,1),answers=Object.fromEntries(old.map((q,i)=>[q.id,q.options[i===0?1:0].id]))
  const attempt:Attempt={id:'old-attempt',lessonId:lesson.id,at:'2026-11-15T12:00:00Z',answers,...scoreQuestions(old,answers)}
  const data={...emptyState(),attempts:[attempt],lessonStates:[{...emptyLesson(lesson.id),notes:'ملاحظة قديمة',assignment:'تطبيق محفوظ',checked:[0,1,2],completed:true}]}
  expect(normalizeState(data).attempts[0]).toEqual(attempt)
  expect(assessmentQuestions(lesson,1)[0].options[1].label).not.toBe(lesson.questions[0].options[1].label)
  expect(()=>normalizeState({...data,attempts:[{...attempt,score:100}]})).toThrow()
  expect(()=>normalizeState({...data,attempts:[{...attempt,assessmentVersion:3}]})).toThrow()
 })
 it('finishes an old active draft with its original questions, then persists a revised retry after reopen',async()=>{
  database=new AcademyDB('editorial-'+crypto.randomUUID());const lesson=lessons[0],answers=Object.fromEntries(lesson.questions.map(q=>[q.id,q.answer]))
  await database.lessonStates.put({...emptyLesson(lesson.id),notes:'لا تحذف تقدمي',quizDraft:{answers,active:true,round:3,updatedAt:'2026-11-15T12:00:00Z'}})
  await saveQuizDraftAnswers(lesson.id,answers,database)
  expect((await database.lessonStates.get(lesson.id))?.quizDraft?.assessmentVersion).toBe(1)
  expect(await submitQuiz(lesson,answers,database)).toMatchObject({assessmentVersion:1,score:100})
  await retryQuiz(lesson.id,database);await saveQuizDraftAnswers(lesson.id,answers,database)
  expect(await submitQuiz(lesson,answers,database)).toMatchObject({assessmentVersion:2,score:100})
  await saveLesson(lesson.id,{assignment:'تطبيق لم يتغير',checked:[0,1,2]},database)
  database.close();await database.open()
  expect((await database.attempts.toArray()).map(a=>a.assessmentVersion).sort()).toEqual([1,2])
  expect(await database.lessonStates.get(lesson.id)).toMatchObject({notes:'لا تحذف تقدمي',assignment:'تطبيق لم يتغير',quizDraft:{assessmentVersion:2,active:false}})
 })
 it('preserves every expanded guide-v1 earned result without claiming new paragraphs were read',()=>{
  for(const lesson of lessons.filter(l=>l.module>=4)){
   const guide=activitiesFor(lesson).find(a=>a.kind==='guide')!
   const saved={...blankInteraction(),step:2,submitted:true,values:{'ack-0':'yes','ack-1':'yes','ack-2':'yes',reflection:'قرار سابق موثق قبل توسيع الشرح'}}
   expect(guide.requiredStepCount,lesson.id).toBe(3)
   expect(guide.steps!.length).toBeGreaterThan(3)
   expect(validInteraction(guide,saved)).toBe(true)
   expect(activityResult(guide,saved).complete,lesson.id).toBe(true)
   expect(saved.values).not.toHaveProperty('ack-3')
   expect(activityResult(guide,{...saved,values:{...saved.values,'ack-3':'yes'}}).complete).toBe(true)
   expect(activityResult(guide,{...saved,values:{...saved.values,reflection:''}}).complete).toBe(false)
  }
 })
 it('retains activity identifiers and accepts an acknowledged original guide step after additions',()=>{
  for(const lesson of lessons){const defs=activitiesFor(lesson),guide=defs.find(d=>d.kind==='guide')!,value={...blankInteraction(),step:0};expect(validInteraction(guide,value)).toBe(true);expect(defs.map(d=>d.id)).toEqual(['guide-v1','match-v1','sequence-v1','blank-v1','scenario-v1','studio-v1'])}
 })
})
