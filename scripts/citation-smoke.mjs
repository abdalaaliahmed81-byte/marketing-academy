import {_electron as electron,expect} from '@playwright/test'
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
const data=await mkdtemp(path.join(tmpdir(),'academy-citation-'))
let app
try{
 app=await electron.launch({args:['.',...(process.platform==='linux'?['--no-sandbox','--ozone-platform=headless']:[])],env:{...process.env,ACADEMY_TEST_DATA_DIR:data}})
 const page=await app.firstWindow();await page.waitForURL('academy://app/**')
 await app.evaluate(({shell})=>{globalThis.__citationRequests=[];shell.openExternal=async url=>{globalThis.__citationRequests.push(url)}})
 const source='https://www.rfc-editor.org/rfc/rfc9989.html',terms='https://policies.google.com/terms'
 for(const url of [source,terms])await page.evaluate(url=>{window.open(url,'_blank')},url)
 await expect.poll(()=>app.evaluate(()=>globalThis.__citationRequests)).toEqual([source,terms])
 await page.evaluate(()=>{window.open('https://untrusted.invalid/','_blank')})
 expect(await app.evaluate(()=>globalThis.__citationRequests)).toEqual([source,terms])
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/citation-smoke.json',JSON.stringify({status:'passed',platform:process.platform,scope:'Development Electron actual main window-open handler; shell.openExternal intercepted to avoid launching external browsers',sourceAndTermsDispatched:true,untrustedHostDenied:true,externalBrowserActuallyOpened:false},null,2))
 console.log('Actual Electron citation/terms dispatch and untrusted-host denial PASS; no external browser launched')
}finally{await app?.close();await rm(data,{recursive:true,force:true})}
