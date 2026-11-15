/** Synthetic v2 fixture, compiled only by the external smoke-test harness. Never packaged. */
import {register,logout} from '../../src/legacy-auth'
import {db,initializeSettings,saveLesson,submitQuiz,completeLesson,saveModuleProject,exportBackup} from '../../src/db'
import {lessons} from '../../src/lessons'
async function fingerprint(name:string,id:string){
 const value=await new Promise<unknown>((resolve,reject)=>{const req=indexedDB.open(name);req.onerror=()=>reject(req.error);req.onsuccess=()=>{const conn=req.result,tx=conn.transaction('lessonStates'),get=tx.objectStore('lessonStates').get(id);get.onsuccess=()=>{resolve(get.result);conn.close()};get.onerror=()=>reject(get.error)}})
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),v=>v.toString(16).padStart(2,'0')).join('')
}
export async function seed(name:string,password:string){
 const session=await register(name,password)
 await initializeSettings({id:'local',goal:'تقدم النسخة السابقة',minutes:30,business:'مطعم',theme:'light'})
 await saveLesson('m01-l01',{notes:'legacy-note-must-survive',assignment:'نشاط سابق مكتمل',checked:[0,1,2]})
 await submitQuiz(lessons[0],Object.fromEntries(lessons[0].questions.map(q=>[q.id,q.answer])))
 await completeLesson(lessons[0])
 await saveModuleProject({id:'module-1',response:'legacy-project-must-survive',checked:[0,1,2,3],completed:true})
 const state=await exportBackup(),sourceName=db.name,sourceFingerprint=await fingerprint(sourceName,'m01-l01')
 logout()
 return {sourceName,sourceFingerprint,state,legacyId:session.id}
}
export async function verifySource(name:string){return fingerprint(name,'m01-l01')}
