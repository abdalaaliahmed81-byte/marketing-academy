import {afterEach,beforeEach,describe,expect,it} from 'vitest'
import {webcrypto} from 'node:crypto'
import Dexie from 'dexie'
import {accountsDB,register,login,logout,changePassword,normalizeUsername} from './auth'
import {AcademyDB,db,exportBackup,restoreBackup,saveLesson,saveModuleProject} from './db'
import {decryptBackup,encryptBackup} from './backup'
import {random} from './vault'

// Real PBKDF2/AES-GCM rather than a fast crypto stub.
Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true})
beforeEach(async()=>{await accountsDB.delete();await accountsDB.open()})
afterEach(async()=>{logout();for(const name of await Dexie.getDatabaseNames())if(name.startsWith('marketing-academy-user-')||name.startsWith('vault-test-'))await Dexie.delete(name);await accountsDB.delete()})
describe('account security and isolation',()=>{
 it('hashes passwords, encrypts records and isolates two accounts through logout/relogin',async()=>{
  const alice=await register('متعلم أ','long-test-password-1')
  await saveLesson('m01-l01',{notes:'ملاحظة خاصة ألف'})
  await db.settings.put({id:'local',goal:'تعلّم',minutes:30,business:'مطعم',theme:'light'})
  await db.settings.update('local',{goal:'تحديث'})
  expect((await db.settings.get('local'))?.goal).toBe('تحديث')
  const native=await new Promise<unknown>((resolve,reject)=>{const req=indexedDB.open(db.name);req.onsuccess=()=>{const conn=req.result;const tx=conn.transaction('lessonStates');const q=tx.objectStore('lessonStates').get('m01-l01');q.onsuccess=()=>{resolve(q.result);conn.close()};q.onerror=reject};req.onerror=reject})
  expect(JSON.stringify(native)).not.toContain('ملاحظة خاصة ألف')
  expect(native).toHaveProperty('_sealed')
  const account=(await accountsDB.accounts.toArray())[0]
  expect(JSON.stringify(account)).not.toContain('long-test-password-1')
  expect(account.iterations).toBe(600000)
  logout()
  const bob=await register('متعلم ب','long-test-password-2')
  expect(bob.id).not.toBe(alice.id)
  expect(await db.lessonStates.count()).toBe(0)
  await saveLesson('m01-l01',{notes:'ملاحظة باء'})
  logout()
  await expect(login('متعلم أ','wrong')).rejects.toThrow()
  await login('متعلم أ','long-test-password-1')
  expect((await db.lessonStates.get('m01-l01'))?.notes).toBe('ملاحظة خاصة ألف')
  expect((await db.lessonStates.orderBy('id').reverse().toArray())[0].notes).toBe('ملاحظة خاصة ألف')
  expect((await db.lessonStates.where('id').equals('m01-l01').first())?.notes).toBe('ملاحظة خاصة ألف')
 },20000)
 it('normalizes names, rejects duplicates and changes passwords without losing data',async()=>{
  expect(normalizeUsername(' Ａlice ')).toBe('alice')
  await register('Alice','secure-long-password')
  await expect(register(' ALICE ','secure-long-password')).rejects.toThrow()
  await expect(register('Short','123')).rejects.toThrow()
  await saveLesson('m01-l01',{notes:'تقدم'})
  await expect(changePassword('incorrect','another-long-password')).rejects.toThrow()
  await changePassword('secure-long-password','another-long-password')
  logout()
  await expect(login('Alice','secure-long-password')).rejects.toThrow()
  await login('Alice','another-long-password')
  expect((await db.lessonStates.get('m01-l01'))?.notes).toBe('تقدم')
 },20000)
 it('rejects an incorrect encryption key and authenticated row tampering',async()=>{
  const name='vault-test-'+crypto.randomUUID(),key=random(32)
  const first=new AcademyDB(name,key)
  await saveLesson('m01-l01',{notes:'سر'},first);first.close()
  const wrong=new AcademyDB(name,random(32))
  await expect(wrong.lessonStates.get('m01-l01')).rejects.toThrow();wrong.close()
  const same=new AcademyDB(name,key)
  expect((await same.lessonStates.get('m01-l01'))?.notes).toBe('سر');same.close()
 })
})
describe('backup and project validation',()=>{
 it('round trips encrypted backups; wrong phrases and modified payloads fail',async()=>{
  await register('Backup','test-backup-password')
  await saveLesson('m01-l01',{notes:'نسخة'})
  const before=await exportBackup(),sealed=await encryptBackup(before,'backup-passphrase')
  expect(JSON.stringify(sealed)).not.toContain('نسخة')
  await expect(decryptBackup(sealed,'wrong')).rejects.toThrow()
  const damaged={...sealed,payload:sealed.payload.slice(0,-4)+'0000'}
  await expect(decryptBackup(damaged,'backup-passphrase')).rejects.toThrow()
  await saveLesson('m01-l01',{notes:'جديد'})
  await restoreBackup(await decryptBackup(sealed,'backup-passphrase'))
  expect(await exportBackup()).toEqual(before)
 },20000)
 it('leaves existing data unchanged when a backup is invalid',async()=>{
  await register('Validation','test-backup-password')
  await saveLesson('m01-l01',{notes:'ثابت'})
  const before=await exportBackup()
  await expect(restoreBackup({...before,lessonStates:[{...before.lessonStates[0],id:'unknown'}]})).rejects.toThrow()
  await expect(restoreBackup({...before,lessonStates:[{...before.lessonStates[0],completed:true}]})).rejects.toThrow()
  await expect(restoreBackup({...before,attempts:[{id:'bad',lessonId:'m01-l01',at:new Date().toISOString(),answers:{},score:100,passed:true,missed:[]}]})).rejects.toThrow()
  await expect(saveModuleProject({id:'module-1',response:'',checked:[0,1,2,3],completed:true} as never)).rejects.toThrow()
  expect(await exportBackup()).toEqual(before)
 },20000)
})
