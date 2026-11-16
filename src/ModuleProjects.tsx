import {useEffect,useRef,useState} from 'react'
import {useLiveQuery} from './storage/query'
import {db,saveModuleProject,appendModuleToPortfolio,type ModuleProject} from './db'
import {moduleGuide,moduleTargets,projectMarkdown} from './project-learning/model'
import {businessCases,caseExamples} from './project-learning/cases'
import {useSavedDraft} from './project-learning/useSavedDraft'
import {artifactFields} from './domain'
import {modules} from './curriculum'
import {ar,Checklist,download,Heading,type Notice} from './ui'
export function ModuleProjects({notice}:{notice:Notice}){
 const [selected,setSelected]=useState(0),[caseIndex,setCaseIndex]=useState(0),[switching,setSwitching]=useState(false)
 const records=useLiveQuery(()=>db.moduleProjects.toArray()),flush=useRef<()=>Promise<void>>(async()=>{})
 const brief=moduleGuide(selected),id='module-'+(selected+1),alternate=caseExamples[caseIndex],target=moduleTargets[selected]
 return <><Heading title="مشروعات الوحدات" description="١٢ مشروعًا محلولًا وقوالب قابلة للتحرير · محاكاة كاملة دون إنفاق أو اشتراك خارجي."/>
 <div className="stack"><nav className="tabs" aria-label="اختيار مشروع الوحدة">{modules.map((m,i)=><button key={m} disabled={switching} aria-pressed={i===selected} className={i===selected?'selected':''} onClick={async()=>{setSwitching(true);try{await flush.current();setSelected(i)}catch{notice('تعذّر حفظ المسودة؛ بقيت في المشروع لحماية تعديلك.')}finally{setSwitching(false)}}}>{ar.format(i+1)} · {m}</button>)}</nav>
 <section className="card stack"><h2>{brief.title}</h2><p>{brief.brief}</p><h3>الهدف والمتطلبات السابقة</h3><p>{brief.objective}</p><p>{brief.prerequisites}</p><h3>المواد والمفاهيم</h3><p>{brief.materials}</p><p>{brief.concepts}</p><p className="callout">{brief.offlineProof}</p>
 <h3>المخرجات المطلوبة</h3><ul>{brief.deliverables.map(v=><li key={v}>{v}</li>)}</ul><h3>خطوات التنفيذ · ٤٥–٩٠ دقيقة</h3><ol>{brief.steps.map(v=><li key={v}>{v}</li>)}</ol>
 <button className="secondary" onClick={()=>download(id+'-worked-project.md',projectMarkdown(selected),'text/markdown;charset=utf-8')}>نزّل المشروع المحلول Markdown</button><details className="worked-example"><summary>النموذج المحلول وشرح القرارات</summary><div className="reading stack">{brief.worked.map((p,i)=><p key={i}>{p}</p>)}</div></details>
 <h3>أخطاء شائعة وتحسين</h3><ul>{brief.mistakes.map(s=><li key={s}>{s}</li>)}</ul><p>{brief.advice}</p>
 <details><summary>أمثلة قابلة لإعادة الاستخدام: مطعم وملابس وتجارة إلكترونية</summary><label>حالة تطبيق إضافية<select value={caseIndex} onChange={e=>setCaseIndex(Number(e.target.value))}>{businessCases.map((c,i)=><option key={c.id} value={i}>{c.name}</option>)}</select></label><p>كل ما يلي محاكاة تكميلية للمقارنة؛ الحل الكامل أعلاه هو مرجع تسليم الوحدة.</p><p>{businessCases[caseIndex].audience} · {businessCases[caseIndex].limit}</p><p>{alternate.fields[target]}</p></details></section>
 {records?<ProjectForm key={id} index={selected} row={records.find(r=>r.id===id)??{id,response:'',checked:[],completed:false}} notice={notice} onFlush={fn=>{flush.current=fn}}/>:<p role="status">جارٍ تحميل مشروعاتك…</p>}</div></>
}
function ProjectForm({row,index,notice,onFlush}:{row:ModuleProject;index:number;notice:Notice;onFlush:(fn:()=>Promise<void>)=>void}){
 const guide=moduleGuide(index),target=useRef(db),[response,setResponse]=useState(row.response),[checked,setChecked]=useState(row.checked),[busy,setBusy]=useState(false),[preview,setPreview]=useState<string|null>(null)
 const earned=useRef(row.completed)
 const autosave=useSavedDraft({response,checked},async draft=>{await saveModuleProject({id:row.id,...draft,completed:earned.current},target.current)})
 useEffect(()=>{onFlush(autosave.flush)},[onFlush,autosave.flush])
 async function save(complete:boolean){setBusy(true);try{await autosave.flush();await saveModuleProject({id:row.id,response,checked,completed:complete||earned.current},target.current);earned.current=complete||earned.current;notice(complete?'حُفظ المشروع مكتملًا بالمراجعة الذاتية.':'حُفظت مسودة المشروع.')}catch(error){notice(error instanceof Error?error.message:'تعذّر الحفظ.')}finally{setBusy(false)}}
 function template(){if(response.length+guide.template.length+2>50000){notice('القالب يتجاوز سعة التسليم؛ صدّر نسخة أولًا.');return}setResponse(response?response+'\n\n'+guide.template:guide.template)}
 return <section className="card stack"><h2>تسليمك ومراجعتك الذاتية</h2><p>لكل بند: ٠ غائب، ١ جزئي أو بلا دليل، ٢ كامل بدليل وحدود. أشر البند عند بلوغ ٢؛ المجموع التدريبي من ٨ وليس درجة مدرس. التأشير مراجعة ذاتية وليس تصحيح مدرس. القالب يضاف إلى النص ولا يستبدل تسليمًا موجودًا.</p><button className="secondary" onClick={template}>أضف قالب الوحدة إلى تسليمي</button>
 <label>تسليم مشروع الوحدة<textarea rows={12} maxLength={50000} value={response} onChange={e=>setResponse(e.target.value)}/></label><Checklist rubric={guide.rubric} checked={checked} onChange={setChecked}/><small aria-live="polite">{autosave.status}</small>
 <div className="actions"><button className="secondary" disabled={busy} onClick={()=>void save(false)}>احفظ المسودة</button><button className="primary" disabled={busy||!response.trim()||checked.length!==4} onClick={()=>void save(true)}>احفظ المشروع مكتملًا</button><button className="secondary" disabled={busy} onClick={async()=>{try{await autosave.flush();download(row.id+'-submission.md',projectMarkdown(index,response),'text/markdown;charset=utf-8')}catch{notice('تعذّر حفظ التسليم قبل تصديره.')}}}>صدّر تسليمي ودليل الوحدة</button></div>
 <p>{row.completed?'آخر حالة محفوظة: مكتمل':'آخر حالة محفوظة: مسودة'}</p>
 <button className="secondary" disabled={busy||!response.trim()} onClick={async()=>{try{await autosave.flush();const project=await target.current.projects.get('portfolio');setPreview(project?.fields[moduleTargets[index]]??'')}catch{notice('تعذّر تجهيز النقل.')}}}>راجع إضافة تسليمي إلى ملف الأعمال</button>
 {preview!==null&&<section className="callout stack"><h3>إضافة إلى {artifactFields.find(([key])=>key===moduleTargets[index])?.[1]}</h3><p>سيضاف التسليم المحفوظ بعد النص الحالي، وتبقى الحقول الأخرى كما هي. التكرار المطابق لا يضاف مرتين.</p><details><summary>النص السابق</summary><pre>{preview||'فارغ'}</pre></details><pre>{response}</pre><button className="primary" disabled={busy} onClick={async()=>{setBusy(true);try{await autosave.flush();await appendModuleToPortfolio(row.id,moduleTargets[index],target.current);setPreview(null);notice('أضيف تسليم الوحدة إلى ملف أعمالك.')}catch(error){notice(error instanceof Error?error.message:'تعذّر النقل.')}finally{setBusy(false)}}}>تأكيد إضافة التسليم المحفوظ</button><button className="secondary" onClick={()=>setPreview(null)}>إلغاء</button></section>}
 </section>
}
