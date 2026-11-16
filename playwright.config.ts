import {defineConfig} from '@playwright/test'
export default defineConfig({
 testDir:'./tests',timeout:90000,workers:1,fullyParallel:false,
 reporter:[['list'],['json',{outputFile:'artifacts/playwright.json'}],['html',{open:'never'}]],
 use:{baseURL:'http://127.0.0.1:4173',headless:true,trace:'retain-on-failure',screenshot:'only-on-failure',launchOptions:process.platform==='linux'&&!process.env.CI?{executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox']}:{}},
 webServer:[{command:'node scripts/serve.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI},{command:'node scripts/start-api-test.mjs',url:'http://127.0.0.1:4174/api/health',reuseExistingServer:!process.env.CI},{command:'node scripts/start-api-test.mjs',url:'http://127.0.0.1:4175/api/health',env:{ACADEMY_TEST_API_PORT:'4175'},reuseExistingServer:!process.env.CI}]
})
