import {mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {spawn} from 'node:child_process'
const folder=await mkdtemp(join(tmpdir(),'academy-api-browser-'))
const child=spawn(process.execPath,['build/server.mjs'],{stdio:'inherit',env:{...process.env,PORT:'4174',HOST:'127.0.0.1',APP_ORIGIN:'http://127.0.0.1:4174',ACADEMY_DATA_DIR:folder}})
const close=()=>child.kill('SIGTERM')
process.on('SIGTERM',close);process.on('SIGINT',close)
child.on('exit',async code=>{await rm(folder,{recursive:true,force:true});process.exit(code??0)})
