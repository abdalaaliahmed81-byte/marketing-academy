import {createRequire} from 'node:module'
const {safeExternal}=createRequire(import.meta.url)('../electron/external.cjs')
import assert from 'node:assert/strict'
import {readFile,mkdir,writeFile,mkdtemp,rm} from 'node:fs/promises'
import {build} from 'esbuild'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'
const folder=await mkdtemp(join(tmpdir(),'academy-content-'))
try{
 const file=join(folder,'audit.mjs')
 await build({stdin:{contents:"export {lessons} from './src/lessons';export {modules} from './src/curriculum';export {activitiesFor} from './src/interactive/content';export {moduleGuide,miniProject} from './src/project-learning/model';export {artifactFields,scoreQuestions} from './src/domain';export {assessmentQuestions,CURRENT_ASSESSMENT} from './src/lessons/assessment-history'",resolveDir:process.cwd()},outfile:file,bundle:true,platform:'node',format:'esm',logLevel:'silent'})
 const {lessons,modules,activitiesFor,moduleGuide,miniProject,artifactFields,scoreQuestions,assessmentQuestions,CURRENT_ASSESSMENT}=await import(pathToFileURL(file).href)
 const provenance=JSON.parse(await readFile('src/content/provenance.json','utf8')),sources=new Map(provenance.sources.map(s=>[s.id,s])),unique=xs=>new Set(xs).size===xs.length,arabic=s=>/[ء-ي]/u.test(s),words=s=>s.trim().split(/\s+/u).length
 assert.equal(modules.length,12);assert.equal(lessons.length,60);assert(unique(lessons.map(l=>l.id)));assert.equal(provenance.lessons.length,60);assert(unique(provenance.lessons.map(l=>l.id)))
 for(const s of sources.values()){assert(new URL(s.url).protocol==='https:');assert(safeExternal(s.url)&&safeExternal(s.rightsURL),s.id+': blocked external citation');for(const field of ['title','author','scope','rights','access','use'])assert(s[field]?.trim(),s.id+': '+field)}
 let gradingCombinations=0
 const rows=lessons.map((l,i)=>{
  assert.equal(l.id,`m${String(Math.floor(i/5)+1).padStart(2,'0')}-l${String(i%5+1).padStart(2,'0')}`);assert.equal(l.module,Math.floor(i/5)+1)
  for(const field of ['title','goal','example','miniCase','summary','assignment','mission'])assert(arabic(l[field])&&l[field].trim().length>=10,l.id+': '+field)
  assert(words(l.reading.join(' '))>=200,l.id+': insufficient reading depth guard');assert(l.reading.every(arabic));assert(/محاكاة|افتراض/.test(l.example));assert(l.rubric.length===3&&l.rubric.every(arabic))
  const reference=provenance.lessons.find(p=>p.id===l.id);assert(reference.references.length>0);for(const r of reference.references){assert(sources.has(r.sourceId),l.id+': missing source');assert(r.claim.trim()&&r.locator.trim())}
  for(const version of [1,2,CURRENT_ASSESSMENT]){
   const questions=assessmentQuestions(l,version);assert.equal(questions.length,5);assert(unique(questions.map(q=>q.id)))
   for(const q of questions){if(version===CURRENT_ASSESSMENT)assert(arabic(q.prompt)&&arabic(q.why)&&q.why.length>=15,q.id+': Arabic explanation');assert.equal(q.options.length,3);assert(unique(q.options.map(o=>o.id)));assert(unique(q.options.map(o=>o.label.trim())));assert.equal(q.options.filter(o=>o.id===q.answer).length,1)}
   for(let mask=0;mask<243;mask++){
    let n=mask,correct=0;const answers={},missed=[]
    for(const q of questions){const choice=q.options[n%3].id;n=Math.floor(n/3);answers[q.id]=choice;if(choice===q.answer)correct++;else missed.push(q.id)}
    assert.deepEqual(scoreQuestions(questions,answers),{score:correct*20,passed:correct>=4,missed});gradingCombinations++
   }
  }
  const activities=activitiesFor(l);assert.equal(activities.length,6);assert(unique(activities.map(a=>a.id)));assert(activities.every(a=>a.title.trim()&&a.prompt.trim()))
  const mini=miniProject(l);assert(mini.steps.length>=4&&mini.solution.length>=100&&mini.template.length>=100&&mini.deliverables.length>=2)
  return {id:l.id,title:l.title,readingWords:words(l.reading.join(' ')),questions:5,activities:6,assignment:true,miniProject:true,sourceIds:reference.references.map(r=>r.sourceId),status:'PASS structural/grading/traceability checks; agent review scoped in CONTENT_AUDIT.md'}
 })
 const projects=Array.from({length:12},(_,i)=>{const p=moduleGuide(i);for(const field of ['title','brief','objective','prerequisites','materials','concepts','template','advice','offlineProof'])assert(p[field]?.trim(),`project${i+1}: ${field}`);assert.equal(p.steps.length,6);assert(p.worked.length>=4&&words(p.worked.join(' '))>=150);assert.equal(p.deliverables.length,4);assert.equal(p.rubric.length,4);assert(p.mistakes.length>=2);return {module:i+1,title:p.title,workedWords:words(p.worked.join(' ')),status:'PASS structural completeness'}})
 assert.equal(artifactFields.length,27);assert(!moduleGuide(11).worked.join(' ').includes('26 حقل'))
 const contentSha256=createHash('sha256').update(JSON.stringify({lessons,projects:Array.from({length:12},(_,i)=>moduleGuide(i)),provenance})).digest('hex')
 const report={status:'PASS',checkedAt:new Date().toISOString(),contentSha256,modules:12,lessons:60,questions:300,activities:360,miniProjects:60,workedModuleProjects:12,capstoneFields:27,allCitationLinksAllowedByDesktopPolicy:true,assessmentVersions:[1,2,CURRENT_ASSESSMENT],gradingCombinations,rows,projects,limits:['Structural/traceability/grade checks cannot establish factual truth, effective teaching or independent human approval.','URLs and rights metadata do not imply a license to copy provider courses.','Small simulated examples are not observed Iraqi market statistics.']}
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/content-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined,projects:undefined}))
}finally{await rm(folder,{recursive:true,force:true})}
