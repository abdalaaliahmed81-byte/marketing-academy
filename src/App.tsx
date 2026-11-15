import {SpacedReview} from './interactive/SpacedReview'
import {Library} from './Library'
import {Statistics} from './Statistics'
import {ModuleProjects} from './ModuleProjects'
import {AuthGate,LegacyImport} from './Account'
import {useEffect,useState} from 'react'
import {useLiveQuery} from './storage/query'
import {Navigate,Route,Routes,useLocation} from 'react-router-dom'
import {db,isUnlocked,seed,initializeSettings} from './db'
import {lessons} from './lessons'
import {artifactFields,emptyCapstone,type Settings} from './domain'
import {Dashboard,Path} from './Overview'
import {LessonRoute,ReviewRoute} from './Learn'
import {MissionPage,ProjectPage,SettingsPage} from './Work'
import {Heading,Icon,SettingsForm,Shell} from './ui'

export function App(){return <AuthGate><AcademyApp/></AuthGate>}
export function AcademyApp(){
  const [boot,setBoot]=useState<'loading'|'ready'|'error'>('loading')
  useEffect(()=>{seed().then(()=>setBoot('ready'),()=>setBoot('error'))},[])
  const settings=useLiveQuery(async()=>({value:await db.settings.get('local')}),[boot])
  const theme=settings?.value?.theme??'light'
  useEffect(()=>{document.documentElement.dataset.theme=theme},[theme])
  if(boot==='error')return <main className="welcome card" role="alert"><Heading title="تعذّر فتح التخزين المحلي" description="تأكد من أن المتصفح يسمح بالتخزين على هذا العنوان."/><button className="primary" onClick={()=>window.location.reload()}>أعد المحاولة</button></main>
  if(boot!=='ready'||!settings)return <main className="welcome" role="status">جارٍ تحميل الأكاديمية…</main>
  return settings.value?<LearningApp settings={settings.value}/>:<Onboarding/>
}
function Onboarding(){
  const [error,setError]=useState('')
  return <main className="onboard"><div className="welcome card"><img src="/icon-192.png" alt="" width="58" height="58"/><Heading title="أكاديمية التسويق" description="تعلّم التسويق الرقمي بالعربية وطبّقه على مشروع تختاره."/><LegacyImport/><SettingsForm save={async settings=>{
    try{await initializeSettings(settings)}catch{setError('تعذّر حفظ الإعدادات. حاول مرة أخرى.')}
  }}/><p role="alert">{error}</p></div></main>
}
function LearningApp({settings}:{settings:Settings}){
  const [message,setMessage]=useState('')
  const location=useLocation()
  const records=useLiveQuery(async()=>({
    states:await db.lessonStates.toArray(),
    attempts:await db.attempts.orderBy('at').reverse().toArray(),
    project:await db.projects.get('portfolio'),
    activity:await db.activity.toArray()
  }))
  useEffect(()=>{
    const anchor=location.hash.slice(1)
    const id=window.requestAnimationFrame(()=>{
      if(anchor&&document.getElementById(anchor))document.getElementById(anchor)?.scrollIntoView()
      else {window.scrollTo(0,0);document.getElementById('main-content')?.focus({preventScroll:true})}
    })
    return ()=>window.cancelAnimationFrame(id)
  },[location.pathname,location.hash,!!records])
  useEffect(()=>{if(!message)return;const timer=window.setTimeout(()=>setMessage(''),4200);return()=>window.clearTimeout(timer)},[message])
  const states=records?.states??[]
  const completed=states.filter(s=>s.completed&&lessons.some(l=>l.id===s.id))
  const next=lessons.find(l=>!completed.some(s=>s.id===l.id))??lessons.at(-1)!
  const resume=settings.resume&&(completed.length===lessons.length||!completed.some(s=>s.id===settings.resume?.lessonId))&&isUnlocked(settings.resume.lessonId,states)?settings.resume:{lessonId:next.id,section:'read'}
  return <Shell settings={settings} onTheme={()=>{db.settings.update('local',{theme:settings.theme==='light'?'dark':'light'}).catch(()=>setMessage('تعذّر تغيير المظهر.'))}}>
    {!records?<p className="loading-state" role="status">جارٍ تحميل تقدمك…</p>:<div className="route-content" key={location.pathname}><Routes>
      <Route path="/" element={<Dashboard settings={settings} states={states} completed={completed.length} attempts={records.attempts} next={resume} projectDone={artifactFields.filter(([id])=>records.project?.fields[id]?.trim()).length} activity={records.activity}/>}/>
      <Route path="/review-due" element={<SpacedReview/>}/>
      <Route path="/library" element={<Library/>}/>
      <Route path="/stats" element={<Statistics/>}/>
      <Route path="/path" element={<Path states={states}/>}/>
      <Route path="/lesson/:id/:section" element={<LessonRoute states={states} attempts={records.attempts} notice={setMessage}/>}/>
      <Route path="/review/:module" element={<ReviewRoute states={states} attempts={records.attempts}/>}/>
      <Route path="/mission" element={<MissionPage completed={completed.length} notice={setMessage}/>}/>
      <Route path="/projects" element={<ModuleProjects notice={setMessage}/>}/>
      <Route path="/project" element={<ProjectPage settings={settings} project={records.project} notice={setMessage}/>}/>
      <Route path="/settings" element={<SettingsPage settings={settings} notice={setMessage}/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes></div>}
    {message&&<div className="toast" role="status" data-tone={message.includes('تعذّر')?'error':'success'}><Icon name={message.includes('تعذّر')?'lock':'check'}/>{message}</div>}
  </Shell>
}
