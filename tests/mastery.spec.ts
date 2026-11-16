import {test,expect,type Page} from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
async function register(page:Page,name:string){await page.goto('/');await page.getByRole('button',{name:'إنشاء حساب',exact:true}).click();await page.getByLabel('اسم المستخدم',{exact:true}).fill(name);await page.getByLabel('كلمة المرور',{exact:true}).fill('mastery-browser-password');await page.getByLabel('تأكيد كلمة المرور',{exact:true}).fill('mastery-browser-password');await page.getByRole('button',{name:'أنشئ حسابي'}).click();await page.getByRole('button',{name:'ابدأ التعلّم',exact:true}).click()}
async function login(page:Page,name:string){await page.getByLabel('اسم المستخدم',{exact:true}).fill(name);await page.getByLabel('كلمة المرور',{exact:true}).fill('mastery-browser-password');await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()}
test('default library search finds autosaved account notes, survives offline restart, and isolates another account',async({page,context})=>{
 const name='Mastery '+crypto.randomUUID().slice(0,8),needle='مفتاحدفترخاص'+crypto.randomUUID().slice(0,6)
 await register(page,name);await page.goto('/#/skills');await page.getByRole('button',{name:/^ملاحظات:/}).first().click()
 await page.getByRole('dialog').getByRole('textbox',{name:'ملاحظاتك لهذا الدرس'}).fill(needle);await expect(page.getByRole('dialog').getByRole('status')).toHaveText('حُفظت الملاحظات');await page.keyboard.press('Escape')
 await expect(page).toHaveURL(/#\/skills$/)
 await page.getByRole('link',{name:'مكتبة الموارد',exact:true}).click();await page.getByRole('searchbox',{name:'ابحث في المكتبة',exact:true}).fill(needle);await expect(page.locator('.resource-card')).toHaveCount(1)
 await page.evaluate(async()=>{await navigator.serviceWorker.ready});await page.reload();await login(page,name);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true)
 await context.setOffline(true);await page.reload();await login(page,name);await page.getByRole('searchbox',{name:'ابحث في المكتبة',exact:true}).fill(needle);await expect(page.locator('.resource-card')).toHaveCount(1)
 await page.getByRole('button',{name:'خروج',exact:true}).click();await context.setOffline(false);await register(page,'Other '+crypto.randomUUID().slice(0,8));await page.getByRole('link',{name:'مكتبة الموارد',exact:true}).click();await page.getByRole('searchbox',{name:'ابحث في المكتبة',exact:true}).fill(needle);await expect(page.locator('.resource-card')).toHaveCount(0)
})
test('skill tree has sixty accessible note circles and respects mobile/reduced-motion without unlocking lessons',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await register(page,'Tree '+crypto.randomUUID().slice(0,8));await page.getByRole('link',{name:'شجرة إتقان المهارات',exact:true}).click();await page.setViewportSize({width:390,height:844})
 await expect(page.locator('.skill-node')).toHaveCount(60);await expect(page.getByRole('button',{name:/^ملاحظات:/})).toHaveCount(60);await expect(page.locator('.skill-node.locked')).toHaveCount(59)
 expect(await page.locator('.skill-node').first().evaluate(el=>getComputedStyle(el).animationName)).toBe('none')
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([])
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
 await page.screenshot({path:'artifacts/mastery-tree-mobile.png',fullPage:true});await page.locator('.skill-module').first().screenshot({path:'artifacts/mastery-module-mobile.png'})
})
