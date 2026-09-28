import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
let denied = null;
let calls = [];
const result = {};
const modules = {
 'next/server': {NextResponse: {json: (body, options={}) => ({body, status: options.status ?? 200, headers: options.headers})}},
 '@/lib/tenancy/guards': {ensureTenantAdminResponse: async()=>denied},
 '@/lib/auth/session': {getSessionContext: async()=>({tenant:{id:'owner',sector:'tekstil'}})},
 '@/lib/data': {
  getTenantCategories: async id=> {assert.equal(id,'owner');return [{id:'visible'},{id:'hidden'}];},
  getStorefrontProductsPage: async p=>{calls.push(p);return {products:[],total:0};},
  getStorefrontProductsByIds: async p=>{calls.push(p);return [{id:'p',category_id:'hidden',description:'private'}];},
 },
 '@/lib/categories/tree': {getHiddenStorefrontCategoryIds:()=>['hidden']},
 '@/lib/storefront/product-sort': {parseStorefrontProductSort:s=>s??'featured'},
 '@/lib/storefront/sector-design/preview-data': {getPreviewPriceLists:async id=> {assert.equal(id,'owner');return [{id:'own-list',is_catalog_only:false}];}},
 '@/lib/storefront/sector-design/config': {hasSectorDesign:()=>true},
};
new Function('exports','require',ts.transpileModule(fs.readFileSync(new URL('../app/api/tenant/settings/sector-design/preview/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(result,id=>{assert.ok(modules[id],id);return modules[id];});
const request=q=>result.GET(new Request('http://localhost/api/preview?'+q));
denied={status:401};assert.equal((await request('priceList=own-list')).status,401);assert.equal(calls.length,0);
denied=null;assert.equal((await request('priceList=foreign-list')).status,403);assert.equal(calls.length,0);
let response=await request('priceList=own-list&tenantId=other&subdomain=other&categoryIds=visible,hidden,foreign&page=2&q=shirt');
assert.equal(response.status,200);assert.equal(response.headers['Cache-Control'],'private, no-store');
assert.equal(calls[0].tenantId,'owner');assert.equal(calls[0].priceListId,'own-list');assert.deepEqual(calls[0].excludeCategoryIds,['hidden']);assert.deepEqual(calls[0].categoryIds,['visible']);assert.equal(calls[0].page,2);assert.equal(calls[0].search,'shirt');
response=await request('priceList=own-list&descriptionId=foreign');assert.equal(response.body.description,null);assert.equal(calls[1].tenantId,'owner');
console.log('PASS: Preview requires admin session, rejects foreign price list, binds reads to session tenant, filters hidden categories, does not cache private data.');
