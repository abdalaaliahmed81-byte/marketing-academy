/** @vitest-environment node */
import {beforeEach,afterEach,it,expect} from 'vitest'
import {createApiServer} from './server'
import {AcademyEngine} from './engine'
import {emptyState} from '../src/data-schema'
let engine:AcademyEngine,server:ReturnType<typeof createApiServer>,url:string
const origin='http://127.0.0.1:4444',password='api-audit-long-password'
async function command(command:string,payload:unknown,cookie?:string,custom:Record<string,string>={}){
 return fetch(url+'/api/command',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Academy-Request':'1',...(cookie?{Cookie:cookie}:{}),...custom},body:JSON.stringify({command,payload})})
}
beforeEach(async()=>{engine=new AcademyEngine(':memory:');server=createApiServer({engine,origin});await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));url='http://127.0.0.1:'+(server.address() as {port:number}).port})
afterEach(async()=>{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));engine.close()})
it('uses HttpOnly same-site sessions, enforces origin and protects cross-account state',async()=>{
 const registration=await command('register',{name:'API Alice',password}),cookie=registration.headers.get('set-cookie')!
 expect(cookie).toContain('HttpOnly');expect(cookie).toContain('SameSite=Strict');expect(cookie).not.toContain('password')
 const alice=(await registration.json()).value
 expect(alice.token).toBeUndefined()
 const authCookie=cookie.split(';')[0]
 expect((await command('read',{ownerId:alice.session.id})).status).toBe(401)
 expect((await command('read',{ownerId:alice.session.id},authCookie,{Origin:'https://attacker.invalid'})).status).toBe(403)
 expect((await command('read',{ownerId:alice.session.id},authCookie,{'X-Academy-Request':''})).status).toBe(403)
 const bobResponse=await command('register',{name:'API Bob',password}),bob=(await bobResponse.json()).value,bobCookie=bobResponse.headers.get('set-cookie')!.split(';')[0]
 expect((await command('commit',{ownerId:alice.session.id,expectedRevision:0,state:emptyState()},bobCookie)).status).toBe(409)
 expect((await command('read',{ownerId:bob.session.id},bobCookie)).status).toBe(200)
 expect((await command('logout',{ownerId:alice.session.id},authCookie)).headers.get('set-cookie')).toContain('Max-Age=0')
 expect((await command('read',{ownerId:alice.session.id},authCookie)).status).toBe(401)
},20000)
it('rejects malformed/oversized/unknown requests, rate limits auth attempts and refuses insecure remote origins',async()=>{
 expect((await command('query',{sql:'DROP TABLE accounts'})).status).toBe(400)
 expect((await fetch(url+'/api/command',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Academy-Request':'1'},body:'{'})).status).toBe(400)
 expect((await command('login',{name:'x',password:'x'.repeat(129)})).status).toBe(400)
 expect((await command('register',{name:'x',password:'x'.repeat(10_000_000)})).status).toBe(413)
 for(let i=0;i<30;i++)await command('changePassword',{})
 expect((await command('changePassword',{})).status).toBe(429)
 expect(()=>createApiServer({engine,origin:'http://example.org'})).toThrow('HTTPS')
 const health=await fetch(url+'/api/health');expect((await health.json()).provider).toBe('sqlite')
})
