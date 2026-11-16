import {expect,it} from 'vitest'
import {skillEvidence} from './model'
import {lessons} from '../lessons'
import {emptyLesson,scoreQuestions,type Attempt} from '../domain'
import {reviewSchedule} from '../interactive/review'
it('derives mastery without withdrawing old completions or writing learner state',()=>{
 const lesson=lessons[0],state={...emptyLesson(lesson.id),assignment:'عمل محفوظ من المتعلم',checked:[0,1,2],completed:true},answers=Object.fromEntries(lesson.questions.map((q,i)=>[q.id,q.options[i===0?1:0].id]))
 const attempt:Attempt={id:'test',lessonId:lesson.id,assessmentVersion:3,at:'2026-11-16T00:00:00Z',answers,...scoreQuestions(lesson.questions,answers)}
 const before=JSON.stringify(state),e=skillEvidence(lesson.id,[state],[attempt])
 expect(e).toMatchObject({best:80,practice:0,application:true,earnedCompletion:true,percent:52,trained:false});expect(JSON.stringify(state)).toBe(before)
 expect(skillEvidence(lesson.id,[],[])).toMatchObject({percent:0,earnedCompletion:false,trained:false});expect(()=>skillEvidence('unknown',[],[])).toThrow()
})
it('does not let a future-dated successful review hide a currently due mistake',()=>{
 const lesson=lessons[0],question=lesson.questions[0],answers=Object.fromEntries(lesson.questions.map((q,i)=>[q.id,q.options[i===0?1:0].id])),attempt:Attempt={id:'past',lessonId:lesson.id,at:'2026-11-16T00:00:00Z',answers,...scoreQuestions(lesson.questions,answers)},state={...emptyLesson(lesson.id),reviews:[{questionId:question.id,answer:question.answer,at:'2026-11-17T00:00:00Z'}]}
 expect(reviewSchedule(lessons,[attempt],[state],new Date('2026-11-16T10:00:00Z'))[0]).toMatchObject({due:'2026-11-16',streak:0})
 expect(reviewSchedule(lessons,[attempt],[state],new Date('2026-11-17T01:00:00Z'))[0]).toMatchObject({due:'2026-11-18',streak:1})
 expect(state.reviews).toHaveLength(1)
})
