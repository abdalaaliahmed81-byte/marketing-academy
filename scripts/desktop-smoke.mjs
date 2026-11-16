import {build} from 'esbuild'
import {DatabaseSync} from 'node:sqlite'
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
await build({entryPoints:['tests/fixtures/legacy-seed.ts'],outfile:path.join(dataDir,'legacy-fixture.js'),bundle:true,platform:'browser',target:'es2022',format:'iife',globalName:'AcademyLegacyFixture',legalComments:'none'})
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
 expect(await page.evaluate(()=>window.academy?.kind)).toBe('desktop-sqlite')
 evidence.checks.push('renderer has no Node require or process; SQLite transport exposed only through the narrow preload')
 await page.getByRole('button',{name:'إنشاء حساب',exact:true}).click()
 await page.getByLabel('اسم المستخدم',{exact:true}).fill('اختبار سطح المكتب')
 await page.getByLabel('كلمة المرور',{exact:true}).fill('desktop-test-long-password')
 await page.getByLabel('تأكيد كلمة المرور',{exact:true}).fill('desktop-test-long-password')
 await page.getByRole('button',{name:'أنشئ حسابي'}).click()
 await page.getByRole('button',{name:'ابدأ التعلّم',exact:true}).click()
 await page.getByRole('navigation',{name:'التنقل الرئيسي',exact:true}).getByRole('link',{name:'مسار التعلّم',exact:true}).click()
 await expect(page.getByRole('button',{name:/^ملاحظات:/})).toHaveCount(60)
 await page.getByRole('button',{name:/^ملاحظات:/}).first().click()
 await page.getByRole('dialog').getByRole('textbox').fill('حفظ دائم بعد إغلاق البرنامج')
 await expect(page.getByRole('dialog').getByRole('status')).toHaveText('حُفظت الملاحظات')
 const noteTimestamp=await page.getByRole('dialog').locator('time').getAttribute('datetime')
 expect(Number.isFinite(Date.parse(noteTimestamp))).toBe(true)
 await page.getByRole('button',{name:'احفظ وأغلق'}).click()
 await expect(page.getByRole('dialog')).not.toBeVisible()
 await page.getByRole('link',{name:'الإعدادات',exact:true}).click()
 await page.getByLabel('اسم العرض',{exact:true}).fill('متعلم سطح المكتب')
 await page.getByRole('button',{name:'احفظ الملف الشخصي'}).click()
 await expect(page.locator('.account-name')).toHaveText('متعلم سطح المكتب')
 evidence.checks.push('native profile edit acknowledged through preload without changing login username')
 await page.getByRole('navigation',{name:'التنقل الرئيسي',exact:true}).getByRole('link',{name:'مسار التعلّم',exact:true}).click()
 await page.getByRole('link',{name:'التسويق يبدأ بمشكلة العميل',exact:true}).click()
 const firstMatch=page.locator('[data-activity=match]')
 await expect(firstMatch).toBeVisible()
 for(let i=0;i<await firstMatch.getByRole('combobox').count();i++)await firstMatch.getByRole('combobox').nth(i).selectOption('term-'+i)
 await firstMatch.getByRole('button',{name:'تحقّق من النشاط',exact:true}).click()
 await expect(firstMatch.getByText('مكتمل',{exact:true})).toBeVisible()
 await page.getByRole('link',{name:'مشروعات الوحدات',exact:true}).click()
 await page.getByRole('textbox',{name:'تسليم مشروع الوحدة'}).fill('تسليم Windows محاكاة محفوظ تلقائيًا')
 await expect(page.getByText('حُفظ المشروع تلقائيًا',{exact:true})).toBeVisible()
 await page.getByRole('link',{name:'مشروعي',exact:true}).click()
 await page.getByRole('textbox',{name:'تحليل المنافسين والبدائل',exact:true}).fill('بدائل محاكاة محفوظة في SQLite')
 await page.getByRole('button',{name:'املأ الحقول الفارغة فقط من الحالة'}).click()
 await expect(page.getByText('حُفظ المشروع تلقائيًا',{exact:true})).toBeVisible()
 evidence.checks.push('native module and27-field capstone autosave acknowledged without an external backend')
 evidence.checks.push('registered account, onboarded, showed 60 lessons and saved a lesson note')
 await running.close()
 page=await launch()
 await expect(page.getByRole('button',{name:'ادخل إلى الأكاديمية'})).toBeVisible()
 await page.getByLabel('اسم المستخدم',{exact:true}).fill('اختبار سطح المكتب')
 await page.getByLabel('كلمة المرور',{exact:true}).fill('desktop-test-long-password')
 await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
 await page.getByRole('navigation',{name:'التنقل الرئيسي',exact:true}).getByRole('link',{name:'مسار التعلّم',exact:true}).click()
 await page.getByRole('button',{name:/^ملاحظات:/}).first().click()
 await expect(page.getByRole('dialog').getByRole('textbox')).toHaveValue('حفظ دائم بعد إغلاق البرنامج')
 await expect(page.getByRole('dialog').locator('time')).toHaveAttribute('datetime',noteTimestamp)
 await expect(page.locator('.account-name')).toHaveText('متعلم سطح المكتب')
 evidence.profilePersistence=true
 await page.getByRole('button',{name:'احفظ وأغلق'}).click()
 await expect(page.getByRole('dialog')).not.toBeVisible()
 await page.getByRole('link',{name:'التسويق يبدأ بمشكلة العميل',exact:true}).click()
 const restoredMatch=page.locator('[data-activity=match]')
 await expect(restoredMatch.getByText('مكتمل',{exact:true})).toBeVisible()
 await expect(restoredMatch.getByRole('combobox').first()).toHaveValue('term-0')
 await page.getByRole('link',{name:'مشروعات الوحدات',exact:true}).click()
 await expect(page.getByRole('textbox',{name:'تسليم مشروع الوحدة'})).toHaveValue('تسليم Windows محاكاة محفوظ تلقائيًا')
 await page.getByRole('link',{name:'مشروعي',exact:true}).click()
 await expect(page.getByRole('textbox',{name:'تحليل المنافسين والبدائل',exact:true})).toHaveValue('بدائل محاكاة محفوظة في SQLite')
 await expect(page.getByRole('progressbar',{name:'بنود المشروع المكتوبة'})).toHaveAttribute('value','27')
 evidence.projectAutosavePersistence=true
 evidence.interactiveActivityPersistence=true
 evidence.noteTimestampPersistence=true
 evidence.checks.push('required login after process restart and recovered persistent note')
 const outside=await page.evaluate(async()=>{try{await fetch('https://example.com');return 'allowed'}catch{return 'blocked'}})
 expect(outside).toBe('blocked')
 evidence.checks.push('external network fetch blocked; curriculum and notes work without external server')
 await page.screenshot({path:'artifacts/desktop.png'})
 // Exercise an actual legacy IndexedDB account in the same preserved academy://app origin.
 await page.getByRole('button',{name:'خروج',exact:true}).click()
 await page.reload()
 const fixtureCode=await fs.readFile(path.join(dataDir,'legacy-fixture.js'),'utf8')
 const inspector=await page.context().newCDPSession(page)
 const injected=await inspector.send('Runtime.evaluate',{expression:fixtureCode+'\n;globalThis.AcademyLegacyFixture=AcademyLegacyFixture;',awaitPromise:true})
 if(injected.exceptionDetails)throw new Error('Legacy fixture injection failed: '+JSON.stringify(injected.exceptionDetails))
 const fixture=await page.evaluate(async()=>window.AcademyLegacyFixture.seed('متعلم النسخة السابقة','legacy-test-long-password'))
 await page.getByLabel('اسم المستخدم',{exact:true}).fill('متعلم النسخة السابقة')
 await page.getByLabel('كلمة المرور',{exact:true}).fill('legacy-test-long-password')
 await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
 await page.getByRole('navigation',{name:'التنقل الرئيسي',exact:true}).getByRole('link',{name:'مسار التعلّم',exact:true}).click()
 await page.getByRole('button',{name:/^ملاحظات:/}).first().click()
 await expect(page.getByRole('dialog').getByRole('textbox')).toHaveValue('legacy-note-must-survive')
 await page.getByRole('button',{name:'احفظ وأغلق'}).click()
 await expect(page.getByRole('dialog')).not.toBeVisible()
 expect(await page.evaluate(name=>window.AcademyLegacyFixture.verifySource(name),fixture.sourceName)).toBe(fixture.sourceFingerprint)
 await page.getByRole('link',{name:'مشروعات الوحدات',exact:true}).click()
 await expect(page.getByRole('textbox',{name:'تسليم مشروع الوحدة'})).toHaveValue('legacy-project-must-survive')
 const migrated=await page.evaluate(async()=>window.academy.request('login',{name:'متعلم النسخة السابقة',password:'legacy-test-long-password'}))
 expect(migrated.ok).toBe(true)
 expect(migrated.value.snapshot.state.lessonStates.find(row=>row.id==='m01-l01').completed).toBe(true)
 expect(migrated.value.snapshot.state.attempts.some(row=>row.lessonId==='m01-l01'&&row.passed&&row.score===100)).toBe(true)
 expect(migrated.value.snapshot.state.moduleProjects[0].completed).toBe(true)
 evidence.checks.push('migrated an authenticated legacy IndexedDB account; completed lesson, note, quiz and project survived; original ciphertext unchanged')
 await running.close();running=undefined
 const sql=new DatabaseSync(path.join(dataDir,'academy.sqlite'))
 const accounts=Number(sql.prepare('SELECT count(*) AS count FROM accounts').get().count)
 const records=Number(sql.prepare('SELECT count(*) AS count FROM learner_records').get().count)
 const legacy=Number(sql.prepare('SELECT count(*) AS count FROM accounts WHERE legacy_source=?').get(fixture.legacyId).count)
 expect(accounts).toBe(2);expect(records).toBeGreaterThan(5);expect(legacy).toBe(1)
 expect(JSON.stringify(sql.prepare('SELECT payload FROM learner_records').all())).not.toContain('legacy-note-must-survive')
 evidence.sqlite={schemaVersion:Number(sql.prepare('PRAGMA user_version').get().user_version),accounts,records,legacySourcesPreserved:true,encryptedRecords:true}
 sql.close()
 evidence.status='passed'
} catch(error){evidence.status='failed';evidence.error=String(error);throw error}
finally{if(running)await running.close().catch(()=>{});await fs.writeFile('artifacts/desktop-smoke.json',JSON.stringify(evidence,null,2));await fs.rm(dataDir,{recursive:true,force:true})}
