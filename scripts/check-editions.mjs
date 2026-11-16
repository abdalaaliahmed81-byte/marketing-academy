import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
async function javascript(dir){let result='';for(const file of await readdir(dir,{withFileTypes:true})){const name=path.join(dir,file.name);if(file.isDirectory())result+=await javascript(name);else if(name.endsWith('.js'))result+=await readFile(name,'utf8')}return result}
const production=await javascript('dist'),qa=await javascript('work/qa-package/dist')
for(const marker of ['academy-qa-studio-reports-v1','qa-content-diagnostics.json','qa-bug-reports.json']){assert(!production.includes(marker),'QA tool present in Production bundle');assert(qa.includes(marker),'QA tool missing')}
const original=JSON.parse(await readFile('package.json','utf8')),isolated=JSON.parse(await readFile('work/qa-package/package.json','utf8'))
assert.notEqual(original.build.appId,isolated.build.appId);assert.equal(isolated.build.appId,'com.marketingacademy.desktop.qa')
assert.equal(JSON.parse(await readFile('electron/flavor.json','utf8')).channel,'production');assert.equal(JSON.parse(await readFile('work/qa-package/electron/flavor.json','utf8')).channel,'qa')
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/edition-boundary.json',JSON.stringify({status:'passed',qaToolsExcludedFromProduction:true,qaToolsPresentInQA:true,dedicatedApplicationId:true,immutableChannels:true},null,2));console.log('Edition build boundary PASS')
