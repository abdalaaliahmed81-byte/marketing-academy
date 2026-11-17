import {agencyPortfolioMarkdown} from '../agency/model'
import guides from './module-guides.json' with {type:'json'}
import minis from './mini-projects.json' with {type:'json'}
import {lessons} from '../lessons'
import {markdown} from '../domain'
import {modules,type Lesson} from '../curriculum'
import {projectBriefs} from '../projects'
import {businessCases} from './cases'
export const moduleTargets=['goals','research','position','story','calendar','post1','media','nurture','budget','kpis','analysis','report'] as const
export const capstoneMilestones=[
 ['موجز السوق والهدف',['market','goals'],'حدد الشريحة والسعة والتأكيد الفريد؛ لا تخلط الهدف بالنتيجة.'],
 ['بحث وشخصية وبدائل',['research','persona','competitors'],'سجل الملاحظات والافتراضات وقارن بدائل بوحدة وفترة متسقة.'],
 ['قيمة وتموضع',['position'],'اربط وعدًا ودليلًا وحدودًا وسعرًا بقدرة التشغيل.'],
 ['قصة ورسالة',['story','message'],'راجع الادعاءات والتوقعات ووسم أي قصة افتراضية.'],
 ['الوصول والتقويم',['media','calendar'],'خطط6 مواد لأسبوعين مع وقت مراجعة ورد، لا اشتراط حساب منصة.'],
 ['أصول المحتوى',['post1','post2','post3','post4','post5'],'اكتب مواد بأدوار مختلفة وحقوق معلومة دون أصول مدفوعة.'],
 ['الاهتمام والرعاية',['capture','nurture'],'افصل طلب المورد عن التسويق واختبر الانسحاب ببيانات وهمية.'],
 ['التأكيد والتجربة',['conversion','experience'],'حدد الإجمالي والتوفر والموعد وحالات خطأ وعدول ودعم.'],
 ['القيمة والإحالة',['value','referral'],'عرّف مجموعة ونافذة، واحسب المساهمة بعد الحافز بلا ضمان مستقبل.'],
 ['إعلان وميزانية',['ad1','ad2','budget'],'نصان وميزانية محاكاة وحد توقف؛ الإنفاق الفعلي صفر.'],
 ['القياس والتحليل',['kpis','analysis'],'أعد المقامات وROAS والمساهمة والحساسية، وسم النتائج محاكاة.'],
 ['تقرير جاهز للمراجعة',['report'],'وضح دورك والنتيجة المصنوعة والقيود والتوصية والمسؤول والموعد.']
] as const
export function moduleGuide(index:number){
 const brief=projectBriefs[index],guide=guides[index]
 return {...brief,...guide,concepts:[...new Set(lessons.filter(l=>l.module===index+1).flatMap(l=>l.glossary.map(([term,definition])=>term+' — '+definition)))].slice(0,12).join(' · '),template:['محاكاة تدريبية · مشروع الوحدة '+(index+1)+' · '+brief.title,'الاسم/التاريخ:', 'السيناريو والجمهور وحدود الخدمة:', 'الأهداف والمتطلبات السابقة:',...brief.deliverables.map(d=>'## '+d+'\nقراري/المخرج:\nدليل أو افتراض:\nخطوات وحسابات ووحدات:\nحدود:'),'الأخطاء التي فحصتها والتحسين التالي:', 'ما نفذته فعلًا وما لم أنفذه:'].join('\n\n')}
}
export function miniProject(lesson:Lesson){
 const record=(minis as Record<string,{task:string;deliverables:string[];solution:string}>)[lesson.id]
 const scenario=businessCases[(lesson.module-1)%3],index=lessons.findIndex(l=>l.id===lesson.id)
 return {...record,title:'مشروع مصغر: '+lesson.title,scenario,prerequisites:index===0?'لا متطلبات تسويقية سابقة؛ قراءة الشرح ومعرفة جمع وطرح بسيط.':'راجع '+lessons[index-1].title+' ومصطلحات الدرس الحالي.',materials:'محرر الأكاديمية وبيانات المثال وحاسبة محلية أو حساب ورقي؛ لا حساب إعلان أو اشتراك مطلوب.',steps:['اقرأ السيناريو ووسم كل افتراض؛ '+record.task,'أنتج المخرجين التاليين بتعريف ووحدة وفترة عند الحاجة: '+record.deliverables.join('، '),'قارن تفسيرك بالحل ثم اكتب سبب اختيارك أو اختلافه.','أكمل التكليف الأصلي وبنود المراجعة أدناه، واحفظ قبل التصدير أو نقل المشروع.'],template:['محاكاة تدريبية · '+record.task,'السيناريو: '+scenario.name,...record.deliverables.map(d=>'## '+d+'\nتسليمي:\nالدليل/الافتراض:\nالحدود:'),'## استكمال التكليف الأصلي\n'+lesson.assignment+'\nتسليمي:', '## تحسين مقترح وما لم أنفذه'].join('\n\n'),mistakes:['عند السؤال «'+lesson.questions[0].prompt+'» يكون اختيار «'+lesson.questions[0].options.find(o=>o.id!==lesson.questions[0].answer)!.label+'» خطأ. '+lesson.questions[0].why,'عرض الأرقام أو الأدوار المصنوعة كوقائع أو مقابلات حقيقية.','نسخ الحل دون تفسير ملاءمته أو إكمال متطلبات التكليف الأصلي.'],advice:'ابدأ بمخرج صغير قابل للفحص. احتفظ بالمقام والعملة والفترة والدليل، ثم عدّل قرارًا واحدًا وأعد التحقق.',rubric:lesson.rubric,moduleName:modules[lesson.module-1]}
}
export function projectMarkdown(index:number,response?:string){const p=moduleGuide(index);return ['# '+p.title,'محاكاة تعليمية؛ لا نتائج عميل حقيقية أو اعتماد مستقل.',p.brief,'## الأهداف',p.objective,'## المتطلبات السابقة',p.prerequisites,'## المواد والمفاهيم',p.materials,p.concepts,'## المخرجات',...p.deliverables,'## خطوات مفصلة',...p.steps.map((s,i)=>`${i+1}. ${s}`),'## الحل الكامل',...p.worked,'## قالب المتعلم',p.template,'## التقييم الذاتي','لكل بند:0 غائب،1 جزئي/بلا دليل،2 كامل مع دليل وحدود. أربعة بنود/8 نقاط للتطوير الذاتي؛ ليست درجة مدرس أو شرطًا جديدًا يسحب تقدمًا سابقًا.',...p.rubric,'## أخطاء شائعة وتحسين',...p.mistakes,p.advice,p.offlineProof,...(response?['## تسليم المتعلم · غير متحقق منه',response]:[])].join('\n\n')+'\n'}

export function clientReport(project:import('../domain').Capstone){
 const keys=[['goals','الهدف ونطاق القياس'],['budget','الميزانية والافتراضات'],['kpis','المؤشرات ومصادر البيانات'],['analysis','التحليل وحدود النتيجة'],['report','الملخص والتوصيات والمسؤول والموعد']]
 return ['# تقرير تسويقي تدريبي — '+(project.name||'مشروعي'),project.business,'بيانات الأمثلة محاكاة وليست نتائج عميل حقيقية. تسليم المتعلم غير متحقق منه بواسطة الأكاديمية؛ وثق أي واقعة فعلية ومصدرها وحدودها.',...keys.flatMap(([id,title])=>['## '+title,project.fields[id]?.trim()||'غير مكتمل — لا تقدمه كجزء متحقق منه.'])].join('\n\n')+'\n'
}
export function learningPortfolioMarkdown(project:import('../domain').Capstone,assignments:{id:string;assignment:string;completed:boolean}[],moduleProjects:{id:string;response:string;completed:boolean}[]){
 return [markdown(project),'## ملحق تطبيقات الدروس المحفوظة','مسودات وتسليمات المتعلم؛ علامة الإكمال مراجعة ذاتية وليست اعتمادًا مهنيًا.',...assignments.filter(r=>r.assignment.trim()).flatMap(r=>['### '+r.id+' · '+(lessons.find(l=>l.id===r.id)?.title??r.id)+' · '+(r.completed?'مكتمل ذاتيًا':'مسودة'),r.assignment]),'## ملحق تسليمات الوحدات',...moduleProjects.filter(r=>r.response.trim()).flatMap(r=>['### '+r.id+' · '+(r.completed?'مكتمل ذاتيًا':'مسودة'),r.response]),...(project.agency?.length?[agencyPortfolioMarkdown(project.agency)]:[])].join('\n\n')+'\n'
}
