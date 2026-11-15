import type {Lesson} from '../curriculum'
import {branchPosition,type Activity,type Interaction,type Field} from './model'
const field=(id:string,label:string,hint:string):Field=>({id,label,hint})
const persona=[field('situation','موقف الشراء','صف ظرفًا وسلوكًا قابلًا للملاحظة، لا صورة نمطية.'),field('need','الحاجة والعائق','ما العمل المطلوب وما الذي يعطل القرار؟'),field('evidence','الدليل وحدوده','اذكر مصدرًا بإذن أو اكتب محاكاة بوضوح.'),field('test','اختبار الفرضية','كيف تميز تفسيرين متنافسين دون توجيه العميل؟')]
const value=[field('audience','الجمهور والسياق','من تخدم في أي موقف محدد؟'),field('benefit','الفائدة والوعد','ماذا يتغير للشخص؟ لا تكتف باسم الخاصية.'),field('proof','الدليل','ما الذي يسند الوعد؟ صرّح بما لا تعرفه.'),field('limits','الحدود والإجراء','حدد ما لا يشمله العرض والخطوة التالية.')]
const copy=[field('customer','موقف العميل','ابدأ بحاجته لا بادعاء بطولة العلامة.'),field('draft','النص أو القصة','اكتب حاجة، وعدًا واقعيًا، دليلًا، وإجراءً واحدًا.'),field('proof','تدقيق الادعاء','أي جملة تحتاج دليلًا؟ كيف تصحح ضمانًا أو ندرة مختلقة؟'),field('revision','المراجعة الأخلاقية','اكتب نسخة محسنة تذكر الشروط والإذن والإفصاح عند الحاجة.')]
const campaign=[field('goal','هدف الحملة','نتيجة قابلة للعد وفترة وخط أساس.'),field('audience','الشريحة والعرض','لمن؟ وما الوعد ودليله وحدوده؟'),field('channel','التنفيذ والقناة','اختر وسيلة وقدرة رد وتسليم فعلية.'),field('measurement','القياس والتوقف','حدد البسط والمقام ومصدر البيانات وحد الإنفاق والتوقف.')]
const plan=[field('market','السوق المستهدف','حاجة وسياق ودليل، لا تعميم على الجميع.'),field('message','الرسالة','فائدة ودليل وحدود.'),field('media','وسائل الوصول','قناة تناسب الجمهور والموارد.'),field('capture','التقاط الاهتمام','إذن واضح وحد أدنى من البيانات.'),field('nurture','رعاية المهتمين','معلومة نافعة وتكرار متفق عليه.'),field('conversion','التحويل','خطوة واحدة مع شروط وسعر واضحين.'),field('experience','تجربة العميل','كيف تفي بما وعدت به؟'),field('value','قيمة العلاقة','منفعة متكررة دون ضغط أو تلاعب.'),field('referral','الإحالات','طلب اختياري شفاف دون كشف بيانات الآخرين.')]
const calendar=Array.from({length:3},(_,i)=>[{...field(`day-${i}`,`المنشور ${i+1}: التاريخ`,'موعد واقعي للنشر.'),type:'date' as const,min:10},{...field(`channel-${i}`,`المنشور ${i+1}: القناة`,'وسيلة مناسبة للجمهور والموارد.'),type:'text' as const,min:2},field(`content-${i}`,`المنشور ${i+1}: الفكرة والإجراء`,'مشكلة محددة ورسالة ودعوة واحدة.'),field(`metric-${i}`,`المنشور ${i+1}: القياس والدليل`,'ما الإجراء الذي تعده؟ وبأي إذن تجمع بياناته؟')]).flat()
const sequences:Record<number,string[]>={
1:['تحديد مشكلة العميل','صياغة هدف قابل للعد','اختيار قناة وإجراء','قياس النتيجة ومراجعة الفرضية'],
2:['طلب الإذن وتعريف سؤال البحث','جمع ملاحظات عن سلوك فعلي','فصل الوقائع عن التفسيرات','اختبار تفسير مع بيان حدود العينة'],
3:['تحديد حاجة الشريحة','صياغة وعد قابل للتنفيذ','فحص الدليل والسعة والحدود','اختبار الفهم ثم مراجعة التموضع'],
4:['فهم موقف العميل واعتراضه','كتابة وعد ودليل مناسب','توضيح الشروط والإجراء','تدقيق الصدق وفهم القارئ'],
5:['تحديد هدف المحتوى وجمهوره','اختيار دور القناة ومواردها','جدولة منشور وإجراء واضح','مراجعة التأهل والخدمة والتعلم'],
6:['تحديد سؤال الجمهور ونيته','صياغة موجز ومصادر موثوقة','إنتاج محتوى يفي بالوعد','مراجعة الإتاحة والقياس والتحديث'],
7:['فهم نية البحث','تنظيم صفحة مفيدة وواضحة','مراجعة إمكانية الوصول والفهرسة','مراقبة الاستعلامات والتحويل بحدودها'],
8:['الحصول على إذن واضح','تحديد الشريحة وحاجتها','إرسال قيمة مع خيار انسحاب','مراجعة التسليم والاحتفاظ دون إزعاج'],
9:['تحديد هدف وعرض وشريحة','حساب السعة والمساهمة وحد الإنفاق','إعداد القياس ومقارنة محدودة','مراجعة الطلبات والتكلفة قبل التوسع'],
10:['تعريف سؤال ومؤشر وفترة','جمع بيانات بإذن وفحص الجودة','حساب البسط والمقام والتكلفة','تفسير القيود واتخاذ قرار قابل للمراجعة'],
11:['صياغة فرضية قابلة للدحض','تحديد معيار ومدة وحدود مسبقًا','تنفيذ مقارنة مصرح بها','تفسير عدم اليقين والمخاطر قبل التعميم'],
12:['تجميع البحث والهدف والعرض','ربط الرسالة والقنوات والميزانية','تدقيق الحسابات والإذن والتنفيذ','تصدير ملف صادق بالدليل والقيود']}
const cases:Record<number,[string,string,string]>={
1:['يسأل عميل مطعم عن وقت الانتظار قبل أن يطلب.','عرض وقت تجهيز موثوق وحدود الخدمة','شراء وصول أكبر قبل توضيح الخدمة'],
2:['قال مشاركان إن السعر مرتفع، لكنك لم تعرف البديل الذي اختاراه.','سؤال بإذن عن آخر قرار وبديله','تعميم رأي المشاركين على السوق كله'],
3:['طلبات التخصيص أكثر من السعة المتاحة غدًا.','إعلان المتاح وعرض موعد بديل','تأكيد جميع المواعيد لجذب الطلبات'],
4:['يريد الفريق نشر قصة نجاح بلا سجل أو موافقة صاحبها.','استخدام محاكاة موسومة بدل شهادة مختلقة','نسب القصة إلى عميل مجهول كأنها واقعية'],
5:['انتشر منشور وزادت الرسائل خارج منطقة التوصيل.','توضيح النطاق وقياس الاستفسارات المؤهلة','اعتبار كل تفاعل طلبًا مؤكدًا'],
6:['العنوان يعد بدليل عملي لكن المسودة تكرر تعريفات عامة.','إضافة خطوات ومثال يفي بالعنوان','مضاعفة الوعود في العنوان لجذب نقرات'],
7:['صفحة تظهر للباحثين لكن معلومات السعر والاستلام ناقصة.','تحسين إجابة الصفحة عن نية الباحث','حشو الكلمات بدل تقديم المعلومة'],
8:['يريد الفريق إضافة أرقام محادثات خدمة إلى قائمة ترويج.','طلب إذن تسويقي منفصل مع انسحاب واضح','اعتبار كل محادثة موافقة دائمة'],
9:['زاد الإيراد بعد خصم بينما انخفضت المساهمة لكل طلب.','حساب المساهمة بعد الإعلان وفحص السعة','توسيع الإنفاق اعتمادًا على الإيراد وحده'],
10:['اختلف معدل التحويل في مجموعتين مختلفتي الحجم.','جمع البسط والمقام وفحص اختلاف الجمهور','حساب متوسط النسب دون أوزان'],
11:['تبدو نسخة إعلان أفضل بعد يوم واحد وعينة صغيرة.','فحص التصميم وعدم اليقين والحدود المسبقة','إعلان فوز سببي ودلالة إحصائية فورًا'],
12:['طلب العميل عرض أرقام المحاكاة كأنها نتائج حملة منشورة.','توضيح الدور والمحاكاة والقيود في الملف','إخفاء مصدر الأرقام لحماية العرض']}
const studioKinds:Record<number,Activity['kind'][]>={1:['plan','campaign','budget','persona','budget'],2:['persona','persona','campaign','persona','value'],3:['persona','value','value','copy','budget'],4:['copy','copy','copy','campaign','copy'],5:['calendar','calendar','campaign','copy','calendar'],6:['campaign','calendar','copy','copy','calendar'],7:['campaign','campaign','copy','campaign','budget'],8:['persona','copy','copy','calendar','campaign'],9:['budget','campaign','budget','copy','budget'],10:['budget','budget','campaign','budget','budget'],11:['campaign','budget','copy','copy','campaign'],12:['plan','calendar','budget','campaign','plan']}
export function activitiesFor(lesson:Lesson):Activity[]{
 const words=lesson.glossary.slice(0,4).map(([label,definition],i)=>({id:'term-'+i,label,definition})),[situation,safe,unsafe]=cases[lesson.module]
 const kind=studioKinds[lesson.module][Number(lesson.id.slice(-2))-1]
 const fields=kind==='persona'?persona:kind==='value'?value:kind==='copy'?copy:kind==='calendar'?calendar:kind==='plan'?plan:campaign
 const titles:Record<string,string>={persona:'بناء شخصية المشتري',value:'ورشة عرض القيمة',copy:'مختبر القصة والإعلان الأخلاقي',budget:'محاكي الميزانية ومحاسبة المؤشرات',calendar:'تقويم محتوى قابل للتحرير',plan:'الخطة التسويقية في صفحة واحدة',campaign:'تمرين تصميم الحملة'}
 return [
  {id:'guide-v1',kind:'guide',title:'شرح موجّه خطوة بخطوة',prompt:lesson.goal,steps:lesson.reading},
  {id:'match-v1',kind:'match',title:'صل المفهوم بمعناه',prompt:'اختر التعريف المناسب لكل مصطلح من هذا الدرس.',items:words},
  {id:'sequence-v1',kind:'sequence',title:'رتّب مسار القرار',prompt:'ترتيب عمل مقترح لهذه الوحدة؛ طبقه على موضوع: '+lesson.title,items:sequences[lesson.module].map((label,i)=>({id:'step-'+i,label}))},
  {id:'blank-v1',kind:'blank',title:'أكمل المصطلح',prompt:'اكتب المصطلح كما ورد في الدرس: «'+words[0].definition+'»',answer:words[0].label},
  {id:'scenario-v1',kind:'scenario',title:'قرار عميل له عواقب',prompt:'محاكاة وحدة مرتبطة بهدف: '+lesson.goal,nodes:[
   {id:'start',text:situation,choices:[{id:'safe',label:safe,next:'verify'},{id:'unsafe',label:unsafe,next:'risk'}]},
   {id:'risk',text:'هذا الاختيار قد يجعل الوعد أو الاستنتاج غير قابل للدفاع. ماذا تفعل؟',choices:[{id:'repair',label:'أراجع الدليل والحدود وأصحح الرسالة قبل المتابعة',next:'verify'},{id:'ignore',label:'أستمر دون مراجعة لأحافظ على الانطباع',next:'harm'}]},
   {id:'verify',text:'قبل اعتماد القرار، ما الخطوة التالية؟',choices:[{id:'test',label:'اختبار محدود بإذن ومؤشر وحد توقف معلن',next:'learn'},{id:'guarantee',label:'أعد النتيجة مضمونة لجميع العملاء',next:'harm'}]},
   {id:'learn',text:'وصلت إلى قرار قابل للمراجعة.',success:true,explanation:'حميت حق العميل في الفهم والاختيار، وربطت القرار بدليل وحدود واختبار. لا تثبت المحاكاة نتيجة ميدانية.'},
   {id:'harm',text:'النتيجة غير مدعومة.',success:false,explanation:'الضمان أو إخفاء القيود يحول فرضية إلى ادعاء مضلل. أعد السيناريو واختر تحققًا يحترم الإذن وحدود الدليل.'}
  ]},
  {id:'studio-v1',kind,title:titles[kind],prompt:lesson.assignment,fields:kind==='budget'?undefined:fields,target:kind==='persona'?'persona':kind==='value'?'position':kind==='copy'?(/الإعلان|الإقناع|العنوان|الخطاف/.test(lesson.title)?'ad1':'story'):kind==='calendar'?'calendar':kind==='budget'?(lesson.module===10?'kpis':'budget'):kind==='plan'?'market':'goals'}
 ]
}
export function validInteraction(a:Activity,s:Interaction){
 if(a.kind==='sequence'&&(s.order.length!==a.items?.length||new Set(s.order).size!==s.order.length||s.order.some(id=>!a.items?.some(item=>item.id===id))))return false
 if(a.kind==='scenario'&&!branchPosition(a,s))return false
 if(a.kind==='guide'&&s.step>=(a.steps?.length??0))return false
 if(a.kind==='match'&&Object.entries(s.values).some(([k,v])=>!a.items?.some(i=>i.id===k)||(v!==''&&!a.items?.some(i=>i.id===v))))return false
 return true
}
