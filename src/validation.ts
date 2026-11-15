import {z} from 'zod'
// Use the interpreter consistently. Validation must never require eval/new Function
// in the sandboxed renderer or change behavior under CSP/test instrumentation.
z.config({jitless:true})
export {z}
