import {mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {spawn} from 'node:child_process'
const port=Number(process.env.ACADEMY_TEST_API_PORT??4174)
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid browser fixture port')
const folder=await mkdtemp(join(tmpdir(),'academy-api-browser-'))
const child=spawn(process.execPath,['build/server.mjs'],{stdio:'inherit',env:{...process.env,PORT:String(port),HOST:'127.0.0.1',APP_ORIGIN:'http://127.0.0.1:'+port,ACADEMY_DATA_DIR:folder}})
const close=()=>child.kill('SIGTERM')
process.on('SIGTERM',close);process.on('SIGINT',close)
child.on('exit',async code=>{await rm(folder,{recursive:true,force:true});process.exit(code??0)})
