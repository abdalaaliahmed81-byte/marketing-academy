'use strict'
const {contextBridge,ipcRenderer}=require('electron')
const allowed=new Set(['register','login','logout','changePassword','read','commit','migrateLegacy','profile','updateProfile'])
contextBridge.exposeInMainWorld('academy',Object.freeze({kind:'desktop-sqlite',request(command,payload){
 if(!allowed.has(command))return Promise.resolve({ok:false,error:{code:'VALIDATION',message:'عملية غير مدعومة.'}})
 return ipcRenderer.invoke('academy:request',{command,payload})
}}))
