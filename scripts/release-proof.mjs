import {assertPublicationReadiness} from './educational-gate.mjs'
import {createHash} from 'node:crypto'
import {readFile,writeFile,appendFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const read=async file=>JSON.parse(await readFile(file,'utf8'))
const educationalReadiness=await read('docs/EDUCATIONAL_READINESS.json')
const releaseChannel=process.env.RELEASE_CHANNEL??'stable'
assertPublicationReadiness(educationalReadiness,releaseChannel)
const windows=await read('verified/artifacts/windows-build.json')
const web=await read('verified-web/artifacts/playwright.json')
const docker=await read('verified-web/artifacts/docker-smoke.json')
const content=await read('verified-web/artifacts/content-audit.json')
const validatedContent=await read('verified-web/artifacts/content-validation.json');assert.equal(validatedContent.status,'PASS');assert.equal(validatedContent.gradingCombinations,43740)
const projects=await read('verified-web/artifacts/project-learning-audit.json')
const tooling=await read('verified-web/artifacts/dependency-audit.json')
const audit=await read('verified-web/artifacts/production-dependency-audit.json')
for(const key of ['restrictedChildPath','offlineLessonCompletion','quizAndCompletionSurviveRestart','actualNewAccountIsolation'])assert.equal(windows.portableExecutableSmoke[key],true)
assert.equal(windows.qa.portableExecutableSmoke.channel,'qa');assert.equal(windows.qa.portableExecutableSmoke.status,'passed');assert.equal(windows.qa.normalStart.status,'passed');assert.equal(windows.isolation.status,'passed');assert.equal(windows.isolation.productionDatabaseUnchangedByQA,true)
assert.equal(windows.normalStart.status,'passed');assert.equal(windows.normalStart.restrictedPath,true)
assert.equal(windows.status,'passed');assert.equal(windows.commit,process.env.GITHUB_SHA)
assert.equal(web.stats.unexpected,0);assert.equal(web.stats.skipped,0);assert(web.stats.expected>=28)
assert.equal(docker.status,'passed');assert.equal(docker.sqliteApi,true);assert.equal(docker.profileSurvivesApiRestart,true);assert.equal(docker.progressSurvivesApiRestart,true);assert.equal(windows.portableExecutableSmoke.sqlite.legacySourcesPreserved,true);assert.equal(windows.portableExecutableSmoke.sqlite.encryptedRecords,true);assert.equal(windows.portableExecutableSmoke.sqlite.schemaVersion,1);assert.equal(windows.portableExecutableSmoke.profilePersistence,true);assert.equal(windows.portableExecutableSmoke.noteTimestampPersistence,true);assert.equal(windows.portableExecutableSmoke.interactiveActivityPersistence,true);assert.equal(content.lessons,60);assert.equal(content.questions,300);assert.equal(content.moduleProjects,12)
assert.equal(projects.moduleGuides.length,12);assert.equal(projects.miniProjects.length,60);assert.equal(projects.capstone.fields.length,27);assert.equal(projects.capstone.workedCases.length,3);assert.equal(windows.portableExecutableSmoke.projectAutosavePersistence,true);assert.equal(docker.projectProgressSurvivesApiRestart,true)
assert.equal(audit.metadata.vulnerabilities.total,0)
assert.equal(tooling.metadata.vulnerabilities.high,0);assert.equal(tooling.metadata.vulnerabilities.critical,0)
const report={status:'passed automated release gates',releaseChannel,educationalReadiness,commit:windows.commit,verificationRun:process.env.VERIFY_RUN_URL,version:windows.version,windows,web:{passed:web.stats.expected,failed:web.stats.unexpected,skipped:web.stats.skipped},docker,validatedContent,content:{modules:12,lessons:60,questions:300,practicalActivities:60,workedModuleProjects:12,workedMiniProjects:60,capstoneFields:27,workedCapstoneCases:3},projectLearning:projects.capstone,productionDependencies:audit.metadata.vulnerabilities,buildToolDependencies:{counts:tooling.metadata.vulnerabilities,affectedPackages:Object.keys(tooling.vulnerabilities)},reviewLimits:['Agent editorial remediation covers60 lessons and84 revised items with bounded source attribution. Independent Arabic review, learner validation and professional approval remain open unless explicitly evidenced in educationalReadiness. A preview does not claim professional completion.','Automated accessibility testing does not establish universal WCAG conformance.','Windows runner validation does not cover every physical device.','The Windows EXE is unsigned. Low/moderate build-tool advisories are documented.']}
await writeFile('verified/release/verification.json',JSON.stringify(report,null,2))
const digest=createHash('sha256').update(await readFile('verified/release/verification.json')).digest('hex')
await appendFile('verified/release/SHA256SUMS.txt',digest+'  verification.json\n')
console.log(JSON.stringify(report,null,2))
