import {test,expect} from '@playwright/test'
import {lessons} from '../src/lessons'
import {assessmentQuestions} from '../src/lessons/assessment-history'
import {emptyLesson,scoreQuestions} from '../src/domain'
test.use({baseURL:'http://127.0.0.1:4175'})
test('v2 restored assessment retains wording, then v3 retry survives reload with notes intact',async({page})=>{
 const name='Content '+crypto.randomUUID().slice(0,8),password='content-history-password',lesson=lessons[0],old=assessmentQuestions(lesson,2)
 await page.goto('/');await page.getByRole('button',{name:'إنشاء حساب',exact:true}).click();await page.getByLabel('اسم المستخدم',{exact:true}).fill(name);await page.getByLabel('كلمة المرور',{exact:true}).fill(password);await page.getByLabel('تأكيد كلمة المرور',{exact:true}).fill(password);await page.getByRole('button',{name:'أنشئ حسابي'}).click();await page.getByRole('button',{name:'ابدأ التعلّم',exact:true}).click()
 const answers=Object.fromEntries(old.map((q,i)=>[q.id,q.options[i===0?1:0].id])),data={version:3,settings:[{id:'local',goal:'حفظ تاريخ التقييم',minutes:30,business:'مطعم',theme:'light'}],lessonStates:[{...emptyLesson(lesson.id),notes:'ملاحظة من التقييم السابق'}],attempts:[{id:'synthetic-v2',lessonId:lesson.id,assessmentVersion:2,at:'2026-11-16T00:00:00Z',answers,...scoreQuestions(old,answers)}],projects:[],missions:[],activity:[],moduleProjects:[]}
 await page.getByRole('link',{name:'الإعدادات',exact:true}).click();await page.getByLabel('اختر نسخة احتياطية',{exact:true}).setInputFiles({name:'synthetic-v2.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await page.getByRole('button',{name:'استعد النسخة واستبدل البيانات',exact:true}).click();await expect(page.getByRole('textbox',{name:'هدفك من التعلّم',exact:true})).toHaveValue('حفظ تاريخ التقييم')
 await page.goto('/#/lesson/'+lesson.id+'/quiz');await expect(page.getByText(/نسخة تقييم سابقة محفوظة/)).toBeVisible();await expect(page.getByText(old[2].prompt,{exact:false})).toBeVisible()
 await page.getByRole('button',{name:'أعد الاختبار',exact:true}).click();await expect(page.getByText(lesson.questions[2].prompt,{exact:false})).toBeVisible()
 for(const q of lesson.questions)await page.locator('input[value="'+q.answer+'"]').check()
 await page.getByRole('button',{name:'سلّم الاختبار',exact:true}).click();await expect(page.getByText(/١٠٠٪ · اجتزت/)).toBeVisible()
 await page.reload();await page.getByLabel('اسم المستخدم',{exact:true}).fill(name);await page.getByLabel('كلمة المرور',{exact:true}).fill(password);await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click();await expect(page.getByText(lesson.questions[2].prompt,{exact:false})).toBeVisible();await expect(page.getByText(/٢ محاولات محفوظة/)).toBeVisible()
 await page.getByRole('button',{name:/^ملاحظات:/}).first().click();await expect(page.getByRole('dialog').getByRole('textbox')).toHaveValue('ملاحظة من التقييم السابق')
})
