import {_electron as electron,chromium,expect} from '@playwright/test'
import {createServer} from 'node:net'
import {spawn} from 'node:child_process'
import {mkdtemp,readFile,writeFile,rm,mkdir} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {setTimeout as delay} from 'node:timers/promises'
const fixture=await mkdtemp(path.join(tmpdir(),'academy-dual-')),password='dual-isolation-test-password',apps=[]
const report={status:'failed',productionAndQaConcurrent:false,identicalUsernamesIndependent:false,productionDatabaseUnchangedByQA:false,restartIsolation:false}
async function launch(channel){
 let driver,page
 if(process.platform==='win32'){
  const listener=createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r))
  const env={...process.env,ACADEMY_TEST_DATA_DIR:fixture};for(const k of Object.keys(env))if(k.toLowerCase()==='path'||['NODE_OPTIONS','NODE_PATH','ELECTRON_RUN_AS_NODE'].includes(k))delete env[k];env.PATH=path.join(process.env.SystemRoot,'System32')+';'+process.env.SystemRoot
  const exe=path.resolve(channel==='qa'?'release/Marketing-Academy-QA-Windows-x64.exe':'release/Marketing-Academy-Portable-Windows-x64.exe')
  const child=spawn(exe,[`--remote-debugging-port=${port}`,'--remote-debugging-address=127.0.0.1'],{env,stdio:'ignore'})
  let ready=false;for(let n=0;n<180;n++){try{if((await fetch(`http://127.0.0.1:${port}/json/version`)).ok){ready=true;break}}catch{}await delay(500)}
  if(!ready){child.kill();throw new Error('Cannot launch '+channel)}
  const browser=await chromium.connectOverCDP(`http://127.0.0.1:${port}`);page=browser.contexts()[0].pages()[0]
  driver={close:async()=>{await page.evaluate(()=>window.close()).catch(()=>{});await browser.close().catch(()=>{});for(let n=0;n<40&&child.exitCode===null;n++)await delay(250);if(child.exitCode===null)await new Promise(r=>{const kill=spawn('taskkill',['/pid',String(child.pid),'/T','/F'],{stdio:'ignore'});kill.on('close',r);kill.on('error',r)})}}
 }else{
  driver=await electron.launch({args:[channel==='qa'?path.resolve('work/qa-package'):'.','--no-sandbox','--ozone-platform=headless'],env:{...process.env,ACADEMY_TEST_DATA_DIR:fixture}});page=await driver.firstWindow()
 }
 const instance={page,driver,closed:false};apps.push(instance);await page.waitForURL('academy://app/**');expect(await page.evaluate(()=>window.academy.profileInfo())).toEqual({channel});return instance
}
async function close(instance){if(!instance.closed){await instance.driver.close();instance.closed=true}}
async function register(page){await page.getByRole('button',{name:'إنشاء حساب',exact:true}).click();await page.getByLabel('اسم المستخدم',{exact:true}).fill('هوية مشتركة للتأكد من العزل');await page.getByLabel('كلمة المرور',{exact:true}).fill(password);await page.getByLabel('تأكيد كلمة المرور',{exact:true}).fill(password);await page.getByRole('button',{name:'أنشئ حسابي'}).click();await page.getByRole('button',{name:'ابدأ التعلّم',exact:true}).click()}
async function note(page,text){await page.getByRole('navigation',{name:'التنقل الرئيسي'}).getByRole('link',{name:'مسار التعلّم',exact:true}).click();await page.getByRole('button',{name:/^ملاحظات:/}).first().click();const field=page.getByRole('dialog').getByRole('textbox');if(text===undefined)return field;await field.fill(text);await page.getByRole('button',{name:'احفظ وأغلق'}).click();await expect(page.getByRole('dialog')).not.toBeVisible()}
async function login(page){await page.getByLabel('اسم المستخدم',{exact:true}).fill('هوية مشتركة للتأكد من العزل');await page.getByLabel('كلمة المرور',{exact:true}).fill(password);await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()}
const fingerprint=async()=>createHash('sha256').update(await readFile(path.join(fixture,'academy.sqlite'))).digest('hex')
try{
 const prod=await launch('production');await register(prod.page);await note(prod.page,'PRODUCTION · محفوظة مستقلة')
 const qa=await launch('qa');await register(qa.page);await expect(await note(qa.page)).toHaveValue('');await qa.page.getByRole('button',{name:'احفظ وأغلق'}).click();await note(qa.page,'QA · لا تكتب إلى Production')
 await expect(await note(prod.page)).toHaveValue('PRODUCTION · محفوظة مستقلة');await prod.page.getByRole('button',{name:'احفظ وأغلق'}).click()
 report.productionAndQaConcurrent=true;report.identicalUsernamesIndependent=true
 await close(prod);const before=await fingerprint();await note(qa.page,'QA · تعديل ثان مع Production مغلقة');await close(qa);expect(await fingerprint()).toBe(before);report.productionDatabaseUnchangedByQA=true
 const qaAgain=await launch('qa');await login(qaAgain.page);await expect(await note(qaAgain.page)).toHaveValue('QA · تعديل ثان مع Production مغلقة');await qaAgain.page.getByRole('button',{name:'احفظ وأغلق'}).click();await close(qaAgain)
 const prodAgain=await launch('production');await login(prodAgain.page);await expect(await note(prodAgain.page)).toHaveValue('PRODUCTION · محفوظة مستقلة');await prodAgain.page.getByRole('button',{name:'احفظ وأغلق'}).click();await close(prodAgain)
 report.restartIsolation=true;report.status='passed'
}catch(error){report.error=String(error);throw error}
finally{for(const a of apps)await close(a).catch(()=>{});await mkdir('artifacts',{recursive:true});await writeFile('artifacts/dual-isolation.json',JSON.stringify(report,null,2));await rm(fixture,{recursive:true,force:true})}
