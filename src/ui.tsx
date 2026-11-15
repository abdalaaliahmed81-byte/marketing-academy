import {useAccount} from './Account'
import {useEffect,useState,type ReactNode} from 'react'
import {NavLink} from 'react-router-dom'
import {baghdadDay,businesses,type Capstone,type Settings} from './domain'

export const ar=new Intl.NumberFormat('ar-IQ')
export type Notice=(message:string)=>void
export type SetSettings=(settings:Settings)=>Promise<void>
const glyphs:Record<string,string>={search:'M11 3a8 8 0 100 16 8 8 0 000-16z M17 17l5 5',chart:'M4 20V10 M10 20V4 M16 20v-9 M22 20H2',note:'M5 3h14v18H5z M8 8h8 M8 12h8 M8 16h4',home:'M3 10l9-7 9 7v10H3z M9 20v-7h6v7',book:'M4 4h6a2 2 0 012 2v15a3 3 0 00-3-2H4z M20 4h-6a2 2 0 00-2 2v15a3 3 0 013-2h5z',target:'M12 3a9 9 0 100 18 9 9 0 000-18z M12 7a5 5 0 100 10 5 5 0 000-10z M12 11v2',case:'M3 7h18v13H3z M8 7V4h8v3 M3 12h18 M10 12v2h4v-2',settings:'M4 7h16 M4 17h16 M9 4v6 M15 14v6',arrow:'M20 12H4 M10 6l-6 6 6 6',moon:'M20 15A8 8 0 019 4a8 8 0 1011 11z',sun:'M12 8a4 4 0 100 8 4 4 0 000-8z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M19 5l-2 2 M7 17l-2 2',lock:'M6 11h12v10H6z M8 11V7a4 4 0 118 0v4',check:'M4 12l5 5L20 6',clock:'M12 3a9 9 0 100 18 9 9 0 000-18z M12 7v6l4 2',bookmark:'M6 3h12v18l-6-4-6 4z',trend:'M3 17l6-6 4 3 7-8 M14 6h6v6'}
export function Icon({name,size=21}:{name:string;size?:number}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={glyphs[name]}/></svg>
}
const links=[['/','الرئيسية','home'],['/path','مسار التعلّم','book'],['/mission','المهمة اليومية','target'],['/projects','مشروعات الوحدات','book'],['/project','مشروعي','case'],['/library','مكتبة الموارد','search'],['/stats','إحصاءات التقدم','chart'],['/settings','الإعدادات','settings']]
export function Shell({settings,onTheme,children}:{settings:Settings;onTheme:()=>void;children:ReactNode}){
  const account=useAccount()
  return <div className="shell">
    <a href="#main-content" className="skip" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus()}}>انتقل إلى المحتوى</a>
    <aside className="sidebar">
      <div className="brand"><img src="/icon-192.png" alt="" width="42" height="42"/><div><strong>أكاديمية التسويق</strong><small>تعلّم · طبّق · تقدّم</small></div></div>
      <nav aria-label="التنقل الرئيسي">{links.map(([to,label,icon])=><NavLink key={to} end={to==='/'} to={to} className={({isActive})=>isActive?'active':''}><Icon name={icon}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-foot"><span className="status-dot"/> تقدمك محفوظ لكل حساب</div>
    </aside>
    <div className="frame">
      <header className="top"><div className="top-brand"><span className="eyebrow">مساحتك للتعلّم</span><strong>أكاديمية التسويق</strong></div><NavLink className="top-search" aria-label="ابحث في مكتبتك" to="/library"><Icon name="search" size={18}/><span>ابحث في مكتبتك</span><kbd aria-hidden="true">⌕</kbd></NavLink><div className="actions">{account&&<><span className="account-name">{account.session.name}</span><button className="secondary" onClick={account.signOut}>خروج</button></>}<button className="icon-btn" onClick={onTheme} aria-label={settings.theme==='dark'?'المظهر الفاتح':'المظهر الداكن'}><Icon name={settings.theme==='dark'?'sun':'moon'}/></button></div></header>
      <main id="main-content" tabIndex={-1}>{children}</main>
    </div>
  </div>
}
export function Heading({title,description}:{title:ReactNode;description?:string}){return <div className="heading"><h1>{title}</h1>{description&&<p>{description}</p>}</div>}
export function Checklist({rubric,checked,onChange}:{rubric:string[];checked:number[];onChange:(value:number[])=>void}){
  return <fieldset className="checklist"><legend>المراجعة الذاتية</legend>{rubric.map((line,i)=><label key={line}><input type="checkbox" checked={checked.includes(i)} onChange={e=>onChange(e.target.checked?[...checked,i]:checked.filter(n=>n!==i))}/>{line}</label>)}</fieldset>
}
export function SettingsForm({settings,save}:{settings?:Settings;save:SetSettings}){
  const [goal,setGoal]=useState(settings?.goal??'أنجز أول مشروع لملف أعمالي')
  const [minutes,setMinutes]=useState(settings?.minutes??30)
  const [business,setBusiness]=useState<Capstone['business']>(settings?.business??'مطعم')
  const [busy,setBusy]=useState(false)
  return <form className="stack" onSubmit={async e=>{e.preventDefault();if(!goal.trim())return;setBusy(true);try{await save({...settings,id:'local',goal:goal.trim(),minutes,business,theme:settings?.theme??'light'})}finally{setBusy(false)}}}>
    <label>هدفك من التعلّم<input required maxLength={200} value={goal} onChange={e=>setGoal(e.target.value)}/></label>
    <label>وقت الدراسة اليومي<select value={minutes} onChange={e=>setMinutes(Number(e.target.value))}>{Array.from({length:21},(_,i)=>i+20).map(n=><option value={n} key={n}>{ar.format(n)} دقيقة</option>)}</select></label>
    <label>نوع المشروع<select value={business} onChange={e=>setBusiness(e.target.value as Capstone['business'])}>{businesses.map(b=><option key={b}>{b}</option>)}</select></label>
    <button className="primary" disabled={busy}>{settings?'احفظ الإعدادات':'ابدأ التعلّم'}<Icon name={settings?'check':'arrow'}/></button>
  </form>
}
export function useBaghdadDay(){
  const [day,setDay]=useState(baghdadDay)
  useEffect(()=>{
    const update=()=>setDay(baghdadDay())
    const timer=window.setInterval(update,1000)
    window.addEventListener('focus',update)
    return ()=>{window.clearInterval(timer);window.removeEventListener('focus',update)}
  },[])
  return day
}
export function download(name:string,content:string,mime:string){
  const url=URL.createObjectURL(new Blob([content],{type:mime}))
  const a=document.createElement('a')
  a.href=url;a.download=name;a.click()
  window.setTimeout(()=>URL.revokeObjectURL(url),1000)
}
