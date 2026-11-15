import {_electron as electron,chromium,expect} from '@playwright/test'
import path from 'node:path'
import os from 'node:os'
import {spawn} from 'node:child_process'
import {createServer} from 'node:net'
import {setTimeout as delay} from 'node:timers/promises'
import fs from 'node:fs/promises'
const dataDir=path.join(path.resolve(process.env.ACADEMY_TEST_DATA_DIR??os.tmpdir()),'academy-smoke-'+crypto.randomUUID())
const executablePath=process.env.DESKTOP_EXE
const args=executablePath?[]:['.']
if(process.platform==='linux')args.push('--no-sandbox','--ozone-platform=headless')
await fs.mkdir('artifacts',{recursive:true})
await fs.rm(dataDir,{recursive:true,force:true})
const evidence={platform:process.platform,architecture:process.arch,executable:executablePath??'development electron',checks:[],networkRequests:[]}
let running
async function launch(){
 running=executablePath?await launchPortable():await electron.launch({args,env:{...process.env,ACADEMY_TEST_DATA_DIR:dataDir},timeout:90000})
 const page=await running.firstWindow({timeout:90000})
 page.on('request',req=>{if(!req.url().startsWith('academy://app/'))evidence.networkRequests.push(req.url())})
 await page.waitForURL('academy://app/**')
 await page.setViewportSize({width:1280,height:900})
 return page
}
// The NSIS portable wrapper does not forward Electron's inspector stdout.
// Start the actual shipped EXE and attach to its loopback renderer CDP instead.
async function launchPortable(){
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;await new Promise(resolve=>server.close(resolve))
 const env={...process.env,ACADEMY_TEST_DATA_DIR:dataDir};delete env.ELECTRON_RUN_AS_NODE
 const child=spawn(path.resolve(executablePath),[...args,`--remote-debugging-port=${port}`,'--remote-debugging-address=127.0.0.1'],{env,stdio:['ignore','pipe','pipe']})
 let output='',spawnError
 child.stdout.on('data',part=>{output=(output+part).slice(-4000)});child.stderr.on('data',part=>{output=(output+part).slice(-4000)});child.on('error',error=>{spawnError=error})
 const endpoint=`http://127.0.0.1:${port}`
 let ready=false
 const deadline=Date.now()+90000
 while(Date.now()<deadline){
  if(spawnError)throw spawnError
  try{const response=await fetch(endpoint+'/json/version',{signal:AbortSignal.timeout(1000)});if(response.ok){ready=true;break}}catch{}
  await delay(250)
 }
 if(!ready){child.kill();throw new Error('Portable EXE did not expose the test renderer endpoint: '+output)}
 const browser=await chromium.connectOverCDP(endpoint)
 const context=browser.contexts()[0]
 let page=context.pages().find(p=>p.url().startsWith('academy:'))??context.pages()[0]
 if(!page)page=await context.waitForEvent('page',{timeout:30000})
 return {firstWindow:async()=>page,close:async()=>{
  await page.evaluate(()=>window.close()).catch(()=>{})
  await browser.close().catch(()=>{})
  const closeDeadline=Date.now()+20000
  while(child.exitCode===null&&Date.now()<closeDeadline)await delay(200)
  if(child.exitCode===null){
   if(process.platform==='win32')await new Promise(resolve=>{const killer=spawn('taskkill',['/pid',String(child.pid),'/T','/F'],{stdio:'ignore'});killer.on('close',resolve);killer.on('error',resolve)})
   else child.kill('SIGKILL')
  }
 }}
}
try{
 let page=await launch()
 await expect(page.getByRole('button',{name:'إنشاء حساب',exact:true})).toBeVisible()
 evidence.checks.push('application rendered Arabic registration using local academy protocol')
 expect(await page.evaluate(()=>typeof window.require)).toBe('undefined')
 expect(await page.evaluate(()=>typeof window.process)).toBe('undefined')
 evidence.checks.push('renderer has no Node require or process')
 await page.getByRole('button',{name:'إنشاء حساب',exact:true}).click()
 await page.getByLabel('اسم المستخدم',{exact:true}).fill('اختبار سطح المكتب')
 await page.getByLabel('كلمة المرور',{exact:true}).fill('desktop-test-long-password')
 await page.getByLabel('تأكيد كلمة المرور',{exact:true}).fill('desktop-test-long-password')
 await page.getByRole('button',{name:'أنشئ حسابي'}).click()
 await page.getByRole('button',{name:'ابدأ التعلّم',exact:true}).click()
 await page.getByRole('link',{name:'مسار التعلّم',exact:true}).click()
 await expect(page.getByRole('button',{name:/^ملاحظات:/})).toHaveCount(60)
 await page.getByRole('button',{name:/^ملاحظات:/}).first().click()
 await page.getByRole('dialog').getByRole('textbox').fill('حفظ دائم بعد إغلاق البرنامج')
 await page.getByRole('button',{name:'احفظ وأغلق'}).click()
 await expect(page.getByRole('dialog')).not.toBeVisible()
 evidence.checks.push('registered account, onboarded, showed 60 lessons and saved a lesson note')
 await running.close()
 page=await launch()
 await expect(page.getByRole('button',{name:'ادخل إلى الأكاديمية'})).toBeVisible()
 await page.getByLabel('اسم المستخدم',{exact:true}).fill('اختبار سطح المكتب')
 await page.getByLabel('كلمة المرور',{exact:true}).fill('desktop-test-long-password')
 await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
 await page.getByRole('link',{name:'مسار التعلّم',exact:true}).click()
 await page.getByRole('button',{name:/^ملاحظات:/}).first().click()
 await expect(page.getByRole('dialog').getByRole('textbox')).toHaveValue('حفظ دائم بعد إغلاق البرنامج')
 evidence.checks.push('required login after process restart and recovered persistent note')
 await page.getByRole('button',{name:'احفظ وأغلق'}).click()
 await expect(page.getByRole('dialog')).not.toBeVisible()
 const outside=await page.evaluate(async()=>{try{await fetch('https://example.com');return 'allowed'}catch{return 'blocked'}})
 expect(outside).toBe('blocked')
 evidence.checks.push('external network fetch blocked; curriculum and notes work without external server')
 await page.screenshot({path:'artifacts/desktop.png'})
 evidence.status='passed'
} catch(error){evidence.status='failed';evidence.error=String(error);throw error}
finally{if(running)await running.close().catch(()=>{});await fs.writeFile('artifacts/desktop-smoke.json',JSON.stringify(evidence,null,2));await fs.rm(dataDir,{recursive:true,force:true})}
