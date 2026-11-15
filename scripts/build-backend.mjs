import {build} from 'esbuild'
await build({entryPoints:['backend/engine.ts'],outfile:'build/engine.cjs',bundle:true,platform:'node',target:'node24',format:'cjs',sourcemap:false,external:['node:*'],legalComments:'none'})
await build({entryPoints:['backend/server.ts'],outfile:'build/server.mjs',bundle:true,platform:'node',target:'node24',format:'esm',sourcemap:false,external:['node:*'],legalComments:'none'})
