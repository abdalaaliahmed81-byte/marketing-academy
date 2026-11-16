import {Link} from 'react-router-dom'
import {useLiveQuery} from '../storage/query'
import {db,isUnlocked} from '../db'
import {lessons} from '../lessons'
import {modules} from '../curriculum'
import {NotesButton} from '../Notes'
import {Heading,ar} from '../ui'
import {skillEvidence} from './model'
import './tree.css'
export function SkillTree(){
 const data=useLiveQuery(async()=>({states:await db.lessonStates.toArray(),attempts:await db.attempts.toArray()}))
 if(!data)return <p role="status">جارٍ قراءة أدلة المهارات…</p>
 return <div className="stack skill-tree"><Heading title="شجرة إتقان المهارات" description="مؤشر تدريب من سجلات حسابك؛ ليس اعتمادًا مهنيًا أو حكم مدرس."/>
 <section className="card stack"><h2>كيف يُحسب المؤشر؟</h2><p>٤٠٪ من أفضل درجة اختبار، و٤٠٪ من الأنشطة الستة المحفوظة، و٢٠٪ لتطبيق محفوظ مع مراجعة بنوده. قد تكون الأنشطة المفتوحة مراجعة ذاتية؛ اكتمال المؤشر لا يثبت الكفاءة المهنية. يبقى إنجاز الدرس السابق محفوظًا حتى إن لم تكن قد نفذت أنشطته الجديدة.</p><p>المراجعة المتباعدة للأخطاء مستقلة عن هذا المؤشر؛ ارتفاعه لا يلغي المراجعات المستحقة. لفتح الدرس التالي، احفظ التطبيق واجتز الاختبار وأكمل مراجعتك ثم اختر «أكمل الدرس» من صفحة التطبيق.</p><Link className="text-link" to="/review-due">افتح المراجعة المتباعدة</Link></section>
 <ol className="skill-modules" role="list">{modules.map((name,i)=>{const group=lessons.filter(l=>l.module===i+1),evidence=group.map(l=>skillEvidence(l.id,data.states,data.attempts)),percent=Math.round(evidence.reduce((n,e)=>n+e.percent,0)/group.length);return <li className="card skill-module" key={name} id={'skill-module-'+(i+1)}><h2>{ar.format(i+1)} · {name}</h2><progress max={100} value={percent} aria-label={'مؤشر مهارات '+name}/><p className="muted">{ar.format(percent)}٪ · مؤشر تدريب الوحدة</p>
 <ol className="skill-branches" role="list">{group.map((l,j)=>{const e=evidence[j],open=isUnlocked(l.id,data.states);return <li key={l.id} className={'skill-node '+(e.trained?'trained':open?'available':'locked')}><div className="lesson-name"><h3>{open?<Link to={'/lesson/'+l.id+'/read'}>{l.title}</Link>:<span>{l.title}</span>}</h3><NotesButton id={l.id} title={l.title}/></div><p>{e.trained?'مؤشرات التدريب مكتملة':open?'متاح للتدريب':'مقفل · أكمل السابق'}</p>{e.earnedCompletion&&<strong className="pill">إنجاز الدرس محفوظ ✓</strong>}<progress max={100} value={e.percent} aria-label={'مؤشر تدريب '+l.title}/><dl><div><dt>أفضل اختبار</dt><dd>{e.hasAttempt?ar.format(e.best)+'٪':'لم تختبر بعد'}</dd></div><div><dt>الأنشطة</dt><dd>{ar.format(e.practice)} من {ar.format(e.totalActivities)}</dd></div><div><dt>التطبيق والمراجعة الذاتية</dt><dd>{e.application?'محفوظ':'لم يكتمل'}</dd></div></dl>{open&&<Link className="text-link" to={'/lesson/'+l.id+'/quiz'}>راجع الاختبار</Link>}</li>})}</ol></li>})}</ol></div>
}
