import {readFile,writeFile,open} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {createReadStream} from 'node:fs'
import {execFileSync} from 'node:child_process'
import assert from 'node:assert/strict'
const {version}=JSON.parse(await readFile('package.json','utf8'))
const exe=`Marketing-Academy-${version}-win-x64.exe`,source=`Marketing-Academy-${version}-source.zip`
const smoke=JSON.parse(await readFile('artifacts/desktop-smoke.json','utf8'))
assert.equal(smoke.platform,'win32');assert.equal(smoke.status,'passed');assert(smoke.executable.endsWith(exe))
const payload=await open('release/win-unpacked/Marketing Academy.exe','r')
const dos=Buffer.alloc(64);await payload.read(dos,0,64,0);assert.equal(dos.toString('ascii',0,2),'MZ')
const pe=Buffer.alloc(6);await payload.read(pe,0,6,dos.readUInt32LE(60));await payload.close()
assert.equal(pe.toString('ascii',0,4),'PE\0\0');assert.equal(pe.readUInt16LE(4),0x8664)
execFileSync('git',['archive','--format=zip','-o','release/'+source,'HEAD'])
async function digest(file){const hash=createHash('sha256');for await(const part of createReadStream(file))hash.update(part);return hash.digest('hex')}
const assets=[]
for(const name of [exe,source])assets.push({name,sha256:await digest('release/'+name)})
await writeFile('release/SHA256SUMS.txt',assets.map(a=>a.sha256+'  '+a.name).join('\n')+'\n','utf8')
const report={status:'passed',commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),version,platform:'windows',payloadArchitecture:'x64',portableExecutableSmoke:smoke,assets}
await writeFile('artifacts/windows-build.json',JSON.stringify(report,null,2))
console.log(JSON.stringify(report,null,2))
