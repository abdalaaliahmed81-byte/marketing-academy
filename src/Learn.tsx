import {NotesButton} from './Notes'
import {useEffect,useState} from 'react'
import {Link,Navigate,useNavigate,useParams} from 'react-router-dom'
import {bookLinks,books,reviewDate,sources,type Lesson,type Question} from './curriculum'
import {completeLesson,isUnlocked,openLesson,saveLesson,submitQuiz} from './db'
import {emptyLesson,ready,shuffleOptions,type Attempt,type LessonState,type Settings} from './domain'
import {lessons,moduleReview} from './lessons'
import {ar,Checklist,Heading,Icon,type Notice} from './ui'

type Section=NonNullable<Settings['resume']>['section']
const tabs:[Section,string][]=[['read','الشرح'],['quiz','الاختبار'],['practice','التطبيق']]
const href=(id:string,section:Section='read')=>'/lesson/'+id+'/'+section

export function LessonRoute({states,attempts,notice}:{states:LessonState[];attempts:Attempt[];notice:Notice}){
  const {id,section}=useParams()
  const item=lessons.find(l=>l.id===id)
  const tab=tabs.find(([key])=>key===section)?.[0]
  if(!item||!tab)return <Navigate to="/path" replace/>
  if(!isUnlocked(item.id,states))return <><Heading title="هذا الدرس مقفل" description="أكمل الدروس السابقة أولًا."/><Link className="primary" to="/path">مسار التعلّم</Link></>
  return <LessonPage key={item.id} lesson={item} tab={tab} state={states.find(s=>s.id===id)??emptyLesson(item.id)} attempts={attempts.filter(a=>a.lessonId===id)} notice={notice}/>
}
function LessonPage({lesson,tab,state,attempts,notice}:{lesson:Lesson;tab:Section;state:LessonState;attempts:Attempt[];notice:Notice}){
  useEffect(()=>{openLesson(lesson.id,tab).catch(()=>notice('تعذّر حفظ موضع المتابعة.'))},[lesson.id,tab,notice])
  const index=lessons.indexOf(lesson)
  const previous=lessons[index-1]
  const next=lessons[index+1]
  return <div className="lesson-wrap stack">
    <div className="section-title"><Link className="text-link" to="/path">مسار التعلّم</Link><button className="secondary" aria-pressed={state.bookmarked} onClick={()=>saveLesson(lesson.id,{bookmarked:!state.bookmarked}).catch(()=>notice('تعذّر حفظ الدرس.'))}><Icon name="bookmark" size={17}/>{state.bookmarked?'أزل العلامة':'احفظ علامة'}</button></div>
    <div className="lesson-title"><Heading title={lesson.title} description={lesson.goal}/><NotesButton id={lesson.id} title={lesson.title}/></div>
    <div className="lesson-meta"><span><Icon name="clock" size={17}/> قراءة وتفكير · ٥–٨ دقائق</span><span>{state.completed?'✓ مكتمل':'الدرس '+ar.format(index+1)}</span></div>
    <nav aria-label="أقسام الدرس" className="tabs">{tabs.map(([key,label])=><Link key={key} className={key===tab?'selected':''} aria-current={key===tab?'page':undefined} to={href(lesson.id,key)}>{label}</Link>)}</nav>
    {tab==='read'&&<>
      <article className="card reading stack">
        {lesson.reading.map((p,i)=><p key={i}>{p}</p>)}
        <div className="callout"><h2>مثال من العراق</h2><p>{lesson.example}</p></div>
        <h2>مصطلحات الدرس</h2><dl>{lesson.glossary.map(([term,value])=><div key={term}><dt lang="en" dir="ltr">{term}</dt><dd>{value}</dd></div>)}</dl>
        <h2>حالة قصيرة</h2><p>{lesson.miniCase}</p><p className="muted">خذ دقيقتين لتكتب قرارك وتشرح ما اعتمدت عليه قبل قراءة الخلاصة.</p>
        <h2>الخلاصة</h2><p>{lesson.summary}</p>
        <details><summary>المراجع</summary><p>إحالات موضوعية مختارة؛ الأمثلة والنتائج التدريبية محاكاة، وليست نقلًا للكتب أو تغطية كاملة لها.</p><ul>{lesson.refs.map(ref=><li key={ref.book}><a href={bookLinks[ref.book]} target="_blank" rel="noreferrer">{books[ref.book]}</a> · {ref.section} · النسخة المرفقة (تمت المراجعة {reviewDate})</li>)}{lesson.online.map(key=><li key={key}><a href={sources[key].url} target="_blank" rel="noreferrer">{sources[key].title}</a> · {reviewDate}</li>)}</ul></details>
        <Link className="primary" to={href(lesson.id,'quiz')}>اذهب إلى الاختبار <Icon name="arrow"/></Link>
      </article>

    </>}
    {tab==='quiz'&&<Quiz lesson={lesson} attempts={attempts} notice={notice}/>}
    {tab==='practice'&&<Practice lesson={lesson} state={state} passed={attempts.some(a=>a.passed)} notice={notice}/>}
    <div className="actions">{previous&&<Link className="secondary" to={href(previous.id)}>الدرس السابق</Link>}{state.completed&&next&&<Link className="primary" to={href(next.id)}>الدرس التالي <Icon name="arrow"/></Link>}{state.completed&&next?.module!==lesson.module&&<Link className="secondary" to={'/review/'+lesson.module}>مراجعة الوحدة</Link>}</div>
  </div>
}
function Rationale({question,answer}:{question:Question;answer:string}){
  const correct=answer===question.answer
  return <div className={'rationale '+(correct?'correct':'incorrect')}><strong>{correct?'إجابة صحيحة':'الإجابة الصحيحة: '+question.options.find(o=>o.id===question.answer)?.label}</strong><p>{question.why}</p></div>
}
function Quiz({lesson,attempts,notice}:{lesson:Lesson;attempts:Attempt[];notice:Notice}){
  const [attempt,setAttempt]=useState<Attempt|null>(attempts[0]??null)
  const [answers,setAnswers]=useState<Record<string,string>>({})
  const [shuffle,setShuffle]=useState(0)
  const [busy,setBusy]=useState(false)
  return <form className="stack" onSubmit={async e=>{
    e.preventDefault()
    setBusy(true)
    try{setAttempt(await submitQuiz(lesson,answers))}
    catch(error){notice(error instanceof Error?error.message:'تعذّر حفظ المحاولة.')}
    finally{setBusy(false)}
  }}>
    <div className="card section-title"><div><h2>{attempt?'نتيجة الاختبار':'اختبار الدرس'}</h2><p>{attempt?ar.format(attempt.score)+'٪ · '+(attempt.passed?'اجتزت الاختبار':'راجع الإجابات وأعد المحاولة'):'حد الاجتياز ٧٠٪. بعد التسليم تظهر نتيجة كل إجابة وسببها.'}</p><small>{ar.format(attempts.length)} محاولات محفوظة</small></div>{attempt&&<button className="secondary" type="button" onClick={()=>{setAnswers({});setAttempt(null);setShuffle(s=>s+1)}}>أعد الاختبار</button>}</div>
    {lesson.questions.map((q,i)=><fieldset key={q.id} className="card question"><legend>{ar.format(i+1)}. {q.prompt}</legend>
      {attempt?<><p>إجابتك: {q.options.find(o=>o.id===attempt.answers[q.id])?.label??'—'}</p><Rationale question={q} answer={attempt.answers[q.id]}/></>:shuffleOptions(q.options,q.id+'-'+shuffle).map(o=><label key={o.id} className="choice"><input type="radio" name={q.id} value={o.id} checked={answers[q.id]===o.id} onChange={()=>setAnswers({...answers,[q.id]:o.id})} required/>{o.label}</label>)}
    </fieldset>)}
    {!attempt?<button className="primary" disabled={busy}>سلّم الاختبار</button>:attempt.passed?<Link className="primary" to={href(lesson.id,'practice')}>اذهب إلى التطبيق <Icon name="arrow"/></Link>:<Link className="secondary" to={href(lesson.id)}>راجع شرح الدرس</Link>}
    {attempts.length>1&&<details className="card"><summary>المحاولات السابقة</summary>{attempts.map(a=><p key={a.id}>{new Date(a.at).toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad'})} · {ar.format(a.score)}٪</p>)}</details>}
  </form>
}
function Practice({lesson,state,passed,notice}:{lesson:Lesson;state:LessonState;passed:boolean;notice:Notice}){
  const [text,setText]=useState(state.assignment)
  const [checked,setChecked]=useState(state.checked)
  const [busy,setBusy]=useState(false)
  const navigate=useNavigate()
  async function save(complete:boolean){
    setBusy(true)
    try{
      await saveLesson(lesson.id,{assignment:text,checked})
      if(complete){
        await completeLesson(lesson)
        const next=lessons[lessons.indexOf(lesson)+1]
        if(next?.module!==lesson.module)navigate('/review/'+lesson.module)
      }
      notice(complete?'أكملت الدرس.':'حُفظ تطبيقك.')
    }catch(error){notice(error instanceof Error?error.message:'تعذّر الحفظ.')}
    finally{setBusy(false)}
  }
  return <section className="card stack">
    <h2>التطبيق العملي</h2><p>{lesson.assignment}</p>
    <label>تطبيقك<textarea maxLength={50000} rows={7} value={text} onChange={e=>setText(e.target.value)}/></label>
    <Checklist rubric={lesson.rubric} checked={checked} onChange={setChecked}/>
    {!passed&&<p className="muted">اجتز اختبار الدرس لتتمكن من إكماله.</p>}
    <div className="actions"><button className="secondary" disabled={busy} onClick={()=>void save(false)}>احفظ التطبيق</button>{!state.completed&&<button className="primary" disabled={busy||!passed||!ready(text,checked,lesson.rubric)} onClick={()=>void save(true)}>أكمل الدرس <Icon name="check"/></button>}</div>
  </section>
}
export function ReviewRoute({states,attempts}:{states:LessonState[];attempts:Attempt[]}){
  const {module}=useParams()
  const n=Number(module)
  const group=lessons.filter(l=>l.module===n)
  if(!group.length||!group.every(l=>states.some(s=>s.id===l.id&&s.completed)))return <Navigate to="/path" replace/>
  return <ModuleReview key={module} group={group} attempts={attempts} prompt={moduleReview[n-1]}/>
}
function ModuleReview({group,attempts,prompt}:{group:Lesson[];attempts:Attempt[];prompt:string}){
  const [answers,setAnswers]=useState<Record<string,string>>({})
  const [submitted,setSubmitted]=useState(false)
  const selected=group.flatMap(l=>{
    const recent=attempts.find(a=>a.lessonId===l.id)
    return l.questions.filter(q=>recent?.missed.includes(q.id)).map(question=>({question,lesson:l}))
  })
  const questions=selected.length?selected:group.map(l=>({lesson:l,question:l.questions[0]}))
  return <><Heading title="مراجعة نهاية الوحدة" description={prompt}/>
    <form className="stack" onSubmit={e=>{e.preventDefault();setSubmitted(true)}}>
      <p>{selected.length?'أعد التدريب على الأسئلة التي أخطأت فيها في أحدث محاولة لكل درس.':'راجع سؤالًا من كل درس لتثبيت المفاهيم.'}</p>
      {questions.map(({question:q,lesson:l})=><fieldset className="card question" key={q.id}><legend>{q.prompt}</legend>
        {submitted?<Rationale question={q} answer={answers[q.id]}/>:shuffleOptions(q.options,q.id).map(o=><label className="choice" key={o.id}><input required type="radio" name={q.id} checked={answers[q.id]===o.id} onChange={()=>setAnswers({...answers,[q.id]:o.id})}/>{o.label}</label>)}
        <Link className="text-link" to={href(l.id)}>{l.title}</Link>
      </fieldset>)}
      <div className="actions">{submitted?<button className="secondary" type="button" onClick={()=>{setAnswers({});setSubmitted(false)}}>أعد المراجعة</button>:<button className="primary">راجع الإجابات</button>}<Link className="secondary" to="/path">مسار التعلّم</Link></div>
    </form></>
}
