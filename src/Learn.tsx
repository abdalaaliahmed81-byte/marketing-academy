import {useAutosave} from './interactive/useAutosave'
import {LessonActivities} from './interactive/Activities'
import {useLiveQuery} from './storage/query'
import {NotesButton} from './Notes'
import {useEffect,useRef,useState} from 'react'
import {Link,Navigate,useNavigate,useParams} from 'react-router-dom'
import {bookLinks,books,reviewDate,sources,type Lesson,type Question} from './curriculum'
import {db,completeLesson,isUnlocked,openLesson,saveLesson,submitQuiz,saveQuizDraftAnswers,retryQuiz} from './db'
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
    <div className="lesson-title"><Heading title={<span className="lesson-name">{lesson.title}<NotesButton id={lesson.id} title={lesson.title}/></span>} description={lesson.goal}/></div>
    <div className="lesson-meta"><span><Icon name="clock" size={17}/> قراءة وتفكير · ٥–٨ دقائق</span><span>{state.completed?'✓ مكتمل':'الدرس '+ar.format(index+1)}</span></div>
    <nav aria-label="أقسام الدرس" className="tabs">{tabs.map(([key,label])=><Link key={key} className={key===tab?'selected':''} aria-current={key===tab?'page':undefined} to={href(lesson.id,key)}>{label}</Link>)}</nav>
    {tab==='read'&&<>
      <LessonActivities lesson={lesson} state={state}/><Link className="primary" to={href(lesson.id,'quiz')}>اذهب إلى الاختبار <Icon name="arrow"/></Link>
      <details className="card"><summary>النص الكامل والأمثلة والمراجع</summary><article className="card reading stack">
        {lesson.reading.map((p,i)=><p key={i}>{p}</p>)}
        <div className="callout"><h2>مثال من العراق</h2><p>{lesson.example}</p></div>
        <h2>مصطلحات الدرس</h2><dl>{lesson.glossary.map(([term,value])=><div key={term}><dt lang="en" dir="ltr">{term}</dt><dd>{value}</dd></div>)}</dl>
        <h2>حالة قصيرة</h2><p>{lesson.miniCase}</p><p className="muted">خذ دقيقتين لتكتب قرارك وتشرح ما اعتمدت عليه قبل قراءة الخلاصة.</p>
        <h2>الخلاصة</h2><p>{lesson.summary}</p>
        <details><summary>المراجع</summary><p>إحالات موضوعية مختارة؛ الأمثلة والنتائج التدريبية محاكاة، وليست نقلًا للكتب أو تغطية كاملة لها.</p><ul>{lesson.refs.map(ref=><li key={ref.book}><a href={bookLinks[ref.book]} target="_blank" rel="noreferrer">{books[ref.book]}</a> · {ref.section} · النسخة المرفقة (تمت المراجعة {reviewDate})</li>)}{lesson.online.map(key=><li key={key}><a href={sources[key].url} target="_blank" rel="noreferrer">{sources[key].title}</a> · {reviewDate}</li>)}</ul></details>
      </article></details>

    </>}
    {tab==='quiz'&&<Quiz lesson={lesson} attempts={attempts} draft={state.quizDraft} notice={notice}/>}
    {tab==='practice'&&<Practice lesson={lesson} state={state} passed={attempts.some(a=>a.passed)} notice={notice}/>}
    <div className="actions">{previous&&<Link className="secondary" to={href(previous.id)}>الدرس السابق</Link>}{state.completed&&next&&<Link className="primary" to={href(next.id)}>الدرس التالي <Icon name="arrow"/></Link>}{state.completed&&next?.module!==lesson.module&&<Link className="secondary" to={'/review/'+lesson.module}>مراجعة الوحدة</Link>}</div>
  </div>
}
function Rationale({question,answer}:{question:Question;answer:string}){
  const correct=answer===question.answer
  return <div className={'rationale '+(correct?'correct':'incorrect')}><strong>{correct?'إجابة صحيحة':'الإجابة الصحيحة: '+question.options.find(o=>o.id===question.answer)?.label}</strong><p>{question.why}</p></div>
}
function Quiz({lesson,attempts,draft,notice}:{lesson:Lesson;attempts:Attempt[];draft:LessonState['quizDraft'];notice:Notice}){
  const [attempt,setAttempt]=useState<Attempt|null>(draft?.active?null:attempts[0]??null)
  const [answers,setAnswers]=useState<Record<string,string>>(draft?.active?draft.answers:{})
  const answerRef=useRef(answers),answerRevision=useRef(0),target=useRef(db)
  const [shuffle,setShuffle]=useState(draft?.round??0)
  const [saved,setSaved]=useState('تُحفظ اختياراتك قبل التسليم')
  const [busy,setBusy]=useState(false)
  return <form className="stack" onSubmit={async e=>{
    e.preventDefault()
    setBusy(true)
    try{setAttempt(await submitQuiz(lesson,answers,target.current))}
    catch(error){notice(error instanceof Error?error.message:'تعذّر حفظ المحاولة.')}
    finally{setBusy(false)}
  }}>
    <div className="card section-title"><div><h2>{attempt?'نتيجة الاختبار':'اختبار الدرس'}</h2><p>{attempt?ar.format(attempt.score)+'٪ · '+(attempt.passed?'اجتزت الاختبار':'راجع الإجابات وأعد المحاولة'):'حد الاجتياز ٧٠٪. بعد التسليم تظهر نتيجة كل إجابة وسببها.'}</p><small>{ar.format(attempts.length)} محاولات محفوظة</small></div>{attempt&&<button className="secondary" type="button" disabled={busy} onClick={async()=>{setBusy(true);try{const next=await retryQuiz(lesson.id,target.current);answerRef.current={};answerRevision.current++;setAnswers({});setAttempt(null);setShuffle(next.round);setSaved('بدأت محاولة جديدة؛ المحاولات السابقة محفوظة')}catch{notice('تعذّر بدء محاولة جديدة.')}finally{setBusy(false)}}}>أعد الاختبار</button>}</div>
    {!attempt&&<small aria-live="polite">{saved}</small>}
    {lesson.questions.map((q,i)=><fieldset key={q.id} className="card question"><legend>{ar.format(i+1)}. {q.prompt}</legend>
      {attempt?<><p>إجابتك: {q.options.find(o=>o.id===attempt.answers[q.id])?.label??'—'}</p><Rationale question={q} answer={attempt.answers[q.id]}/></>:shuffleOptions(q.options,q.id+'-'+shuffle).map(o=><label key={o.id} className="choice"><input type="radio" name={q.id} value={o.id} checked={answers[q.id]===o.id} onChange={()=>{const next={...answerRef.current,[q.id]:o.id},revision=++answerRevision.current;answerRef.current=next;setAnswers(next);setSaved('جارٍ حفظ الاختيار…');void saveQuizDraftAnswers(lesson.id,next,target.current).then(()=>{if(revision===answerRevision.current)setSaved('حُفظت اختياراتك')},()=>{if(revision===answerRevision.current)setSaved('تعذّر حفظ الاختيار؛ أعد اختياره أو سلّم لحفظ المحاولة كاملة')})}} required/>{o.label}</label>)}
    </fieldset>)}
    {!attempt?<button className="primary" disabled={busy}>سلّم الاختبار</button>:attempt.passed?<Link className="primary" to={href(lesson.id,'practice')}>اذهب إلى التطبيق <Icon name="arrow"/></Link>:<Link className="secondary" to={href(lesson.id)}>راجع شرح الدرس</Link>}
    <Link className="text-link" to="/review-due">راجع الأخطاء بتكرار متباعد</Link>
    {attempts.length>1&&<details className="card"><summary>المحاولات السابقة</summary>{attempts.map(a=><p key={a.id}>{new Date(a.at).toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad'})} · {ar.format(a.score)}٪</p>)}</details>}
  </form>
}
function Practice({lesson,state,passed,notice}:{lesson:Lesson;state:LessonState;passed:boolean;notice:Notice}){
  const [text,setText]=useState(state.assignment)
  const [checked,setChecked]=useState(state.checked)
  const [busy,setBusy]=useState(false)
  const target=useRef(db)
  const autosave=useAutosave({text,checked},draft=>saveLesson(lesson.id,{assignment:draft.text,checked:draft.checked},target.current))
  const navigate=useNavigate()
  async function save(complete:boolean){
    setBusy(true)
    try{
      await saveLesson(lesson.id,{assignment:text,checked},target.current)
      if(complete){
        await completeLesson(lesson,target.current)
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
    <Checklist rubric={lesson.rubric} checked={checked} onChange={setChecked}/><small aria-live="polite">{autosave}</small>
    {!passed&&<p className="muted">اجتز اختبار الدرس لتتمكن من إكماله.</p>}
    <div className="actions"><button className="secondary" disabled={busy} onClick={()=>void save(false)}>احفظ التطبيق</button>{!state.completed&&<button className="primary" disabled={busy||!passed||!ready(text,checked,lesson.rubric)} onClick={()=>void save(true)}>أكمل الدرس <Icon name="check"/></button>}</div>
  </section>
}
export function ReviewRoute({states,attempts}:{states:LessonState[];attempts:Attempt[]}){
  const {module}=useParams()
  const persisted=useLiveQuery(()=>db.lessonStates.toArray())
  const n=Number(module)
  const group=lessons.filter(l=>l.module===n)
  if(!persisted)return <p role="status">جارٍ تحميل مراجعة الوحدة…</p>
  if(!group.length||!group.every(l=>persisted.some(s=>s.id===l.id&&s.completed)))return <Navigate to="/path" replace/>
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
        <div className="lesson-name"><Link className="text-link" to={href(l.id)}>{l.title}</Link><NotesButton id={l.id} title={l.title}/></div>
      </fieldset>)}
      <div className="actions">{submitted?<button className="secondary" type="button" onClick={()=>{setAnswers({});setSubmitted(false)}}>أعد المراجعة</button>:<button className="primary">راجع الإجابات</button>}<Link className="secondary" to="/path">مسار التعلّم</Link></div>
    </form></>
}
