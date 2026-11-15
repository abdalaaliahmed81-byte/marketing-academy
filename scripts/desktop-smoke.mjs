import {_electron as electron,expect} from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs/promises'
const dataDir=path.resolve(process.env.ACADEMY_TEST_DATA_DIR??'artifacts/desktop-test-data')
const executablePath=process.env.DESKTOP_EXE
const args=executablePath?[]:['.']
if(process.platform==='linux')args.push('--no-sandbox','--ozone-platform=headless')
await fs.mkdir('artifacts',{recursive:true})
await fs.rm(dataDir,{recursive:true,force:true})
const evidence={platform:process.platform,architecture:process.arch,executable:executablePath??'development electron',checks:[],networkRequests:[]}
let running
async function launch(){
 running=await electron.launch({executablePath,args,env:{...process.env,ACADEMY_TEST_DATA_DIR:dataDir},timeout:90000})
 const page=await running.firstWindow({timeout:90000})
 page.on('request',req=>{if(!req.url().startsWith('academy://app/'))evidence.networkRequests.push(req.url())})
 await page.waitForURL('academy://app/**')
 return page
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
 const outside=await page.evaluate(async()=>{try{await fetch('https://example.com');return 'allowed'}catch{return 'blocked'}})
 expect(outside).toBe('blocked')
 evidence.checks.push('external network fetch blocked; curriculum and notes work without external server')
 await page.screenshot({path:'artifacts/desktop.png'})
 evidence.status='passed'
} catch(error){evidence.status='failed';evidence.error=String(error);throw error}
finally{if(running)await running.close().catch(()=>{});await fs.writeFile('artifacts/desktop-smoke.json',JSON.stringify(evidence,null,2));await fs.rm(dataDir,{recursive:true,force:true})}
