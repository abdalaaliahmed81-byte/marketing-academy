import {createRoot} from 'react-dom/client'
import {HashRouter} from 'react-router-dom'
import {registerSW} from 'virtual:pwa-register'
import {App} from './App'
import './style.css'

if(import.meta.env.PROD&&location.protocol!=='academy:') registerSW({immediate:true})
createRoot(document.getElementById('root')!).render(<HashRouter><App/></HashRouter>)
