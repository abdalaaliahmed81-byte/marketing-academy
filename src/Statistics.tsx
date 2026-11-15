import {useLiveQuery} from './storage/query'
import {db} from './db'
import {lessons} from './lessons'
import {modules} from './curriculum'
import {ar,Heading,Icon} from './ui'
export function Statistics(){
 const data=useLiveQuery(async()=>({states:await db.lessonStates.toArray(),attempts:await db.attempts.toArray(),activity:await db.activity.toArray(),projects:await db.moduleProjects.toArray()}))
 if(!data)return <p className="loading-state" role="status">جارٍ قراءة تقدمك…</p>
 const done=data.states.filter(s=>s.completed).length,total=data.attempts.length,mean=total?Math.round(data.attempts.reduce((n,a)=>n+a.score,0)/total):undefined
 return <div className="stack"><Heading title="إحصاءات التقدم" description="صورة واضحة لما أنجزته، من سجلات حسابك الفعلية."/>
  <div className="metrics stats-metrics">{[['book','دروس مكتملة',ar.format(done)+' / ٦٠'],['target','متوسط المحاولات',mean===undefined?'لم تختبر بعد':ar.format(mean)+'٪'],['clock','أيام نشاط مسجلة',ar.format(data.activity.length)],['case','مشروعات مراجعة ذاتيًا',ar.format(data.projects.filter(p=>p.completed).length)+' / ١٢']].map(([icon,label,value])=><section className="card metric" key={label}><span className="tile"><Icon name={icon}/></span><div><p>{label}</p><strong>{value}</strong></div></section>)}</div>
  <section className="card stack"><div className="section-title"><h2>رحلتك عبر الوحدات</h2><span className="pill">{ar.format(Math.round(done/60*100))}٪ من المسار</span></div>{modules.map((m,i)=>{const count=lessons.filter(l=>l.module===i+1&&data.states.some(s=>s.id===l.id&&s.completed)).length;return <div className="module-stat" key={m}><div className="progress-label"><span>{ar.format(i+1)} · {m}</span><strong>{ar.format(count)} / ٥</strong></div><progress aria-label={'تقدم '+m} max={5} value={count}/></div>})}</section>
  <div className="dash-grid"><section className="card stack"><h2>سجل المحاولات الأخيرة</h2>{!total?<p className="muted">تظهر محاولاتك هنا بعد أول اختبار؛ يمكنك إعادته للتعلّم من الأخطاء.</p>:[...data.attempts].sort((a,b)=>b.at.localeCompare(a.at)).slice(0,12).map(a=><div className="history-row" key={a.id}><span>{lessons.find(l=>l.id===a.lessonId)?.title}<small>{new Intl.DateTimeFormat('ar-IQ',{dateStyle:'medium',timeStyle:'short'}).format(new Date(a.at))}</small></span><strong className={'score '+(a.passed?'passed':'retry')}>{ar.format(a.score)}٪</strong></div>)}</section><section className="card stack"><h2>دفتر يرافق تعلّمك</h2><p>{ar.format(data.states.filter(s=>s.notes.trim()).length)} ملاحظات مكتوبة، و{ar.format(data.states.filter(s=>s.assignment.trim()).length)} تطبيقات عملية محفوظة.</p><p className="muted">هدف الدراسة اليومي ليس وقتًا مقاسًا. أيام النشاط تعني وجود نشاط محفوظ؛ ونسبة الاختبارات ليست اعتمادًا مهنيًا.</p></section></div>
 </div>
}
