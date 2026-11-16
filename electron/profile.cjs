'use strict'
const path=require('node:path')
function resolveProfile(channel,appData,productionData,testRoot){
 if(!['production','qa'].includes(channel))throw new Error('Unknown packaged channel')
 const userData=channel==='qa'?path.join(testRoot||appData,'marketing-academy-qa'):(testRoot?path.resolve(testRoot):productionData)
 return {channel,userData,sessionData:channel==='qa'?path.join(userData,'chromium'):undefined}
}
module.exports={resolveProfile}
