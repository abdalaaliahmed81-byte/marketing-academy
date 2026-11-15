import {NotesButton} from './Notes'
import {Link} from 'react-router-dom'
import {useLiveQuery} from './storage/query'
import {lessons} from './lessons'
import {modules} from './curriculum'
import {db,isUnlocked} from './db'
import {artifactFields,studyStreak,type Attempt,type LessonState,type Settings} from './domain'
import {ar,Heading,Icon,useBaghdadDay} from './ui'

const lessonHref=(id:string,section='read')=>'/lesson/'+id+'/'+section
function Metric({icon,label,value,detail}:{icon:string;label:string;value:string;detail:string}){
  return <div className="card metric"><div className="tile"><Icon name={icon}/></div><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></div>
}
export function Dashboard({settings,states,completed,attempts,next,projectDone,activity}:{settings:Settings;states:LessonState[];completed:number;attempts:Attempt[];next:{lessonId:string;section:string};projectDone:number;activity:{date:string}[]}){
  const date=useBaghdadDay()
  const mission=useLiveQuery(()=>db.missions.get(date),[date])
  const latest=attempts[0]
  const current=lessons.find(l=>l.id===next.lessonId)!
  const percent=Math.round(100*completed/lessons.length)
  const bookmarks=states.filter(s=>s.bookmarked).map(s=>lessons.find(l=>l.id===s.id)).filter(l=>l!==undefined)
  return <div className="dashboard stack">
    <section className="hero">
      <div className="hero-art" aria-hidden="true"><span/><span/><span/><svg width="238" height="150" viewBox="0 0 238 150" fill="none"><path d="M14 124h210M14 94h210M14 64h210M14 34h210M43 20v111M87 20v111M131 20v111M175 20v111M219 20v111" stroke="#a797f7" strokeOpacity=".26"/><path d="M19 118 59 95 95 104 136 60 163 72 211 25" stroke="#c8b6ff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="211" cy="25" r="7" fill="#e4d7ff"/></svg></div>
      <div className="hero-copy"><p className="hero-tag"><Icon name="trend" size={16}/> التعلّم بالتطبيق</p><h1>معرفة تصنع فرقًا.<br/>ومهارة تبني مستقبلك.</h1><p>{settings.goal}</p><Link className="hero-button" to={lessonHref(next.lessonId,next.section)}>{completed||settings.resume?'تابع التعلّم':'ابدأ الدرس الأول'}<Icon name="arrow" size={19}/></Link></div>
    </section>
    <Link className="text-link" to="/review-due"><Icon name="target" size={18}/> مراجعات الأخطاء المستحقة</Link>
    <div className="metrics">
      <Metric icon="book" label="الدروس المكتملة" value={ar.format(completed)+' / '+ar.format(lessons.length)} detail="من الدروس المتاحة"/>
      <Metric icon="clock" label="هدف الدراسة اليومي" value={ar.format(settings.minutes)+' دقيقة'} detail={ar.format(studyStreak(date,activity))+' أيام تعلّم متتالية'}/>
      <Metric icon="target" label="آخر اختبار" value={latest?ar.format(latest.score)+'٪':'—'} detail={latest?(latest.passed?'تم الاجتياز':'يمكنك إعادة المحاولة'):'بعد أول محاولة'}/>
    </div>
    <div className="dash-grid">
      <section className="card stack"><div className="section-title"><h2>مسار التعلّم</h2><Link to="/path">كل الوحدات <Icon name="arrow" size={16}/></Link></div>
        <div className="progress-label"><span>التقدم في الدروس المتاحة</span><strong>{ar.format(percent)}٪</strong></div><progress max={100} value={percent} aria-label="التقدم في الدروس"/>
        <div className="track">{modules.map((name,i)=>{
          const count=lessons.filter(l=>l.module===i+1&&states.some(s=>s.completed&&s.id===l.id)).length
          return <Link key={name} to={'/path#module-'+(i+1)} className="track-row"><span className="tile"><Icon name={count===5?'check':'book'} size={18}/></span><span><strong>{name}</strong><small>{ar.format(count)} من ٥ دروس مكتملة</small></span><Icon name="arrow" size={16}/></Link>
        })}</div>
        <div className="lesson-name muted"><span>درس المتابعة: {current.title}</span><NotesButton id={current.id} title={current.title}/></div>
      </section>
      <div className="stack">
        <section className="card dash-small"><div className="tile green"><Icon name="target"/></div><h2>المهمة اليومية</h2><p>{mission?.completed?'أكملت مهمة اليوم. يمكنك مراجعة إجابتك.':completed?'طبّق مهارة تعلمتها في مهمة قصيرة.':'تظهر أول مهمة بعد إكمال درس.'}</p><Link className="text-link" to="/mission">افتح المهمة <Icon name="arrow" size={16}/></Link></section>
        <section className="card dash-small"><div className="tile amber"><Icon name="case"/></div><h2>مشروع ملف الأعمال</h2><p>{ar.format(projectDone)} من {ar.format(artifactFields.length)} بنود مكتوبة</p><Link className="text-link" to="/project">افتح مشروعي <Icon name="arrow" size={16}/></Link></section>
      </div>
    </div>
    {!!bookmarks.length&&<section className="card stack"><h2>الدروس المحفوظة</h2>{bookmarks.map(l=><div className="lesson-name" key={l.id}><Link className="text-link" to={lessonHref(l.id)}>{l.title}<Icon name="arrow" size={16}/></Link><NotesButton id={l.id} title={l.title}/></div>)}</section>}
  </div>
}
export function Path({states}:{states:LessonState[]}){
  return <><Heading title="مسار التعلّم" description="١٢ وحدة متدرجة · ٦٠ درسًا · ١٢ مشروعًا تطبيقيًا."/>
  <div className="stack">{modules.map((title,i)=>{
    const group=lessons.filter(l=>l.module===i+1)
    const done=group.every(l=>states.some(s=>s.id===l.id&&s.completed))
    return <section id={'module-'+(i+1)} key={title} className="card stack"><div className="section-title"><h2><span className="module-number">{ar.format(i+1).padStart(2,'٠')}</span> {title}</h2><span className="pill">{ar.format(group.filter(l=>states.some(s=>s.id===l.id&&s.completed)).length)} / ٥ مكتمل</span>{done&&<Link to={'/review/'+(i+1)}>مراجعة الوحدة <Icon name="arrow" size={16}/></Link>}</div>
      {group.map(l=>{
        const open=isUnlocked(l.id,states)
        const complete=states.some(s=>s.id===l.id&&s.completed)
        return <div className={'lesson-row track-row '+(complete?'is-complete':open?'is-current':'locked')} key={l.id}>
          <span className="tile"><Icon name={complete?'check':open?'book':'lock'} size={18}/></span>
          <div><div className="lesson-name">{open?<Link to={lessonHref(l.id)}><strong>{l.title}</strong></Link>:<strong>{l.title}</strong>}<NotesButton id={l.id} title={l.title}/></div><small>{complete?'مكتمل':open?'متاح · ابدأ هذا الدرس':'يتاح بعد إكمال الدرس السابق'}</small></div>
          {open&&<Link to={lessonHref(l.id)} aria-label={'افتح الدرس: '+l.title}><Icon name="arrow" size={18}/></Link>}
        </div>
      })}
    </section>
  })}</div></>
}
