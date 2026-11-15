import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
import {setTimeout as delay} from 'node:timers/promises'
const id=execFileSync('docker',['compose','ps','-q','academy'],{encoding:'utf8'}).trim()
assert(id,'compose service is missing')
let state
for(let attempt=0;attempt<60;attempt++){
 state=JSON.parse(execFileSync('docker',['inspect',id],{encoding:'utf8'}))[0]
 if(state.State.Health?.Status==='healthy')break
 await delay(1000)
}
assert.equal(state.State.Health.Status,'healthy')
assert.equal(state.Config.User,'101:101')
assert.equal(state.HostConfig.ReadonlyRootfs,true)
assert(state.HostConfig.CapDrop.includes('ALL'))
assert(state.HostConfig.SecurityOpt.includes('no-new-privileges:true'))
const origin=process.env.ACADEMY_WEB_URL??'http://127.0.0.1:8080'
const response=await fetch(origin+'/')
assert.equal(response.status,200)
const html=await response.text()
assert(html.includes('lang="ar"')&&html.includes('dir="rtl"'))
assert(response.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"))
assert.equal(response.headers.get('x-content-type-options'),'nosniff')
assert.equal(response.headers.get('x-frame-options'),'DENY')
const asset=html.match(/src="([^"]+\.js)"/)[1]
assert.equal((await fetch(new URL(asset,origin))).status,200)
const health=await fetch(origin+'/api/health');assert.equal(health.status,200);assert.equal((await health.json()).provider,'sqlite')
const call=async(command,payload,cookie)=>{const response=await fetch(origin+'/api/command',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Academy-Request':'1',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify({command,payload})});return {response,body:await response.json()}}
const name='Docker audit '+crypto.randomUUID().slice(0,8),password='docker-audit-long-password'
const registered=await call('register',{name,password})
assert.equal(registered.response.status,200)
const cookie=registered.response.headers.get('set-cookie').split(';')[0],ownerId=registered.body.value.session.id
const updated=await call('updateProfile',{ownerId,name:'ملف Docker محفوظ'},cookie);assert.equal(updated.response.status,200);assert.equal(updated.body.value.username,name.toLowerCase())
const saved=registered.body.value.snapshot.state
saved.lessonStates=[{id:'m01-l01',notes:'docker-sqlite-persistence',bookmarked:false,assignment:'',checked:[],completed:false}]
assert.equal((await call('commit',{ownerId,expectedRevision:0,state:saved},cookie)).response.status,200)
execFileSync('docker',['compose','restart','api'],{stdio:'pipe'})
let ready=false
for(let i=0;i<45;i++){try{if((await fetch(origin+'/api/health')).ok){ready=true;break}}catch{}await delay(1000)}
assert(ready,'API did not recover after restart')
const relogin=await call('login',{name,password});assert.equal(relogin.response.status,200)
assert.equal(relogin.body.value.session.name,'ملف Docker محفوظ')
assert.equal(relogin.body.value.snapshot.state.lessonStates[0].notes,'docker-sqlite-persistence')
const apiId=execFileSync('docker',['compose','ps','-q','api'],{encoding:'utf8'}).trim()
const api=JSON.parse(execFileSync('docker',['inspect',apiId],{encoding:'utf8'}))[0]
assert.equal(api.HostConfig.ReadonlyRootfs,true);assert.equal(api.Config.User,'node');assert(api.HostConfig.CapDrop.includes('ALL'))
const report={status:'passed',http:200,healthy:true,user:state.Config.User,readOnlyRoot:state.HostConfig.ReadonlyRootfs,capabilitiesDropped:state.HostConfig.CapDrop,securityHeaders:true,rtl:true,scriptAsset:true,sqliteApi:true,apiUser:api.Config.User,apiReadOnlyRoot:true,progressSurvivesApiRestart:true,profileSurvivesApiRestart:true}
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/docker-smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
