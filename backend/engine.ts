import {normalizeIdentity,validIdentity,validNewPassword} from '../src/identity'
import {DatabaseSync} from 'node:sqlite'
import {createCipheriv,createDecipheriv,createHash,randomBytes,randomUUID,pbkdf2 as pbkdf2Callback,timingSafeEqual} from 'node:crypto'
import {promisify} from 'node:util'
import {mkdirSync,chmodSync} from 'node:fs'
import {dirname} from 'node:path'
import {z} from '../src/validation'
import {collections,emptyState,normalizeState,MAX_STATE_BYTES,type Collection,type LearnerState} from '../src/data-schema'
import {displayNameSchema} from '../src/storage/protocol'
import type {Command,Snapshot,UserSession} from '../src/storage/protocol'

const pbkdf2=promisify(pbkdf2Callback)
export const ITERATIONS=600000
const APPLICATION_ID=0x4d414332
const owner=z.object({ownerId:z.string().uuid()}).strict()
const credentials=z.object({name:z.string().min(1).max(80),password:z.string().min(1).max(128)}).strict()
const change=z.object({ownerId:z.string().uuid(),oldPassword:z.string().min(1).max(128),newPassword:z.string().min(12).max(128)}).strict()
const commitSchema=z.object({ownerId:z.string().uuid(),expectedRevision:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER-1),state:z.unknown()}).strict()
export const legacyCredentialSchema=z.object({id:z.string().uuid(),username:z.string().max(80),displayName:z.string().max(80),salt:z.string().regex(/^[a-f0-9]{32}$/),iterations:z.literal(ITERATIONS),verifier:z.string().regex(/^[a-f0-9]{64}$/),wrappedKey:z.string().max(400),createdAt:z.string(),failures:z.number().nonnegative(),retryAt:z.number().nonnegative()}).strict()
const migrationSchema=z.object({password:z.string().min(1).max(128),account:legacyCredentialSchema,state:z.unknown()}).strict()
export class AcademyError extends Error{constructor(public code:string,message:string){super(message)}}
export function publicError(error:unknown){
 if(error instanceof AcademyError)return {code:error.code,message:error.message}
 if(error instanceof z.ZodError)return {code:'VALIDATION',message:'بيانات غير صالحة؛ بقيت البيانات المحفوظة دون تغيير.'}
 return {code:'STORAGE',message:'تعذّر إتمام العملية بأمان. لم يُعتمد أي حفظ جزئي.'}
}
export const normalizeName=normalizeIdentity
function validName(value:string){const result=normalizeName(value);if(!validIdentity(result))throw new AcademyError('VALIDATION','اسم المستخدم يجب أن يتكون من٣–٤٠ حرفًا أو رقمًا.');return result}
function boundedState(value:unknown){const serialized=JSON.stringify(value);if(typeof serialized!=='string')throw new AcademyError('VALIDATION','بيانات التقدم مفقودة.');if(Buffer.byteLength(serialized,'utf8')>MAX_STATE_BYTES)throw new AcademyError('TOO_LARGE','تجاوز حجم التقدم الحد الآمن للحفظ.');const state=normalizeState(value);for(const collection of collections)for(const row of state[collection])if(recordId(row).length>200)throw new AcademyError('VALIDATION','معرّف سجل غير صالح.');return state}
function seal(key:Uint8Array,value:unknown,aad:string){const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,nonce);cipher.setAAD(Buffer.from(aad));return nonce.toString('hex')+':'+Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final(),cipher.getAuthTag()]).toString('hex')}
function unseal<T>(key:Uint8Array,value:string,aad:string):T{
 const [nonce,payload,...extra]=value.split(':')
 if(extra.length||!/^[a-f0-9]{24}$/.test(nonce)||!/^(?:[a-f0-9]{2}){16,}$/.test(payload??''))throw new AcademyError('INTEGRITY','تعذّر التحقق من سلامة البيانات المشفّرة.')
 const body=Buffer.from(payload,'hex'),decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(nonce,'hex'));decipher.setAAD(Buffer.from(aad));decipher.setAuthTag(body.subarray(-16))
 try{return JSON.parse(Buffer.concat([decipher.update(body.subarray(0,-16)),decipher.final()]).toString('utf8')) as T}catch{throw new AcademyError('INTEGRITY','تعذّر التحقق من سلامة البيانات المشفّرة.')}
}
interface AccountRow {id:string;username:string;display_name:string;salt:string;verifier:string;wrapped_key:string;iterations:number;failed:number;retry_at:number;password_version:number}
interface AuthSession {userId:string;key:Buffer;passwordVersion:number;lastSeen:number;createdAt:number}
interface RecordRow {collection:Collection;record_id:string;payload:string}
export interface AuthResponse {token:string;session:UserSession;snapshot:Snapshot}
export class AcademyEngine{
 private sql:DatabaseSync
 private sessions=new Map<string,AuthSession>()
 private kdfActive=0
 private closed=false
 constructor(readonly filename:string){
  if(filename!==':memory:')mkdirSync(dirname(filename),{recursive:true,mode:0o700})
  this.sql=new DatabaseSync(filename,{allowExtension:false,enableForeignKeyConstraints:true})
  try{
   const version=Number(this.sql.prepare('PRAGMA user_version').get()!.user_version)
   const appId=Number(this.sql.prepare('PRAGMA application_id').get()!.application_id)
   const tables=this.sql.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()
   if(version>1||(version>0&&appId!==APPLICATION_ID)||(appId!==0&&appId!==APPLICATION_ID)||(version===0&&tables.length))throw new AcademyError('SCHEMA','قاعدة البيانات تخص إصدارًا آخر؛ لم نغيّرها.')
   if(filename!==':memory:')try{chmodSync(filename,0o600)}catch{}
   this.sql.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA trusted_schema=OFF;')
   if(version===0)this.migrate()
   const expectedTables=['accounts','account_state','learner_records','schema_migrations']
   const present=new Set(this.sql.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row=>String(row.name)))
   if(expectedTables.some(name=>!present.has(name))||String(this.sql.prepare('PRAGMA quick_check').get()!.quick_check)!=='ok'||this.sql.prepare('PRAGMA foreign_key_check').all().length)throw new AcademyError('INTEGRITY','تعذّر التحقق من سلامة قاعدة البيانات؛ لم نعد تهيئتها.')
   if(filename!==':memory:')try{chmodSync(filename,0o600)}catch{}
  }catch(error){this.sql.close();throw error}
 }
 private migrate(){
  this.sql.exec(`BEGIN IMMEDIATE;
   CREATE TABLE accounts(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,display_name TEXT NOT NULL,salt TEXT NOT NULL,iterations INTEGER NOT NULL,verifier TEXT NOT NULL,wrapped_key TEXT NOT NULL,created_at TEXT NOT NULL,failed INTEGER NOT NULL DEFAULT 0,retry_at INTEGER NOT NULL DEFAULT 0,password_version INTEGER NOT NULL DEFAULT 1,legacy_source TEXT UNIQUE);
   CREATE TABLE account_state(user_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,revision INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL);
   CREATE TABLE learner_records(user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,collection TEXT NOT NULL CHECK(collection IN ('settings','lessonStates','attempts','missions','projects','activity','moduleProjects')),record_id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(user_id,collection,record_id));
   CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL);
   INSERT INTO schema_migrations VALUES(1,datetime('now'));
   PRAGMA application_id=${APPLICATION_ID}; PRAGMA user_version=1; COMMIT;`)
 }
 private async stretch(password:string,salt:Buffer){
  if(this.kdfActive>=4)throw new AcademyError('RATE_LIMIT','طلبات دخول كثيرة؛ حاول بعد قليل.')
  this.kdfActive++
  try{return await pbkdf2(password,salt,ITERATIONS,64,'sha256')}finally{this.kdfActive--}
 }
 private verifier(key:Uint8Array){return createHash('sha256').update(key).digest()}
 private account(username:string){return this.sql.prepare('SELECT * FROM accounts WHERE username=?').get(username) as unknown as AccountRow|undefined}
 private authenticated(token:string|undefined,expectedOwner:string){
  const session=token?this.sessions.get(token):undefined
  const now=Date.now()
  if(!session||now-session.lastSeen>30*60_000||now-session.createdAt>12*60*60_000){if(token)this.endSession(token);throw new AcademyError('SESSION_EXPIRED','انتهت الجلسة. سجّل الدخول مجددًا.')}
  if(session.userId!==expectedOwner)throw new AcademyError('OWNER_MISMATCH','تغير الحساب في نافذة أخرى؛ لم نحفظ البيانات في حساب مختلف.')
  const account=this.sql.prepare('SELECT password_version FROM accounts WHERE id=?').get(session.userId)
  if(!account||Number(account.password_version)!==session.passwordVersion){this.endSession(token!);throw new AcademyError('SESSION_EXPIRED','تغيرت بيانات الدخول. سجّل الدخول مجددًا.')}
  session.lastSeen=now;return session
 }
 endSession(token:string){const session=this.sessions.get(token);session?.key.fill(0);this.sessions.delete(token)}
 private ensureSessionCapacity(){
  const now=Date.now()
  for(const [token,session] of this.sessions)if(now-session.lastSeen>30*60_000||now-session.createdAt>12*60*60_000)this.endSession(token)
  if(this.sessions.size>=1000)throw new AcademyError('RATE_LIMIT','عدد الجلسات مرتفع؛ حاول لاحقًا.')
 }
 private start(account:AccountRow,key:Buffer):AuthResponse{
  const now=Date.now()
  try{this.ensureSessionCapacity()}catch(error){key.fill(0);throw error}
  const token=randomBytes(32).toString('hex'),session={userId:account.id,key,passwordVersion:account.password_version,lastSeen:now,createdAt:now}
  // Do not expose a session until its encrypted state has passed integrity/schema checks.
  let snapshot:Snapshot
  try{snapshot=this.snapshot(session)}catch(error){key.fill(0);throw error}
  this.sessions.set(token,session)
  return {token,session:{id:account.id,name:account.display_name},snapshot}
 }
 private snapshot(session:AuthSession):Snapshot{
  const state=emptyState()
  for(const row of this.sql.prepare('SELECT collection,record_id,payload FROM learner_records WHERE user_id=? ORDER BY collection,record_id').all(session.userId) as unknown as RecordRow[]){
   const record=unseal(session.key,row.payload,`${session.userId}:${row.collection}:${row.record_id}:v1`)
   ;(state[row.collection] as unknown[]).push(record)
  }
  const revision=this.sql.prepare('SELECT revision FROM account_state WHERE user_id=?').get(session.userId)
  if(!revision)throw new AcademyError('INTEGRITY','سجل الحساب غير مكتمل؛ لم نعد تهيئته أو نحذف تقدمه.')
  return {ownerId:session.userId,revision:Number(revision.revision),state:boundedState(state)}
 }
 private writeState(session:AuthSession,state:LearnerState,expectedRevision:number){
  this.sql.exec('BEGIN IMMEDIATE')
  try{
   const current=this.snapshot(session)
   if(current.revision!==expectedRevision)throw new AcademyError('CONFLICT','حُدّث التقدم في نافذة أخرى. راجع النسخة الأحدث وأعد الحفظ.')
   const previous=new Map<string,string>()
   for(const collection of collections)for(const row of current.state[collection])previous.set(collection+':'+recordId(row),JSON.stringify(row))
   const present=new Set<string>()
   const put=this.sql.prepare('INSERT INTO learner_records(user_id,collection,record_id,payload) VALUES(?,?,?,?) ON CONFLICT(user_id,collection,record_id) DO UPDATE SET payload=excluded.payload')
   for(const collection of collections)for(const row of state[collection]){
    const id=recordId(row);if(id.length>200)throw new AcademyError('VALIDATION','معرّف سجل غير صالح.')
    const key=collection+':'+id;present.add(key)
    if(previous.get(key)!==JSON.stringify(row))put.run(session.userId,collection,id,seal(session.key,row,`${session.userId}:${collection}:${id}:v1`))
   }
   const remove=this.sql.prepare('DELETE FROM learner_records WHERE user_id=? AND collection=? AND record_id=?')
   for(const row of this.sql.prepare('SELECT collection,record_id FROM learner_records WHERE user_id=?').all(session.userId) as unknown as Pick<RecordRow,'collection'|'record_id'>[])if(!present.has(row.collection+':'+row.record_id))remove.run(session.userId,row.collection,row.record_id)
   this.sql.prepare('UPDATE account_state SET revision=revision+1,updated_at=? WHERE user_id=?').run(new Date().toISOString(),session.userId)
   this.sql.exec('COMMIT')
  }catch(error){this.sql.exec('ROLLBACK');throw error}
  return this.snapshot(session)
 }
 private async create(name:string,password:string,initial=emptyState(),legacySource?:string,displayName=name.trim()):Promise<AuthResponse>{
  const username=validName(name),safeDisplayName=displayNameSchema.parse(displayName)
  if(!validNewPassword(password))throw new AcademyError('VALIDATION','استخدم كلمة مرور من١٢–١٢٨ حرفًا.')
  if(this.account(username))throw new AcademyError('DUPLICATE','اسم المستخدم مستخدم؛ سجّل الدخول إلى حسابه الحالي.')
  const id=randomUUID(),salt=randomBytes(16),derived=await this.stretch(password,salt),key=randomBytes(32)
  try{
   // Recheck after asynchronous KDF, before any durable account creation. No await until start().
   this.ensureSessionCapacity()
   this.sql.exec('BEGIN IMMEDIATE')
   try{
    if(this.account(username))throw new AcademyError('DUPLICATE','اسم المستخدم مستخدم بالفعل.')
    this.sql.prepare('INSERT INTO accounts(id,username,display_name,salt,iterations,verifier,wrapped_key,created_at,legacy_source) VALUES(?,?,?,?,?,?,?,?,?)').run(id,username,safeDisplayName,salt.toString('hex'),ITERATIONS,this.verifier(derived.subarray(0,32)).toString('hex'),seal(derived.subarray(32),key.toString('hex'),'account:'+id),new Date().toISOString(),legacySource??null)
    this.sql.prepare('INSERT INTO account_state(user_id,revision,updated_at) VALUES(?,0,?)').run(id,new Date().toISOString())
    // Import initial records inside the same account-creation transaction.
    const put=this.sql.prepare('INSERT INTO learner_records(user_id,collection,record_id,payload) VALUES(?,?,?,?)')
    for(const collection of collections)for(const row of initial[collection]){const rid=recordId(row);put.run(id,collection,rid,seal(key,row,`${id}:${collection}:${rid}:v1`))}
    const verified=this.snapshot({userId:id,key,passwordVersion:1,lastSeen:Date.now(),createdAt:Date.now()})
    if(JSON.stringify(normalizeStateSorted(verified.state))!==JSON.stringify(normalizeStateSorted(initial)))throw new AcademyError('INTEGRITY','تعذّر التحقق من نقل التقدم؛ بقي الأصل محفوظًا.')
    this.sql.exec('COMMIT')
   }catch(error){this.sql.exec('ROLLBACK');throw error}
   const account=this.account(username)!
   const result=this.start(account,key)
   return result
  }catch(error){key.fill(0);throw error}finally{derived.fill(0)}
 }
 private async login(name:string,password:string):Promise<AuthResponse>{
  const account=this.account(normalizeName(name))
  if(account&&account.retry_at>Date.now())throw new AcademyError('RATE_LIMIT','انتظر قليلًا قبل المحاولة التالية.')
  const derived=await this.stretch(password,account?Buffer.from(account.salt,'hex'):randomBytes(16))
  try{
   const candidate=this.verifier(derived.subarray(0,32)),expected=account?Buffer.from(account.verifier,'hex'):Buffer.alloc(32)
   if(!account||expected.length!==candidate.length||!timingSafeEqual(candidate,expected)){
    if(account){const current=this.account(account.username);if(current)this.sql.prepare('UPDATE accounts SET failed=failed+1,retry_at=? WHERE id=?').run(Date.now()+(current.failed>=4?Math.min(60000,1000*2**Math.min(current.failed-4,6)):0),current.id)}
    throw new AcademyError('AUTH_FAILED','اسم المستخدم أو كلمة المرور غير صحيح.')
   }
   const latest=this.account(account.username)
   if(!latest||latest.password_version!==account.password_version||latest.salt!==account.salt)throw new AcademyError('AUTH_FAILED','تغيرت بيانات الدخول أثناء المحاولة؛ أعد تسجيل الدخول.')
   const key=Buffer.from(unseal<string>(derived.subarray(32),account.wrapped_key,'account:'+account.id),'hex')
   this.sql.prepare('UPDATE accounts SET failed=0,retry_at=0 WHERE id=?').run(account.id)
   return this.start(account,key)
  }finally{derived.fill(0)}
 }
 async request(command:Command,payload:unknown,token?:string):Promise<unknown>{
  if(this.closed)throw new AcademyError('STORAGE','التخزين مغلق.')
  if(command==='register'){const value=credentials.parse(payload);return this.create(value.name,value.password)}
  if(command==='recoverBackup'){const value=credentials.extend({state:z.unknown()}).strict().parse(payload);return this.create(value.name,value.password,boundedState(value.state))}
  if(command==='login'){const value=credentials.parse(payload);return this.login(value.name,value.password)}
  if(command==='migrateLegacy'){
   const value=migrationSchema.parse(payload),username=validName(value.account.username)
   if(this.account(username))throw new AcademyError('DUPLICATE','نُقل هذا الاسم أو يوجد حساب به؛ استخدم كلمة المرور الحالية. بقي الأصل القديم محفوظًا.')
   const derived=await this.stretch(value.password,Buffer.from(value.account.salt,'hex'))
   try{
    const expected=Buffer.from(value.account.verifier,'hex'),actual=this.verifier(derived.subarray(0,32))
    if(!timingSafeEqual(actual,expected))throw new AcademyError('AUTH_FAILED','تعذّر التحقق من الحساب القديم.')
    const oldKey=Buffer.from(unseal<string>(derived.subarray(32),value.account.wrappedKey,'account:'+value.account.id),'hex')
    if(oldKey.length!==32)throw new AcademyError('INTEGRITY','مفتاح الحساب القديم غير صالح.');oldKey.fill(0)
    return this.create(username,value.password,boundedState(value.state),value.account.id,value.account.displayName)
   }finally{derived.fill(0)}
  }
  if(command==='changePassword'){
   const value=change.parse(payload),session=this.authenticated(token,value.ownerId),account=this.sql.prepare('SELECT * FROM accounts WHERE id=?').get(session.userId) as unknown as AccountRow
   const previous=await this.stretch(value.oldPassword,Buffer.from(account.salt,'hex'))
   const valid=timingSafeEqual(this.verifier(previous.subarray(0,32)),Buffer.from(account.verifier,'hex'));previous.fill(0)
   if(!valid)throw new AcademyError('AUTH_FAILED','كلمة المرور الحالية غير صحيحة.')
   const salt=randomBytes(16),next=await this.stretch(value.newPassword,salt)
   try{
    // Recheck the session after awaiting cryptographic work.
    this.authenticated(token,value.ownerId)
    this.sql.prepare('UPDATE accounts SET salt=?,verifier=?,wrapped_key=?,password_version=password_version+1,failed=0,retry_at=0 WHERE id=?').run(salt.toString('hex'),this.verifier(next.subarray(0,32)).toString('hex'),seal(next.subarray(32),session.key.toString('hex'),'account:'+session.userId),session.userId)
    session.passwordVersion++
    for(const [other,record] of this.sessions)if(other!==token&&record.userId===session.userId)this.endSession(other)
    return {ok:true}
   }finally{next.fill(0)}
  }
  if(command==='updateProfile'){
   const value=owner.extend({name:displayNameSchema}).strict().parse(payload),session=this.authenticated(token,value.ownerId)
   this.sql.prepare('UPDATE accounts SET display_name=? WHERE id=?').run(value.name,session.userId)
   return this.profile(session.userId)
  }
  if(command==='commit'){const value=commitSchema.parse(payload),session=this.authenticated(token,value.ownerId);return this.writeState(session,boundedState(value.state),value.expectedRevision)}
  const value=owner.parse(payload),session=this.authenticated(token,value.ownerId)
  if(command==='profile')return this.profile(session.userId)
  if(command==='read')return this.snapshot(session)
  if(command==='logout'){this.endSession(token!);return {ok:true}}
  throw new AcademyError('VALIDATION','عملية غير مدعومة.')
 }
 private profile(id:string){const row=this.sql.prepare('SELECT id,username,display_name,created_at FROM accounts WHERE id=?').get(id)!;return {id:String(row.id),username:String(row.username),name:String(row.display_name),createdAt:String(row.created_at)}}
 health(){return {provider:'sqlite',protocolVersion:1,schemaVersion:Number(this.sql.prepare('PRAGMA user_version').get()!.user_version),sqliteVersion:this.sql.prepare('SELECT sqlite_version() AS version').get()!.version}}
 close(){if(this.closed)return;for(const token of this.sessions.keys())this.endSession(token);this.sql.close();this.closed=true}
}
function recordId(row:unknown){const value=row as {id?:string;date?:string};const result=value.id??value.date;if(!result)throw new AcademyError('VALIDATION','معرّف سجل مفقود.');return result}
function normalizeStateSorted(state:LearnerState){const result=normalizeState(state);for(const collection of collections)(result[collection] as unknown[]).sort((a,b)=>recordId(a).localeCompare(recordId(b)));return result}
