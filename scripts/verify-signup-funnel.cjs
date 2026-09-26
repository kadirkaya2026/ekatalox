// Yerel, ağsız sözleşme kontrolü: node scripts/verify-signup-funnel.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
};
const { normalizeTrMobile, signupSchema } = require('../lib/validators/signup.ts');
const { siteAnalyticsBatchSchema } = require('../lib/validators/site-analytics.ts');
const { FUNNEL_EVENTS, trackFunnel } = require('../lib/site-analytics/funnel.ts');
for (const phone of ['0532 000 00 00', '+90 (532) 000-00-00', '905320000000', '5320000000']) {
  assert.equal(normalizeTrMobile(phone), '05320000000');
}
assert.equal(normalizeTrMobile('1234'), null);
const signup = {businessName:'Deneme Firma', sector:'diger', fullName:'Test Kişi', phone:'+90 532 000 00 00', email:'test@example.com', password:'test-only-password', city:'İstanbul', whatsappNumber:'05320000000', subdomain:'test-katalog', termsAccepted:true};
for (const plan of ['free', 'starter', 'professional', 'corporate']) {
  assert.equal(signupSchema.parse({...signup, plan}).plan, plan);
}
assert.equal(signupSchema.safeParse({...signup, plan:'unknown'}).success, false);
assert.equal(signupSchema.safeParse({...signup, plan:'free', termsAccepted:false}).success, false);
const batch = {v:1, visitorKey:'test-visitor', sessionKey:'test-session', events:[]};
for (const funnelEvent of FUNNEL_EVENTS) {
  const event = {type:'funnel', path:'/basvuru', funnelEvent, plan:'professional', email:'must-not-be-stored@example.com'};
  const parsed = siteAnalyticsBatchSchema.parse({...batch, events:[event]});
  assert.equal('email' in parsed.events[0], false);
}
for (const event of [{type:'funnel',path:'/basvuru'}, {type:'funnel',path:'/basvuru',funnelEvent:'invented'}, {type:'funnel',path:'/basvuru',funnelEvent:'signup_start',plan:'unknown'}]) {
  assert.equal(siteAnalyticsBatchSchema.safeParse({...batch,events:[event]}).success,false);
}
for (const type of ['pageview','click','leave']) {
  assert.equal(siteAnalyticsBatchSchema.safeParse({...batch,events:[{type,path:'/'}]}).success,true);
}
assert.doesNotThrow(() => trackFunnel('signup_start','free'));
console.log('OK: telefon biçimleri, dört paket, şartlar, olay izin listesi, kişisel alanların elenmesi ve mevcut olay uyumluluğu.');
