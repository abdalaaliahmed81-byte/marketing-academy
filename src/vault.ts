import {gcm} from '@noble/ciphers/aes.js'
import type {DBCore,DBCoreCursor,Middleware} from 'dexie'

const encoder=new TextEncoder(),decoder=new TextDecoder()
export const hex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')
export function unhex(text:string){
  if(!/^(?:[0-9a-f]{2})+$/.test(text))throw new Error('بيانات مشفرة غير صالحة.')
  return new Uint8Array(text.match(/../g)!.map(n=>parseInt(n,16)))
}
export const random=(size:number)=>crypto.getRandomValues(new Uint8Array(size))
export function seal(key:Uint8Array,value:unknown,aad:string){
  const nonce=random(12)
  return hex(nonce)+':'+hex(gcm(key,nonce,encoder.encode(aad)).encrypt(encoder.encode(JSON.stringify(value))))
}
export function unseal<T>(key:Uint8Array,value:string,aad:string):T{
  const [nonce,body,...extra]=value.split(':')
  if(extra.length||!body)throw new Error('بيانات مشفرة غير صالحة.')
  return JSON.parse(decoder.decode(gcm(key,unhex(nonce),encoder.encode(aad)).decrypt(unhex(body)))) as T
}
/** Keep only indexed metadata visible; bind ciphertext to table and primary key. */
export function encryptedStorage(key:Uint8Array):Middleware<DBCore>{
  return {stack:'dbcore',name:'academy-vault',level:1,create(down){return {...down,table(name){
    const table=down.table(name)
    if(name==='lessons')return table
    const indices=[table.schema.primaryKey,...table.schema.indexes]
    const fields=[...new Set(indices.flatMap(i=>typeof i.keyPath==='string'?[i.keyPath]:i.keyPath??[]))]
    const aad=(row:Record<string,unknown>)=>name+':'+JSON.stringify(table.schema.primaryKey.extractKey?.(row))
    const encrypt=(row:Record<string,unknown>)=>({...Object.fromEntries(fields.map(f=>[f,row[f]])),_sealed:seal(key,row,aad(row))})
    const decrypt=(row:Record<string,unknown>|undefined)=>row?unseal(key,String(row._sealed),aad(row)):undefined
    const wrap=(cursor:DBCoreCursor):DBCoreCursor=>new Proxy(cursor,{get(target,prop){
      if(prop==='value')return decrypt(target.value)
      if(prop==='next')return async()=>wrap(await target.next())
      const value=Reflect.get(target,prop)
      return typeof value==='function'?value.bind(target):value
    }})
    return {...table,
      mutate(req){
        if(req.type==='add'||req.type==='put'){
          // Encrypt full records and disable lower-level partial-update optimizations.
          const copy={...req,values:req.values.map(encrypt)}
          if(copy.type==='put'){delete copy.changeSpec;delete copy.updates;delete copy.criteria}
          return table.mutate(copy)
        }
        return table.mutate(req)
      },
      get:async req=>decrypt(await table.get(req)),
      getMany:async req=>(await table.getMany(req)).map(decrypt),
      query:async req=>{const result=await table.query(req);return req.values?{...result,result:result.result.map(decrypt)}:result},
      openCursor:async req=>{const cursor=await table.openCursor(req);return cursor&&req.values?wrap(cursor):cursor}
    }
  }}}}
}
