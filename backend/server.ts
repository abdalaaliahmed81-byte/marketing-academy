import {createServer,type IncomingMessage,type ServerResponse} from 'node:http'
import {readFile,stat,realpath} from 'node:fs/promises'
import {existsSync} from 'node:fs'
import {resolve,sep,extname} from 'node:path'
import {pathToFileURL} from 'node:url'
import {z} from '../src/validation'
import {commands} from '../src/storage/protocol'
import {AcademyEngine,AcademyError,publicError,type AuthResponse} from './engine'
const envelope=z.object({command:z.enum(commands),payload:z.unknown()}).strict()
const statusFor:Record<string,number>={VALIDATION:400,AUTH_FAILED:401,SESSION_EXPIRED:401,OWNER_MISMATCH:409,DUPLICATE:409,CONFLICT:409,FORBIDDEN:403,TOO_LARGE:413,RATE_LIMIT:429,INTEGRITY:503,SCHEMA:503,STORAGE:503}
export function createApiServer(options:{engine:AcademyEngine;origin:string;staticRoot?:string}){
 const origin=new URL(options.origin).origin,u=new URL(origin)
 if(u.protocol!=='https:'&&!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw new Error('Non-loopback API deployment requires an HTTPS origin.')
 const secure=u.protocol==='https:',buckets=new Map<string,{start:number;count:number}>()
 const root=options.staticRoot?resolve(options.staticRoot):undefined
 function json(res:ServerResponse,status:number,body:unknown){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"});res.end(JSON.stringify(body))}
 function token(req:IncomingMessage){const found=(req.headers.cookie??'').split(';').map(v=>v.trim()).find(v=>v.startsWith('ma_session='))?.slice(11);return found&&/^[a-f0-9]{64}$/.test(found)?found:undefined}
 function limit(req:IncomingMessage,kind:string){
  const now=Date.now(),key=(req.socket.remoteAddress??'unknown')+':'+kind
  for(const [key,bucket] of buckets)if(now-bucket.start>60000)buckets.delete(key)
  if(buckets.size>10000)throw new AcademyError('RATE_LIMIT','طلبات كثيرة؛ حاول لاحقًا.')
  const bucket=buckets.get(key)??{start:now,count:0};bucket.count++;buckets.set(key,bucket)
  if(bucket.count>(kind==='register'?10:kind==='auth'?30:1200))throw new AcademyError('RATE_LIMIT','طلبات كثيرة؛ حاول بعد دقيقة.')
 }
 const server=createServer({requestTimeout:30000,headersTimeout:10000,maxHeaderSize:8192},async(req,res)=>{
  try{
   const pathname=new URL(req.url??'/',origin).pathname
   if(pathname==='/api/health'&&req.method==='GET'){json(res,200,{...options.engine.health(),ok:true});return}
   if(pathname==='/api/command'){
    if(req.method!=='POST')throw new AcademyError('FORBIDDEN','طريقة غير مسموحة.')
    if(req.headers.origin!==origin||req.headers['x-academy-request']!=='1'||!/^application\/json(?:;|$)/i.test(req.headers['content-type']??''))throw new AcademyError('FORBIDDEN','مصدر الطلب أو نوعه غير مصرح.')
    limit(req,'all')
    if(Number(req.headers['content-length']??0)>10000000)throw new AcademyError('TOO_LARGE','الطلب أكبر من الحد الآمن.')
    const chunks:Buffer[]=[];let length=0
    for await(const chunk of req){const part=Buffer.from(chunk);length+=part.length;if(length>10000000)throw new AcademyError('TOO_LARGE','الطلب أكبر من الحد الآمن.');chunks.push(part)}
    let raw:unknown
    try{raw=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw new AcademyError('VALIDATION','JSON غير صالح.')}
    const request=envelope.parse(raw)
    if(['login','migrateLegacy','changePassword'].includes(request.command))limit(req,'auth')
    if(['register','recoverBackup'].includes(request.command))limit(req,'register')
    const previous=token(req),result=await options.engine.request(request.command,request.payload,previous)
    if(['register','recoverBackup','login','migrateLegacy'].includes(request.command)){
     const auth=result as AuthResponse
     if(previous)options.engine.endSession(previous)
     res.setHeader('Set-Cookie',`ma_session=${auth.token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=43200${secure?'; Secure':''}`)
     json(res,200,{ok:true,value:{session:auth.session,snapshot:auth.snapshot}});return
    }
    if(request.command==='logout')res.setHeader('Set-Cookie',`ma_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0${secure?'; Secure':''}`)
    json(res,200,{ok:true,value:result});return
   }
   if(pathname.startsWith('/api/')){json(res,404,{ok:false,error:{code:'NOT_FOUND',message:'المسار غير موجود.'}});return}
   if(!root||!['GET','HEAD'].includes(req.method??'')){res.writeHead(404).end();return}
   let file:string
   try{file=resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname))}catch{res.writeHead(400).end();return}
   if(!file.startsWith(root+sep)){res.writeHead(403).end();return}
   try{const physical=await realpath(file),physicalRoot=await realpath(root);if(!physical.startsWith(physicalRoot+sep)){res.writeHead(403).end();return}if(!(await stat(file)).isFile()){res.writeHead(404).end();return}}catch{res.writeHead(404).end();return}
   const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json'}
   res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-cache','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"})
   res.end(req.method==='HEAD'?undefined:await readFile(file))
  }catch(error){const detail=publicError(error);if(detail.code==='RATE_LIMIT')res.setHeader('Retry-After','60');json(res,statusFor[detail.code]??503,{ok:false,error:detail})}
 })
 server.keepAliveTimeout=5000;server.maxRequestsPerSocket=100
 return server
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const port=Number(process.env.PORT??3000)
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid API port')
 const dataDir=resolve(process.env.ACADEMY_DATA_DIR??'work/api-data')
 const engine=new AcademyEngine(resolve(dataDir,'academy.sqlite'))
 const staticRoot=existsSync('dist/index.html')?resolve('dist'):undefined
 const server=createApiServer({engine,origin:process.env.APP_ORIGIN??`http://127.0.0.1:${port}`,staticRoot})
 server.listen(port,process.env.HOST??'127.0.0.1',()=>console.log('Marketing Academy API ready on port '+port))
 const close=()=>server.close(()=>{engine.close();process.exit(0)})
 process.on('SIGINT',close);process.on('SIGTERM',close)
}
