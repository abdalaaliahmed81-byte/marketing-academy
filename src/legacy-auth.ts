import {displayNameSchema,type Profile} from './storage/protocol'
import Dexie,{type Table} from 'dexie'
import {AcademyDB,activateDatabase,db,exportBackup,restoreBackup} from './db'
import {hex,random,seal,unhex,unseal} from './vault'

export const KDF_ITERATIONS=600000
export interface Account {id:string;username:string;displayName:string;salt:string;iterations:number;verifier:string;wrappedKey:string;createdAt:string;failures:number;retryAt:number}
class AccountDB extends Dexie{
  accounts!:Table<Account,string>
  metadata!:Table<{id:string;userId:string},string>
  constructor(){super('marketing-academy-accounts');this.version(1).stores({accounts:'id,&username',metadata:'id'})}
}
export const accountsDB=new AccountDB()
export interface Session {id:string;name:string}
let session:Session|undefined
let masterKey:Uint8Array|undefined
export const currentSession=()=>session
export function normalizeUsername(name:string){return name.normalize('NFKC').trim().toLocaleLowerCase('en-US')}
export async function derive(password:string,salt:Uint8Array,iterations=KDF_ITERATIONS){
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new Uint8Array(salt),iterations,hash:'SHA-256'},material,512))
}
const verifier=async(key:Uint8Array)=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(key))))
function equal(a:string,b:string){let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0}
async function enter(account:Account,key:Uint8Array){
  const next=new AcademyDB('marketing-academy-user-'+account.id,key)
  await next.open()
  activateDatabase(next)
  masterKey=key
  session={id:account.id,name:account.displayName}
  return session
}
export async function register(name:string,password:string){
  const username=normalizeUsername(name)
  if(!/^[\p{L}\p{N}_. -]{3,40}$/u.test(username))throw new Error('اسم المستخدم: ٣–٤٠ حرفًا أو رقمًا، ويمكن استخدام مسافة أو نقطة أو شرطة.')
  if(password.length<12||password.length>128)throw new Error('استخدم كلمة مرور من ١٢ إلى ١٢٨ حرفًا.')
  if(await accountsDB.accounts.where('username').equals(username).first())throw new Error('اسم المستخدم مستخدم بالفعل.')
  const id=crypto.randomUUID(),salt=random(16),derived=await derive(password,salt),key=random(32)
  const account:Account={id,username,displayName:name.trim(),salt:hex(salt),iterations:KDF_ITERATIONS,verifier:await verifier(derived.subarray(0,32)),wrappedKey:seal(derived.subarray(32),hex(key),'account:'+id),createdAt:new Date().toISOString(),failures:0,retryAt:0}
  try{await accountsDB.accounts.add(account)}catch{key.fill(0);throw new Error('تعذّر إنشاء الحساب. قد يكون الاسم مستخدمًا.')}
  derived.fill(0)
  return enter(account,key)
}
export async function login(name:string,password:string){
  if(password.length>128)throw new Error('اسم المستخدم أو كلمة المرور غير صحيح.')
  const account=await accountsDB.accounts.where('username').equals(normalizeUsername(name)).first()
  if(account&&account.retryAt>Date.now())throw new Error('انتظر قليلًا قبل المحاولة التالية.')
  // Derive even for unknown accounts to reduce username timing disclosure.
  const derived=await derive(password,account?unhex(account.salt):random(16))
  if(!account||!equal(await verifier(derived.subarray(0,32)),account.verifier)){
    derived.fill(0)
    if(account)await accountsDB.accounts.update(account.id,{failures:account.failures+1,retryAt:Date.now()+(account.failures>=4?Math.min(60000,1000*2**Math.min(account.failures-4,6)):0)})
    throw new Error('اسم المستخدم أو كلمة المرور غير صحيح.')
  }
  let key:Uint8Array
  try{key=unhex(unseal<string>(derived.subarray(32),account.wrappedKey,'account:'+account.id))}finally{derived.fill(0)}
  await accountsDB.accounts.update(account.id,{failures:0,retryAt:0})
  return enter(account,key)
}
export function logout(){db.close();masterKey?.fill(0);masterKey=undefined;session=undefined}
export async function changePassword(oldPassword:string,newPassword:string){
  if(!session||newPassword.length<12||newPassword.length>128)throw new Error('استخدم كلمة مرور من ١٢ إلى ١٢٨ حرفًا.')
  const account=await accountsDB.accounts.get(session.id)
  if(!account||!masterKey)throw new Error('سجّل الدخول أولًا.')
  const previous=await derive(oldPassword,unhex(account.salt))
  const valid=equal(await verifier(previous.subarray(0,32)),account.verifier);previous.fill(0)
  if(!valid)throw new Error('كلمة المرور الحالية غير صحيحة.')
  const salt=random(16),next=await derive(newPassword,salt)
  await accountsDB.accounts.update(account.id,{salt:hex(salt),verifier:await verifier(next.subarray(0,32)),wrappedKey:seal(next.subarray(32),hex(masterKey),'account:'+account.id),failures:0,retryAt:0})
  next.fill(0)
}
export async function legacyAvailable(){
  if(!session||await accountsDB.metadata.get('legacy-owner'))return false
  if(!await Dexie.exists('marketing-academy'))return false
  const old=new AcademyDB('marketing-academy')
  try{return !!(await old.settings.count()||await old.lessonStates.count())}finally{old.close()}
}
export async function importLegacy(){
  if(!session)throw new Error('سجّل الدخول أولًا.')
  if(await db.lessonStates.count()||await db.settings.count())throw new Error('استورد البيانات القديمة قبل بدء الحساب الجديد.')
  // Claim once before reading; do not silently assign shared legacy data to every user.
  try{await accountsDB.metadata.add({id:'legacy-owner',userId:session.id})}catch{throw new Error('تم ربط البيانات القديمة بحساب آخر.')}
  const old=new AcademyDB('marketing-academy')
  try{await restoreBackup(await exportBackup(old))}catch(error){await accountsDB.metadata.delete('legacy-owner');throw error}finally{old.close()}
}

export async function profile():Promise<Profile>{
 const owner=session?.id
 if(!owner)throw new Error('سجّل الدخول أولًا.')
 const account=await accountsDB.accounts.get(owner)
 if(!account||session?.id!==owner)throw new Error('تغير الحساب؛ أعد المحاولة.')
 return {id:account.id,username:account.username,name:account.displayName,createdAt:account.createdAt}
}
export async function updateProfile(name:string):Promise<Profile>{
 const next=displayNameSchema.parse(name),owner=session?.id
 if(!owner)throw new Error('سجّل الدخول أولًا.')
 await accountsDB.transaction('rw',accountsDB.accounts,async()=>{
  const account=await accountsDB.accounts.get(owner)
  if(!account||session?.id!==owner)throw new Error('تغير الحساب؛ أعد المحاولة.')
  await accountsDB.accounts.update(owner,{displayName:next})
 })
 if(session?.id===owner)session={...session,name:next}
 return profile()
}
