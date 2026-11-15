import {test,expect,type Page} from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {lessons} from '../src/lessons'
const password='design-test-long-password'
async function register(page:Page,name:string){
 await page.goto('/');await page.getByRole('button',{name:'إنشاء حساب',exact:true}).click()
 await page.getByLabel('اسم المستخدم',{exact:true}).fill(name);await page.getByLabel('كلمة المرور',{exact:true}).fill(password);await page.getByLabel('تأكيد كلمة المرور',{exact:true}).fill(password)
 await page.getByRole('button',{name:'أنشئ حسابي'}).click();await page.getByRole('button',{name:'ابدأ التعلّم',exact:true}).click()
 await expect(page.getByRole('link',{name:'مسار التعلّم',exact:true})).toBeVisible()
}
for(const [edition,baseURL] of [['static','http://127.0.0.1:4173'],['api','http://127.0.0.1:4174']] as const){
 test.describe(edition+' lesson notebook',()=>{
  test.use({baseURL})
  test('notes stay beside titles, autosave with stable timestamps, search and remain isolated after reload',async({page})=>{
   const username='Notebook '+crypto.randomUUID().slice(0,8)
   await register(page,username);await page.getByRole('link',{name:'مسار التعلّم',exact:true}).click()
   await expect(page.locator('dialog')).toHaveCount(0)
   const url=page.url(),button=page.getByRole('button',{name:/^ملاحظات:/}).first()
   const adjacent=await button.evaluate(el=>!!el.closest('.lesson-name'))
   expect(adjacent).toBe(true)
   await button.click();await expect(page.getByRole('dialog')).toBeVisible();expect(page.url()).toBe(url)
   const text='فكرة نمو للفريق. فكرة ثانية عن مؤشر الاحتفاظ.'
   await page.getByRole('dialog').getByRole('textbox').fill(text)
   await expect(page.getByRole('dialog').getByRole('status')).toHaveText('حُفظت الملاحظات')
   const stamp=await page.getByRole('dialog').locator('time').getAttribute('datetime');expect(Number.isFinite(Date.parse(stamp!))).toBe(true)
   await page.getByRole('dialog').getByLabel('ابحث داخل الملاحظة',{exact:true}).fill('فكرة')
   await expect(page.getByText('٢ نتائج مطابقة',{exact:true})).toBeVisible()
   await page.getByRole('button',{name:'النتيجة التالية'}).click()
   expect(await page.getByRole('dialog').getByRole('textbox').evaluate((el:HTMLTextAreaElement)=>el.value.slice(el.selectionStart,el.selectionEnd))).toBe('فكرة')
   await page.getByRole('button',{name:'احفظ وأغلق'}).click();await expect(page.getByRole('dialog')).not.toBeVisible()
   await page.reload();await page.getByLabel('اسم المستخدم',{exact:true}).fill(username);await page.getByLabel('كلمة المرور',{exact:true}).fill(password);await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
   await page.getByRole('button',{name:/^ملاحظات:/}).first().click()
   await expect(page.getByRole('dialog').getByRole('textbox')).toHaveValue(text)
   await expect(page.getByRole('dialog').locator('time')).toHaveAttribute('datetime',stamp!)
   await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();expect(page.url()).toBe(url)
   await page.getByRole('link',{name:'مكتبة الموارد',exact:true}).click()
   await page.getByLabel('نوع المورد',{exact:true}).selectOption('notes');await page.getByLabel('ابحث في المكتبة',{exact:true}).fill('مؤشر الاحتفاظ')
   await expect(page.locator('.resource-card')).toHaveCount(1)
   await page.goto('/#/lesson/m01-l01/quiz')
   for(const q of lessons[0].questions)await page.getByRole('radio',{name:q.options.find(o=>o.id===q.answer)!.label,exact:true}).check()
   await page.getByRole('button',{name:'سلّم الاختبار',exact:true}).click()
   await expect(page.getByRole('heading',{name:'نتيجة الاختبار'})).toBeVisible()
   await page.getByRole('link',{name:'إحصاءات التقدم',exact:true}).click()
   await expect(page.locator('.stats-metrics')).toContainText('١٠٠٪')
   await expect(page.getByText(/١ ملاحظات مكتوبة/)).toBeVisible()
   await page.getByRole('button',{name:'خروج',exact:true}).click();await register(page,'Other '+crypto.randomUUID().slice(0,8))
   await page.getByRole('link',{name:'مكتبة الموارد',exact:true}).click();await page.getByLabel('نوع المورد',{exact:true}).selectOption('notes')
   await expect(page.getByRole('heading',{name:'لم نعثر على نتيجة'})).toBeVisible()
  })
 })
}
test('real responsive pages, RTL, notes keyboard targets and library filters work in both themes',async({page})=>{
 test.setTimeout(180000);await page.emulateMedia({reducedMotion:'reduce'})
 await register(page,'Design '+crypto.randomUUID().slice(0,8))
 for(const width of [1280,390,320]){
  await page.setViewportSize({width,height:950})
  for(const route of ['/#/','/#/library','/#/stats','/#/lesson/m01-l01/read','/#/lesson/m01-l01/quiz','/#/mission','/#/projects','/#/project','/#/settings']){
   await page.goto(route);await expect(page.getByRole('heading',{level:1})).toBeVisible()
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' width='+width).toBe(true)
  }
  await page.goto('/#/library')
  await expect(page.locator('.resource-card')).toHaveCount(75)
  await page.getByLabel('نوع المورد',{exact:true}).selectOption('lessons')
  await page.getByLabel('الوحدة',{exact:true}).selectOption('3')
  await expect(page.locator('.resource-card')).toHaveCount(5)
  await page.getByLabel('ابحث في المكتبة',{exact:true}).fill('خريطة التعاطف')
  await expect(page.locator('.resource-card')).toHaveCount(1)
  const note=page.getByRole('button',{name:/^ملاحظات:/}).first(),rect=await note.boundingBox()
  expect(rect!.width).toBeGreaterThanOrEqual(44);expect(rect!.height).toBeGreaterThanOrEqual(44)
  await note.focus();await page.keyboard.press('Enter');await expect(page.getByRole('dialog')).toBeVisible()
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(audit.violations).toEqual([])
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.screenshot({path:`artifacts/ui-library-${width}.png`,fullPage:true})
 }
 await page.setViewportSize({width:1280,height:950});await page.goto('/#/');await page.screenshot({path:'artifacts/ui-dashboard-desktop.png',fullPage:true})
 await page.goto('/#/lesson/m01-l01/read');await page.screenshot({path:'artifacts/ui-lesson-desktop.png',fullPage:true})
 await page.getByRole('button',{name:/^ملاحظات:/}).click();await page.screenshot({path:'artifacts/ui-notes-desktop.png'})
 await page.keyboard.press('Escape')
 for(const dark of [false,true]){
  if(dark)await page.getByRole('button',{name:'المظهر الداكن',exact:true}).click()
  for(const route of ['/#/library','/#/stats']){await page.goto(route);await expect(page.getByRole('heading',{level:1})).toBeVisible();const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(audit.violations).toEqual([])}
 }
 expect(await page.locator('.route-content').evaluate(el=>getComputedStyle(el).animationName)).toBe('none')
})
