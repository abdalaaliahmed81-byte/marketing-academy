import {readFile,writeFile,open,copyFile,stat} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {createReadStream} from 'node:fs'
import {execFileSync} from 'node:child_process'
import assert from 'node:assert/strict'
const {version}=JSON.parse(await readFile('package.json','utf8'))
const exe='Marketing-Academy-Portable-Windows-x64.exe',source=`Marketing-Academy-${version}-source.zip`
const normalStart=JSON.parse((await readFile('artifacts/windows-normal-start.json','utf8')).replace(/^\uFEFF/,''));assert.equal(normalStart.status,'passed');assert.equal(normalStart.visibleWindow,true)
const smoke=JSON.parse(await readFile('artifacts/desktop-smoke.json','utf8'))
assert.equal(smoke.platform,'win32');assert.equal(smoke.status,'passed');assert(smoke.executable.endsWith(exe))
assert.equal(smoke.projectAutosavePersistence,true);assert.equal(smoke.profilePersistence,true);assert.equal(smoke.noteTimestampPersistence,true);assert.equal(smoke.interactiveActivityPersistence,true);assert.equal(smoke.sqlite.schemaVersion,1);assert.equal(smoke.sqlite.encryptedRecords,true);assert.equal(smoke.sqlite.legacySourcesPreserved,true);assert(smoke.sqlite.accounts>=2)
const wrapper=await open('release/'+exe,'r'),wrapperDos=Buffer.alloc(64),wrapperPe=Buffer.alloc(6)
await wrapper.read(wrapperDos,0,64,0);assert.equal(wrapperDos.toString('ascii',0,2),'MZ');await wrapper.read(wrapperPe,0,6,wrapperDos.readUInt32LE(60));await wrapper.close();assert.equal(wrapperPe.toString('ascii',0,4),'PE\0\0')
const payload=await open('release/win-unpacked/Marketing Academy.exe','r')
const dos=Buffer.alloc(64);await payload.read(dos,0,64,0);assert.equal(dos.toString('ascii',0,2),'MZ')
const pe=Buffer.alloc(6);await payload.read(pe,0,6,dos.readUInt32LE(60));await payload.close()
assert.equal(pe.toString('ascii',0,4),'PE\0\0');assert.equal(pe.readUInt16LE(4),0x8664)
execFileSync('git',['archive','--format=zip','-o','release/'+source,'HEAD'])
async function digest(file){const hash=createHash('sha256');for await(const part of createReadStream(file))hash.update(part);return hash.digest('hex')}
await copyFile('docs/START_AR.md','release/START_AR.md')
const exeStat=await stat('release/'+exe);assert(exeStat.size>50_000_000)
const assets=[]
for(const name of [exe,source,'START_AR.md'])assets.push({name,sha256:await digest('release/'+name)})
await writeFile('release/SHA256SUMS.txt',assets.map(a=>a.sha256+'  '+a.name).join('\n')+'\n','utf8')
const report={status:'passed',commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),version,platform:'windows',normalStart,portableBytes:exeStat.size,wrapperMachine:wrapperPe.readUInt16LE(4),payloadArchitecture:'x64',portableExecutableSmoke:smoke,assets}
await writeFile('artifacts/windows-build.json',JSON.stringify(report,null,2))
console.log(JSON.stringify(report,null,2))
