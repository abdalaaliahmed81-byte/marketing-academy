import {spawnSync} from 'node:child_process'
import {mkdirSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
mkdirSync('artifacts',{recursive:true})
const npm=process.platform==='win32'?'npm.cmd':'npm'
for(const production of [true,false]){
 const result=spawnSync(npm,['audit','--json',...(production?['--omit=dev']:[])],{encoding:'utf8',shell:process.platform==='win32'})
 const report=JSON.parse(result.stdout)
 assert(report.metadata?.vulnerabilities,'dependency audit did not return usable evidence')
 const counts=report.metadata.vulnerabilities
 assert.equal(counts.high,0);assert.equal(counts.critical,0)
 if(production)assert.equal(counts.total,0)
 writeFileSync('artifacts/'+(production?'production-dependency-audit':'dependency-audit')+'.json',JSON.stringify(report,null,2))
 console.log((production?'Production':'All tooling')+' vulnerability counts:',JSON.stringify(counts))
}
