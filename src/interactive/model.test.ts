import {describe,it,expect} from 'vitest'
import {lessons} from '../lessons'
import {activitiesFor,validInteraction} from './content'
import {activityResult,blankInteraction,campaignMetrics,moveItem,simulateBudget} from './model'
import {scoreQuestions,baghdadDay,type Attempt} from '../domain'
import {reviewQueue,reviewSchedule} from './review'
describe('interactive curriculum and grading',()=>{
 it('gives all60 lessons six versioned activities and covers every requested activity family',()=>{
  const kinds=new Set<string>()
  for(const lesson of lessons){const list=activitiesFor(lesson);expect(list).toHaveLength(6);expect(new Set(list.map(a=>a.id)).size).toBe(6);for(const a of list)kinds.add(a.kind);expect(list[0].steps).toEqual(lesson.reading);expect(lesson.questions.length).toBeGreaterThanOrEqual(5);expect(lesson.questions.every(q=>q.why.trim().length>0)).toBe(true)}
  expect([...kinds].sort()).toEqual(['blank','budget','calendar','campaign','copy','guide','match','persona','plan','scenario','sequence','value'])
 })
 it('grades matching, ordering, blank and branching paths without accepting a forged completion flag',()=>{
  const a=activitiesFor(lessons[0]),base={...blankInteraction(),submitted:true}
  const match=a.find(a=>a.kind==='match')!
  expect(activityResult(match,base).complete).toBe(false)
  expect(activityResult(match,{...base,values:Object.fromEntries(match.items!.map(i=>[i.id,i.id]))}).complete).toBe(true)
  const order=a.find(a=>a.kind==='sequence')!,ids=order.items!.map(i=>i.id)
  expect(activityResult(order,{...base,order:[...ids].reverse()}).complete).toBe(false)
  expect(activityResult(order,{...base,order:ids}).complete).toBe(true)
  expect(moveItem(ids,0,2)).toEqual([ids[1],ids[2],ids[0],ids[3]]);expect(ids[0]).toBe('step-0')
  const blank=a.find(a=>a.kind==='blank')!
  expect(activityResult(blank,{...base,values:{answer:' '+blank.answer!.toUpperCase()+' '}}).complete).toBe(true)
  const branch=a.find(a=>a.kind==='scenario')!
  expect(activityResult(branch,{...base,path:['unsafe','ignore']}).complete).toBe(false)
  expect(activityResult(branch,{...base,path:['unsafe','repair','test']}).complete).toBe(true)
  expect(validInteraction(branch,{...base,path:['unsafe','test']})).toBe(false)
 })
 it('calculates budget/KPIs, zero denominators, Arabic numbers and scenario assumptions correctly',()=>{
  const values={impressions:'1000',clicks:'40',orders:'4',price:'6000',unitCost:'3600',budget:'8000'}
  expect(campaignMetrics(values)).toMatchObject({ctr:4,cpc:200,cpa:2000,roas:3,revenue:24000,contribution:1600})
  expect(simulateBudget(values,10000)).toEqual({clicks:50,orders:5,contribution:2000})
  expect(campaignMetrics({...values,impressions:'١٬٠٠٠',clicks:'٤٠'})).toMatchObject({ctr:4})
  expect(campaignMetrics({...values,impressions:'0',clicks:'0',orders:'0',budget:'0'})).toMatchObject({ctr:null,cpc:null,cpa:null,roas:null})
  expect(campaignMetrics({...values,orders:'41'})).toBeUndefined();expect(campaignMetrics({...values,budget:'Infinity'})).toBeUndefined();expect(simulateBudget({...values,budget:'0'},100)).toBeUndefined()
 })
 it('retains70% passing and rejects incomplete/unknown answers',()=>{
  const q=lessons[0].questions,ten=[...q,...q.map(item=>({...item,id:item.id+'-extra'}))]
  const answers=Object.fromEntries(ten.map((item,i)=>[item.id,i<7?item.answer:item.options.find(o=>o.id!==item.answer)!.id]))
  expect(scoreQuestions(ten,answers)).toMatchObject({score:70,passed:true})
  expect(()=>scoreQuestions(q,{...Object.fromEntries(q.map(i=>[i.id,i.answer])),unknown:'bad'})).toThrow()
  expect(()=>scoreQuestions(q,{})).toThrow()
 })
})
describe('spaced retrieval in Baghdad time',()=>{
 it('makes mistakes due today and correct retrieval due1/3 days later across midnight',()=>{
  const lesson=lessons[0],question=lesson.questions[0],answers=Object.fromEntries(lesson.questions.map(q=>[q.id,q.id===question.id?q.options.find(o=>o.id!==q.answer)!.id:q.answer]))
  const attempt:Attempt={id:'test',lessonId:lesson.id,at:'2026-11-16T20:59:59Z',answers,...scoreQuestions(lesson.questions,answers)}
  expect(baghdadDay(new Date(attempt.at))).toBe('2026-11-16');expect(baghdadDay(new Date('2026-11-16T21:00:00Z'))).toBe('2026-11-17')
  expect(baghdadDay(new Date('2026-12-31T21:00:00Z'))).toBe('2027-01-01')
  expect(reviewQueue(lessons,[attempt],[],new Date(attempt.at))).toHaveLength(1)
  const state={id:lesson.id,notes:'',assignment:'',checked:[],completed:false,bookmarked:false,reviews:[{questionId:question.id,answer:question.answer,at:'2026-11-16T21:00:00Z'}]}
  expect(reviewQueue(lessons,[attempt],[state],new Date('2026-11-17T00:00:00Z'))).toHaveLength(0)
  expect(reviewSchedule(lessons,[attempt],[state])[0]).toMatchObject({due:'2026-11-18',interval:1})
  const retake={...attempt,id:'retake',at:'2026-11-16T21:01:00Z',answers:Object.fromEntries(lesson.questions.map(q=>[q.id,q.answer])),score:100,passed:true,missed:[]}
  expect(reviewSchedule(lessons,[attempt,retake],[state])[0]).toMatchObject({due:'2026-11-18',interval:1})
  const next={...state,reviews:[...state.reviews,{questionId:question.id,answer:question.answer,at:'2026-11-18T08:00:00Z'}]}
  expect(reviewSchedule(lessons,[attempt],[next])[0]).toMatchObject({due:'2026-11-21',interval:3})
 })
})
