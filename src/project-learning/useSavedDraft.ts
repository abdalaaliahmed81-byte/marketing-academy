import {useCallback,useEffect,useRef,useState} from 'react'
/** Serialized, acknowledged draft writes; caller must capture its authenticated repository. */
export function useSavedDraft<T>(value:T,commit:(draft:T)=>Promise<unknown>){
 const signature=JSON.stringify(value),latest=useRef({value,commit,signature}),stored=useRef(signature),queue=useRef<Promise<unknown>>(Promise.resolve()),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),mounted=useRef(true),pending=useRef(0)
 latest.current={value,commit,signature}
 const [status,setStatus]=useState('الحفظ التلقائي جاهز')
 const enqueue=useCallback((snapshot:{value:T;commit:(draft:T)=>Promise<unknown>;signature:string})=>{
  pending.current++
  const task=queue.current.catch(()=>{}).then(async()=>{
   if(snapshot.signature===stored.current)return
   if(mounted.current)setStatus('جارٍ حفظ المشروع…')
   try{await snapshot.commit(snapshot.value);stored.current=snapshot.signature;if(mounted.current&&latest.current.signature===snapshot.signature)setStatus('حُفظ المشروع تلقائيًا')}
   catch(error){if(mounted.current)setStatus('تعذّر الحفظ؛ بقيت آخر نسخة محفوظة. أعد المحاولة قبل الإغلاق.');throw error}
  }).finally(()=>{pending.current--});queue.current=task;return task
 },[])
 const flush=useCallback(async()=>{clearTimeout(timer.current);await enqueue(latest.current)},[enqueue])
 useEffect(()=>{if(signature===stored.current&&pending.current===0)return;setStatus('تعديلات غير محفوظة');timer.current=setTimeout(()=>void enqueue(latest.current).catch(()=>{}),650);return()=>clearTimeout(timer.current)},[signature,enqueue])
 useEffect(()=>{mounted.current=true;const warn=(event:BeforeUnloadEvent)=>{if(latest.current.signature!==stored.current){event.preventDefault();event.returnValue=''}};window.addEventListener('beforeunload',warn);return()=>{mounted.current=false;clearTimeout(timer.current);window.removeEventListener('beforeunload',warn);if(latest.current.signature!==stored.current)void enqueue(latest.current).catch(()=>{})}},[enqueue])
 return {status,flush}
}
