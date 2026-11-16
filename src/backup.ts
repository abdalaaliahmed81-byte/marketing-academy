import {z} from './validation'
import {derive,KDF_ITERATIONS} from './auth'
import {hex,random,seal,unhex,unseal} from './vault'
const envelope=z.object({format:z.literal('marketing-academy-encrypted'),version:z.literal(1),iterations:z.literal(KDF_ITERATIONS),salt:z.string().regex(/^[0-9a-f]{32}$/),payload:z.string().max(30_000_000)}).strict()
export async function encryptBackup(data:unknown,password:string){
  if(password.length<12||password.length>128)throw new Error('عبارة حماية النسخة: ١٢–١٢٨ حرفًا.')
  if(new TextEncoder().encode(JSON.stringify(data)).byteLength>9_000_000)throw new Error('حجم البيانات يتجاوز حد النسخة المشفّرة الآمنة (٩ ميغابايت). لم يُنشأ ملف غير قابل للاستعادة.')
  const salt=random(16),key=await derive(password,salt)
  try{return {format:'marketing-academy-encrypted',version:1,iterations:KDF_ITERATIONS,salt:hex(salt),payload:seal(key.subarray(32),data,'academy-backup-v1')}}finally{key.fill(0)}
}
export async function decryptBackup(data:unknown,password:string){
  if(password.length<12||password.length>128)throw new Error('عبارة حماية النسخة: ١٢–١٢٨ حرفًا.')
  const parsed=envelope.parse(data),key=await derive(password,unhex(parsed.salt))
  try{return unseal(key.subarray(32),parsed.payload,'academy-backup-v1')}catch{throw new Error('عبارة الحماية غير صحيحة أو الملف تالف.')}finally{key.fill(0)}
}
