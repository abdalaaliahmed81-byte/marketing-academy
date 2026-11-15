import {describe,expect,it} from 'vitest'
import {mkdirSync,writeFileSync} from 'node:fs'
import {lessons,moduleReview} from './lessons'
import {books,modules,sources} from './curriculum'
import {artifactFields} from './domain'
import {capstoneExample,projectBriefs} from './projects'
const count=(text:string)=>text.trim().split(/\s+/).length
describe('curriculum publication integrity',()=>{
 it('has twelve progressive groups, practical activities and consistent references',()=>{
  expect(modules).toHaveLength(12);expect(moduleReview).toHaveLength(12)
  expect(lessons).toHaveLength(60)
  for(let i=1;i<=12;i++){
   const group=lessons.filter(l=>l.module===i)
   expect(group).toHaveLength(5)
   expect(group.map(l=>l.id)).toEqual(Array.from({length:5},(_,n)=>`m${String(i).padStart(2,'0')}-l0${n+1}`))
  }
  for(const l of lessons){
   expect(l.goal.length,l.id).toBeGreaterThan(20)
   expect(count(l.reading.join(' ')),l.id).toBeGreaterThan(140)
   expect(l.example.length,l.id).toBeGreaterThan(60)
   expect(l.assignment.length,l.id).toBeGreaterThan(60)
   expect(l.mission.length,l.id).toBeGreaterThan(30)
   expect(l.glossary.length,l.id).toBeGreaterThanOrEqual(3)
   for(const ref of l.refs)expect(books).toHaveProperty(ref.book)
   for(const key of l.online)expect(new URL(sources[key].url).protocol).toBe('https:')
   for(const q of l.questions){expect(new Set(q.options.map(o=>o.label)).size,q.id).toBe(3);expect(q.options.some(o=>o.id===q.answer)).toBe(true);expect(q.why.length,q.id).toBeGreaterThan(15)}
  }
  const report={status:'passed structural checks only; not an independent human content review',modules:modules.length,lessons:lessons.length,questions:lessons.reduce((n,l)=>n+l.questions.length,0),practicalActivities:lessons.length,moduleProjects:projectBriefs.length,readingWords:lessons.map(l=>({id:l.id,words:count(l.reading.join(' '))})),bookKeys:Object.keys(books)}
  mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/content-audit.json',JSON.stringify(report,null,2))
 })
 it('provides twelve worked projects and every capstone deliverable',()=>{
  expect(projectBriefs).toHaveLength(12)
  for(const p of projectBriefs){expect(p.steps).toHaveLength(4);expect(p.deliverables).toHaveLength(4);expect(p.rubric).toHaveLength(4);expect(count(p.worked.join(' '))).toBeGreaterThan(100)}
  expect(Object.keys(capstoneExample.fields).sort()).toEqual(artifactFields.map(([id])=>id).sort())
  for(const [id] of artifactFields)expect(capstoneExample.fields[id].length,id).toBeGreaterThan(60)
 })
 it('verifies the worked ad example arithmetic and sensitivity independently',()=>{
  const rows=[{spend:8000,clicks:40,orders:4,revenue:24000},{spend:7500,clicks:25,orders:5,revenue:30000}]
  const result=rows.map(r=>({cpa:r.spend/r.orders,roas:r.revenue/r.spend,contribution:r.revenue-r.orders*3600-r.spend,sensitivity:r.revenue-r.orders*3960-r.spend}))
  expect(result).toEqual([{cpa:2000,roas:3,contribution:1600,sensitivity:160},{cpa:1500,roas:4,contribution:4500,sensitivity:2700}])
  expect((15500/9).toFixed(2)).toBe('1722.22')
  expect(capstoneExample.fields.analysis).toContain('2860')
 })
})
