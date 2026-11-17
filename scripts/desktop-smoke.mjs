import AxeBuilder from '@axe-core/playwright'
import {build} from 'esbuild'
import {pbkdf2Sync,randomBytes,createCipheriv} from 'node:crypto'
import {DatabaseSync} from 'node:sqlite'
import {_electron as electron,chromium,expect} from '@playwright/test'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import os from 'node:os'
import {spawn} from 'node:child_process'
import {createServer} from 'node:net'
import {setTimeout as delay} from 'node:timers/promises'
import fs from 'node:fs/promises'
const dataDir=path.join(path.resolve(process.env.ACADEMY_TEST_DATA_DIR??os.tmpdir()),'academy-smoke-'+crypto.randomUUID())
const executablePath=process.env.DESKTOP_EXE
const channel=process.env.EXPECTED_CHANNEL??'production'
const profileDir=channel==='qa'?path.join(dataDir,'marketing-academy-qa'):dataDir
const args=executablePath?[]:[process.env.DESKTOP_APP_PATH??'.']
if(process.platform==='linux')args.push('--no-sandbox','--ozone-platform=headless')
await fs.mkdir('artifacts',{recursive:true})
await fs.rm(dataDir,{recursive:true,force:true})
await build({entryPoints:['tests/fixtures/legacy-seed.ts'],outfile:path.join(dataDir,'legacy-fixture.js'),bundle:true,platform:'browser',target:'es2022',format:'iife',globalName:'AcademyLegacyFixture',legalComments:'none'})
await build({stdin:{contents:"export {lessons} from './src/lessons';export {agencyRubric,workedAgencyProject,simulateCampaign} from './src/agency/model'",resolveDir:process.cwd()},outfile:path.join(dataDir,'curriculum.mjs'),bundle:true,platform:'node',format:'esm'})
const {lessons,agencyRubric,workedAgencyProject,simulateCampaign}=await import(pathToFileURL(path.join(dataDir,'curriculum.mjs')).href)
const firstLesson=lessons[0]
const evidence={platform:process.platform,architecture:process.arch,channel,baselineVersion:process.env.AUTH_BASELINE_VERSION,executable:executablePath??'development electron',checks:[],networkRequests:[],expectedAuthRejections:{confirmation:false,invalidName:false,unknownAccount:false,wrongPassword:false,duplicate:false}}
let running
async function launch(){
 if(executablePath)running=await launchPortable()
 else {
  const app=await electron.launch({args,env:{...process.env,ACADEMY_TEST_DATA_DIR:dataDir},timeout:90000})
  running={firstWindow:options=>app.firstWindow(options),close:async()=>{let forced=false;const timer=setTimeout(()=>{forced=true;app.process().kill('SIGTERM')},15000);try{await app.close()}finally{clearTimeout(timer)}if(forced)throw new Error('Synthetic development Electron did not exit after acknowledged saves within15s')}}
 }
 const page=await running.firstWindow({timeout:90000})
 page.on('request',req=>{if(!req.url().startsWith('academy://app/'))evidence.networkRequests.push(req.url())})
 page.setDefaultTimeout(30000)
 await page.waitForURL('academy://app/**')
 await page.setViewportSize({width:1280,height:900})
 return page
}
// The NSIS portable wrapper does not forward Electron's inspector stdout.
// Start the actual shipped EXE and attach to its loopback renderer CDP instead.
async function launchPortable(){
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;await new Promise(resolve=>server.close(resolve))
 const env={...process.env,ACADEMY_TEST_DATA_DIR:dataDir};delete env.ELECTRON_RUN_AS_NODE;delete env.NODE_OPTIONS;delete env.NODE_PATH
 if(process.platform==='win32'){for(const key of Object.keys(env))if(key.toLowerCase()==='path')delete env[key];env.PATH=path.join(process.env.SystemRoot,'System32')+';'+process.env.SystemRoot;evidence.restrictedChildPath=true}
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
 expect(await page.evaluate(()=>window.academy.profileInfo())).toEqual({channel})
 if(channel==='qa')await expect(page.getByRole('complementary',{name:'بيئة الاختبار المعزولة'})).toBeVisible()
 evidence.checks.push('renderer has no Node require or process; SQLite transport exposed only through the narrow preload')
 if(process.env.AUTH_UNICODE_BASELINE==='1'){
  const secret='🔐'.repeat(70)
  const created=await page.evaluate(async password=>window.academy.request('register',{name:'Unicode Secret Fixture',password}),secret);expect(created.ok).toBe(true)
  await page.getByLabel('اسم المستخدم',{exact:true}).fill('Unicode Secret Fixture');await page.getByLabel('كلمة المرور',{exact:true}).fill(secret)
  expect((await page.getByLabel('كلمة المرور',{exact:true}).inputValue()).length).toBe(128)
  await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click();await expect(page.getByRole('alert')).toContainText('اسم المستخدم أو كلمة المرور غير صحيح')
  evidence.unicodePasswordBaselineTruncation=true
 }
 await page.getByRole('button',{name:'إنشاء حساب',exact:true}).click()
 await page.getByLabel('اسم المستخدم',{exact:true}).fill('اختبار سطح المكتب')
 await page.getByLabel('كلمة المرور',{exact:true}).fill('desktop-test-long-password')
 await page.getByLabel('تأكيد كلمة المرور',{exact:true}).fill('desktop-test-long-password')
 await page.getByLabel('تأكيد كلمة المرور',{exact:true}).fill('different-long-password')
 await page.getByRole('button',{name:'أنشئ حسابي'}).click()
 await expect(page.getByRole('alert')).toContainText('كلمتا المرور غير متطابقتين')
 evidence.expectedAuthRejections.confirmation=true
 await page.getByLabel('تأكيد كلمة المرور',{exact:true}).fill('desktop-test-long-password')
 if(process.env.AUTH_UNICODE_BASELINE==='1'){
  await page.getByLabel('اسم المستخدم',{exact:true}).fill('مُحَمَّد_١');await page.getByRole('button',{name:'أنشئ حسابي'}).click()
  await expect(page.getByRole('alert')).toContainText('اسم المستخدم يجب');evidence.unicodeBaselineRejection=true
 }
 await page.getByLabel('اسم المستخدم',{exact:true}).fill('اسم/غيرصالح')
 await page.getByRole('button',{name:'أنشئ حسابي'}).click()
 await expect(page.getByRole('alert')).toContainText('اسم المستخدم يجب')
 evidence.expectedAuthRejections.invalidName=true
 await page.getByLabel('اسم المستخدم',{exact:true}).fill('اختبار سطح المكتب')
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
 await page.context().setOffline(true)
 await page.goto('academy://app/#/lesson/m01-l01/quiz')
 for(const q of firstLesson.questions)await page.locator('input[type=radio][value="'+q.answer+'"]').check()
 await page.getByRole('button',{name:'سلّم الاختبار'}).click()
 await page.getByRole('link',{name:'اذهب إلى التطبيق',exact:true}).click()
 await page.getByRole('textbox',{name:'تطبيقك',exact:true}).fill('محاكاة مكتملة: شريحة محددة ووعد محدود ودليل ومقياس، وليست حملة حقيقية.')
 for(const text of firstLesson.rubric)await page.getByRole('checkbox',{name:text,exact:true}).check()
 await page.getByRole('button',{name:'أكمل الدرس',exact:true}).click()
 await expect(page.getByRole('link',{name:'الدرس التالي',exact:true})).toBeVisible()
 evidence.offlineLessonCompletion=true
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
 await page.getByLabel('اسم المستخدم',{exact:true}).fill('حساب غير موجود للاختبار')
 await page.getByLabel('كلمة المرور',{exact:true}).fill('desktop-test-long-password')
 await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
 await expect(page.getByRole('alert')).toContainText('اسم المستخدم أو كلمة المرور غير صحيح')
 evidence.expectedAuthRejections.unknownAccount=true
 await page.getByLabel('اسم المستخدم',{exact:true}).fill('اختبار سطح المكتب')
 await page.getByLabel('كلمة المرور',{exact:true}).fill('wrong-desktop-password')
 await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
 await expect(page.getByRole('alert')).toContainText('اسم المستخدم أو كلمة المرور غير صحيح')
 evidence.expectedAuthRejections.wrongPassword=true
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
 await page.goto('academy://app/#/lesson/m01-l01/quiz')
 await expect(page.getByText(/١٠٠٪ · اجتزت الاختبار/)).toBeVisible()
 await page.getByRole('link',{name:'اذهب إلى التطبيق',exact:true}).click()
 await expect(page.getByRole('textbox',{name:'تطبيقك',exact:true})).toHaveValue(/محاكاة مكتملة/)
 await expect(page.getByRole('button',{name:'أكمل الدرس',exact:true})).toHaveCount(0)
 evidence.quizAndCompletionSurviveRestart=true
 evidence.projectAutosavePersistence=true
 evidence.interactiveActivityPersistence=true
 evidence.noteTimestampPersistence=true
 evidence.checks.push('required login after process restart and recovered persistent note')
 const outside=await page.evaluate(async()=>{try{await fetch('https://example.com');return 'allowed'}catch{return 'blocked'}})
 expect(outside).toBe('blocked')
 evidence.checks.push('external network fetch blocked; curriculum and notes work without external server')
 await page.screenshot({path:process.env.DESKTOP_SCREENSHOT??'artifacts/desktop.png'})
 if(process.env.AUTH_EXTENDED==='1'){
  const phrase='recovery-fixture-passphrase',newPassword='🔑'.repeat(70),recoveredPassword='🔐'.repeat(70)
  const source=await page.evaluate(async()=>window.academy.request('login',{name:'اختبار سطح المكتب',password:'desktop-test-long-password'}))
  expect(source.ok).toBe(true)
  const salt=randomBytes(16),derived=pbkdf2Sync(phrase,salt,600000,64,'sha256'),nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',derived.subarray(32),nonce)
  cipher.setAAD(Buffer.from('academy-backup-v1'));const body=Buffer.concat([cipher.update(JSON.stringify(source.value.snapshot.state)),cipher.final(),cipher.getAuthTag()]);derived.fill(0)
  const backupFile=path.join(dataDir,'recovery.academy');await fs.writeFile(backupFile,JSON.stringify({format:'marketing-academy-encrypted',version:1,iterations:600000,salt:salt.toString('hex'),payload:nonce.toString('hex')+':'+body.toString('hex')}))
  await page.getByRole('button',{name:'خروج',exact:true}).click()
  await page.getByRole('button',{name:'نسيت كلمة المرور؟ استعادة من نسخة مشفرة',exact:true}).click()
  await page.getByLabel('النسخة المشفرة',{exact:true}).setInputFiles(backupFile)
  await page.getByLabel('عبارة حماية النسخة',{exact:true}).fill('wrong-recovery-passphrase')
  await page.getByLabel('اسم الحساب الجديد',{exact:true}).fill('مُستعاد_١')
  await page.getByLabel('كلمة مرور الحساب الجديد',{exact:true}).fill(recoveredPassword)
  await page.getByLabel('تأكيد كلمة مرور الحساب الجديد',{exact:true}).fill(recoveredPassword)
  await expect(page.getByLabel('كلمة مرور الحساب الجديد',{exact:true})).toHaveValue(recoveredPassword)
  await page.getByRole('button',{name:'استعد إلى حساب جديد',exact:true}).click()
  await expect(page.getByRole('alert')).toContainText('عبارة الحماية غير صحيحة')
  await page.getByLabel('عبارة حماية النسخة',{exact:true}).fill(phrase)
  await page.getByLabel('اسم الحساب الجديد',{exact:true}).fill('اختبار سطح المكتب')
  await page.getByRole('button',{name:'استعد إلى حساب جديد',exact:true}).click()
  await expect(page.getByRole('alert')).toContainText('اسم المستخدم مستخدم')
  await page.getByLabel('اسم الحساب الجديد',{exact:true}).fill('مُستعاد_١')
  await page.getByRole('button',{name:'استعد إلى حساب جديد',exact:true}).click()
  await page.getByRole('navigation',{name:'التنقل الرئيسي'}).getByRole('link',{name:'مسار التعلّم',exact:true}).click()
  await page.getByRole('button',{name:/^ملاحظات:/}).first().click();await expect(page.getByRole('dialog').getByRole('textbox')).toHaveValue('حفظ دائم بعد إغلاق البرنامج');await page.getByRole('button',{name:'احفظ وأغلق'}).click()
  await running.close();page=await launch()
  await page.getByLabel('اسم المستخدم',{exact:true}).fill('مُستعاد_١');await page.getByLabel('كلمة المرور',{exact:true}).fill(recoveredPassword);await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
  await page.getByRole('button',{name:'خروج',exact:true}).click()
  await page.getByLabel('اسم المستخدم',{exact:true}).fill('اختبار سطح المكتب');await page.getByLabel('كلمة المرور',{exact:true}).fill('desktop-test-long-password');await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
  await page.getByRole('link',{name:'الإعدادات',exact:true}).click()
  await page.getByLabel('كلمة المرور الحالية',{exact:true}).fill('incorrect-current-password')
  await page.getByLabel('كلمة المرور الجديدة',{exact:true}).fill(newPassword)
  await expect(page.getByLabel('كلمة المرور الجديدة',{exact:true})).toHaveValue(newPassword)
  await page.getByRole('button',{name:'غيّر كلمة المرور',exact:true}).click()
  await expect(page.getByText('كلمة المرور الحالية غير صحيحة.',{exact:true})).toBeVisible()
  await page.getByLabel('كلمة المرور الحالية',{exact:true}).fill('desktop-test-long-password')
  await page.getByRole('button',{name:'غيّر كلمة المرور',exact:true}).click()
  await expect(page.getByText('تغيّرت كلمة المرور.',{exact:true})).toBeVisible()
  await running.close();page=await launch()
  await page.getByLabel('اسم المستخدم',{exact:true}).fill('اختبار سطح المكتب');await page.getByLabel('كلمة المرور',{exact:true}).fill('desktop-test-long-password');await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
  await expect(page.getByRole('alert')).toContainText('اسم المستخدم أو كلمة المرور غير صحيح')
  await page.getByLabel('كلمة المرور',{exact:true}).fill(newPassword);await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
  await page.getByRole('navigation',{name:'التنقل الرئيسي'}).getByRole('link',{name:'مسار التعلّم',exact:true}).click();await page.getByRole('button',{name:/^ملاحظات:/}).first().click();await expect(page.getByRole('dialog').getByRole('textbox')).toHaveValue('حفظ دائم بعد إغلاق البرنامج');await page.getByRole('button',{name:'احفظ وأغلق'}).click()
  evidence.authExtensions={unicodeRecovery:true,wrongPhraseRejected:true,duplicateRecoveryRejected:true,recoveredLoginAfterRestart:true,originalAccountPreserved:true,wrongCurrentPasswordRejected:true,passwordChangeAfterRestart:true,unicodePasswordUntruncated:true}
 }
 // A newly registered local account must not receive the first account's saved data.
 await page.getByRole('button',{name:'خروج',exact:true}).click()
 await page.getByRole('button',{name:'إنشاء حساب',exact:true}).click()
 await page.getByLabel('اسم المستخدم',{exact:true}).fill('اختبار سطح المكتب')
 await page.getByLabel('كلمة المرور',{exact:true}).fill('isolated-desktop-password')
 await page.getByLabel('تأكيد كلمة المرور',{exact:true}).fill('isolated-desktop-password')
 await page.getByRole('button',{name:'أنشئ حسابي'}).click()
 await expect(page.getByRole('alert')).toContainText('اسم المستخدم مستخدم')
 evidence.expectedAuthRejections.duplicate=true
 await page.getByLabel('اسم المستخدم',{exact:true}).fill('حساب معزول جديد')
 await page.getByLabel('كلمة المرور',{exact:true}).fill('isolated-desktop-password')
 await page.getByLabel('تأكيد كلمة المرور',{exact:true}).fill('isolated-desktop-password')
 await page.getByRole('button',{name:'أنشئ حسابي'}).click()
 await page.getByRole('button',{name:'ابدأ التعلّم',exact:true}).click()
 await page.getByRole('navigation',{name:'التنقل الرئيسي',exact:true}).getByRole('link',{name:'مسار التعلّم',exact:true}).click()
 await page.getByRole('button',{name:/^ملاحظات:/}).first().click()
 await expect(page.getByRole('dialog').getByRole('textbox')).toHaveValue('')
 await page.getByRole('button',{name:'احفظ وأغلق'}).click()
 await page.getByRole('link',{name:'مشروعات الوحدات',exact:true}).click()
 await expect(page.getByRole('textbox',{name:'تسليم مشروع الوحدة'})).toHaveValue('')
 await page.goto('academy://app/#/lesson/m01-l01/quiz')
 await expect(page.getByRole('button',{name:'سلّم الاختبار',exact:true})).toBeVisible()
 evidence.actualNewAccountIsolation=true
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
 if(!process.env.AUTH_BASELINE_VERSION){
  await page.goto('academy://app/#/skills');await expect(page.getByRole('heading',{name:'شجرة إتقان المهارات',exact:true})).toBeVisible()
  expect(await page.locator('.skill-node').count()).toBe(60);expect(await page.getByRole('button',{name:/^ملاحظات:/}).count()).toBe(60)
  await expect(page.getByRole('progressbar',{name:'مؤشر تدريب '+firstLesson.title,exact:true})).toHaveAttribute('value','60')
  await expect(page.locator('.skill-node').first().getByText('إنجاز الدرس محفوظ ✓',{exact:true})).toBeVisible()
  await page.getByRole('button',{name:/^ملاحظات:/}).first().click();await expect(page.getByRole('dialog').getByRole('textbox')).toHaveValue('legacy-note-must-survive');await page.getByRole('button',{name:'احفظ وأغلق'}).click();await expect(page).toHaveURL('academy://app/#/skills')
  await page.getByRole('link',{name:'مكتبة الموارد',exact:true}).click();await page.getByRole('searchbox',{name:'ابحث في المكتبة',exact:true}).fill('legacy-note-must-survive');await expect(page.locator('.resource-card')).toHaveCount(1)
  evidence.skillTree={sixtyNodesAndNoteCircles:true,oldCompletionAndScorePreserved:true,notesRemainOnTree:true,generalNoteSearch:true}
 }
 if(!process.env.AUTH_BASELINE_VERSION){
  await page.goto('academy://app/#/agency');await expect(page.getByRole('heading',{name:'الوكالة الافتراضية ومحاكي الحملات',exact:true})).toBeVisible()
  await page.getByLabel('المنصة الافتراضية',{exact:true}).selectOption('google')
  const sample=workedAgencyProject('restaurant'),labels={brief:'الموجز والفرضية والجمهور',targeting:'خطة الاستهداف والاستبعاد',copyA:'نص الإعلان أ',copyB:'نص الإعلان ب',landing:'مخطط صفحة الهبوط',analysis:'تحليلك وحدود البيانات',recommendation:'التوصية وحد التوقف'}
  for(const [field,label] of Object.entries(labels))await page.getByRole('textbox',{name:label,exact:true}).fill(field==='brief'?'AGENCY-NATIVE-MARKER '+sample[field]:sample[field])
  for(const label of agencyRubric)await page.getByRole('checkbox',{name:label,exact:true}).check()
  await page.getByRole('button',{name:'أكمل مشروع الوكالة',exact:true}).click();await expect(page.getByText('حالة المشروع: مكتمل بالمراجعة الذاتية',{exact:true})).toBeVisible()
  await running.close();running=undefined;page=await launch()
  await page.getByLabel('اسم المستخدم',{exact:true}).fill('متعلم النسخة السابقة');await page.getByLabel('كلمة المرور',{exact:true}).fill('legacy-test-long-password');await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click();await page.goto('academy://app/#/agency')
  await expect(page.getByRole('textbox',{name:labels.brief,exact:true})).toHaveValue('AGENCY-NATIVE-MARKER '+sample.brief);await expect(page.getByLabel('المنصة الافتراضية',{exact:true})).toHaveValue('google');await expect(page.getByText('حالة المشروع: مكتمل بالمراجعة الذاتية',{exact:true})).toBeVisible()
  const agencyState=await page.evaluate(async()=>window.academy.request('login',{name:'متعلم النسخة السابقة',password:'legacy-test-long-password'}));const project=agencyState.value.snapshot.state.projects[0];expect(project.agency[0].completed).toBe(true);expect(simulateCampaign(project.agency[0]).total.contribution).toBe(24000);expect(agencyState.value.snapshot.state.lessonStates[0].notes).toBe('legacy-note-must-survive')
  await page.getByRole('button',{name:'خروج',exact:true}).click();await page.getByLabel('اسم المستخدم',{exact:true}).fill('حساب معزول جديد');await page.getByLabel('كلمة المرور',{exact:true}).fill('isolated-desktop-password');await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click();await page.goto('academy://app/#/agency');await expect(page.getByRole('textbox',{name:labels.brief,exact:true})).toHaveValue('')
  await page.getByRole('button',{name:'خروج',exact:true}).click();await page.getByLabel('اسم المستخدم',{exact:true}).fill('متعلم النسخة السابقة');await page.getByLabel('كلمة المرور',{exact:true}).fill('legacy-test-long-password');await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
  evidence.agency={syntheticInputsAndKpi:true,completionPersistsAfterRestart:true,otherAccountIsolated:true,oldLessonNotesPreserved:true}
 }
 if(channel==='production'&&!process.env.AUTH_BASELINE_VERSION){await page.goto('academy://app/#/qa-studio');await expect(page).toHaveURL('academy://app/#/');await expect(page.getByRole('link',{name:'افتح استوديو الاختبار'})).not.toBeVisible();evidence.productionQAAccessDenied=true}
 await running.close();running=undefined
 const sql=new DatabaseSync(path.join(profileDir,'academy.sqlite'))
 const accounts=Number(sql.prepare('SELECT count(*) AS count FROM accounts').get().count)
 const records=Number(sql.prepare('SELECT count(*) AS count FROM learner_records').get().count)
 const legacy=Number(sql.prepare('SELECT count(*) AS count FROM accounts WHERE legacy_source=?').get(fixture.legacyId).count)
 expect(accounts).toBe((process.env.AUTH_EXTENDED==='1'?4:3)+(process.env.AUTH_UNICODE_BASELINE==='1'?1:0));expect(records).toBeGreaterThan(5);expect(legacy).toBe(1)
 expect(JSON.stringify(sql.prepare('SELECT payload FROM learner_records').all())).not.toContain('legacy-note-must-survive')
 if(!process.env.AUTH_BASELINE_VERSION)expect(JSON.stringify(sql.prepare('SELECT payload FROM learner_records').all())).not.toContain('AGENCY-NATIVE-MARKER')
 evidence.sqlite={schemaVersion:Number(sql.prepare('PRAGMA user_version').get().user_version),accounts,records,legacySourcesPreserved:true,encryptedRecords:true}
 sql.close()
 if(process.env.QA_STUDIO_TEST==='1'){
  expect(channel).toBe('qa');page=await launch()
  await page.getByLabel('اسم المستخدم',{exact:true}).fill('متعلم النسخة السابقة');await page.getByLabel('كلمة المرور',{exact:true}).fill('legacy-test-long-password');await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
  await page.getByRole('link',{name:'افتح استوديو الاختبار'}).click();await expect(page.getByRole('heading',{name:'Marketing Academy QA Studio',exact:true})).toBeVisible()
  await page.setViewportSize({width:390,height:844});expect((await new AxeBuilder({page}).setLegacyMode().withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);await page.screenshot({path:'artifacts/qa-studio-mobile.png',fullPage:true});await page.setViewportSize({width:1280,height:900})
  for(const lesson of lessons)for(const section of ['read','quiz','practice']){
   await page.goto('academy://app/#/lesson/'+lesson.id+'/'+section)
   await expect(page.getByRole('heading').filter({hasText:lesson.title}).first()).toBeVisible()
   await expect(page.getByText('هذا الدرس مقفل',{exact:true})).not.toBeVisible()
  }
  for(let module=1;module<=12;module++){await page.goto('academy://app/#/review/'+module);await expect(page).toHaveURL(new RegExp('/review/'+module+'$'));await expect(page.getByRole('heading',{name:'مراجعة نهاية الوحدة',exact:true})).toBeVisible()}
  await page.goto('academy://app/#/projects');const projects=page.getByRole('navigation',{name:'اختيار مشروع الوحدة'}).getByRole('button');expect(await projects.count()).toBe(12);for(let i=0;i<12;i++){await projects.nth(i).click();await expect(projects.nth(i)).toHaveAttribute('aria-pressed','true')}
  await page.goto('academy://app/#/project');await expect(page.getByRole('main')).toBeVisible()
  await page.getByRole('link',{name:'افتح استوديو الاختبار'}).click()
  const testName=await page.getByLabel('اسم حساب الاختبار',{exact:true}).inputValue()
  await page.getByLabel('كلمة مرور حساب الاختبار',{exact:true}).fill('synthetic-studio-password')
  await page.getByRole('button',{name:'أنشئ حساب اختبار',exact:true}).click()
  await page.getByLabel('اسم المستخدم',{exact:true}).fill(testName);await page.getByLabel('كلمة المرور',{exact:true}).fill('synthetic-studio-password');await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
  await page.getByRole('link',{name:'افتح استوديو الاختبار'}).click()
  await page.getByLabel('عنوان الخطأ',{exact:true}).fill('Synthetic QA issue')
  await page.getByLabel('الخطوات والمتوقع والفعلي',{exact:true}).fill('Synthetic steps only')
  await page.getByRole('button',{name:'احفظ تقرير الخطأ',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'حُفظ تقرير الخطأ'})).toBeVisible()
  await page.getByLabel(/^قالب التقدم/).selectOption('30');await page.getByLabel('أوافق على استبدال بيانات حساب QA الحالي').check();await page.getByRole('button',{name:'طبّق قالب QA'}).click()
  await page.getByLabel('اسم المستخدم',{exact:true}).fill(testName);await page.getByLabel('كلمة المرور',{exact:true}).fill('synthetic-studio-password');await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
  await running.close();running=undefined;page=await launch()
  await page.getByLabel('اسم المستخدم',{exact:true}).fill(testName);await page.getByLabel('كلمة المرور',{exact:true}).fill('synthetic-studio-password');await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
  const auth=await page.evaluate(async name=>window.academy.request('login',{name,password:'synthetic-studio-password'}),testName)
  expect(auth.value.snapshot.state.lessonStates.filter(s=>s.completed)).toHaveLength(30)
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('academy-qa-studio-reports-v1')).length)).toBe(1)
  await page.getByRole('link',{name:'افتح استوديو الاختبار'}).click();await page.getByLabel(/^قالب التقدم/).selectOption('0');await page.getByLabel('أوافق على استبدال بيانات حساب QA الحالي').check();await page.getByRole('button',{name:'طبّق قالب QA'}).click()
  await page.getByLabel('اسم المستخدم',{exact:true}).fill(testName);await page.getByLabel('كلمة المرور',{exact:true}).fill('synthetic-studio-password');await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
  const reset=await page.evaluate(async name=>window.academy.request('login',{name,password:'synthetic-studio-password'}),testName);expect(reset.value.snapshot.state.lessonStates).toHaveLength(0)
  evidence.qaStudio={mobileAxe:true,all180LessonRoutes:true,all12ReviewRoutes:true,all12ModuleProjects:true,capstoneAccessible:true,syntheticRegistration:true,preset30PersistsAfterRestart:true,reportsPersistAfterRestart:true,resetAccountProgress:true}
 }
 evidence.status='passed'
} catch(error){evidence.status='failed';evidence.error=String(error);throw error}
finally{if(running)await running.close().catch(()=>{});await fs.writeFile(process.env.DESKTOP_EVIDENCE??'artifacts/desktop-smoke.json',JSON.stringify(evidence,null,2));await fs.rm(dataDir,{recursive:true,force:true})}
