import {commands,TransportError,type Command,type Transport} from './protocol'
import {sessionInvalid} from './events'
interface Reply {ok:boolean;value?:unknown;error?:{code:string;message:string}}
declare global{interface Window{academy?:{kind:'desktop-sqlite';request(command:Command,payload:unknown):Promise<Reply>}}}
let transport:Transport|undefined
export const activeTransport=()=>transport
function unwrap(reply:Reply,ownerId?:string){
 if(!reply||typeof reply.ok!=='boolean')throw new TransportError('PROTOCOL','استجابة تخزين غير صالحة.')
 if(!reply.ok){const error=new TransportError(reply.error?.code??'STORAGE',reply.error?.message??'تعذّر إتمام العملية.');if(['OWNER_MISMATCH','SESSION_EXPIRED'].includes(error.code))sessionInvalid(ownerId);throw error}
 return reply.value
}
export async function discoverTransport():Promise<Transport|undefined>{
 if(typeof window==='undefined')return undefined
 if(window.academy){transport={kind:'desktop-sqlite',request:async(command,payload)=>unwrap(await window.academy!.request(command,payload),(payload as {ownerId?:string})?.ownerId)};return transport}
 try{
  const response=await fetch('/api/health',{cache:'no-store',signal:AbortSignal.timeout(2500)})
  const health=response.ok?await response.json():undefined
  if(health?.provider==='sqlite'&&health.protocolVersion===1){
   localStorage.setItem('academy-data-provider','web-api')
   transport={kind:'web-api',request:async(command,payload)=>{
    if(!commands.includes(command))throw new TransportError('VALIDATION','عملية غير مدعومة.')
    let response:Response
    try{response=await fetch('/api/command',{method:'POST',signal:AbortSignal.timeout(15000),credentials:'same-origin',headers:{'Content-Type':'application/json','X-Academy-Request':'1'},body:JSON.stringify({command,payload})})}catch{throw new TransportError('OFFLINE','خادم الحسابات غير متاح. بقي تقدمك محفوظًا؛ حاول عند عودة الاتصال.')}
    return unwrap(await response.json(),(payload as {ownerId?:string})?.ownerId)
   }}
   return transport
  }
 }catch{}
 if(localStorage.getItem('academy-data-provider')==='web-api')throw new TransportError('OFFLINE','خادم الحسابات غير متاح. لن ننشئ مخزنًا بديلًا قد يُخفي تقدمك؛ أعد المحاولة عند عودة الاتصال.')
 transport=undefined;return undefined
}
