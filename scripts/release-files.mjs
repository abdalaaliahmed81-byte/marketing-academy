import {readFile,writeFile,open,copyFile,stat} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {createReadStream} from 'node:fs'
import {execFileSync} from 'node:child_process'
import assert from 'node:assert/strict'
const {version}=JSON.parse(await readFile('package.json','utf8'))
const exe='Marketing-Academy-Portable-Windows-x64.exe',qaExe='Marketing-Academy-QA-Windows-x64.exe',source=`Marketing-Academy-${version}-source.zip`
const read=async p=>JSON.parse((await readFile(p,'utf8')).replace(/^\uFEFF/,''))
async function verify(channel,name,smokeFile,normalFile,payloadFile){
 const normalStart=await read(normalFile),smoke=await read(smokeFile)
 assert.equal(normalStart.status,'passed');assert.equal(normalStart.visibleWindow,true);assert.equal(normalStart.executable,name)
 assert.equal(smoke.platform,'win32');assert.equal(smoke.channel,channel);assert.equal(smoke.status,'passed');assert(smoke.executable.endsWith(name))
 for(const key of ['projectAutosavePersistence','profilePersistence','noteTimestampPersistence','interactiveActivityPersistence','offlineLessonCompletion','quizAndCompletionSurviveRestart','actualNewAccountIsolation','restrictedChildPath'])assert.equal(smoke[key],true)
 for(const key of ['confirmation','invalidName','unknownAccount','wrongPassword','duplicate'])assert.equal(smoke.expectedAuthRejections[key],true)
 assert.equal(smoke.sqlite.schemaVersion,1);assert.equal(smoke.sqlite.encryptedRecords,true);assert.equal(smoke.sqlite.legacySourcesPreserved,true);assert(smoke.sqlite.accounts>=3)
 const wrapper=await open('release/'+name,'r'),wrapperDos=Buffer.alloc(64),wrapperPe=Buffer.alloc(6)
 await wrapper.read(wrapperDos,0,64,0);assert.equal(wrapperDos.toString('ascii',0,2),'MZ');await wrapper.read(wrapperPe,0,6,wrapperDos.readUInt32LE(60));await wrapper.close();assert.equal(wrapperPe.toString('ascii',0,4),'PE\0\0')
 const payload=await open(payloadFile,'r'),dos=Buffer.alloc(64),pe=Buffer.alloc(6)
 await payload.read(dos,0,64,0);assert.equal(dos.toString('ascii',0,2),'MZ');await payload.read(pe,0,6,dos.readUInt32LE(60));await payload.close()
 assert.equal(pe.toString('ascii',0,4),'PE\0\0');assert.equal(pe.readUInt16LE(4),0x8664)
 for(const key of ['unicodeRecovery','wrongPhraseRejected','duplicateRecoveryRejected','recoveredLoginAfterRestart','originalAccountPreserved','wrongCurrentPasswordRejected','passwordChangeAfterRestart','unicodePasswordUntruncated'])assert.equal(smoke.authExtensions[key],true)
 const bytes=(await stat('release/'+name)).size;assert(bytes>50_000_000)
 return {channel,normalStart,portableBytes:bytes,wrapperMachine:wrapperPe.readUInt16LE(4),payloadArchitecture:'x64',portableExecutableSmoke:smoke}
}
const baseline={production:await read('artifacts/auth-baseline-production.json'),qa:await read('artifacts/auth-baseline-qa.json')}
for(const report of Object.values(baseline)){assert.equal(report.status,'passed');assert.equal(report.baselineVersion,'2.3.1');assert.equal(report.unicodeBaselineRejection,true);assert.equal(report.unicodePasswordBaselineTruncation,true);for(const key of ['confirmation','invalidName','unknownAccount','wrongPassword','duplicate'])assert.equal(report.expectedAuthRejections[key],true)}
const production=await verify('production',exe,'artifacts/desktop-smoke.json','artifacts/windows-normal-start.json','release/win-unpacked/Marketing Academy.exe')
assert.equal(production.portableExecutableSmoke.productionQAAccessDenied,true)
const qa=await verify('qa',qaExe,'artifacts/desktop-smoke-qa.json','artifacts/windows-normal-start-qa.json','release/qa-build/win-unpacked/Marketing Academy QA.exe')
for(const value of Object.values(qa.portableExecutableSmoke.qaStudio??{}))assert.equal(value,true)
assert.equal(qa.portableExecutableSmoke.qaStudio?.all180LessonRoutes,true)
const isolation=await read('artifacts/dual-isolation.json');assert.equal(isolation.status,'passed');for(const key of ['productionAndQaConcurrent','identicalUsernamesIndependent','productionDatabaseUnchangedByQA','restartIsolation'])assert.equal(isolation[key],true)
execFileSync('git',['archive','--format=zip','-o','release/'+source,'HEAD'])
async function digest(file){const hash=createHash('sha256');for await(const part of createReadStream(file))hash.update(part);return hash.digest('hex')}
await copyFile('docs/START_AR.md','release/START_AR.md')
const assets=[];for(const name of [exe,qaExe,source,'START_AR.md'])assets.push({name,sha256:await digest('release/'+name)})
await writeFile('release/SHA256SUMS.txt',assets.map(a=>a.sha256+'  '+a.name).join('\n')+'\n','utf8')
const editionBoundary=await read('artifacts/edition-boundary.json');assert.equal(editionBoundary.qaToolsExcludedFromProduction,true);assert.equal(editionBoundary.status,'passed')
const citationDispatch=await read('artifacts/citation-smoke.json');assert.equal(citationDispatch.status,'passed');assert.equal(citationDispatch.sourceAndTermsDispatched,true);assert.equal(citationDispatch.untrustedHostDenied,true)
const report={status:'passed',editionBoundary,citationDispatch,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),version,platform:'windows',...production,qa,isolation,authAuditBaseline:baseline,assets}
await writeFile('artifacts/windows-build.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))
