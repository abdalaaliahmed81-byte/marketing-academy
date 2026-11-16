// Build-time capability plus immutable main-process channel; never URL/localStorage selected.
const qaBuild=()=>typeof import.meta.env!=='undefined'&&import.meta.env.VITE_QA_STUDIO==='1'
let verified=false
export async function verifyEdition(){
 if(!qaBuild())return false
 try{verified=(await window.academy?.profileInfo?.())?.channel==='qa'}catch{verified=false}
 return verified
}
export const isQAStudio=()=>qaBuild()&&verified
