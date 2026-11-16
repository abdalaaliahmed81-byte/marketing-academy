/** @vitest-environment node */
import {createRequire} from 'node:module'
import {expect,it} from 'vitest'
const {resolveProfile}=createRequire(import.meta.url)('../electron/profile.cjs')
it('preserves Production data and isolates QA data, browser storage and shared test overrides',()=>{
 const prod=resolveProfile('production','/appdata','/existing-production'),qa=resolveProfile('qa','/appdata','/existing-production')
 expect(prod.userData).toBe('/existing-production');expect(prod.sessionData).toBeUndefined()
 expect(qa.userData).not.toBe(prod.userData);expect(qa.sessionData).toContain('marketing-academy-qa')
 const p=resolveProfile('production','/appdata','/existing','/fixture'),q=resolveProfile('qa','/appdata','/existing','/fixture')
 expect(q.userData).not.toBe(p.userData);expect(q.sessionData).not.toBe(p.userData)
 expect(()=>resolveProfile('other','/a','/b')).toThrow()
})
