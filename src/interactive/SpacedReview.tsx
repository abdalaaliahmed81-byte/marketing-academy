import {useMemo,useState} from 'react'
import {Link} from 'react-router-dom'
import {db,saveReview} from '../db'
import {lessons} from '../lessons'
import {useLiveQuery} from '../storage/query'
import {shuffleOptions} from '../domain'
import {ar,Heading,useBaghdadDay} from '../ui'
import {reviewSchedule} from './review'
export function SpacedReview(){
 const day=useBaghdadDay(),data=useLiveQuery(async()=>({states:await db.lessonStates.toArray(),attempts:await db.attempts.toArray()}),[day])
 const [answer,setAnswer]=useState(''),[feedback,setFeedback]=useState<Awaited<ReturnType<typeof saveReview>>>(),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const schedule=useMemo(()=>data?reviewSchedule(lessons,data.attempts,data.states):[],[data])
 if(!data)return <p role="status" className="loading-state">جارٍ تجهيز المراجعات…</p>
 const queue=schedule.filter(item=>item.due<=day),current=queue[0],future=schedule.filter(item=>item.due>day)
 return <div className="stack"><Heading title="المراجعة المتباعدة" description="تعود الأخطاء اليوم؛ الاسترجاع الصحيح يباعد المراجعة يومًا ثم٣ ثم٧ ثم١٤ ثم٣٠. اليوم محسوب بتوقيت بغداد."/>
 <p>{ar.format(queue.length)} أسئلة مستحقة الآن · {ar.format(future.length)} مراجعات لاحقة</p>
 {feedback?<section className={'card stack '+(feedback.correct?'correct':'incorrect')} role="status"><h2>{feedback.correct?'استرجاع صحيح':'تحتاج محاولة أخرى'}</h2><p>{feedback.why}</p><p>موعد الاسترجاع التالي: <bdi>{feedback.nextDue}</bdi></p><button className="primary" onClick={()=>{setFeedback(undefined);setAnswer('')}}>{feedback.correct?'السؤال التالي':'أعد الاسترجاع'}</button></section>:current?<form className="card stack" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{setFeedback(await saveReview(current.question.id,answer))}catch{setError('تعذّر حفظ المراجعة؛ لم نغيّر موعدها. أعد المحاولة.')}finally{setBusy(false)}}}><p className="eyebrow">{current.lesson.title}</p><fieldset className="question"><legend>{current.question.prompt}</legend>{shuffleOptions(current.question.options,current.question.id+'-review').map(o=><label className="choice" key={o.id}><input required type="radio" name="review-answer" value={o.id} checked={answer===o.id} onChange={()=>setAnswer(o.id)}/>{o.label}</label>)}</fieldset><button className="primary" disabled={busy||!answer}>تحقّق واحفظ المراجعة</button><p role="alert">{error}</p><Link className="text-link" to={'/lesson/'+current.lesson.id+'/read'}>ارجع إلى شرح الدرس</Link></form>:<section className="card stack"><h2>لا توجد أسئلة مستحقة الآن</h2><p>تظهر هنا أخطاء المحاولات الحقيقية، دون إنشاء نتائج أو مهام وهمية.</p>{future.slice(0,5).map(item=><p key={item.question.id}>{item.lesson.title} · <bdi>{item.due}</bdi></p>)}<Link className="primary" to="/path">تابع مسار التعلّم</Link></section>}
 </div>
}
