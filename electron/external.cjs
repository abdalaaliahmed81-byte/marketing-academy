'use strict'
const externalHosts=new Set(['grow.google','academy.hubspot.com','www.facebookblueprint.com','skillshop.withgoogle.com','developers.google.com','www.semrush.com','allandib.com','www.penguinrandomhouse.com','seths.blog','support.google.com','www.google.com','www.ftc.gov','www.w3.org','docs.cloud.google.com','legal.hubspot.com','openstax.org','policies.google.com','www.facebook.com','www.itl.nist.gov','www.nist.gov','www.rfc-editor.org'])
function safeExternal(url){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&externalHosts.has(u.hostname)}catch{return false}}
module.exports={safeExternal}
