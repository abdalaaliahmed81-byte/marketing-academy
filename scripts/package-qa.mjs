import {readFile,writeFile,cp,mkdir,rm,copyFile} from 'node:fs/promises'
import path from 'node:path'
import {execFileSync} from 'node:child_process'
const root=process.cwd(),stage=path.join(root,'work','qa-package'),pkg=JSON.parse(await readFile('package.json','utf8'))
await rm(stage,{recursive:true,force:true});await mkdir(stage,{recursive:true})
for(const folder of ['dist','build','electron'])await cp(folder,path.join(stage,folder),{recursive:true})
// Build a separate renderer: QA tools are never copied into the Production dist.
execFileSync(process.execPath,[path.join(root,'node_modules','vite','bin','vite.js'),'build','--outDir',path.join(stage,'dist')],{stdio:'inherit',env:{...process.env,VITE_QA_STUDIO:'1'}})
await mkdir(path.join(stage,'public'));await copyFile('public/academy.ico',path.join(stage,'public','academy.ico'))
await writeFile(path.join(stage,'electron','flavor.json'),JSON.stringify({channel:'qa'}))
const qa={...pkg,name:'marketing-academy-qa',description:'Marketing Academy QA Studio · بيانات اختبار معزولة',dependencies:{},devDependencies:{},build:{...pkg.build,electronVersion:pkg.devDependencies.electron,appId:'com.marketingacademy.desktop.qa',productName:'Marketing Academy QA',directories:{output:path.join(root,'release','qa-build')},win:{...pkg.build.win,artifactName:'Marketing-Academy-QA-Windows-x64.${ext}'}}}
await writeFile(path.join(stage,'package.json'),JSON.stringify(qa,null,2))
execFileSync(process.execPath,[path.join(root,'scripts','check-editions.mjs')],{stdio:'inherit'})
if(!process.argv.includes('--stage-only')){
 execFileSync(process.execPath,[path.join(root,'node_modules','electron-builder','cli.js'),'--projectDir',stage,'--win','portable','--x64','--publish','never'],{stdio:'inherit'})
 await copyFile(path.join(root,'release','qa-build','Marketing-Academy-QA-Windows-x64.exe'),path.join(root,'release','Marketing-Academy-QA-Windows-x64.exe'))
}
console.log('QA stage ready: '+stage+'; isolated packaged channel; production source and profile unchanged')
