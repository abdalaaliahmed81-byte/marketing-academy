import {act,renderHook,waitFor} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
import {useSavedDraft} from './useSavedDraft'
afterEach(()=>vi.useRealTimers())
it('serializes drafts, never acknowledges a stale save as the current draft, and flushes before export',async()=>{
 vi.useFakeTimers();const calls:string[]=[],resolvers:(()=>void)[]=[]
 const save=(v:string)=>{calls.push(v);return new Promise<void>(resolve=>resolvers.push(resolve))}
 const hook=renderHook(({value})=>useSavedDraft(value,save),{initialProps:{value:''}})
 hook.rerender({value:'أ'});await act(async()=>{await vi.advanceTimersByTimeAsync(700)})
 hook.rerender({value:'أحدث'});await act(async()=>{await vi.advanceTimersByTimeAsync(700)})
 expect(calls).toEqual(['أ']);expect(hook.result.current.status).not.toBe('حُفظ المشروع تلقائيًا')
 await act(async()=>{resolvers.shift()!();await Promise.resolve()});expect(calls).toEqual(['أ','أحدث'])
 await act(async()=>{resolvers.shift()!();await hook.result.current.flush()});expect(hook.result.current.status).toBe('حُفظ المشروع تلقائيًا');hook.unmount()
})
it('keeps failure visible and retries the same draft without pretending it saved',async()=>{
 const save=vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
 const hook=renderHook(({value})=>useSavedDraft(value,save),{initialProps:{value:''}});hook.rerender({value:'مسودة باقية'})
 await act(async()=>{await expect(hook.result.current.flush()).rejects.toThrow('offline')})
 expect(hook.result.current.status).toContain('تعذّر الحفظ')
 await act(async()=>{await hook.result.current.flush()});await waitFor(()=>expect(hook.result.current.status).toBe('حُفظ المشروع تلقائيًا'));expect(save).toHaveBeenLastCalledWith('مسودة باقية');hook.unmount()
})
it('saves a reverted value even when it matches an earlier acknowledgment behind an in-flight later write',async()=>{
 vi.useFakeTimers();const calls:string[]=[],resolvers:(()=>void)[]=[]
 const save=(v:string)=>{calls.push(v);return new Promise<void>(resolve=>resolvers.push(resolve))}
 const hook=renderHook(({value})=>useSavedDraft(value,save),{initialProps:{value:''}})
 hook.rerender({value:'أ'});await act(async()=>{await vi.advanceTimersByTimeAsync(700)})
 hook.rerender({value:'ب'});await act(async()=>{await vi.advanceTimersByTimeAsync(700)})
 await act(async()=>{resolvers.shift()!();await Promise.resolve()});expect(calls).toEqual(['أ','ب'])
 hook.rerender({value:'أ'});await act(async()=>{await vi.advanceTimersByTimeAsync(700)})
 await act(async()=>{resolvers.shift()!();await Promise.resolve()});expect(calls).toEqual(['أ','ب','أ'])
 await act(async()=>{resolvers.shift()!();await hook.result.current.flush()});expect(hook.result.current.status).toBe('حُفظ المشروع تلقائيًا');hook.unmount()
})
it('warns and flushes a reverted draft on immediate unmount while a different write is in flight',async()=>{
 vi.useFakeTimers();const calls:string[]=[],resolvers:(()=>void)[]=[]
 const save=(v:string)=>{calls.push(v);return new Promise<void>(resolve=>resolvers.push(resolve))}
 const hook=renderHook(({value})=>useSavedDraft(value,save),{initialProps:{value:''}})
 hook.rerender({value:'أ'});await act(async()=>{await vi.advanceTimersByTimeAsync(700)})
 hook.rerender({value:'ب'});await act(async()=>{await vi.advanceTimersByTimeAsync(700)})
 await act(async()=>{resolvers.shift()!();await Promise.resolve()})
 hook.rerender({value:'أ'})
 const closing=new Event('beforeunload',{cancelable:true});window.dispatchEvent(closing);expect(closing.defaultPrevented).toBe(true)
 hook.unmount()
 await act(async()=>{resolvers.shift()!();await Promise.resolve()});expect(calls).toEqual(['أ','ب','أ'])
 await act(async()=>{resolvers.shift()!();await Promise.resolve()})
})
