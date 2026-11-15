import {createContext,useContext,useEffect,useState,type ReactNode} from 'react'
import {currentSession,importLegacy,legacyAvailable,login,logout,register,type Session} from './auth'
import {Heading} from './ui'

const AccountContext=createContext<{session:Session;signOut:()=>void}|undefined>(undefined)
export const useAccount=()=>useContext(AccountContext)
export function AuthGate({children}:{children:ReactNode}){
  const [session,setSession]=useState(currentSession)
  if(!session)return <Login onEnter={setSession}/>
  return <AccountContext.Provider value={{session,signOut:()=>{logout();setSession(undefined)}}}><div key={session.id}>{children}</div></AccountContext.Provider>
}
function Login({onEnter}:{onEnter:(session:Session)=>void}){
  const [mode,setMode]=useState<'login'|'register'>('login')
  const [name,setName]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('')
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  return <main className="onboard"><section className="welcome card stack"><img src="/icon-192.png" alt="" width="58" height="58"/><Heading title="أكاديمية التسويق ٢.٠" description="تعلّم، جرّب، وابنِ ملف أعمالك · ٦٠ درسًا بالعربية"/>
    <div className="tabs"><button aria-pressed={mode==='login'} onClick={()=>{setMode('login');setError('')}}>تسجيل الدخول</button><button aria-pressed={mode==='register'} onClick={()=>{setMode('register');setError('')}}>إنشاء حساب</button></div>
    <form className="stack" onSubmit={async e=>{e.preventDefault();setError('');setBusy(true);try{
      if(mode==='register'&&password!==confirm)throw new Error('كلمتا المرور غير متطابقتين.')
      const next=await (mode==='login'?login(name,password):register(name,password));setPassword('');setConfirm('');onEnter(next)
    }catch(err){setError(err instanceof Error?err.message:'تعذّر فتح الحساب.')}finally{setBusy(false)}}}>
      <label>اسم المستخدم<input required minLength={3} maxLength={40} autoComplete="username" value={name} onChange={e=>setName(e.target.value)}/></label>
      <label>كلمة المرور<input required type="password" minLength={mode==='register'?12:1} maxLength={128} autoComplete={mode==='register'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>
      {mode==='register'&&<><label>تأكيد كلمة المرور<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><p className="muted">استخدم عبارة طويلة من ١٢ حرفًا على الأقل. احتفظ بكلمة المرور؛ لا توجد استعادة عبر البريد للحساب المحلي.</p></>}
      <button className="primary" disabled={busy}>{busy?'جارٍ فتح الحساب…':mode==='register'?'أنشئ حسابي':'ادخل إلى الأكاديمية'}</button>
      <p role="alert">{error}</p>
    </form><p className="muted">حساب محلي على هذا الجهاز. بيانات كل حساب مشفّرة ومحفوظة منفصلة. لا تحتاج اتصالًا بالإنترنت للتعلّم.</p>
  </section></main>
}
export function LegacyImport(){
  const [available,setAvailable]=useState(false),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
  useEffect(()=>{legacyAvailable().then(setAvailable).catch(()=>setMessage('تعذّر فحص بيانات النسخة السابقة.'))},[])
  if(!available&&!message)return null
  return <section className="callout stack"><h2>بيانات النسخة السابقة</h2><p>وجدنا تقدمًا من النسخة القديمة دون حساب. يمكنك ربطه بهذا الحساب مرة واحدة قبل بدء الدراسة. يبقى الأصل محفوظًا.</p><button className="secondary" disabled={busy} onClick={async()=>{setBusy(true);try{await importLegacy();window.location.reload()}catch(e){setMessage(e instanceof Error?e.message:'تعذّر الاستيراد.');setBusy(false)}}}>اربط تقدمي السابق بهذا الحساب</button><p role="status">{message}</p></section>
}
