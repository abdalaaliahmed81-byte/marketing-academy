import {test,expect,type Page} from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {lessons} from '../src/lessons'
import {activitiesFor} from '../src/interactive/content'
import {baghdadDay} from '../src/domain'
const password='interactive-browser-password'
async function register(page:Page){const name='Interactive '+crypto.randomUUID().slice(0,8);await page.goto('/');await page.getByRole('button',{name:'إنشاء حساب',exact:true}).click();await page.getByLabel('اسم المستخدم',{exact:true}).fill(name);await page.getByLabel('كلمة المرور',{exact:true}).fill(password);await page.getByLabel('تأكيد كلمة المرور',{exact:true}).fill(password);await page.getByRole('button',{name:'أنشئ حسابي'}).click();await page.getByRole('button',{name:'ابدأ التعلّم',exact:true}).click();return name}
async function login(page:Page,name:string){await page.getByLabel('اسم المستخدم',{exact:true}).fill(name);await page.getByLabel('كلمة المرور',{exact:true}).fill(password);await page.getByRole('button',{name:'ادخل إلى الأكاديمية'}).click();await expect(page.getByRole('button',{name:'خروج',exact:true})).toBeVisible()}
const card=(page:Page,kind:string)=>page.locator('[data-activity="'+kind+'"]')
test('six activities save real answers; mouse dragging and keyboard ordering work; plan enters portfolio',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});const name=await register(page);await page.goto('/#/lesson/m01-l01/read')
 const defs=activitiesFor(lessons[0]),guide=card(page,'guide')
 for(let i=0;i<defs[0].steps!.length;i++)await guide.getByRole('button',{name:'راجعت هذه الخطوة',exact:true}).click()
 await guide.getByRole('textbox').fill('سأميز بين الدليل والتفسير ثم أختبر قرارًا محدودًا بإذن.')
 await guide.getByRole('button',{name:'تحقّق من النشاط',exact:true}).click();await expect(guide.getByText('مكتمل',{exact:true})).toBeVisible()
 const matching=card(page,'match');for(let i=0;i<await matching.getByRole('combobox').count();i++)await matching.getByRole('combobox').nth(i).selectOption('term-'+i)
 await matching.getByRole('button',{name:'تحقّق من النشاط',exact:true}).click();await expect(matching.getByText('مكتمل',{exact:true})).toBeVisible()
 const sequence=card(page,'sequence'),order=defs.find(a=>a.kind==='sequence')!
 const before=await sequence.locator('li>span').allTextContents();await sequence.locator('li').nth(0).dragTo(sequence.locator('li').nth(1));expect(await sequence.locator('li>span').allTextContents()).not.toEqual(before)
 for(let i=0;i<order.items!.length;i++){let at=(await sequence.locator('li>span').allTextContents()).indexOf(order.items![i].label);while(at>i){const up=sequence.getByRole('button',{name:'حرّك '+order.items![i].label+' لأعلى',exact:true});await up.focus();await page.keyboard.press('Enter');at--}}
 await sequence.getByRole('button',{name:'تحقّق من النشاط',exact:true}).click();await expect(sequence.getByText('مكتمل',{exact:true})).toBeVisible()
 const blank=card(page,'blank');await blank.getByRole('textbox').fill(defs.find(a=>a.kind==='blank')!.answer!);await blank.getByRole('button',{name:'تحقّق من النشاط',exact:true}).click();await expect(blank.getByText('مكتمل',{exact:true})).toBeVisible()
 const branch=card(page,'scenario'),nodes=defs.find(a=>a.kind==='scenario')!.nodes!
 await branch.getByRole('button',{name:nodes[0].choices![1].label,exact:true}).click();await branch.getByRole('button',{name:nodes[1].choices![0].label,exact:true}).click();await branch.getByRole('button',{name:nodes[2].choices![0].label,exact:true}).click();await expect(branch.getByText('مكتمل',{exact:true})).toBeVisible()
 const plan=card(page,'plan'),definition=defs.find(a=>a.kind==='plan')!
 for(const field of definition.fields!)await plan.getByRole('textbox',{name:field.label,exact:true}).fill('محاكاة موثقة لهذا القرار مع نطاق واختبار '+field.label)
 await plan.getByRole('button',{name:'تحقّق من النشاط',exact:true}).click();await expect(plan.getByText('مكتمل',{exact:true})).toBeVisible()
 await expect(page.getByRole('progressbar',{name:'تقدم الأنشطة التفاعلية',exact:true})).toHaveAttribute('value','6')
 await plan.getByRole('button',{name:'راجع النقل إلى ملف أعمالي',exact:true}).click();await plan.getByRole('button',{name:'تأكيد استبدال الحقول المعروضة',exact:true}).click();await expect(plan.getByText('نُقل الناتج إلى ملف أعمالك.',{exact:true})).toBeVisible()
 await page.reload();await login(page,name);await expect(card(page,'match').getByRole('combobox').first()).toHaveValue('term-0');await expect(page.getByRole('progressbar',{name:'تقدم الأنشطة التفاعلية',exact:true})).toHaveAttribute('value','6')
 await page.getByRole('link',{name:'مشروعي',exact:true}).click();await page.getByRole('button',{name:'قبل الشراء',exact:true}).click();await expect(page.getByRole('textbox',{name:'السوق المستهدف',exact:true})).toHaveValue('محاكاة موثقة لهذا القرار مع نطاق واختبار السوق المستهدف')
})
test.describe('API quiz drafts and spaced review',()=>{
 test.use({baseURL:'http://127.0.0.1:4174'})
 test('answers survive refresh; retries preserve attempts; review schedules survive login',async({page})=>{
  const name=await register(page),lesson=lessons[0]
  await page.goto('/#/lesson/'+lesson.id+'/quiz')
  for(const [i,q] of lesson.questions.entries())await page.locator('input[type=radio][value="'+(i===0?q.options[1].id:q.answer)+'"]').check()
  await expect(page.getByText('حُفظت اختياراتك',{exact:true})).toBeVisible()
  await page.reload();await login(page,name);await expect(page.locator('input[value="'+lesson.questions[0].options[1].id+'"]')).toBeChecked()
  await page.getByRole('button',{name:'سلّم الاختبار',exact:true}).click();await expect(page.getByText(/٨٠٪ · اجتزت/)).toBeVisible()
  await page.getByRole('button',{name:'أعد الاختبار',exact:true}).click();await page.reload();await login(page,name)
  await expect(page.locator('input[type=radio]:checked')).toHaveCount(0)
  for(const q of lesson.questions)await page.locator('input[value="'+q.options[1].id+'"]').check()
  await page.getByRole('button',{name:'سلّم الاختبار',exact:true}).click();await expect(page.getByText(/٠٪ · راجع/)).toBeVisible()
  await page.getByRole('link',{name:'راجع الأخطاء بتكرار متباعد',exact:true}).click()
  await page.getByRole('radio',{name:lesson.questions[0].options.find(o=>o.id===lesson.questions[0].answer)!.label,exact:true}).check()
  await page.getByRole('button',{name:'تحقّق واحفظ المراجعة',exact:true}).click();await expect(page.getByRole('heading',{name:'استرجاع صحيح',exact:true})).toBeVisible()
  await page.reload();await login(page,name);await expect(page.getByRole('group')).toContainText(lesson.questions[1].prompt)
 })
})
test('persona, value, ethical story, budget and editable calendar generate saved portfolios accessibly',async({page})=>{
 test.setTimeout(180000);await page.emulateMedia({reducedMotion:'reduce'});await register(page)
 const at=new Date().toISOString(),data={version:3,settings:[{id:'local',goal:'تمارين متقدمة',minutes:30,business:'مطعم',theme:'light'}],lessonStates:lessons.map(l=>({id:l.id,notes:'',bookmarked:false,assignment:'محاكاة تطبيق مكتمل للمراجعة الذاتية',checked:[0,1,2],completed:true})),attempts:lessons.map(l=>({id:'fixture-'+l.id,lessonId:l.id,at,answers:Object.fromEntries(l.questions.map(q=>[q.id,q.answer])),score:100,passed:true,missed:[]})),activity:[{date:baghdadDay()}],missions:[],projects:[{id:'portfolio',name:'تمارين محاكاة',business:'مطعم',fields:{}}],moduleProjects:[]}
 await page.getByRole('link',{name:'الإعدادات',exact:true}).click();await page.getByLabel('اختر نسخة احتياطية',{exact:true}).setInputFiles({name:'synthetic-training.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await page.getByRole('button',{name:'استعد النسخة واستبدل البيانات',exact:true}).click()
 await expect(page.getByRole('textbox',{name:'هدفك من التعلّم',exact:true})).toHaveValue('تمارين متقدمة')
 for(const id of ['m02-l01','m03-l02','m04-l01','m05-l01','m09-l01']){
  const lesson=lessons.find(l=>l.id===id)!,definition=activitiesFor(lesson).find(a=>a.id==='studio-v1')!
  await page.goto('/#/lesson/'+id+'/read');const box=card(page,definition.kind)
  if(definition.kind==='budget'){
   for(const [label,value] of [['مرات الظهور','١٠٠٠'],['النقرات','٤٠'],['الطلبات','٤'],['سعر الطلب بالدينار','٦٠٠٠'],['التكلفة المتغيرة للطلب بالدينار','٣٦٠٠'],['الإنفاق الإعلاني بالدينار','٨٠٠٠']])await box.getByRole('textbox',{name:label,exact:true}).fill(value)
   await expect(box.locator('dd').first()).toHaveText('٤٪');await box.getByRole('textbox',{name:'ميزانية بديلة للمحاكاة',exact:true}).fill('١٠٠٠٠');await expect(box.getByText(/٥٠ نقرة/)).toBeVisible();await box.getByRole('textbox',{name:'قرارك وحدوده',exact:true}).fill('أبدأ باختبار محدود مع فحص السعة والتكلفة؛ النتائج افتراضية وليست ضمانًا.')
  }else{for(const field of definition.fields!){if(field.type==='date')await box.getByLabel(field.label,{exact:true}).fill('2026-11-16');else await box.getByRole('textbox',{name:field.label,exact:true}).fill('تطبيق محاكاة مع دليل وحدود لهذا البند '+field.label)}if(definition.kind==='copy')await box.getByRole('checkbox').check()}
  await box.getByRole('button',{name:'تحقّق من النشاط',exact:true}).click();await expect(box.getByText('مكتمل',{exact:true})).toBeVisible()
  await box.getByRole('button',{name:'راجع النقل إلى ملف أعمالي',exact:true}).click();await box.getByRole('button',{name:'تأكيد استبدال الحقول المعروضة',exact:true}).click();await expect(box.getByText('نُقل الناتج إلى ملف أعمالك.',{exact:true})).toBeVisible()
 }
 await page.setViewportSize({width:390,height:900})
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(audit.violations).toEqual([])
 await page.screenshot({path:'artifacts/interactive-budget-mobile.png',fullPage:true})
})
