import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
const dir=await mkdtemp(join(tmpdir(),'academy-agency-'))
try{
 const file=join(dir,'agency.mjs');await build({stdin:{contents:"export * from './src/agency/model';export * from './src/agency/schema'",resolveDir:process.cwd()},outfile:file,bundle:true,platform:'node',format:'esm',logLevel:'silent'})
 const {agencyClients,newAgencyProject,simulateCampaign,workedAgencyProject,agencyProjectSchema,agencyMarkdown}=await import(pathToFileURL(file).href)
 const expected=[{orders:15,revenue:120000,contribution:24000},{orders:21,revenue:525000,contribution:174000},{orders:18,revenue:324000,contribution:96000}]
 const cases=agencyClients.map((c,i)=>{const r=simulateCampaign(newAgencyProject(c.id));for(const key of ['orders','revenue','contribution'])assert.equal(r.total[key],expected[i][key]);for(const key of ['spend','impressions','clicks','orders'])assert.equal(r.days.reduce((n,d)=>n+d[key],0),r.total[key]);assert(r.total.orders<=c.capacity);const p=agencyProjectSchema.parse({...workedAgencyProject(c.id),checked:[0,1,2,3],completed:true});assert(agencyMarkdown(p).includes('بيانات اصطناعية'));return {id:c.id,name:c.name,synthetic:true,...expected[i],workedDeliverables:7}})
 assert.equal(simulateCampaign({...newAgencyProject('restaurant'),budget:0}).total.cpa,null)
 const report={status:'PASS',model:'agency-model-v1',checkedAt:new Date().toISOString(),synthetic:true,clients:3,platforms:['meta','google'],cases,totalsReconciledAcrossSevenSyntheticDays:true,zeroDenominatorsReturnNull:true,limits:['Deterministic arithmetic from explicit fictional assumptions, not Meta/Google algorithms or market prediction.','A/B comparisons are descriptive generated data, not randomized market evidence/statistical significance.','Completion and rubric are learner self-review, not instructor certification.']}
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/agency-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
}finally{await rm(dir,{recursive:true,force:true})}
