import {useSavedDraft} from './project-learning/useSavedDraft'
import {businessCases,caseExamples,emptyFieldTemplate,caseMetrics} from './project-learning/cases'
import {capstoneMilestones,clientReport,learningPortfolioMarkdown} from './project-learning/model'
import {useAutosave} from './interactive/useAutosave'
import {ProfilePanel} from './Account'
import {activeTransport} from './storage/transport'
import {capstoneExample} from './projects'
import {encryptBackup,decryptBackup} from './backup'
import {changePassword} from './auth'
import {useEffect,useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import {useLiveQuery} from './storage/query'
import {db,exportBackup,getMission,restoreBackup,saveMission,saveProject} from './db'
import {artifactFields,businesses,emptyCapstone,markdown,ready,sections,stages,type Capstone,type Mission,type Settings} from './domain'
import {ar,Checklist,download,Heading,Icon,SettingsForm,useBaghdadDay,type Notice} from './ui'

export function MissionPage({completed,notice}:{completed:number;notice:Notice}){
  const date=useBaghdadDay()
  const [failed,setFailed]=useState(false)
  const [retry,setRetry]=useState(0)
  const data=useLiveQuery(async()=>({today:await db.missions.get(date),history:await db.missions.orderBy('date').reverse().toArray()}),[date])
  const [selected,setSelected]=useState<string>()
  useEffect(()=>{setFailed(false);let active=true;getMission(date).catch(()=>{if(active)setFailed(true)});return()=>{active=false}},[date,completed,retry])
  const mission=(selected?data?.history.find(m=>m.date===selected):undefined)??data?.today
  return <><Heading title="المهمة اليومية" description="تدريب قصير مبني على الدروس التي أكملتها. يُحسب اليوم بتوقيت بغداد."/>
    <div className="stack">
      {failed?<div className="card" role="alert"><p>تعذّر تحميل مهمة اليوم.</p><button className="secondary" onClick={()=>setRetry(n=>n+1)}>أعد المحاولة</button></div>:mission?<MissionForm key={mission.date} mission={mission} notice={notice}/>:!data||completed?<p role="status">جارٍ تجهيز مهمة اليوم…</p>:<section className="card stack"><h2>مهمتك الأولى تنتظرك</h2><p>أكمل درسًا واختباره وتطبيقه لتظهر مهمة مرتبطة بما تعلمته.</p><Link className="primary" to="/path">افتح مسار التعلّم</Link></section>}
      {!!data?.history.length&&<section className="card stack"><h2>سجل المهام</h2>{data.history.map(m=><button key={m.date} className="secondary" aria-pressed={mission?.date===m.date} onClick={()=>setSelected(m.date===date?undefined:m.date)}><bdi>{m.date}</bdi> · {m.completed?'مكتملة':m.response?'مسودة':'متاحة'}</button>)}{selected&&<button className="secondary" onClick={()=>setSelected(undefined)}>اعرض مهمة اليوم</button>}</section>}
    </div></>
}
function MissionForm({mission,notice}:{mission:Mission;notice:Notice}){
  const target=useRef(db)
  const [response,setResponse]=useState(mission.response)
  const [checked,setChecked]=useState(mission.checked)
  const autosave=useAutosave({response,checked},draft=>saveMission(mission.date,draft.response,draft.checked,false,target.current))
  const [busy,setBusy]=useState(false)
  async function persist(complete:boolean){
    setBusy(true)
    try{await saveMission(mission.date,response,checked,complete,target.current);notice(complete?'أكملت المهمة.':'حُفظت مسودة المهمة.')}
    catch(error){notice(error instanceof Error?error.message:'تعذّر حفظ المهمة.')}
    finally{setBusy(false)}
  }
  return <section className="card stack">
    <div className="section-title"><h2><bdi>{mission.date}</bdi></h2><span>{mission.completed?'✓ مكتملة':'تطبيق · ١٠–٢٠ دقيقة'}</span></div>
    <p>{mission.prompt}</p><label>إجابتك<textarea maxLength={50000} rows={7} value={response} onChange={e=>setResponse(e.target.value)}/></label>
    <Checklist rubric={mission.rubric} checked={checked} onChange={setChecked}/><small aria-live="polite">{autosave}</small>
    <div className="actions"><button className="secondary" disabled={busy} onClick={()=>void persist(false)}>احفظ المسودة</button><button className="primary" disabled={busy||!ready(response,checked,mission.rubric)} onClick={()=>void persist(true)}>احفظ كمكتملة <Icon name="check"/></button></div>
  </section>
}
const prompts:Record<string,string>={
  research:'سجّل الملاحظات وتواريخها وما يحتاج إلى تحقق.',persona:'اكتب الموقف والدافع والعائق والبديل ودليل الثقة.',story:'صف تجربة أو وعدًا يستطيع العميل التحقق منه.',goals:'حدّد الإجراء والعدد والفترة وخط الأساس.',position:'لمن هذا العرض؟ ما الفائدة ودليلها؟',
  calendar:'اكتب اليوم، القناة، الفكرة، الإجراء، ومقياس كل منشور.',budget:'يمكن اختيار ٠ د.ع. أو تخصيص ميزانية افتراضية للقنوات.',kpis:'حدّد المقياس والبسط والمقام والفترة والنتيجة.',analysis:'وسم البيانات كمحاكاة وفسّر ما تستطيع استنتاجه.',report:'اذكر الهدف والعمل والنتائج والقيود والقرار التالي.'
}
export function ProjectPage({settings,project,notice}:{settings:Settings;project?:Capstone;notice:Notice}){
  return <ProjectEditor project={project??emptyCapstone(settings.business)} notice={notice}/>
}
function ProjectEditor({project,notice}:{project:Capstone;notice:Notice}){
  const baseline=useRef(project),target=useRef(db)
  const [selected,setSelected]=useState(0)
  const [caseIndex,setCaseIndex]=useState(0)
  const [printMode,setPrintMode]=useState<'full'|'plan'>('full')
  const [name,setName]=useState(project.name)
  const [business,setBusiness]=useState(project.business)
  const [draft,setDraft]=useState(project.fields)
  const [busy,setBusy]=useState(false)
  const count=artifactFields.filter(([id])=>draft[id]?.trim()).length
  const value={name,business,fields:draft}
  const autosave=useSavedDraft(value,async next=>{await saveProject(next,baseline.current,target.current);baseline.current=next})
  async function exportFile(kind:'full'|'plan'|'report'){setBusy(true);try{await autosave.flush();const output=kind==='report'?{...value,fields:Object.fromEntries(['goals','budget','kpis','analysis','report'].map(id=>[id,value.fields[id]??'']))}:value;const [assignments,modules]=kind==='full'?await Promise.all([target.current.lessonStates.toArray(),target.current.moduleProjects.toArray()]):[[],[]];download(kind==='report'?'marketing-client-report.md':kind==='plan'?'marketing-one-page-plan.md':'marketing-portfolio.md',kind==='report'?clientReport(value):kind==='full'?learningPortfolioMarkdown(value,assignments,modules):markdown(output,true),'text/markdown;charset=utf-8')}catch{notice('تعذّر حفظ الملف قبل التصدير؛ بقيت النسخة السابقة.')}finally{setBusy(false)}}
  async function save(){
    setBusy(true)
    try{
      await autosave.flush()
      notice('حُفظ المشروع.')
    }catch{notice('تعذّر حفظ المشروع. حاول مرة أخرى.')}
    finally{setBusy(false)}
  }
  async function print(mode:'full'|'plan'){try{await autosave.flush();setPrintMode(mode);window.setTimeout(()=>window.print(),80)}catch{notice('تعذّر حفظ المسودة قبل الطباعة.')}}
  return <>
    <div className="no-print">
      <Heading title="مشروعي" description="طوّر خطة تسويقية وملف أعمال لمشروع حقيقي أو افتراضي. محاكاة تدريبية بحفظ تلقائي؛ انتظر إشارة الحفظ قبل الإغلاق. لا إنفاق أو اشتراك مطلوب."/>
      <div className="stack">
        <section className="card stack"><div className="form-row"><label>اسم المشروع<input maxLength={200} value={name} onChange={e=>setName(e.target.value)} placeholder="مثال: كرسبي الجامعة"/></label><label>نوع المشروع<select value={business} onChange={e=>setBusiness(e.target.value as Capstone['business'])}>{businesses.map(b=><option key={b}>{b}</option>)}</select></label></div>
          <div className="progress-label"><span>بنود مكتوبة</span><strong>{ar.format(count)} / {ar.format(artifactFields.length)}</strong></div><progress max={artifactFields.length} value={count} aria-label="بنود المشروع المكتوبة"/>
        </section>
        <section className="card stack"><h2>خطوات مشروع التخرج</h2><p>تقدم في المراحل أو عد إليها دون فقد النص. اكتمال الحقول مراجعة ذاتية؛ أرقام الأمثلة محاكاة. اكتب قرارك ودليله وحدوده، ثم راجع مثال الحالة إذا احتجت مساعدة.</p><details><summary>افتح دليل المراحل الاثنتي عشرة ومخرجاتها</summary><ol className="capstone-stages">{capstoneMilestones.map(([title,keys,help])=><li key={title}><button className="text-link" onClick={()=>setSelected(Math.max(0,sections.findIndex(section=>section.fields.some(([key])=>key===keys[0]))))}>{title} · {ar.format(keys.filter(key=>draft[key]?.trim()).length)}/{ar.format(keys.length)}</button><p>{help}</p></li>)}</ol></details><small aria-live="polite">{autosave.status}</small><p>للنسخ الاحتياطي المشفر لكل التسليمات والملاحظات: <Link to="/settings">افتح النسخ الاحتياطي</Link>. الحساب المحلي لا يزامن الأجهزة تلقائيًا.</p></section>
        <nav aria-label="أقسام المشروع" className="tabs">{sections.map((s,i)=><button type="button" key={s.name} aria-pressed={selected===i} className={selected===i?'selected':''} onClick={()=>setSelected(i)}>{s.name}</button>)}</nav>
        <section className="card stack"><h2>{sections[selected].name}</h2>{selected===sections.length-1&&<details><summary>بيانات تدريب افتراضية</summary><div className="sample"><table><caption>مجموعة هدية المساء الافتراضية · مثال مستقل · المبالغ بالدينار العراقي</caption><thead><tr><th scope="col">النسخة</th><th scope="col">ظهور</th><th scope="col">نقرات</th><th scope="col">طلبات</th><th scope="col">إنفاق</th><th scope="col">إيراد</th></tr></thead><tbody><tr><th scope="row">أ</th><td>١٠٠٠</td><td>٤٠</td><td>٤</td><td>٨٠٠٠</td><td>٢٤٠٠٠</td></tr><tr><th scope="row">ب</th><td>١٠٠٠</td><td>٢٥</td><td>٥</td><td>٧٥٠٠</td><td>٣٠٠٠٠</td></tr></tbody></table></div><p>احسب نسبة النقرات من الظهور وتكلفة الطلب، ثم فسّر لماذا قد تختار نسخة بأقل نقرات. الإيراد هنا لا يشمل تكاليف الإنتاج.</p></details>}{sections[selected].fields.map(([id,title])=><div key={id} className="stack"><label>{title}<textarea maxLength={50000} rows={4} value={draft[id]??''} placeholder={prompts[id]??emptyFieldTemplate(id)} onChange={e=>setDraft({...draft,[id]:e.target.value})}/></label><button type="button" className="secondary" onClick={()=>{const text=[draft[id],emptyFieldTemplate(id)].filter(Boolean).join('\n\n');if(text.length>50000){notice('القالب يتجاوز حد الحقل؛ بقي نصك دون تغيير.');return}setDraft({...draft,[id]:text})}}>أضف قالب: {title}</button></div>)}
          <button className="primary" disabled={busy} onClick={()=>void save()}>احفظ المشروع <Icon name="check"/></button>
        </section>
        <section className="card stack"><h2>نموذج التخرج المحلول</h2><p>نموذج كامل موسوم كمحاكاة يغطي الخطة والأصول والحسابات والتقرير. يمكنك قراءته أو استخدامه كنقطة بداية ثم تعديل قراراتك.</p><details><summary>اقرأ النموذج المحلول</summary>{artifactFields.map(([id,title])=><div key={id}><h3>{title}</h3><p>{capstoneExample.fields[id]}</p></div>)}</details><button className="secondary" onClick={()=>{if(window.confirm('سيستبدل النموذج النصوص المعروضة. سيحفظ تلقائيًا بعد التأكيد. صدّر نسخة أولًا إذا أردت الاحتفاظ بالنص الحالي. هل تريد المتابعة؟')){setName(capstoneExample.name);setBusiness(capstoneExample.business);setDraft({...capstoneExample.fields})}}}>استخدم نموذج المحاكاة في المحرر</button></section><section className="card stack"><h2>نماذج عراقية قابلة لإعادة الاستخدام</h2><p>ثلاث حالات مؤلفة ببيانات كاملة ونتائج محاكاة. استخدم النصوص أو رسمًا ورقيًا؛ لا تحتاج حساب إعلان أو متجرًا حيًا.</p><label>مثال مشروع التخرج<select value={caseIndex} onChange={e=>setCaseIndex(Number(e.target.value))}>{businessCases.map((c,i)=><option key={c.id} value={i}>{c.name}</option>)}</select></label><p>{businessCases[caseIndex].audience} · {businessCases[caseIndex].limit}</p><p>السعر{ar.format(businessCases[caseIndex].price)} والمتغير{ar.format(businessCases[caseIndex].cost)} والسعة الأسبوعية{ar.format(businessCases[caseIndex].capacity)}؛ جميعها افتراضات.</p><div className="sample"><table><caption>جدول محاكاة · لا أداء فعلي</caption><thead><tr><th>نسخة</th><th>ظهور</th><th>نقر</th><th>طلب</th><th>إنفاق</th><th>إيراد</th></tr></thead><tbody>{caseMetrics(businessCases[caseIndex]).map((r,i)=><tr key={i}><th scope="row">{i===0?'أ':'ب'}</th><td>{ar.format(r.impressions)}</td><td>{ar.format(r.clicks)}</td><td>{ar.format(r.orders)}</td><td>{ar.format(r.spend)}</td><td>{ar.format(r.revenue)}</td></tr>)}</tbody></table></div><details><summary>الحل الكامل للحالة المختارة · كل الحقول</summary>{artifactFields.map(([id,title])=><div key={id}><h3>{title}</h3><p>{caseExamples[caseIndex].fields[id]}</p></div>)}</details><button className="secondary" onClick={()=>{const example=caseExamples[caseIndex];setDraft(current=>({...example.fields,...Object.fromEntries(Object.entries(current).filter(([,text])=>text.trim()))}));if(!name.trim()){setName(example.name);setBusiness(example.business)}}}>املأ الحقول الفارغة فقط من الحالة</button><button className="secondary" onClick={()=>download(businessCases[caseIndex].id+'-worked-capstone.md',markdown(caseExamples[caseIndex]),'text/markdown;charset=utf-8')}>نزّل مثال الحالة الكامل</button></section><section className="card stack"><h2>تصدير ملف الأعمال</h2><p>لإنشاء PDF اختر «حفظ بتنسيق PDF» من نافذة الطباعة. استخدم نصوصًا قصيرة لطباعة الخطة في صفحة واحدة.</p><div className="actions">
          <button className="secondary" disabled={busy} onClick={()=>void exportFile('full')}>ملف الأعمال Markdown</button>
          <button className="secondary" disabled={busy} onClick={()=>void exportFile('plan')}>الخطة Markdown</button>
          <button className="secondary" disabled={busy||!draft.report?.trim()} onClick={()=>void exportFile('report')}>تقرير العميل Markdown</button><button className="secondary" onClick={()=>void print('full')}>اطبع ملف الأعمال</button>
          <button className="secondary" onClick={()=>print('plan')}>اطبع الخطة</button>
        </div></section>
      </div>
    </div>
    <article className={'print-only '+(printMode==='plan'?'print-plan':'')}><h1>{name.trim()||'مشروع التسويق'}</h1><p>{business}</p><p>ملف تدريبي؛ بيانات الأمثلة محاكاة وليست نتائج عميل حقيقية. تسليم المتعلم غير متحقق منه؛ وثق أي واقعة ومصدرها وحدودها.</p><div className="print-grid">{(printMode==='plan'?stages:sections).map(s=><section key={s.name}><h2>{s.name}</h2>{s.fields.map(([id,title])=><div key={id}><h3>{title}</h3><p>{draft[id]?.trim()||'—'}</p></div>)}</section>)}</div></article>
  </>
}
export function SettingsPage({settings,notice}:{settings:Settings;notice:Notice}){
  const target=useRef(db)
  const [pending,setPending]=useState<File>()
  const [phrase,setPhrase]=useState('')
  const [oldPassword,setOldPassword]=useState(''),[newPassword,setNewPassword]=useState('')
  const [busy,setBusy]=useState(false)
  const [failure,setFailure]=useState('')
  return <><Heading title="الإعدادات" description="عدّل خطة الدراسة أو انقل تقدمك إلى جهاز آخر."/>
    <div className="stack">
      <ProfilePanel/>
      <section className="card"><SettingsForm key={settings.goal+settings.minutes+settings.business} settings={settings} save={async next=>{try{await db.settings.update('local',{goal:next.goal,minutes:next.minutes,business:next.business});notice('حُفظت الإعدادات.')}catch{notice('تعذّر حفظ الإعدادات.')}}}/></section>
      <section className="card stack"><h2>نسخ احتياطي واستعادة</h2><p>النسخة الجديدة مشفّرة بعبارة تختارها. احفظها خارج الجهاز. الاستعادة تستبدل بيانات الحساب الحالي فقط بعد التحقق؛ صدّر نسخة قبله. يمكن استيراد JSON من الإصدار السابق أيضًا.</p>
        <label>عبارة حماية النسخة<input type="password" autoComplete="off" minLength={12} maxLength={128} value={phrase} onChange={e=>setPhrase(e.target.value)}/></label>
        <button className="secondary" disabled={busy||phrase.length<12} onClick={async()=>{setBusy(true);try{download('marketing-academy.academy',JSON.stringify(await encryptBackup(await exportBackup(target.current),phrase)),'application/json');notice('صُدّرت النسخة المشفّرة.')}catch(error){notice(error instanceof Error?error.message:'تعذّر تصدير النسخة.')}finally{setBusy(false)}}}>نزّل نسخة مشفّرة</button>
        <label>اختر نسخة احتياطية<input type="file" accept=".academy,.json,application/json" onChange={e=>{setPending(e.target.files?.[0]);setFailure('')}}/></label>
        <button className="primary" disabled={!pending||busy} onClick={async()=>{if(!pending)return;setBusy(true);setFailure('');try{if(pending.size>20_000_000)throw new Error('ملف كبير جدًا.');const raw=JSON.parse(await pending.text());await restoreBackup(raw.format==='marketing-academy-encrypted'?await decryptBackup(raw,phrase):raw,target.current);setPending(undefined);notice('استُعيدت النسخة بنجاح.')}catch{setFailure('الملف غير صالح أو تعذّر استيراده. بقي تقدمك الحالي محفوظًا.')}finally{setBusy(false)}}}>استعد النسخة واستبدل البيانات</button>
        {failure&&<p role="alert">{failure}</p>}
      </section>
      <section className="card stack"><h2>تغيير كلمة المرور</h2><form className="stack" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await changePassword(oldPassword,newPassword);setOldPassword('');setNewPassword('');notice('تغيّرت كلمة المرور.')}catch(e){notice(e instanceof Error?e.message:'تعذّر تغيير كلمة المرور.')}finally{setBusy(false)}}}><label>كلمة المرور الحالية<input type="password" autoComplete="current-password" maxLength={256} required value={oldPassword} onChange={e=>setOldPassword(e.target.value)}/></label><label>كلمة المرور الجديدة<input type="password" autoComplete="new-password" minLength={12} maxLength={256} required value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></label><button className="secondary" disabled={busy}>غيّر كلمة المرور</button></form></section>
      <section className="card stack"><h2>التثبيت والاستخدام دون اتصال</h2><p>نسخة Windows المحمولة تعمل مباشرة دون تثبيت أدوات أو خادم. {activeTransport()?.kind==='web-api'?'حسابات نسخة الويب هذه تحتاج اتصالًا بالخادم للدخول والحفظ.':'نسخة الويب المحلية تعمل دون اتصال بعد تحميل التطبيق وحفظ ملفاته.'} استخدم خيار تثبيت التطبيق في قائمة متصفحك. على iPad، افتح Safari واختر «مشاركة»، ثم «إضافة إلى الشاشة الرئيسية».</p></section>
    </div></>
}
