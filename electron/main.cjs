'use strict'
const {app,BrowserWindow,protocol,shell,session}=require('electron')
const path=require('node:path')
const fs=require('node:fs')

protocol.registerSchemesAsPrivileged([{scheme:'academy',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}])
const root=path.resolve(__dirname,'../dist')
const origin='academy://app'
const externalHosts=new Set(['grow.google','academy.hubspot.com','www.facebookblueprint.com','skillshop.withgoogle.com','developers.google.com','www.semrush.com','allandib.com','www.penguinrandomhouse.com','seths.blog','support.google.com','www.google.com','www.ftc.gov','www.w3.org'])
function safeExternal(url){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&externalHosts.has(u.hostname)}catch{return false}}
function appUrl(url){try{const u=new URL(url);return u.protocol==='academy:'&&u.host==='app'}catch{return false}}
if(process.env.ACADEMY_TEST_DATA_DIR)app.setPath('userData',path.resolve(process.env.ACADEMY_TEST_DATA_DIR))
if(!app.requestSingleInstanceLock())app.quit()
else {
 app.on('second-instance',()=>{const w=BrowserWindow.getAllWindows()[0];if(w){if(w.isMinimized())w.restore();w.focus()}})
 app.whenReady().then(()=>{
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
  const window=new BrowserWindow({width:1320,height:900,minWidth:360,minHeight:600,show:false,title:'أكاديمية التسويق ٢.٠',backgroundColor:'#211a49',autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,allowRunningInsecureContent:false,devTools:!app.isPackaged}})
  window.webContents.setWindowOpenHandler(({url})=>{if(safeExternal(url))shell.openExternal(url);return {action:'deny'}})
  window.webContents.on('will-navigate',(event,url)=>{if(!appUrl(url))event.preventDefault()})
  window.webContents.on('will-attach-webview',event=>event.preventDefault())
  window.on('ready-to-show',()=>window.show())
  window.webContents.on('did-fail-load',(_event,code,description)=>console.error('Local application load failed:',code,description))
  window.loadURL(origin+'/')
 })
 app.on('window-all-closed',()=>app.quit())
}
