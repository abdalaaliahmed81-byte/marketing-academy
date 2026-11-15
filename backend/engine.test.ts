/** @vitest-environment node */
import {beforeEach,afterEach,describe,it,expect} from 'vitest'
import {mkdtemp,rm,readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {DatabaseSync} from 'node:sqlite'
import {pbkdf2Sync,randomBytes,randomUUID,createHash} from 'node:crypto'
import {AcademyEngine,publicError,type AuthResponse} from './engine'
import {emptyState,type LearnerState} from '../src/data-schema'
import {emptyLesson} from '../src/domain'
import {seal} from '../src/vault'
import type {Snapshot} from '../src/storage/protocol'
let folder:string,filename:string,engine:AcademyEngine
const password='secure-audit-password'
const account=async(name='Audit Alice')=>await engine.request('register',{name,password}) as AuthResponse
const read=(auth:AuthResponse)=>engine.request('read',{ownerId:auth.session.id},auth.token) as Promise<Snapshot>
const commit=(auth:AuthResponse,state:LearnerState,revision=auth.snapshot.revision)=>engine.request('commit',{ownerId:auth.session.id,expectedRevision:revision,state},auth.token) as Promise<Snapshot>
beforeEach(async()=>{folder=await mkdtemp(join(tmpdir(),'academy-engine-'));filename=join(folder,'academy.sqlite');engine=new AcademyEngine(filename)})
afterEach(async()=>{engine.close();await rm(folder,{recursive:true,force:true})})
describe('real SQLite accounts and progress',()=>{
 it('persists encrypted per-user records, rejects cross-owner and stale commits, and reopens without losing progress',async()=>{
  const alice=await account(),bob=await account('Audit Bob')
  const state=emptyState();state.lessonStates=[{...emptyLesson('m01-l01'),notes:'PRIVATE-NOTE-SQLITE'}]
  const saved=await commit(alice,state)
  expect(saved.revision).toBe(1)
  expect((await read(bob)).state.lessonStates).toEqual([])
  await expect(engine.request('commit',{ownerId:alice.session.id,expectedRevision:0,state},bob.token)).rejects.toMatchObject({code:'OWNER_MISMATCH'})
  await expect(commit(alice,state,0)).rejects.toMatchObject({code:'CONFLICT'})
  await expect(engine.request('login',{name:'Audit Alice',password:'wrong'})).rejects.toMatchObject({code:'AUTH_FAILED'})
  engine.close()
  expect((await readFile(filename)).includes(Buffer.from('PRIVATE-NOTE-SQLITE'))).toBe(false)
  expect((await readFile(filename)).includes(Buffer.from(password))).toBe(false)
  engine=new AcademyEngine(filename)
  await expect(read(alice)).rejects.toMatchObject({code:'SESSION_EXPIRED'})
  const reopened=await engine.request('login',{name:'AUDIT ALICE',password}) as AuthResponse
  expect(reopened.snapshot.state.lessonStates[0].notes).toBe('PRIVATE-NOTE-SQLITE')
  expect(engine.health().schemaVersion).toBe(1)
 })
 it('rolls back every row when an actual SQLite trigger aborts a commit',async()=>{
  const auth=await account(),sql=new DatabaseSync(filename)
  sql.exec("CREATE TRIGGER reject_test_activity BEFORE INSERT ON learner_records WHEN NEW.collection='activity' BEGIN SELECT RAISE(ABORT,'test disk/write failure'); END")
  const state=emptyState();state.lessonStates=[{...emptyLesson('m01-l01'),notes:'must roll back'}];state.activity=[{date:'2026-11-15'}]
  await expect(commit(auth,state)).rejects.toThrow()
  expect((await read(auth)).state.lessonStates).toEqual([])
  expect((await read(auth)).revision).toBe(0)
  sql.exec('DROP TRIGGER reject_test_activity');sql.close()
  expect((await commit(auth,state)).state.lessonStates[0].notes).toBe('must roll back')
 })
 it('validates before restore and preserves the previous snapshot on invalid data',async()=>{
  const auth=await account(),state=emptyState();state.lessonStates=[{...emptyLesson('m01-l01'),notes:'keep'}]
  const before=await commit(auth,state)
  await expect(commit(auth,{...state,lessonStates:[{...state.lessonStates[0],id:'unknown'}]},1)).rejects.toThrow()
  expect(await read(auth)).toEqual(before)
 })
 it('changes passwords without changing data and revokes other authenticated sessions',async()=>{
  const auth=await account(),state=emptyState();state.lessonStates=[{...emptyLesson('m01-l01'),notes:'stable'}];await commit(auth,state)
  const other=await engine.request('login',{name:'Audit Alice',password}) as AuthResponse
  await engine.request('changePassword',{ownerId:auth.session.id,oldPassword:password,newPassword:'new-secure-audit-password'},auth.token)
  expect((await read(auth)).state.lessonStates[0].notes).toBe('stable')
  await expect(read(other)).rejects.toMatchObject({code:'SESSION_EXPIRED'})
  await expect(engine.request('login',{name:'Audit Alice',password})).rejects.toMatchObject({code:'AUTH_FAILED'})
  const next=await engine.request('login',{name:'Audit Alice',password:'new-secure-audit-password'}) as AuthResponse
  expect(next.snapshot.state.lessonStates[0].notes).toBe('stable')
 },20000)
 it('rejects an old-password login paused across a concurrent password change',async()=>{
  const auth=await account()
  const internals=engine as unknown as {stretch(password:string,salt:Buffer):Promise<Buffer>}
  const original=internals.stretch.bind(engine)
  let release!:()=>void,entered!:()=>void,pauseNext=true
  const gate=new Promise<void>(resolve=>{release=resolve}),paused=new Promise<void>(resolve=>{entered=resolve})
  internals.stretch=async(value,salt)=>{const pause=pauseNext;pauseNext=false;const result=await original(value,salt);if(pause){entered();await gate}return result}
  const pending=engine.request('login',{name:'Audit Alice',password})
  await paused
  try{await engine.request('changePassword',{ownerId:auth.session.id,oldPassword:password,newPassword:'changed-concurrently-password'},auth.token)}finally{release()}
  await expect(pending).rejects.toMatchObject({code:'AUTH_FAILED'})
  const fresh=await engine.request('login',{name:'Audit Alice',password:'changed-concurrently-password'}) as AuthResponse
  expect(fresh.session.id).toBe(auth.session.id)
 },20000)
 it('refuses foreign/future schemas without resetting their data',async()=>{
  engine.close();const sql=new DatabaseSync(filename);sql.exec('PRAGMA user_version=99');sql.close()
  const bytes=await readFile(filename)
  expect(()=>new AcademyEngine(filename)).toThrow()
  expect(await readFile(filename)).toEqual(bytes)
  const alien=join(folder,'foreign.sqlite'),foreign=new DatabaseSync(alien);foreign.exec('CREATE TABLE precious(data TEXT); INSERT INTO precious VALUES(\'preserve\')');foreign.close()
  expect(()=>new AcademyEngine(alien)).toThrow()
  const verify=new DatabaseSync(alien);expect(verify.prepare('SELECT data FROM precious').get()!.data).toBe('preserve');verify.close()
 })
 it('detects authenticated ciphertext corruption instead of resetting progress',async()=>{
  const auth=await account(),state=emptyState();state.lessonStates=[emptyLesson('m01-l01')];await commit(auth,state)
  const sql=new DatabaseSync(filename);sql.prepare("UPDATE learner_records SET payload=? WHERE collection='lessonStates'").run('000000000000000000000000:'+('00'.repeat(32)));sql.close()
  await expect(read(auth)).rejects.toMatchObject({code:'INTEGRITY'})
 })
})
describe('legacy compatibility and trust boundaries',()=>{
 it('authenticates v2 credentials, verifies and rekeys a complete migration, and never overwrites an existing account',async()=>{
  const id=randomUUID(),salt=randomBytes(16),derived=pbkdf2Sync(password,salt,600000,64,'sha256'),key=randomBytes(32)
  const legacy={id,username:'legacy student',displayName:'Legacy Student',salt:salt.toString('hex'),iterations:600000,verifier:createHash('sha256').update(derived.subarray(0,32)).digest('hex'),wrappedKey:seal(derived.subarray(32),key.toString('hex'),'account:'+id),createdAt:new Date().toISOString(),failures:0,retryAt:0}
  const state=emptyState();state.lessonStates=[{...emptyLesson('m01-l01'),notes:'legacy preserved'}];state.moduleProjects=[{id:'module-1',response:'legacy project',checked:[0,1,2,3],completed:true}]
  await expect(engine.request('migrateLegacy',{password:'wrong',account:legacy,state})).rejects.toMatchObject({code:'AUTH_FAILED'})
  const migrated=await engine.request('migrateLegacy',{password,account:legacy,state}) as AuthResponse
  expect(migrated.snapshot.state).toEqual(state)
  await expect(engine.request('migrateLegacy',{password,account:legacy,state})).rejects.toMatchObject({code:'DUPLICATE'})
  expect((await read(migrated)).state.lessonStates[0].notes).toBe('legacy preserved')
  derived.fill(0);key.fill(0)
 },20000)
 it('sanitizes storage errors and does not accept arbitrary SQL commands',async()=>{
  expect(publicError(new Error('SELECT secret FROM /private/path'))).toEqual({code:'STORAGE',message:'تعذّر إتمام العملية بأمان. لم يُعتمد أي حفظ جزئي.'})
  await expect(engine.request('sql' as never,{query:'DROP TABLE accounts'})).rejects.toThrow()
  expect((await account()).snapshot.state).toEqual(emptyState())
 })
})
