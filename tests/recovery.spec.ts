import {test,expect} from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
test.use({baseURL:'http://127.0.0.1:4175'})
test('encrypted recovery creates a new Unicode identity and preserves the original after restart',async({page})=>{
 const suffix=crypto.randomUUID().slice(0,8),name='Recovery '+suffix,recovered='مُستعاد_'+suffix,password='source-account-password',next='recovered-account-password',phrase='independent-backup-phrase'
 await page.goto('/');await page.getByRole('button',{name:'إنشاء حساب',exact:true}).click()
 await page.getByLabel('اسم المستخدم',{exact:true}).fill(name);await page.getByLabel('كلمة المرور',{exact:true}).fill(password);await page.getByLabel('تأكيد كلمة المرور',{exact:true}).fill(password)
 await page.getByRole('button',{name:'أنشئ حسابي'}).click();await page.getByRole('button',{name:'ابدأ التعلّم',exact:true}).click()
 await page.getByRole('link',{name:'مسار التعلّم',exact:true}).click();await page.getByRole('button',{name:/^ملاحظات:/}).first().click();await page.getByRole('dialog').getByRole('textbox').fill('أصل الحساب لا يتغير عند الاستعادة');await page.getByRole('button',{name:'احفظ وأغلق'}).click()
 await page.getByRole('link',{name:'الإعدادات',exact:true}).click();await page.getByLabel('عبارة حماية النسخة',{exact:true}).fill(phrase)
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'نزّل نسخة مشفّرة'}).click();const file=(await (await pending).path())!
 await page.getByRole('button',{name:'خروج',exact:true}).click();await page.getByRole('button',{name:'نسيت كلمة المرور؟ استعادة من نسخة مشفرة',exact:true}).click()
 await page.getByLabel('النسخة المشفرة',{exact:true}).setInputFiles(file);await page.getByLabel('عبارة حماية النسخة',{exact:true}).fill('incorrect-backup-phrase')
 await page.getByLabel('اسم الحساب الجديد',{exact:true}).fill(recovered);await page.getByLabel('كلمة مرور الحساب الجديد',{exact:true}).fill(next);await page.getByLabel('تأكيد كلمة مرور الحساب الجديد',{exact:true}).fill(next)
 await page.getByRole('button',{name:'استعد إلى حساب جديد'}).click();await expect(page.getByRole('alert')).toContainText('عبارة الحماية غير صحيحة')
 await page.setViewportSize({width:390,height:844});expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([])
 await page.getByLabel('عبارة حماية النسخة',{exact:true}).fill(phrase);await page.getByRole('button',{name:'استعد إلى حساب جديد'}).click()
 await page.getByRole('link',{name:'مسار التعلّم',exact:true}).click();await page.getByRole('button',{name:/^ملاحظات:/}).first().click();await expect(page.getByRole('dialog').getByRole('textbox')).toHaveValue('أصل الحساب لا يتغير عند الاستعادة');await page.getByRole('button',{name:'احفظ وأغلق'}).click()
 await page.reload();await page.getByLabel('اسم المستخدم',{exact:true}).fill(recovered);await page.getByLabel('كلمة المرور',{exact:true}).fill(next);await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
 await page.getByRole('button',{name:'خروج',exact:true}).click();await page.getByLabel('اسم المستخدم',{exact:true}).fill(name);await page.getByLabel('كلمة المرور',{exact:true}).fill(password);await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click()
 await page.getByRole('button',{name:/^ملاحظات:/}).first().click();await expect(page.getByRole('dialog').getByRole('textbox')).toHaveValue('أصل الحساب لا يتغير عند الاستعادة')
})
test('login accepts an existing API account with a long Unicode password without input truncation',async({page,request})=>{
 const name='Unicode Password '+crypto.randomUUID().slice(0,8),password='🔐'.repeat(70)
 const response=await request.post('/api/command',{headers:{Origin:'http://127.0.0.1:4175','X-Academy-Request':'1'},data:{command:'register',payload:{name,password}}})
 expect(response.status()).toBe(200)
 await page.goto('/');await page.getByLabel('اسم المستخدم',{exact:true}).fill(name);await page.getByLabel('كلمة المرور',{exact:true}).fill(password)
 await expect(page.getByLabel('كلمة المرور',{exact:true})).toHaveValue(password)
 await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click();await expect(page.getByRole('button',{name:'ابدأ التعلّم',exact:true})).toBeVisible()
})
