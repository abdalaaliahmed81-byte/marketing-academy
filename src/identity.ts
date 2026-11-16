/** Existing canonical identity is deliberately unchanged; passwords never use this function. */
export const normalizeIdentity=(name:string)=>name.normalize('NFKC').trim().toLocaleLowerCase('en-US')
export function validIdentity(name:string){const n=Array.from(name).length;return n>=3&&n<=40&&/^[\p{L}\p{N}_. -][\p{L}\p{M}\p{N}_. -]*$/u.test(name)}
/** Validate new secrets by Unicode code points; never normalize or trim their bytes. */
export function validNewPassword(password:string){const n=Array.from(password).length;return n>=12&&n<=128}
