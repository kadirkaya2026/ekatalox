import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(process.cwd()+'/package.json');const ts=require('typescript');
const compile=(path,resolve)=>{const out={};new Function('exports','require',ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(out,resolve);return out;};
const config=compile('lib/storefront/sector-design/config.ts',require);
const pub=compile('lib/storefront/sector-design/publication.ts',id=>id==='./config'?config:require(id));
let stored=null,deny=null,race=false,fail=false;let cache=0;
const db={from(table){assert.equal(table,'tenant_storefront_settings');let mutation=null,where=[];return {select(){if(mutation){if(fail)return Promise.resolve({error:{code:'DB_DOWN'}});if(race)return Promise.resolve({data:[]});assert.deepEqual(where[0],['tenant_id','owner']);if(stored===null)assert.deepEqual(where[1],['sector_design',null]);else assert.deepEqual(where[1],['sector_design',JSON.stringify(stored)]);stored=mutation.sector_design;return Promise.resolve({data:[{tenant_id:'owner'}]});}return this;},eq(k,v){where.push([k,v]);return this;},is(k,v){where.push([k,v]);return this;},maybeSingle:async()=>({data:{sector_design:stored}}),update(row){mutation=row;return this;}};}};
const modules={'next/server':{NextResponse:{json:(body,opt={})=>({body,status:opt.status??200})}},'@/lib/auth/session':{getSessionContext:async()=>({tenant:{id:'owner',sector:'telefon-aksesuar',subdomain:'owner'}})},'@/lib/tenancy/guards':{ensureTenantAdminResponse:async()=>deny},'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},'@/lib/storefront/cache':{revalidateStorefrontCache:()=>cache++},'@/lib/storefront/sector-design/publication':pub,'@/lib/storefront/sector-design/config':config};
const route=compile('app/api/tenant/settings/sector-design/route.ts',id=>modules[id]??require(id));
const call=body=>route.PATCH(new Request('http://localhost/api/tenant/settings/sector-design',{method:'PATCH',body:JSON.stringify(body)}));
const form={themeId:'electronics-forma',mode:'retail',content:config.defaultContent('electronics-forma')};
deny={status:401};assert.equal((await call(form)).status,401);deny=null;
assert.equal((await call(form)).status,428);
let response=await call({...form,baseRevision:pub.publicationRevision(null)});assert.equal(response.status,200);const first=response.body.revision;assert.equal(cache,1);
assert.equal((await call({...form,baseRevision:pub.publicationRevision(null)})).status,409);
// 29 Eyl 2026: başka sektörün teması serbest; geçersiz tema kimliği hâlâ reddedilir.
assert.equal((await call({...form,themeId:'__proto__',baseRevision:first})).status,400);
const second={...form,content:{...form.content,heroTitle:'Yeni başlık'}};
response=await call({...second,baseRevision:first});assert.equal(response.status,200);assert.equal(response.body.previous.content['electronics-forma'].heroTitle,form.content.heroTitle);
response=await call({restore:true,baseRevision:response.body.revision});assert.equal(response.status,200);assert.equal(response.body.design.content['electronics-forma'].heroTitle,form.content.heroTitle);
const before=JSON.stringify(stored);race=true;assert.equal((await call({...second,baseRevision:pub.publicationRevision(stored)})).status,409);assert.equal(JSON.stringify(stored),before);race=false;fail=true;assert.equal((await call({...second,baseRevision:pub.publicationRevision(stored)})).status,500);assert.equal(JSON.stringify(stored),before);
for(const id of config.DESIGN_IDS){const sector=config.designSector(id);const c={...config.defaultContent(id),accentColor:'#aabbcc',storefrontTitle:'Test',logoUrl:'/logo.png',imageFit:'cover',imagePosition:'top'};assert.ok(config.prepareDesignUpdate(sector,{themeId:id,mode:'retail',content:c},null).document);}
const signup=compile('lib/validators/signup.ts',id=>id==='@/lib/storefront/sector-design/config'?config:id==='@/lib/billing/toptan-plans'?compile('lib/billing/toptan-plans.ts',require):id==='@/lib/tenancy/reserved-subdomains'?compile('lib/tenancy/reserved-subdomains.ts',require):require(id));
const fields={businessName:'Demo firma',sector:'telefon-aksesuar',themeId:'textile-atelier',fullName:'Test Test',phone:'05321112233',email:'test@example.com',password:'testtest12',city:'İstanbul',subdomain:'demo-test',whatsappNumber:'05321112233',termsAccepted:true,plan:'free'};
const result=signup.signupSchema.safeParse(fields);assert.equal(result.success,false);assert.ok(result.error.issues.some(i=>i.path[0]==='themeId'));
assert.equal(signup.signupSchema.safeParse({...fields,themeId:'electronics-modul'}).success,true);
console.log('PASS: session guard, revision precondition, atomic stale/race refusal, rollback, failed-write preservation, 33-theme brand/color/image schema, signup cross-sector refusal.');
// Uploaded files stay in the authenticated tenant's storage prefix; spoofed extensions cannot bypass validation.
let uploaded=null;
const storageDb={storage:{from:bucket=>({upload:async(path,bytes,options)=>{uploaded={bucket,path,bytes,options};return {error:null};},getPublicUrl:path=>({data:{publicUrl:'https://example.com/'+path}})})}};
const imageRoute=compile('app/api/tenant/settings/sector-design/image/route.ts',id=>id==='@/lib/supabase/admin'?{createSupabaseAdminClient:()=>storageDb}:id==='@/lib/storage/banners'?{STOREFRONT_BANNERS_BUCKET:'banners'}:modules[id]??require(id));
const upload=async(bytes,name)=>{const fd=new FormData();fd.set('image',new File([bytes],name,{type:'image/png'}));return imageRoute.POST(new Request('http://localhost/image',{method:'POST',body:fd}));};
assert.equal((await upload('not a real image','spoof.png')).status,400);assert.equal(uploaded,null);
assert.equal((await upload(new Uint8Array(5*1024*1024+1),'large.png')).status,400);
assert.equal((await upload(Buffer.from('89504e470d0a1a0a00000000','hex'),'sample.png')).status,200);assert.ok(uploaded.path.startsWith('owner/sector-design/'));assert.equal(uploaded.options.upsert,false);
console.log('PASS: upload signature/size validation and tenant-isolated storage path.');
