import {afterEach,expect,it,vi} from 'vitest'
import {preset,diagnostics} from './model'
import {isQAStudio,verifyEdition} from '../edition'
import {AcademyDB,isUnlocked,submitQuiz,restoreBackup} from '../db'
import {lessons} from '../lessons'
afterEach(()=>{vi.unstubAllEnvs();delete window.academy})
it('keeps all navigation locked without both a QA build and immutable QA channel',async()=>{
 vi.stubEnv('VITE_QA_STUDIO','0');window.academy={profileInfo:async()=>({channel:'qa'})} as typeof window.academy
 expect(await verifyEdition()).toBe(false);expect(isQAStudio()).toBe(false);expect(isUnlocked(lessons[59].id,[])).toBe(false)
 vi.stubEnv('VITE_QA_STUDIO','1');window.academy={profileInfo:async()=>({channel:'production'})} as typeof window.academy
 expect(await verifyEdition()).toBe(false);expect(isUnlocked(lessons[59].id,[])).toBe(false)
 window.academy={profileInfo:async()=>({channel:'qa'})} as typeof window.academy
 expect(await verifyEdition()).toBe(true);for(const l of lessons)expect(isUnlocked(l.id,[])).toBe(true)
 expect(isUnlocked('foreign-id',[])).toBe(false)
})
it('generates validated synthetic presets and resets only the selected repository',async()=>{
 vi.stubEnv('VITE_QA_STUDIO','1');window.academy={profileInfo:async()=>({channel:'qa'})} as typeof window.academy;await verifyEdition()
 const a=new AcademyDB('studio-a-'+crypto.randomUUID()),b=new AcademyDB('studio-b-'+crypto.randomUUID())
 try{
  for(const n of [0,5,30,60]){const value=preset(n);expect(value.lessonStates).toHaveLength(n);expect(value.attempts.every(a=>a.passed)).toBe(true)}
  await restoreBackup(preset(5),a);await restoreBackup(preset(30),b)
  await restoreBackup(preset(0),a);expect(await a.lessonStates.count()).toBe(0);expect(await b.lessonStates.count()).toBe(30)
  const last=lessons[59];expect((await submitQuiz(last,Object.fromEntries(last.questions.map(q=>[q.id,q.answer])),a)).passed).toBe(true)
 }finally{await a.delete();await b.delete()}
})
it('diagnoses all published lessons without claiming professional review',()=>{expect(diagnostics()).toMatchObject({modules:12,lessons:60,questions:300,issues:[]});expect(()=>preset(61)).toThrow()})
