import {test,expect,type Page} from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {readFile} from 'node:fs/promises'
import {agencyRubric,workedAgencyProject} from '../src/agency/model'
const labels={brief:'الموجز والفرضية والجمهور',targeting:'خطة الاستهداف والاستبعاد',copyA:'نص الإعلان أ',copyB:'نص الإعلان ب',landing:'مخطط صفحة الهبوط',analysis:'تحليلك وحدود البيانات',recommendation:'التوصية وحد التوقف'}
async function register(page:Page,name:string){await page.goto('/');await page.getByRole('button',{name:'إنشاء حساب',exact:true}).click();await page.getByLabel('اسم المستخدم',{exact:true}).fill(name);await page.getByLabel('كلمة المرور',{exact:true}).fill('agency-browser-password');await page.getByLabel('تأكيد كلمة المرور',{exact:true}).fill('agency-browser-password');await page.getByRole('button',{name:'أنشئ حسابي'}).click();await page.getByRole('button',{name:'ابدأ التعلّم',exact:true}).click()}
async function login(page:Page,name:string){await page.getByLabel('اسم المستخدم',{exact:true}).fill(name);await page.getByLabel('كلمة المرور',{exact:true}).fill('agency-browser-password');await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()}
test('agency saves/completes all fictional clients, exports real reports, survives restart and isolates users',async({page})=>{
 const name='Agency '+crypto.randomUUID().slice(0,8);await register(page,name);await page.getByRole('link',{name:'الوكالة الافتراضية ومحاكي الحملات',exact:true}).click()
 // An explicit export of an untouched valid draft must create real saved state.
 let waiting=page.waitForEvent('download');await page.getByRole('button',{name:'صدّر بيانات المحاكاة JSON',exact:true}).click();let downloaded=await waiting;let exported=JSON.parse(await readFile((await downloaded.path())!,'utf8'));expect(exported.synthetic).toBe(true);expect(exported.project.budget).toBe(24000);expect(exported.results.total.contribution).toBe(24000)
 await page.getByLabel('المنصة الافتراضية',{exact:true}).selectOption('google');await page.getByLabel('الجمهور الافتراضي',{exact:true}).selectOption('intent')
 const clients=['restaurant','clothing','ecommerce'] as const
 for(let i=0;i<clients.length;i++){
  if(i)await page.getByRole('navigation',{name:'اختيار عميل الوكالة'}).getByRole('button').nth(i).click()
  const p=workedAgencyProject(clients[i]);for(const field of Object.keys(labels) as (keyof typeof labels)[])await page.getByRole('textbox',{name:labels[field],exact:true}).fill(p[field])
  for(const label of agencyRubric)await page.getByRole('checkbox',{name:label,exact:true}).check()
  await page.getByRole('button',{name:'أكمل مشروع الوكالة',exact:true}).click();await expect(page.getByText('حالة المشروع: مكتمل بالمراجعة الذاتية',{exact:true})).toBeVisible();expect(await page.evaluate(()=>{const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented})).toBe(false)
 }
 waiting=page.waitForEvent('download');await page.getByRole('button',{name:'صدّر تقرير الوكالة Markdown',exact:true}).click();downloaded=await waiting;const report=await readFile((await downloaded.path())!,'utf8');expect(report).toContain('بيانات اصطناعية');expect(report).toContain('المساهمة');expect(report).toContain('سلة البيت')
 await page.reload();await login(page,name);await expect(page.getByRole('textbox',{name:labels.brief,exact:true})).toHaveValue(workedAgencyProject('restaurant').brief);await expect(page.getByLabel('المنصة الافتراضية',{exact:true})).toHaveValue('google')
 await page.getByRole('link',{name:'مشروعي',exact:true}).click();waiting=page.waitForEvent('download');await page.getByRole('button',{name:'ملف الأعمال Markdown',exact:true}).click();downloaded=await waiting;const portfolio=await readFile((await downloaded.path())!,'utf8');expect(portfolio).toContain('ملحق الوكالة الافتراضية');expect(portfolio).toContain('كرسبي الجامعة');expect(portfolio).toContain('خيط الموصل');expect(portfolio).toContain('سلة البيت')
 await page.getByRole('button',{name:'خروج',exact:true}).click();await register(page,'Other '+crypto.randomUUID().slice(0,8));await page.getByRole('link',{name:'الوكالة الافتراضية ومحاكي الحملات',exact:true}).click();await expect(page.getByRole('textbox',{name:labels.brief,exact:true})).toHaveValue('');await expect(page.getByText('حالة المشروع: مسودة',{exact:true})).toBeVisible()
})
test('agency controls have bounded feedback, zero-denominator handling and mobile accessibility',async({page})=>{
 await register(page,'AgencyMobile '+crypto.randomUUID().slice(0,6));await page.goto('/#/agency');await page.getByLabel('الميزانية الاصطناعية د.ع.',{exact:true}).fill('0');await expect(page.getByRole('region',{name:'نتائج الحملة الاصطناعية'})).toContainText('غير قابل للحساب')
 await expect(page.getByRole('button',{name:'أكمل مشروع الوكالة',exact:true})).toBeDisabled();await page.getByLabel('الميزانية الاصطناعية د.ع.',{exact:true}).fill('-1');await expect(page.getByText('قيم المحاكاة غير صالحة؛',{exact:false})).toBeVisible();await page.getByLabel('الميزانية الاصطناعية د.ع.',{exact:true}).fill('0');await page.getByText(/^الحل الكامل المحلول/).click();await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'})
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([])
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.screenshot({path:'artifacts/agency-mobile.png',fullPage:true})
})
