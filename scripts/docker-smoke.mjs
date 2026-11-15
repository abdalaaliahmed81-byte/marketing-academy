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
const response=await fetch('http://127.0.0.1:8080/')
assert.equal(response.status,200)
const html=await response.text()
assert(html.includes('lang="ar"')&&html.includes('dir="rtl"'))
assert(response.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"))
assert.equal(response.headers.get('x-content-type-options'),'nosniff')
assert.equal(response.headers.get('x-frame-options'),'DENY')
const asset=html.match(/src="([^"]+\.js)"/)[1]
assert.equal((await fetch(new URL(asset,'http://127.0.0.1:8080'))).status,200)
const report={status:'passed',http:200,healthy:true,user:state.Config.User,readOnlyRoot:state.HostConfig.ReadonlyRootfs,capabilitiesDropped:state.HostConfig.CapDrop,securityHeaders:true,rtl:true,scriptAsset:true}
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/docker-smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
