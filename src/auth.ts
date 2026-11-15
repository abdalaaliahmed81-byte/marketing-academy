import Dexie from 'dexie'
import * as legacy from './legacy-auth'
import {AcademyDB,activateDatabase,db,exportBackup,restoreBackup} from './db'
import {SQLiteRepository} from './storage/repository'
import {activeTransport} from './storage/transport'
import {parseAuthResult,TransportError,type AuthResult,type UserSession} from './storage/protocol'
export {derive,KDF_ITERATIONS,accountsDB,normalizeUsername} from './legacy-auth'
export type Session=UserSession
let nativeSession:Session|undefined
export const currentSession=()=>activeTransport()?nativeSession:legacy.currentSession()
function enter(result:AuthResult){activateDatabase(new SQLiteRepository(result.snapshot,activeTransport()!));nativeSession=result.session;return result.session}
export async function register(name:string,password:string){
 const transport=activeTransport()
 if(!transport)return legacy.register(name,password)
 if(await legacy.accountsDB.accounts.where('username').equals(legacy.normalizeUsername(name)).first())throw new Error('يوجد حساب من النسخة السابقة بهذا الاسم. سجّل الدخول لنقل تقدمه بأمان.')
 return enter(parseAuthResult(await transport.request('register',{name,password})))
}
export async function login(name:string,password:string){
 const transport=activeTransport()
 if(!transport)return legacy.login(name,password)
 try{return enter(parseAuthResult(await transport.request('login',{name,password})))}catch(error){
  if(!(error instanceof TransportError)||error.code!=='AUTH_FAILED')throw error
  const account=await legacy.accountsDB.accounts.where('username').equals(legacy.normalizeUsername(name)).first()
  if(!account)throw error
  // Authenticate and decrypt the original v2 store; never delete it or overwrite a native account.
  await legacy.login(name,password)
  try{
   const state=await exportBackup()
   const result=parseAuthResult(await transport.request('migrateLegacy',{password,account,state}))
   legacy.logout();return enter(result)
  }catch(migrationError){legacy.logout();throw migrationError}
 }
}
export function logout(){
 const transport=activeTransport(),session=nativeSession
 if(!transport){legacy.logout();return}
 db.close();nativeSession=undefined
 if(session)void transport.request('logout',{ownerId:session.id}).catch(()=>{})
}
export function forgetSession(){if(activeTransport()){db.close();nativeSession=undefined}else legacy.logout()}
export async function changePassword(oldPassword:string,newPassword:string){
 const transport=activeTransport()
 if(!transport)return legacy.changePassword(oldPassword,newPassword)
 if(!nativeSession)throw new Error('سجّل الدخول أولًا.')
 await transport.request('changePassword',{ownerId:nativeSession.id,oldPassword,newPassword})
}
export async function legacyAvailable(){
 if(!activeTransport())return legacy.legacyAvailable()
 if(!nativeSession||await legacy.accountsDB.metadata.get('legacy-owner')||!await Dexie.exists('marketing-academy'))return false
 const source=new AcademyDB('marketing-academy')
 try{return !!(await source.settings.count()||await source.lessonStates.count())}finally{source.close()}
}
export async function importLegacy(){
 if(!activeTransport())return legacy.importLegacy()
 if(!nativeSession)throw new Error('سجّل الدخول أولًا.')
 const ownerId=nativeSession.id
 if(await db.lessonStates.count()||await db.settings.count())throw new Error('انقل التقدم السابق قبل بدء الحساب الجديد.')
 try{await legacy.accountsDB.metadata.add({id:'legacy-owner',userId:ownerId})}catch{throw new Error('تم ربط المصدر القديم بحساب آخر.')}
 const source=new AcademyDB('marketing-academy')
 try{await restoreBackup(await exportBackup(source))}catch(error){
  if((await legacy.accountsDB.metadata.get('legacy-owner'))?.userId===ownerId)await legacy.accountsDB.metadata.delete('legacy-owner')
  throw error
 }finally{source.close()}
}
