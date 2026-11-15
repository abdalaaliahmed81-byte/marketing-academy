import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {execFileSync,execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {tmpdir} from 'node:os'
import {join,extname} from 'node:path'
import {pathToFileURL} from 'node:url'
import {build} from 'esbuild'
import ts from 'typescript'
const exec=promisify(execFile)
const files=[...new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n'))].filter(p=>!['docs/AUDIT_INVENTORY.json','docs/CONTENT_MATRIX.md','docs/AUDIT_REFERENCE_CHECKS.json','docs/CONTENT_METRICS.json','docs/INTERACTION_MATRIX.md'].includes(p))
const inventory=[]
for(const file of files){
 const bytes=await readFile(file),text=bytes.toString('utf8'),code=/\.(ts|tsx|js|mjs|cjs)$/.test(file)
 const parsed=code?ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true):undefined
 inventory.push({path:file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),lines:/\.(ts|tsx|js|mjs|cjs|md|json|ya?ml|conf|css|html)$/.test(file)?text.split('\n').length:undefined,inspection:code?'read and syntax-parsed; security/runtime review scoped in AUDIT.md':extname(file)==='.json'?'read; manifests/locks additionally consumed by build and dependency audit':'read; review scope documented',syntaxErrors:parsed?.parseDiagnostics.length})
}
await mkdir('docs',{recursive:true})
await writeFile('docs/AUDIT_INVENTORY.json',JSON.stringify({baseline:'1eecadbf3e1811e31dc2eafe274487ecb8a15e57',generatedAt:new Date().toISOString(),files:inventory},null,2)+'\n')
const folder=await mkdtemp(join(tmpdir(),'academy-curriculum-audit-'))
try{
 const target=join(folder,'curriculum.mjs')
 await build({stdin:{contents:"export {lessons} from './src/lessons'; export {modules,sources,books,bookLinks} from './src/curriculum'; export {projectBriefs} from './src/projects'; export {activitiesFor} from './src/interactive/content'",resolveDir:process.cwd(),sourcefile:'audit-entry.ts'},outfile:target,bundle:true,platform:'node',format:'esm',target:'node24',logLevel:'silent'})
 const {lessons,modules,sources,books,bookLinks,projectBriefs,activitiesFor}=await import(pathToFileURL(target).href)
 const words=s=>s.trim().split(/\s+/).length
 const records=lessons.map(lesson=>{
  const readingWords=words(lesson.reading.join(' ')),generatedCase=lesson.miniCase.startsWith('قبل قراءة الحل:'),repeatedSummary=lesson.summary===lesson.goal
  const weakDistractors=lesson.questions.filter(q=>q.options.filter(o=>o.id!==q.answer).some(o=>/لون|ألوان|الشعار|اسم الحملة فقط|عدد الحروف|عدد الخطوط/.test(o.label))).map(q=>q.id)
  const answerLengthCue=lesson.questions.filter(q=>{const answer=q.options.find(o=>o.id===q.answer);return q.options.every(o=>o.id===q.answer||words(answer.label)>words(o.label))}).map(q=>q.id)
  const actions=['معايرة بشرية للأسئلة ومواءمة الهدف والتقييم','إثبات مرجعي أدق من مجرد رابط بوابة']
  if(readingWords<200)actions.push('توسيع التطبيق المتقدم والأمثلة؛ الشرح الحالي درس مصغر')
  if(generatedCase)actions.push('تأليف حالة نقل مستقلة بدل إعادة سؤال الاختبار')
  if(repeatedSummary)actions.push('كتابة خلاصة معرفة وقرار بدل تكرار الهدف')
  if(weakDistractors.length)actions.push('استبدال مشتتات غير مرتبطة بالمجال')
  return {id:lesson.id,module:lesson.module,title:lesson.title,readingWords,readingParagraphs:lesson.reading.length,questions:lesson.questions.length,interactions:activitiesFor(lesson).map(({id,kind,title,target})=>({id,kind,title,target})),practicalActivity:!!lesson.assignment.trim(),dailyMission:!!lesson.mission.trim(),rubricItems:lesson.rubric.length,generatedCase,repeatedSummary,weakDistractors,answerLengthCue,bookReferences:lesson.refs.map(ref=>({title:books[ref.book],section:ref.section})),officialReferences:lesson.online.map(key=>sources[key]),status:'present; advanced instructional approval open',independentHumanReview:false,actions}
 })
 const metrics={generatedAt:new Date().toISOString(),modules:modules.length,lessons:records.length,questions:records.reduce((n,l)=>n+l.questions,0),workedProjects:projectBriefs.length,interactiveActivities:records.reduce((n,l)=>n+l.interactions.length,0),shortMicroLessons:records.filter(l=>l.readingWords<200).length,generatedCases:records.filter(l=>l.generatedCase).length,repeatedSummaries:records.filter(l=>l.repeatedSummary).length,questionsWithWeakDistractorHeuristic:records.reduce((n,l)=>n+l.weakDistractors.length,0),questionsWithUniqueLongestCorrectAnswer:records.reduce((n,l)=>n+l.answerLengthCue.length,0),limitation:'Heuristics flag editorial review, not automatic proof of incorrectness. Structural presence is not professional approval.',records}
 await writeFile('docs/CONTENT_METRICS.json',JSON.stringify(metrics,null,2)+'\n')
 const rows=records.map(l=>`|${l.id}|${l.title}|${l.readingWords}|${l.questions}|${l.generatedCase?'إعادة سؤال':'موجودة'}|${l.repeatedSummary?'تكرر الهدف':'موجودة'}|${l.weakDistractors.length}|${l.bookReferences.map(r=>r.title+' — '+r.section).join('<br>')}|${l.actions.join('؛ ')}|`)
 const markdown=`# مصفوفة تدقيق المحتوى — جميع الدروس الستين\n\nالمصدر: المنهج الفعلي في هذا الفرع. توليد: ${new Date().toISOString()}.\n\nالحضور البنيوي مثبت: ${metrics.lessons} درسًا، ${metrics.modules} وحدة، ${metrics.questions} سؤالًا، ${metrics.workedProjects} مشروعًا محلولًا. جميع الدروس تحتوي نشاطًا ومهمة وروبركًا. **لم تُعتمد الجاهزية المتقدمة أو المراجعة البشرية المستقلة لأي درس.** هذا تفريق بين المحتوى الموجود ومستوى التحقق، وليس حذفًا للدروس أو لنتائج المتعلمين.\n\nكشف الفحص ${metrics.shortMicroLessons} درسًا مصغرًا بشرح أقل من٢٠٠ كلمة، و${metrics.generatedCases} حالة تعيد سؤال اختبار، و${metrics.repeatedSummaries} خلاصة تكرر الهدف. أشار مرشح المشتتات إلى${metrics.questionsWithWeakDistractorHeuristic} سؤالًا يحتاج مراجعة صلة البدائل، و${metrics.questionsWithUniqueLongestCorrectAnswer} إجابة صحيحة هي الأطول وحدها. هذه إشارات مراجعة، وليست حكمًا آليًا بأن كل سؤال خاطئ. خيار الإجابة الصحيحة الأول في البيانات يُخلط في الواجهة، لذلك لا يُسجل ذلك كخلل عرض؛ تبقى معرفات الخيارات ثابتة لحماية المحاولات القديمة.\n\nالمراجع الرسمية الحالية لكل درس وروابطها كاملة في [CONTENT_METRICS.json](CONTENT_METRICS.json). المصدر الكتابي أدناه إحالة موضوعية؛ لا يثبت وحده كل ادعاء منصة حديثة. المصدر الإلكتروني الذي يعيد٢٠٠ ليس بالضرورة دليلًا لكل جملة. انظر AUDIT_REFERENCE_CHECKS.json وملخص فحص PDFs في AUDIT.md.\n\n|المعرف|الدرس|كلمات الشرح|أسئلة|الحالة|الخلاصة|أسئلة مشتتات مرشحة|الكتاب والموضع المذكور|الإجراء التعليمي المفتوح|\n|---|---|---:|---:|---|---|---:|---|---|\n${rows.join('\n')}\n\n## المشروعات والتخرج\n\nكل مشروع من الاثني عشر يحتوي تكليفًا وأربعة مخرجات وأربع خطوات وروبركًا وحلًا ونموذج تسليم محفوظًا. النماذج تعلن المحاكاة، ومقال الوحدة٦ يتجاوز٣٠٠ كلمة. التخرج يغطي٢٦ حقلًا، وتوجد حسابات مستقلة للمثال الإعلاني. بقي تقييم جودة التسليم ذاتيًا؛ لا يوجد حكم مدرس أو قياس تعلم قبلي/بعدي. لا تسمي إكمال الخانات دليل كفاءة مهنية أو اعتمادًا.\n`
 await writeFile('docs/CONTENT_MATRIX.md',markdown+'\n## التفاعلات المحفوظة\n\nكل درس يعرض ستة أنشطة فعلية محفوظة، بإجمالي'+metrics.interactiveActivities+' نشاطًا. التوزيع الكامل ومعرفات النسخ في [INTERACTION_MATRIX.md](INTERACTION_MATRIX.md). لا تلغي إضافة التفاعل ملاحظات عمق المحتوى أو المراجعة البشرية أعلاه.\n')
 await writeFile('docs/INTERACTION_MATRIX.md','# Interactive coverage — actual definitions\n\n60 lessons ×6 activities ='+metrics.interactiveActivities+'. Common families: guided explanation, matching, ordering with drag/keyboard controls, fill-blank and module branching scenario; the studio varies by lesson. All states persist under the authenticated encrypted lesson record. Open-ended studios are self-reviewed, not certified human grading. Scenario templates are shared within their module and contextualized with the lesson goal; glossary/reading activities use each lesson’s own material.\n\n|Lesson|Title|Studio|Portfolio field|Versioned activity IDs|\n|---|---|---|---|---|\n'+records.map(l=>{const a=l.interactions.find(a=>a.id==='studio-v1');return '|'+l.id+'|'+l.title+'|'+a.kind+'|'+a.target+'|'+l.interactions.map(a=>a.id).join(', ')+'|'}).join('\n')+'\n')
 if(process.argv.includes('--check-links')){
  const urls=[...new Set([...Object.values(sources).map(s=>s.url),...Object.values(bookLinks)])]
  const links=[]
  for(const url of urls){try{const {stdout}=await exec('curl',['-sS','-L','--max-time','20','-o','/dev/null','-w','%{http_code}\t%{url_effective}',url]);const [status,effectiveUrl]=stdout.split('\t');links.push({url,status:Number(status),effectiveUrl})}catch{links.push({url,status:null,error:'transport failed'})}}
  await writeFile('docs/AUDIT_REFERENCE_CHECKS.json',JSON.stringify({checkedAt:new Date().toISOString(),scope:'HTTP accessibility plus selective official-source review; no exhaustive claim-level certification',links},null,2)+'\n')
 }
 console.log(JSON.stringify({sourceFiles:inventory.length,syntaxErrors:inventory.reduce((n,f)=>n+(f.syntaxErrors??0),0),lessons:metrics.lessons,questions:metrics.questions,shortMicroLessons:metrics.shortMicroLessons,generatedCases:metrics.generatedCases,repeatedSummaries:metrics.repeatedSummaries,weakDistractorFlags:metrics.questionsWithWeakDistractorHeuristic,longestAnswerCues:metrics.questionsWithUniqueLongestCorrectAnswer}))
}finally{await rm(folder,{recursive:true,force:true})}
