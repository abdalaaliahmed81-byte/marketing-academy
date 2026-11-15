import {useMemo,useState} from 'react'
import {Link} from 'react-router-dom'
import {books,bookLinks,modules,sources} from './curriculum'
import {lessons} from './lessons'
import {db,isUnlocked} from './db'
import {useLiveQuery} from './storage/query'
import {NotesButton} from './Notes'
import {ar,Heading,Icon} from './ui'

export const searchText=(value:string)=>value.normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').toLocaleLowerCase().trim()
export function Library(){
 const states=useLiveQuery(()=>db.lessonStates.toArray())
 const [query,setQuery]=useState(''),[kind,setKind]=useState('all'),[module,setModule]=useState('')
 const needle=searchText(query)
 const items=useMemo(()=>lessons.filter(l=>{
  const state=states?.find(s=>s.id===l.id)
  return (!module||l.module===Number(module))&&(kind!=='notes'||!!state?.notes.trim())&&searchText([l.title,l.goal,modules[l.module-1],...(kind==='notes'?[state?.notes??'']:[])].join(' ')).includes(needle)
 }),[states,module,kind,needle])
 const external=[...Object.entries(sources).map(([id,s])=>({id,title:s.title,url:s.url,type:'مرجع رسمي أو تدريبي'})),...Object.entries(books).map(([id,title])=>({id,title,url:bookLinks[id as keyof typeof books],type:'صفحة الكتاب · مصدر مفاهيمي'}))].filter(s=>searchText(s.title).includes(needle))
 const showLessons=kind!=='sources',showSources=(kind==='all'||kind==='sources')&&!module
 const count=(showLessons?items.length:0)+(showSources?external.length:0)
 return <div className="stack library"><Heading title="مكتبة الموارد" description="فكرتك التالية أقرب مما تتخيل. ابحث في الدروس والمراجع ودفترك الخاص."/>
  <section className="card library-tools"><label>ابحث في المكتبة<input type="search" maxLength={200} value={query} onChange={e=>setQuery(e.target.value)} placeholder="مثال: الجمهور، التحليلات، أو فكرة في ملاحظاتك"/></label>
   <label>نوع المورد<select aria-label="نوع المورد" value={kind} onChange={e=>{setKind(e.target.value);if(e.target.value==='sources')setModule('')}}><option value="all">كل الموارد</option><option value="lessons">الدروس</option><option value="notes">ملاحظاتي</option><option value="sources">المراجع والكتب</option></select></label>
   <label>الوحدة<select aria-label="الوحدة" value={module} onChange={e=>setModule(e.target.value)} disabled={kind==='sources'}><option value="">كل الوحدات</option>{modules.map((m,i)=><option value={i+1} key={m}>{m}</option>)}</select></label>
  </section>
  <p className="muted" role="status">{states?ar.format(count)+' مورد يطابق بحثك':'جارٍ تحميل مكتبتك…'}</p>
  {states&&count===0&&<section className="card empty-state"><Icon name="search" size={30}/><h2>لم نعثر على نتيجة</h2><p>جرّب كلمة أقصر أو وحدة أخرى. البحث في «ملاحظاتي» يشمل نص الملاحظة.</p><button className="secondary" onClick={()=>{setQuery('');setKind('all');setModule('')}}>مسح عوامل البحث</button></section>}
  <div className="resource-grid">{states&&showLessons&&items.map(l=>{const state=states.find(s=>s.id===l.id),open=isUnlocked(l.id,states);return <article key={l.id} className="card resource-card stack">
   <div className="section-title"><span className="eyebrow">الوحدة {ar.format(l.module)}</span><Icon name={state?.completed?'check':open?'book':'lock'} size={18}/></div>
   <div className="lesson-name"><h2>{open?<Link to={'/lesson/'+l.id+'/read'}>{l.title}</Link>:l.title}</h2><NotesButton id={l.id} title={l.title}/></div>
   <p className="muted">{l.goal}</p>
   {kind==='notes'&&<p className="note-preview">{state?.notes.slice(0,180)}{(state?.notes.length??0)>180?'…':''}</p>}
   {state?.notesUpdatedAt&&<small>آخر تعديل للملاحظة: <time dateTime={state.notesUpdatedAt}>{new Intl.DateTimeFormat('ar-IQ',{dateStyle:'medium'}).format(new Date(state.notesUpdatedAt))}</time></small>}
   <span className="pill">{state?.completed?'درست هذا المورد':open?'جاهز للتعلّم':'أكمل الدروس السابقة لفتحه'}</span>
  </article>})}
  {showSources&&external.map(s=><article className="card resource-card stack" key={s.id}><span className="eyebrow">{s.type}</span><h2>{s.title}</h2><p className="muted">مرجع مساند للمنهج. الرابط الخارجي يحتاج الإنترنت؛ لا يتضمن نسخة من الكتاب.</p><a className="text-link" href={s.url} target="_blank" rel="noreferrer">افتح المصدر <Icon name="arrow" size={16}/><span className="sr-only"> · {s.title} · نافذة جديدة</span></a></article>)}
  </div>
 </div>
}
