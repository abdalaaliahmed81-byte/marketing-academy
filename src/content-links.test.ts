import {createRequire} from 'node:module'
import {expect,it} from 'vitest'
import registry from './content/provenance.json'
const {safeExternal}=createRequire(import.meta.url)('../electron/external.cjs') as {safeExternal:(url:string)=>boolean}
it('allows every published source and terms link to open in the external browser',()=>{
 const denied=registry.sources.flatMap(s=>['url','rightsURL'].flatMap(key=>{const url=s[key as 'url'|'rightsURL'];return safeExternal(url)?[]:[{source:s.id,key,url}]}))
 expect(denied).toEqual([])
})
it('still rejects arbitrary hosts, credentials, deceptive subdomains and non-HTTPS URLs',()=>{
 for(const url of ['javascript:alert(1)','file:///tmp/a','http://www.w3.org/','https://www.w3.org.evil.invalid/a','https://evil.invalid/','https://user:pass@www.w3.org/a'])expect(safeExternal(url)).toBe(false)
})
