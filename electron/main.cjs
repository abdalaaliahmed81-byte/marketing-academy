'use strict'
const {app,BrowserWindow,protocol,shell,session,ipcMain,dialog}=require('electron')
const path=require('node:path')
const fs=require('node:fs')

protocol.registerSchemesAsPrivileged([{scheme:'academy',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}])
const root=path.resolve(__dirname,'../dist')
const origin='academy://app'
const {AcademyEngine,AcademyError,publicError}=require('../build/engine.cjs')
let engine
const tokens=new Map()
const commands=new Set(['register','recoverBackup','login','logout','changePassword','read','commit','migrateLegacy','profile','updateProfile'])
const {safeExternal}=require('./external.cjs')
function appUrl(url){try{const u=new URL(url);return u.protocol==='academy:'&&u.host==='app'}catch{return false}}
const channel=require('./flavor.json').channel
const profile=require('./profile.cjs').resolveProfile(channel,app.getPath('appData'),app.getPath('userData'),process.env.ACADEMY_TEST_DATA_DIR)
if(channel==='qa')app.setName('Marketing Academy QA')
app.setPath('userData',profile.userData)
if(profile.sessionData)app.setPath('sessionData',profile.sessionData)
if(!app.requestSingleInstanceLock())app.quit()
else {
 app.on('second-instance',()=>{const w=BrowserWindow.getAllWindows()[0];if(w){if(w.isMinimized())w.restore();w.focus()}})
 app.whenReady().then(()=>{
  try{engine=new AcademyEngine(path.join(app.getPath('userData'),'academy.sqlite'))}catch{dialog.showErrorBox('تعذّر فتح البيانات','لم نغيّر تقدمك أو نحذف بياناتك. تعذّر فتح التخزين بأمان.');app.quit();return}
  ipcMain.handle('academy:profile-info',event=>{const frame=event.senderFrame;if(!frame||frame!==event.sender.mainFrame||!appUrl(frame.url))throw new Error('Forbidden profile source');return {channel}})
  ipcMain.handle('academy:request',async(event,request)=>{
   try{
    const frame=event.senderFrame
    if(!frame||frame!==event.sender.mainFrame||!appUrl(frame.url))throw new AcademyError('FORBIDDEN','مصدر الطلب غير مصرح.')
    if(!request||!commands.has(request.command)||Object.keys(request).some(k=>!['command','payload'].includes(k)))throw new AcademyError('VALIDATION','عملية غير مدعومة.')
    if(Buffer.byteLength(JSON.stringify(request),'utf8')>10000000)throw new AcademyError('TOO_LARGE','الطلب أكبر من الحد الآمن.')
    const value=await engine.request(request.command,request.payload,tokens.get(event.sender.id))
    if(value&&value.token){
     if(event.sender.isDestroyed()||event.sender.mainFrame!==frame){engine.endSession(value.token);throw new AcademyError('SESSION_EXPIRED','أُغلقت نافذة الدخول.')}
     const old=tokens.get(event.sender.id);if(old)engine.endSession(old)
     tokens.set(event.sender.id,value.token)
     return {ok:true,value:{session:value.session,snapshot:value.snapshot}}
    }
    if(request.command==='logout')tokens.delete(event.sender.id)
    return {ok:true,value}
   }catch(error){return {ok:false,error:publicError(error)}}
  })
  protocol.handle('academy',async request=>{
   if(!appUrl(request.url)||!['GET','HEAD'].includes(request.method))return new Response('Forbidden',{status:403})
   let file
   try{const u=new URL(request.url);file=path.resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname))}catch{return new Response('Invalid path',{status:400})}
   if(!file.startsWith(root+path.sep))return new Response('Forbidden',{status:403})
   try{if(!fs.statSync(file).isFile())throw new Error('file')}catch{return new Response('Not found',{status:404})}
   const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webmanifest':'application/manifest+json','.woff2':'font/woff2'}
   return new Response(request.method==='HEAD'?null:await fs.promises.readFile(file),{headers:{'Content-Type':types[path.extname(file)]??'application/octet-stream'}})
  })
  session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false))
  session.defaultSession.setPermissionCheckHandler(()=>false)
  session.defaultSession.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!appUrl(details.url)}))
  session.defaultSession.webRequest.onHeadersReceived((details,callback)=>callback({responseHeaders:{...details.responseHeaders,
   'Content-Security-Policy':["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-src 'none'"],
   'X-Content-Type-Options':['nosniff']
  }}))
  const window=new BrowserWindow({width:1320,height:900,minWidth:360,minHeight:600,show:false,title:channel==='qa'?'أكاديمية التسويق · QA Studio':'أكاديمية التسويق ٢.٠',backgroundColor:'#211a49',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,allowRunningInsecureContent:false,devTools:!app.isPackaged}})
  if(channel==='qa'){window.setTitle('أكاديمية التسويق · QA Studio');window.webContents.on('page-title-updated',event=>{event.preventDefault();window.setTitle('أكاديمية التسويق · QA Studio')})}
  window.webContents.setWindowOpenHandler(({url})=>{if(safeExternal(url))shell.openExternal(url);return {action:'deny'}})
  window.webContents.on('will-navigate',(event,url)=>{if(!appUrl(url))event.preventDefault()})
  window.webContents.on('will-attach-webview',event=>event.preventDefault())
  const contentsId=window.webContents.id
  window.webContents.on('destroyed',()=>{const token=tokens.get(contentsId);if(token)engine.endSession(token);tokens.delete(contentsId)})
  window.on('ready-to-show',()=>window.show())
  window.webContents.on('did-fail-load',(_event,code,description)=>console.error('Local application load failed:',code,description))
  window.loadURL(origin+'/')
 })
 app.on('window-all-closed',()=>app.quit())
 app.on('will-quit',()=>{engine?.close()})
}
