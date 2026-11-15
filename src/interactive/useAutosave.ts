import {useEffect,useRef,useState} from 'react'
/** Caller captures its authenticated repository; a later account is never used implicitly. */
export function useAutosave<T>(draft:T,save:(value:T)=>Promise<unknown>){
 const signature=JSON.stringify(draft),stored=useRef(signature),callback=useRef(save),revision=useRef(0)
 const [status,setStatus]=useState('تُحفظ المسودة تلقائيًا')
 callback.current=save
 useEffect(()=>{
  if(signature===stored.current)return
  const version=++revision.current;setStatus('تعديلات غير محفوظة')
  const value=JSON.parse(signature) as T,commit=callback.current
  const timer=window.setTimeout(()=>{setStatus('جارٍ حفظ المسودة…');void commit(value).then(()=>{stored.current=signature;if(version===revision.current)setStatus('حُفظت المسودة')},()=>{if(version===revision.current)setStatus('تعذّر الحفظ؛ أبقِ النص وأعد الحفظ يدويًا.')})},650)
  return()=>window.clearTimeout(timer)
 },[signature])
 return status
}
