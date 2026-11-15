import {capstoneExample} from './projects'
import {encryptBackup,decryptBackup} from './backup'
import {changePassword} from './auth'
import {useEffect,useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import {useLiveQuery} from 'dexie-react-hooks'
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
  const [response,setResponse]=useState(mission.response)
  const [checked,setChecked]=useState(mission.checked)
  const [busy,setBusy]=useState(false)
  async function persist(complete:boolean){
    setBusy(true)
    try{await saveMission(mission.date,response,checked,complete);notice(complete?'أكملت المهمة.':'حُفظت مسودة المهمة.')}
    catch(error){notice(error instanceof Error?error.message:'تعذّر حفظ المهمة.')}
    finally{setBusy(false)}
  }
  return <section className="card stack">
    <div className="section-title"><h2><bdi>{mission.date}</bdi></h2><span>{mission.completed?'✓ مكتملة':'تطبيق · ١٠–٢٠ دقيقة'}</span></div>
    <p>{mission.prompt}</p><label>إجابتك<textarea rows={7} value={response} onChange={e=>setResponse(e.target.value)}/></label>
    <Checklist rubric={mission.rubric} checked={checked} onChange={setChecked}/>
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
  const baseline=useRef(project)
  const [selected,setSelected]=useState(0)
  const [printMode,setPrintMode]=useState<'full'|'plan'>('full')
  const [name,setName]=useState(project.name)
  const [business,setBusiness]=useState(project.business)
  const [draft,setDraft]=useState(project.fields)
  const [busy,setBusy]=useState(false)
  const count=artifactFields.filter(([id])=>draft[id]?.trim()).length
  const value={name,business,fields:draft}
  async function save(){
    setBusy(true)
    try{
      await saveProject(value,baseline.current)
      baseline.current=value
      notice('حُفظ المشروع على جهازك.')
    }catch{notice('تعذّر حفظ المشروع. حاول مرة أخرى.')}
    finally{setBusy(false)}
  }
  function print(mode:'full'|'plan'){
    setPrintMode(mode)
    window.setTimeout(()=>window.print(),80)
  }
  return <>
    <div className="no-print">
      <Heading title="مشروعي" description="طوّر خطة تسويقية وملف أعمال لمشروع حقيقي أو افتراضي. احفظ مسودتك قبل مغادرة الصفحة."/>
      <div className="stack">
        <section className="card stack"><div className="form-row"><label>اسم المشروع<input value={name} onChange={e=>setName(e.target.value)} placeholder="مثال: كرسبي الجامعة"/></label><label>نوع المشروع<select value={business} onChange={e=>setBusiness(e.target.value as Capstone['business'])}>{businesses.map(b=><option key={b}>{b}</option>)}</select></label></div>
          <div className="progress-label"><span>بنود مكتوبة</span><strong>{ar.format(count)} / {ar.format(artifactFields.length)}</strong></div><progress max={artifactFields.length} value={count} aria-label="بنود المشروع المكتوبة"/>
        </section>
        <nav aria-label="أقسام المشروع" className="tabs">{sections.map((s,i)=><button type="button" key={s.name} aria-pressed={selected===i} className={selected===i?'selected':''} onClick={()=>setSelected(i)}>{s.name}</button>)}</nav>
        <section className="card stack"><h2>{sections[selected].name}</h2>{selected===sections.length-1&&<details><summary>بيانات تدريب افتراضية</summary><div className="sample"><table><caption>نتائج إعلانين خلال أسبوع · المبالغ بالدينار العراقي</caption><thead><tr><th scope="col">النسخة</th><th scope="col">ظهور</th><th scope="col">نقرات</th><th scope="col">طلبات</th><th scope="col">إنفاق</th><th scope="col">إيراد</th></tr></thead><tbody><tr><th scope="row">أ</th><td>١٠٠٠</td><td>٤٠</td><td>٤</td><td>٨٠٠٠</td><td>٢٤٠٠٠</td></tr><tr><th scope="row">ب</th><td>١٠٠٠</td><td>٢٥</td><td>٥</td><td>٧٥٠٠</td><td>٣٠٠٠٠</td></tr></tbody></table></div><p>احسب نسبة النقرات من الظهور وتكلفة الطلب، ثم فسّر لماذا قد تختار نسخة بأقل نقرات. الإيراد هنا لا يشمل تكاليف الإنتاج.</p></details>}{sections[selected].fields.map(([id,title])=><label key={id}>{title}<textarea rows={4} value={draft[id]??''} placeholder={prompts[id]} onChange={e=>setDraft({...draft,[id]:e.target.value})}/></label>)}
          <button className="primary" disabled={busy} onClick={()=>void save()}>احفظ المشروع <Icon name="check"/></button>
        </section>
        <section className="card stack"><h2>نموذج التخرج المحلول</h2><p>نموذج كامل موسوم كمحاكاة يغطي الخطة والأصول والحسابات والتقرير. يمكنك قراءته أو استخدامه كنقطة بداية ثم تعديل قراراتك.</p><details><summary>اقرأ النموذج المحلول</summary>{artifactFields.map(([id,title])=><div key={id}><h3>{title}</h3><p>{capstoneExample.fields[id]}</p></div>)}</details><button className="secondary" onClick={()=>{if(window.confirm('سيستبدل النموذج النصوص المعروضة. لن تُحفظ التغييرات حتى تضغط احفظ المشروع. هل تريد المتابعة؟')){setName(capstoneExample.name);setBusiness(capstoneExample.business);setDraft({...capstoneExample.fields})}}}>استخدم نموذج المحاكاة في المحرر</button></section><section className="card stack"><h2>تصدير ملف الأعمال</h2><p>لإنشاء PDF اختر «حفظ بتنسيق PDF» من نافذة الطباعة. استخدم نصوصًا قصيرة لطباعة الخطة في صفحة واحدة.</p><div className="actions">
          <button className="secondary" onClick={()=>download('marketing-portfolio.md',markdown(value),'text/markdown;charset=utf-8')}>ملف الأعمال Markdown</button>
          <button className="secondary" onClick={()=>download('marketing-one-page-plan.md',markdown(value,true),'text/markdown;charset=utf-8')}>الخطة Markdown</button>
          <button className="secondary" onClick={()=>print('full')}>اطبع ملف الأعمال</button>
          <button className="secondary" onClick={()=>print('plan')}>اطبع الخطة</button>
        </div></section>
      </div>
    </div>
    <article className={'print-only '+(printMode==='plan'?'print-plan':'')}><h1>{name.trim()||'مشروع التسويق'}</h1><p>{business}</p><div className="print-grid">{(printMode==='plan'?stages:sections).map(s=><section key={s.name}><h2>{s.name}</h2>{s.fields.map(([id,title])=><div key={id}><h3>{title}</h3><p>{draft[id]?.trim()||'—'}</p></div>)}</section>)}</div></article>
  </>
}
export function SettingsPage({settings,notice}:{settings:Settings;notice:Notice}){
  const [pending,setPending]=useState<File>()
  const [phrase,setPhrase]=useState('')
  const [oldPassword,setOldPassword]=useState(''),[newPassword,setNewPassword]=useState('')
  const [busy,setBusy]=useState(false)
  const [failure,setFailure]=useState('')
  return <><Heading title="الإعدادات" description="عدّل خطة الدراسة أو انقل تقدمك إلى جهاز آخر."/>
    <div className="stack">
      <section className="card"><SettingsForm key={settings.goal+settings.minutes+settings.business} settings={settings} save={async next=>{try{await db.settings.update('local',{goal:next.goal,minutes:next.minutes,business:next.business});notice('حُفظت الإعدادات.')}catch{notice('تعذّر حفظ الإعدادات.')}}}/></section>
      <section className="card stack"><h2>نسخ احتياطي واستعادة</h2><p>النسخة الجديدة مشفّرة بعبارة تختارها. احفظها خارج الجهاز. الاستعادة تستبدل بيانات الحساب الحالي فقط بعد التحقق؛ صدّر نسخة قبله. يمكن استيراد JSON من الإصدار السابق أيضًا.</p>
        <label>عبارة حماية النسخة<input type="password" autoComplete="off" minLength={12} maxLength={128} value={phrase} onChange={e=>setPhrase(e.target.value)}/></label>
        <button className="secondary" disabled={busy||phrase.length<12} onClick={async()=>{setBusy(true);try{download('marketing-academy.academy',JSON.stringify(await encryptBackup(await exportBackup(),phrase)),'application/json');notice('صُدّرت النسخة المشفّرة.')}catch(error){notice(error instanceof Error?error.message:'تعذّر تصدير النسخة.')}finally{setBusy(false)}}}>نزّل نسخة مشفّرة</button>
        <label>اختر نسخة احتياطية<input type="file" accept=".academy,.json,application/json" onChange={e=>{setPending(e.target.files?.[0]);setFailure('')}}/></label>
        <button className="primary" disabled={!pending||busy} onClick={async()=>{if(!pending)return;setBusy(true);setFailure('');try{if(pending.size>20_000_000)throw new Error('ملف كبير جدًا.');const raw=JSON.parse(await pending.text());await restoreBackup(raw.format==='marketing-academy-encrypted'?await decryptBackup(raw,phrase):raw);setPending(undefined);notice('استُعيدت النسخة بنجاح.')}catch{setFailure('الملف غير صالح أو تعذّر استيراده. بقي تقدمك الحالي محفوظًا.')}finally{setBusy(false)}}}>استعد النسخة واستبدل البيانات</button>
        {failure&&<p role="alert">{failure}</p>}
      </section>
      <section className="card stack"><h2>تغيير كلمة المرور</h2><form className="stack" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await changePassword(oldPassword,newPassword);setOldPassword('');setNewPassword('');notice('تغيّرت كلمة المرور.')}catch(e){notice(e instanceof Error?e.message:'تعذّر تغيير كلمة المرور.')}finally{setBusy(false)}}}><label>كلمة المرور الحالية<input type="password" autoComplete="current-password" required value={oldPassword} onChange={e=>setOldPassword(e.target.value)}/></label><label>كلمة المرور الجديدة<input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></label><button className="secondary" disabled={busy}>غيّر كلمة المرور</button></form></section>
      <section className="card stack"><h2>التثبيت والاستخدام دون اتصال</h2><p>نسخة Windows المحمولة تعمل مباشرة دون تثبيت أدوات أو خادم. في نسخة الويب افتح التطبيق مرة واحدة وانتظر اكتمال تحميله. استخدم خيار تثبيت التطبيق في قائمة متصفحك. على iPad، افتح Safari واختر «مشاركة»، ثم «إضافة إلى الشاشة الرئيسية».</p></section>
    </div></>
}
