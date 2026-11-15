const listeners=new Set<()=>void>()
export const subscribeStore=(listener:()=>void)=>{listeners.add(listener);return ()=>{listeners.delete(listener)}}
export function notifyStore(){for(const listener of listeners)listener()}
export function sessionInvalid(ownerId?:string){if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('academy-session-invalid',{detail:ownerId}))}
