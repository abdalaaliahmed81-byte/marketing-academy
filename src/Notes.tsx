import {createPortal} from 'react-dom'
import {useEffect,useMemo,useRef,useState} from 'react'
import {db,saveLesson} from './db'
import {Icon} from './ui'

export function NotesButton({id,title}:{id:string;title:string}){
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),editor=useRef<HTMLTextAreaElement>(null)
 const store=useRef(db),saved=useRef(''),revision=useRef(0),active=useRef(true)
 const [text,setText]=useState(''),[open,setOpen]=useState(false),[status,setStatus]=useState(''),[busy,setBusy]=useState(false)
 const [updated,setUpdated]=useState<string>(),[query,setQuery]=useState(''),[selected,setSelected]=useState(-1)
 useEffect(()=>{active.current=true;return()=>{active.current=false}},[])
 useEffect(()=>{if(open&&!dialog.current?.open)dialog.current?.showModal()},[open])
 const matches=useMemo(()=>{if(!query)return [];const content=text.toLocaleLowerCase(),needle=query.toLocaleLowerCase(),result:number[]=[];let i=0;while((i=content.indexOf(needle,i))>=0){result.push(i);i+=needle.length}return result},[text,query])
 async function persist(value:string){
  const target=store.current
  if(value===saved.current)return
  await saveLesson(id,{notes:value},target)
  const row=await target.lessonStates.get(id)
  saved.current=value
  if(active.current)setUpdated(row?.notesUpdatedAt)
 }
 useEffect(()=>{
  if(!open||text===saved.current)return
  const current=++revision.current
  setStatus('تعديلات غير محفوظة')
  const timer=window.setTimeout(()=>{setStatus('جارٍ الحفظ…');persist(text).then(()=>{if(active.current&&current===revision.current)setStatus('حُفظت الملاحظات')},()=>{if(active.current&&current===revision.current)setStatus('تعذّر الحفظ. حاول مجددًا قبل الإغلاق.')})},650)
  return()=>window.clearTimeout(timer)
 },[text,open,id])
 async function show(){
  setBusy(true);store.current=db
  try{const row=await store.current.lessonStates.get(id);saved.current=row?.notes??'';setText(saved.current);setUpdated(row?.notesUpdatedAt);setQuery('');setSelected(-1);setStatus(saved.current?'حُفظت الملاحظات':'ملاحظة جديدة');setOpen(true)}catch{setStatus('تعذّر فتح الملاحظات.')}finally{setBusy(false)}
 }
 async function close(){
  if(busy)return
  setBusy(true)
  try{await persist(text);setOpen(false);dialog.current?.close();trigger.current?.focus()}catch{setStatus('تعذّر الحفظ. لم نغلق المحرر حتى لا تفقد النص.')}finally{setBusy(false)}
 }
 function nextMatch(){const next=(selected+1)%matches.length;setSelected(next);editor.current?.focus();editor.current?.setSelectionRange(matches[next],matches[next]+query.length)}
 return <>
  <button ref={trigger} type="button" className="note-button" disabled={busy} aria-label={'ملاحظات: '+title} title="ملاحظات الدرس" onClick={e=>{e.preventDefault();e.stopPropagation();void show()}}><Icon name="note" size={17}/></button>
  {open&&createPortal(<dialog ref={dialog} className="notes-dialog" aria-labelledby={'note-title-'+id} onClick={e=>e.stopPropagation()} onCancel={e=>{e.preventDefault();void close()}}><div className="stack">
   <div className="eyebrow"><Icon name="note" size={16}/> دفتر التعلّم الخاص بك</div><h2 id={'note-title-'+id}>ملاحظات · {title}</h2>
   <label>ملاحظاتك لهذا الدرس<textarea ref={editor} disabled={busy} autoFocus rows={10} maxLength={50000} placeholder="فكرة تستحق التذكر، سؤال تبحث عنه، أو خطوة ستطبقها…" value={text} onChange={e=>setText(e.target.value)}/></label>
   <div className="note-search"><label>ابحث داخل الملاحظة<input type="search" maxLength={120} value={query} onChange={e=>{setQuery(e.target.value);setSelected(-1)}}/></label><button className="secondary" type="button" disabled={!matches.length} onClick={nextMatch}>النتيجة التالية</button></div>
   {query&&<p className="muted" aria-live="polite">{new Intl.NumberFormat('ar-IQ').format(matches.length)} نتائج مطابقة</p>}
   <div className="note-save-line"><p role="status">{status}</p><small>{new Intl.NumberFormat('ar-IQ').format(text.length)} / ٥٠٬٠٠٠ حرف</small></div>
   <small className="note-timestamp">{updated?<>آخر حفظ: <time dateTime={updated}>{new Intl.DateTimeFormat('ar-IQ',{dateStyle:'medium',timeStyle:'short'}).format(new Date(updated))}</time></>:text?'وقت الملاحظة القديمة غير مسجل؛ يُسجل بعد أول تعديل.':'لم تُكتب ملاحظة بعد.'}</small>
   <div className="actions"><button className="primary" type="button" disabled={busy} onClick={()=>void close()}>احفظ وأغلق</button><small>تُحفظ تلقائيًا أثناء الكتابة، لهذا الدرس وحسابك فقط.</small></div>
  </div></dialog>,document.body)}{!open&&status.startsWith('تعذّر')&&<span role="alert">{status}</span>}
 </>
}
