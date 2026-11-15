import {z} from '../validation'
import {normalizeState,type LearnerState} from '../data-schema'
export const commands=['register','login','logout','changePassword','read','commit','migrateLegacy'] as const
export type Command=typeof commands[number]
export interface UserSession {id:string;name:string}
export interface Snapshot {ownerId:string;revision:number;state:LearnerState}
export interface AuthResult {session:UserSession;snapshot:Snapshot}
export interface Transport {kind:'desktop-sqlite'|'web-api';request(command:Command,payload:unknown):Promise<unknown>}
export class TransportError extends Error{constructor(public code:string,message:string){super(message)}}
export function parseSnapshot(raw:unknown):Snapshot{
 const value=z.object({ownerId:z.string().uuid(),revision:z.number().int().nonnegative(),state:z.unknown()}).strict().parse(raw)
 return {...value,state:normalizeState(value.state)}
}
export function parseAuthResult(raw:unknown):AuthResult{
 const value=z.object({session:z.object({id:z.string().uuid(),name:z.string().min(1).max(80)}).strict(),snapshot:z.unknown()}).strict().parse(raw)
 const snapshot=parseSnapshot(value.snapshot)
 if(value.session.id!==snapshot.ownerId)throw new Error('مالك البيانات لا يطابق الحساب.')
 return {session:value.session,snapshot}
}
