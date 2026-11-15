import {useEffect,useRef,useState} from 'react'
import {liveQuery} from 'dexie'
import {subscribeStore} from './events'
/** Supports preserved IndexedDB and the acknowledged SQLite memory read model. */
export function useLiveQuery<T>(query:()=>Promise<T>|T,deps:unknown[]=[]):T|undefined{
 const callback=useRef(query);callback.current=query
 const [value,setValue]=useState<T>()
 useEffect(()=>{
  let active=true,sequence=0
  const refresh=()=>{const current=++sequence;Promise.resolve().then(()=>callback.current()).then(result=>{if(active&&current===sequence)setValue(result)},()=>{})}
  const subscription=liveQuery(()=>callback.current()).subscribe({next:result=>{if(active)setValue(result)},error:()=>{}})
  const unsubscribe=subscribeStore(refresh)
  refresh()
  return ()=>{active=false;subscription.unsubscribe();unsubscribe()}
 },deps)
 return value
}
