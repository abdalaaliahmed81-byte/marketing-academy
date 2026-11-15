import {lessons} from '../lessons'
import type {Lesson} from '../curriculum'
import type {Settings,LessonState,Attempt,Mission,Capstone} from '../domain'
import {collections,emptyState,normalizeState,type Collection,type LearnerState,type ModuleProject} from '../data-schema'
import {parseSnapshot,TransportError,type Snapshot,type Transport} from './protocol'
import {notifyStore,sessionInvalid} from './events'

type ProjectRow=Capstone&{id:'portfolio'}
type Rows={settings:Settings;lessonStates:LessonState;attempts:Attempt;missions:Mission;projects:ProjectRow;activity:{date:string};moduleProjects:ModuleProject}
export interface RecordTable<T>{
 get(key:string):Promise<T|undefined>;toArray():Promise<T[]>;count():Promise<number>
 put(value:T):Promise<string>;add(value:T):Promise<string>;bulkPut(values:readonly T[]):Promise<string>
 update(key:string,patch:Partial<T>):Promise<number>;delete(key:string):Promise<void>;clear():Promise<void>
 where(index:string):{equals(value:string|number):{toArray():Promise<T[]>;first():Promise<T|undefined>}}
 orderBy(index:string):{toArray():Promise<T[]>;reverse():{toArray():Promise<T[]>}}
}
export type StoreView={ [K in Collection]:RecordTable<Rows[K]> }&{lessons:RecordTable<Lesson>}
const copy=<T>(value:T):T=>structuredClone(value)
const keyOf=(row:unknown)=>{const value=row as {id?:string;date?:string};return value.id??value.date??''}
function memoryTable<T>(read:()=>T[],mutate:<R>(action:(rows:T[])=>R)=>Promise<R>):RecordTable<T>{
 const put=(value:T,unique=false)=>mutate(rows=>{
  const key=keyOf(value);if(!key)throw new Error('معرّف سجل غير صالح.')
  const index=rows.findIndex(r=>keyOf(r)===key)
  if(unique&&index>=0)throw new Error('السجل موجود بالفعل.')
  if(index<0)rows.push(copy(value));else rows[index]=copy(value)
  return key
 })
 const filtered=(index:string,value:unknown)=>read().filter(row=>(row as Record<string,unknown>)[index]===value)
 const sorted=(index:string,reverse=false)=>{
  const result=copy(read()).sort((a,b)=>{const left=(a as Record<string,unknown>)[index],right=(b as Record<string,unknown>)[index];return left===right?keyOf(a).localeCompare(keyOf(b)):String(left).localeCompare(String(right))})
  return reverse?result.reverse():result
 }
 return {
  async get(key){return copy(read().find(row=>keyOf(row)===key))},async toArray(){return copy(read())},async count(){return read().length},
  put:value=>put(value),add:value=>put(value,true),
  bulkPut:values=>mutate(rows=>{for(const value of values){const key=keyOf(value),i=rows.findIndex(r=>keyOf(r)===key);if(i<0)rows.push(copy(value));else rows[i]=copy(value)}return values.length?keyOf(values[values.length-1]):''}),
  update:(key,patch)=>mutate(rows=>{const i=rows.findIndex(row=>keyOf(row)===key);if(i<0)return 0;rows[i]={...rows[i],...copy(patch)};return 1}),
  delete:key=>mutate(rows=>{const i=rows.findIndex(row=>keyOf(row)===key);if(i>=0)rows.splice(i,1)}),clear:()=>mutate(rows=>{rows.splice(0)}),
  where:index=>({equals:value=>({toArray:async()=>copy(filtered(index,value)),first:async()=>copy(filtered(index,value)[0])})}),
  orderBy:index=>({toArray:async()=>sorted(index),reverse:()=>({toArray:async()=>sorted(index,true)})})
 }
}
/** SQLite owns durable state. This read model never writes learner data to browser storage. */
export class SQLiteRepository implements StoreView{
 readonly name:string
 readonly ownerId:string
 private state:LearnerState
 private revision:number
 private closed=false
 private queue:Promise<unknown>=Promise.resolve()
 settings!:RecordTable<Settings>;lessonStates!:RecordTable<LessonState>;attempts!:RecordTable<Attempt>;missions!:RecordTable<Mission>;projects!:RecordTable<ProjectRow>;activity!:RecordTable<{date:string}>;moduleProjects!:RecordTable<ModuleProject>;lessons!:RecordTable<Lesson>
 constructor(snapshot:Snapshot,private transport:Transport){
  this.ownerId=snapshot.ownerId;this.name='sqlite-user-'+snapshot.ownerId;this.state=normalizeState(snapshot.state);this.revision=snapshot.revision
  Object.assign(this,this.view())
 }
 private ensureOpen(){if(this.closed)throw new TransportError('SESSION_EXPIRED','سجّل الدخول مجددًا.')}
 private view(scoped?:LearnerState,write=false):StoreView{
  const tables={} as StoreView
  for(const collection of collections){
   const table=memoryTable<Rows[typeof collection]>(()=>{this.ensureOpen();return (scoped??this.state)[collection] as Rows[typeof collection][]},async action=>{
    this.ensureOpen()
    if(scoped){if(!write)throw new Error('المعاملة للقراءة فقط.');return action(scoped[collection] as Rows[typeof collection][])}
    return this.transact('rw',async tx=>{
     // This branch is only used by direct table calls; the scoped view is bound explicitly.
     return (tx as StoreViewWithMutate).mutate(collection,action)
    })
   })
   Object.assign(tables,{[collection]:table})
  }
  tables.lessons=memoryTable(()=>copy(lessons),async()=>{throw new Error('المنهج ثابت للقراءة.')})
  if(scoped)Object.assign(tables,{mutate:<R>(collection:Collection,action:(rows:Rows[Collection][])=>R)=>{if(!write)throw new Error('المعاملة للقراءة فقط.');return action(scoped[collection] as Rows[Collection][])}})
  return tables
 }
 async transact<T>(mode:'r'|'rw',scope:(store:StoreView)=>Promise<T>):Promise<T>{
  const task=this.queue.then(async()=>{
   this.ensureOpen();const state=copy(this.state)
   const result=await scope(this.view(state,mode==='rw'))
   if(mode==='rw'&&JSON.stringify(state)!==JSON.stringify(this.state)){
    const validated=normalizeState(state)
    try{
     const committed=parseSnapshot(await this.transport.request('commit',{ownerId:this.ownerId,expectedRevision:this.revision,state:validated}))
     this.ensureOpen();this.accept(committed)
    }catch(error){
     if(error instanceof TransportError&&error.code==='CONFLICT')this.accept(parseSnapshot(await this.transport.request('read',{ownerId:this.ownerId})))
     if(error instanceof TransportError&&['SESSION_EXPIRED','OWNER_MISMATCH'].includes(error.code))sessionInvalid(this.ownerId)
     throw error
    }
   }
   return result
  })
  this.queue=task.then(()=>undefined,()=>undefined)
  return task
 }
 private accept(snapshot:Snapshot){
  this.ensureOpen()
  if(snapshot.ownerId!==this.ownerId){sessionInvalid(this.ownerId);throw new TransportError('OWNER_MISMATCH','تغير الحساب في نافذة أخرى. سجّل الدخول مجددًا.')}
  this.state=snapshot.state;this.revision=snapshot.revision;notifyStore()
 }
 async open(){this.ensureOpen();return this}
 close(){this.closed=true;this.state=emptyState();notifyStore()}
 async delete():Promise<void>{throw new Error('حذف قاعدة بيانات المتعلم غير متاح من الواجهة.')}
}
interface StoreViewWithMutate extends StoreView{mutate<R>(collection:Collection,action:(rows:Rows[Collection][])=>R):R}
