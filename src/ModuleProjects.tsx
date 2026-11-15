import {useState} from 'react'
import {useLiveQuery} from 'dexie-react-hooks'
import {db,saveModuleProject,type ModuleProject} from './db'
import {projectBriefs} from './projects'
import {modules} from './curriculum'
import {ar,Checklist,download,Heading,type Notice} from './ui'
export function ModuleProjects({notice}:{notice:Notice}){
 const [selected,setSelected]=useState(0)
 const records=useLiveQuery(()=>db.moduleProjects.toArray())
 const brief=projectBriefs[selected],id='module-'+(selected+1)
 return <><Heading title="مشروعات الوحدات" description="١٢ مشروعًا مع خطوات ونماذج محلولة · جميع بيانات النماذج محاكاة تدريبية."/>
 <div className="stack"><nav className="tabs" aria-label="اختيار مشروع الوحدة">{modules.map((m,i)=><button key={m} aria-pressed={i===selected} className={i===selected?'selected':''} onClick={()=>setSelected(i)}>{ar.format(i+1)} · {m}</button>)}</nav>
 <section className="card stack"><h2>{brief.title}</h2><p>{brief.brief}</p><h3>المخرجات المطلوبة</h3><ul>{brief.deliverables.map(v=><li key={v}>{v}</li>)}</ul><h3>خطوات التنفيذ · ٤٥–٩٠ دقيقة</h3><ol>{brief.steps.map(v=><li key={v}>{v}</li>)}</ol>
 <button className="secondary" onClick={()=>download('module-'+(selected+1)+'-worked-project.md',['# '+brief.title,'محاكاة تعليمية أصلية، وليست نتائج عميل حقيقي.',brief.brief,'## المخرجات',...brief.deliverables,'## خطوات التنفيذ',...brief.steps,'## الحل الكامل',...brief.worked,'## معيار المراجعة الذاتية',...brief.rubric].join('\n\n'),'text/markdown;charset=utf-8')}>نزّل المشروع المحلول Markdown</button><details className="worked-example"><summary>النموذج المحلول وشرح القرارات</summary><div className="reading stack">{brief.worked.map((p,i)=><p key={i}>{p}</p>)}</div></details></section>
 {records?<ProjectForm key={id} row={records.find(r=>r.id===id)??{id,response:'',checked:[],completed:false}} rubric={brief.rubric} notice={notice}/>:<p role="status">جارٍ تحميل مشروعاتك…</p>}</div></>
}
function ProjectForm({row,rubric,notice}:{row:ModuleProject;rubric:string[];notice:Notice}){
 const [response,setResponse]=useState(row.response),[checked,setChecked]=useState(row.checked),[busy,setBusy]=useState(false)
 async function save(complete:boolean){setBusy(true);try{await saveModuleProject({id:row.id,response,checked,completed:complete});notice(complete?'حُفظ المشروع مكتملًا بالمراجعة الذاتية.':'حُفظت مسودة المشروع.')}catch{notice('تعذّر الحفظ؛ اكتب التسليم وأكمل بنود المراجعة.')}finally{setBusy(false)}}
 return <section className="card stack"><h2>تسليمك ومراجعتك الذاتية</h2><p>قارن قرارك بالنموذج واذكر اختلاف سياقك. التأشير مراجعة ذاتية ولا يعني تصحيحًا بشريًا مستقلًا.</p><label>تسليم مشروع الوحدة<textarea rows={12} maxLength={50000} value={response} onChange={e=>setResponse(e.target.value)}/></label><Checklist rubric={rubric} checked={checked} onChange={setChecked}/><div className="actions"><button className="secondary" disabled={busy} onClick={()=>void save(false)}>احفظ المسودة</button><button className="primary" disabled={busy||!response.trim()||checked.length!==4} onClick={()=>void save(true)}>احفظ المشروع مكتملًا</button></div><p>{row.completed?'آخر حالة محفوظة: مكتمل':'آخر حالة محفوظة: مسودة'}</p></section>
}
