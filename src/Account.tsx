import {discoverTransport,activeTransport} from './storage/transport'
import {createContext,useContext,useEffect,useState,useCallback,type ReactNode} from 'react'
import {currentSession,forgetSession,importLegacy,legacyAvailable,login,logout,register,profile,updateProfile,type Session} from './auth'
import {Heading} from './ui'

const AccountContext=createContext<{session:Session;signOut:()=>void;refreshIdentity:()=>void}|undefined>(undefined)
export const useAccount=()=>useContext(AccountContext)
export function AuthGate({children}:{children:ReactNode}){
  const [session,setSession]=useState(currentSession)
  const [ending,setEnding]=useState(false),[exitNotice,setExitNotice]=useState('')
  const signOut=useCallback(()=>{setEnding(true);setExitNotice('');void logout().catch(()=>setExitNotice('قُفلت بياناتك في هذه النافذة، لكن تعذّر إنهاء جلسة الخادم. أغلق المتصفح على الجهاز المشترك؛ جلسة الخادم تنتهي بعد مدة الخمول.')).finally(()=>{setSession(undefined);setEnding(false)})},[])
  useEffect(()=>{
   if(!session)return
   const started=Date.now();let lastActive=started,lastPing=started,locked=false
   const activity=()=>{check();if(!locked)lastActive=Date.now()}
   const check=()=>{if(!locked&&(Date.now()-lastActive>=30*60_000||Date.now()-started>=12*60*60_000)){locked=true;signOut()}else if(!locked&&Date.now()-lastPing>=5*60_000&&Date.now()-lastActive<5*60_000){lastPing=Date.now();void profile().catch(()=>{})}}
   const events=['pointerdown','keydown','scroll'] as const
   for(const event of events)window.addEventListener(event,activity,{passive:true})
   window.addEventListener('focus',check)
   const timer=window.setInterval(check,15000)
   return()=>{window.clearInterval(timer);window.removeEventListener('focus',check);for(const event of events)window.removeEventListener(event,activity)}
  },[session?.id,signOut])
  const [boot,setBoot]=useState<'loading'|'ready'|'error'>('loading'),[failure,setFailure]=useState('')
  useEffect(()=>{let active=true;discoverTransport().then(()=>{if(active)setBoot('ready')},error=>{if(active){setFailure(error instanceof Error?error.message:'تعذّر فتح الحسابات.');setBoot('error')}});const invalid=(event:Event)=>{const owner=(event as CustomEvent<string|undefined>).detail;if(owner&&currentSession()?.id!==owner)return;forgetSession();setSession(undefined)};window.addEventListener('academy-session-invalid',invalid);return()=>{active=false;window.removeEventListener('academy-session-invalid',invalid)}},[])
  if(boot==='loading')return <main className="welcome" role="status">جارٍ فتح الأكاديمية…</main>
  if(boot==='error')return <main className="welcome card stack"><p role="alert">{failure}</p><button className="primary" onClick={()=>window.location.reload()}>أعد المحاولة</button></main>
  if(ending)return <main className="welcome" role="status">جارٍ قفل الحساب…</main>
  if(!session)return <Login onEnter={setSession} notice={exitNotice}/>
  return <AccountContext.Provider value={{session,refreshIdentity:()=>setSession(currentSession()),signOut}}><div key={session.id}>{children}</div></AccountContext.Provider>
}
function Login({onEnter,notice}:{onEnter:(session:Session)=>void;notice?:string}){
  const [mode,setMode]=useState<'login'|'register'>('login')
  const [name,setName]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('')
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  return <main className="onboard"><section className="welcome card stack"><img src="/icon-192.png" alt="" width="58" height="58"/><Heading title="أكاديمية التسويق ٢.٠" description="تعلّم، جرّب، وابنِ ملف أعمالك · ٦٠ درسًا بالعربية"/>
    {notice&&<p role="alert">{notice}</p>}<div className="tabs"><button aria-pressed={mode==='login'} onClick={()=>{setMode('login');setError('')}}>تسجيل الدخول</button><button aria-pressed={mode==='register'} onClick={()=>{setMode('register');setError('')}}>إنشاء حساب</button></div>
    <form className="stack" onSubmit={async e=>{e.preventDefault();setError('');setBusy(true);try{
      if(mode==='register'&&password!==confirm)throw new Error('كلمتا المرور غير متطابقتين.')
      const next=await (mode==='login'?login(name,password):register(name,password));setPassword('');setConfirm('');onEnter(next)
    }catch(err){setError(err instanceof Error?err.message:'تعذّر فتح الحساب.')}finally{setBusy(false)}}}>
      <label>اسم المستخدم<input required minLength={3} maxLength={40} autoComplete="username" value={name} onChange={e=>setName(e.target.value)}/></label>
      <label>كلمة المرور<input required type="password" minLength={mode==='register'?12:1} maxLength={128} autoComplete={mode==='register'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>
      {mode==='register'&&<><label>تأكيد كلمة المرور<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><p className="muted">استخدم عبارة طويلة من ١٢ حرفًا على الأقل. احتفظ بكلمة المرور؛ لا توجد استعادة عبر البريد للحساب المحلي.</p></>}
      <button className="primary" disabled={busy}>{busy?'جارٍ فتح الحساب…':mode==='register'?'أنشئ حسابي':'ادخل إلى الأكاديمية'}</button>
      <p role="alert">{error}</p>
    </form><p className="muted">{activeTransport()?.kind==='web-api'?'حساب على خادم هذا النشر؛ بياناته محفوظة منفصلة. يلزم اتصال بالخادم للحفظ.':'حساب محلي على هذا الجهاز. بيانات كل حساب مشفّرة ومحفوظة منفصلة. لا تحتاج اتصالًا بالإنترنت للتعلّم.'}</p>
  </section></main>
}
export function LegacyImport(){
  const [available,setAvailable]=useState(false),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
  useEffect(()=>{legacyAvailable().then(setAvailable).catch(()=>setMessage('تعذّر فحص بيانات النسخة السابقة.'))},[])
  if(!available&&!message)return null
  return <section className="callout stack"><h2>بيانات النسخة السابقة</h2><p>وجدنا تقدمًا من النسخة القديمة دون حساب. يمكنك ربطه بهذا الحساب مرة واحدة قبل بدء الدراسة. يبقى الأصل محفوظًا.</p><button className="secondary" disabled={busy} onClick={async()=>{setBusy(true);try{await importLegacy();window.location.reload()}catch(e){setMessage(e instanceof Error?e.message:'تعذّر الاستيراد.');setBusy(false)}}}>اربط تقدمي السابق بهذا الحساب</button><p role="status">{message}</p></section>
}

export function ProfilePanel(){
 const account=useAccount()
 const [details,setDetails]=useState<Awaited<ReturnType<typeof profile>>>(),[name,setName]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0)
 useEffect(()=>{let active=true;profile().then(value=>{if(active){setDetails(value);setName(value.name);setMessage('')}},()=>{if(active)setMessage('تعذّر تحميل الملف الشخصي.')});return()=>{active=false}},[retry])
 return <section className="card stack"><h2>الملف الشخصي والحساب</h2>{details?<form className="stack" onSubmit={async e=>{e.preventDefault();setBusy(true);setMessage('');try{const next=await updateProfile(name);setDetails(next);setName(next.name);account?.refreshIdentity();setMessage('حُفظ الملف الشخصي.')}catch{setMessage('تعذّر حفظ الاسم. استخدم من حرف إلى٨٠ حرفًا دون أسطر جديدة.')}finally{setBusy(false)}}}>
 <p>اسم الدخول الثابت: <bdi>{details.username}</bdi></p><p>تاريخ إنشاء الحساب: <time dateTime={details.createdAt}>{new Intl.DateTimeFormat('ar',{dateStyle:'medium'}).format(new Date(details.createdAt))}</time></p>
 <label>اسم العرض<input required maxLength={80} value={name} onChange={e=>setName(e.target.value)} autoComplete="nickname"/></label><button className="primary" disabled={busy}>احفظ الملف الشخصي</button>
 </form>:<button className="secondary" onClick={()=>setRetry(n=>n+1)}>أعد تحميل الملف الشخصي</button>}
 <p role="status">{message}</p><p>تغيير اسم العرض لا يغيّر اسم الدخول أو تقدمك. تُقفل النافذة بعد٣٠ دقيقة دون تفاعل وبحد أقصى١٢ ساعة؛ احفظ المسودات قبل ترك الجهاز. لتبديل المستخدم، يُقفل الحساب الحالي ثم تسجّل دخول الحساب الآخر بكلمة مروره.</p><button className="secondary" onClick={account?.signOut}>تبديل المستخدم</button>
 <p>لا توجد مزامنة سحابية تلقائية بين حساب الجهاز ونسخة الويب أو الأجهزة الأخرى. انقل تقدمك يدويًا بنسخة مشفّرة وعبارة حمايتها؛ الاستعادة تستبدل بيانات الحساب المفتوح فقط ولا تنقل كلمة مروره.</p></section>
}
