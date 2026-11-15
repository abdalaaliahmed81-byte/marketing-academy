import {execFileSync} from 'node:child_process'
import {readFileSync,statSync} from 'node:fs'
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n')
const forbidden=[]
for(const file of files){
 if(/\.(pdf|sqlite(?:-wal|-shm)?|db(?:-wal|-shm)?|pfx|pem|key)$/i.test(file)||/(^|\/)\.env(?:\.|$)/.test(file)||/backup.*\.json$/i.test(file))forbidden.push(file)
 if(!/\.(?:ts|tsx|js|mjs|cjs|md|json|ya?ml|conf|html|css|gitignore|dockerignore)$/i.test(file)||statSync(file).size>2_000_000)continue
 const text=readFileSync(file,'utf8')
 if(/(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(text))forbidden.push(file)
}
if(forbidden.length)throw new Error('Source publication blocked: '+forbidden.join(', '))
console.log('Source guard passed: '+files.length+' files checked; no forbidden books/databases/private keys/token patterns found. This is a bounded pattern check, not proof of absence of every secret.')
