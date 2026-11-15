import {useEffect,useRef,useState} from 'react'
import {db,saveLesson} from './db'
import {Icon} from './ui'

export function NotesButton({id,title}:{id:string;title:string}){
  const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null)
  const [text,setText]=useState(''),[open,setOpen]=useState(false),[status,setStatus]=useState(''),[busy,setBusy]=useState(false)
  const revision=useRef(0)
  async function persist(value:string){await saveLesson(id,{notes:value})}
  useEffect(()=>{
    if(!open)return
    const current=++revision.current
    const timer=window.setTimeout(()=>{setStatus('جارٍ الحفظ…');persist(text).then(()=>{if(current===revision.current)setStatus('حُفظت الملاحظات')},()=>{if(current===revision.current)setStatus('تعذّر الحفظ. حاول مجددًا قبل الإغلاق.')})},650)
    return ()=>window.clearTimeout(timer)
  },[text,open,id])
  async function show(){
    setBusy(true)
    try{const row=await db.lessonStates.get(id);setText(row?.notes??'');setStatus('');setOpen(true);dialog.current?.showModal()}catch{setStatus('تعذّر فتح الملاحظات.')}finally{setBusy(false)}
  }
  async function close(){
    setBusy(true)
    try{await persist(text);setOpen(false);dialog.current?.close();trigger.current?.focus()}catch{setStatus('تعذّر الحفظ. لم نغلق المحرر حتى لا تفقد النص.')}finally{setBusy(false)}
  }
  return <>
    <button ref={trigger} type="button" className="note-button" disabled={busy} aria-label={'ملاحظات: '+title} title="ملاحظات الدرس" onClick={()=>void show()}><Icon name="note" size={18}/></button>
    <dialog ref={dialog} className="notes-dialog" aria-labelledby={'note-title-'+id} onCancel={e=>{e.preventDefault();void close()}}><div className="stack">
      <h2 id={'note-title-'+id}>ملاحظات · {title}</h2><label>ملاحظاتك لهذا الدرس<textarea autoFocus rows={10} maxLength={50000} value={text} onChange={e=>setText(e.target.value)}/></label><p role="status">{status}</p><div className="actions"><button className="primary" disabled={busy} onClick={()=>void close()}>احفظ وأغلق</button><small>تُحفظ تلقائيًا أثناء الكتابة.</small></div>
    </div></dialog>{!open&&status.startsWith('تعذّر')&&<span role="alert">{status}</span>}
  </>
}
