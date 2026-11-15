import {defineConfig} from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import {VitePWA} from 'vite-plugin-pwa'

export default defineConfig({
  plugins:[react(),tailwind(),VitePWA({
    registerType:'autoUpdate', injectRegister:false,
    manifest:{name:'أكاديمية التسويق',short_name:'أكاديمية التسويق',description:'تعلّم التسويق الرقمي خطوة بخطوة',lang:'ar',dir:'rtl',id:'/',start_url:'/',display:'standalone',background_color:'#f7f8fc',theme_color:'#1e1953',icons:[
      {src:'icon-192.png',sizes:'192x192',type:'image/png'},
      {src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}
    ]},
    workbox:{globPatterns:['**/*.{html,js,css,png,woff2}'],navigateFallback:'/index.html',cleanupOutdatedCaches:true}
  })],
  build:{rollupOptions:{output:{manualChunks:{curriculum:['./src/lessons/index.ts']}}}},
  test:{environment:'jsdom',setupFiles:['./src/test-setup.ts']}
})
