import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL('../lib/storefront/sector-design/config.ts', import.meta.url), 'utf8');
const exports = {};
new Function('exports', 'require', ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(exports, require);
const { DESIGN_IDS, designsForSector, designSector, defaultContent, newDesignDocument, prepareDesignUpdate: update, readDesignDocument, getDesignContent } = exports;
assert.equal(new Set(DESIGN_IDS).size, 15);
const sectors = ['telefon-aksesuar', 'gida', 'tekstil', 'hirdavat', 'kozmetik'];
for (const sector of sectors) {
  const designs = designsForSector(sector);
  assert.equal(designs.length, 3);
  let saved = null;
  for (const {id: themeId} of designs) {
    const content = {...defaultContent(themeId), heroTitle: `Özel ${themeId}`};
    const request = {themeId, mode:'wholesale', content};
    for (const other of [...sectors.filter(s => s !== sector), 'kirtasiye', null, undefined]) assert.ok(update(other, request, saved).error);
    assert.ok(update(sector, {...request, sector}, saved).error);
    assert.ok(update(sector, {...request, themeId:'__proto__'}, saved).error);
    assert.ok(update(sector, {...request, content:{...content, otherThemeField:'x'}}, saved).error);
    for (const heroImage of ['javascript:alert(1)','//unsafe.example/a.png']) assert.ok(update(sector, {...request, content:{...content, heroImage}}, saved).error);
    assert.ok(update(sector, {...request, content:{...content, heroTitle:'x'.repeat(81)}}, saved).error);
    const result = update(sector, request, saved);
    assert.ok(result.document); saved = result.document;
  }
  for (const {id} of designs) assert.equal(saved.content[id].heroTitle, `Özel ${id}`);
  const otherSector = sector === 'gida' ? 'telefon-aksesuar' : 'gida';
  assert.equal(readDesignDocument(saved, otherSector), null);
  const foreignId = designsForSector(otherSector)[0].id;
  const clean = readDesignDocument({...saved, content:{...saved.content,[foreignId]:defaultContent(foreignId)}},sector);
  assert.equal(clean.content[foreignId],undefined);
  assert.equal(readDesignDocument({...saved,version:2}, sector),null);
  const malformed = readDesignDocument({...newDesignDocument(designs[0].id), content:{[designs[0].id]:{heroTitle:34}}},sector);
  assert.deepEqual(getDesignContent(malformed),defaultContent(designs[0].id));
  assert.ok(update(sector,{themeId:designs[0].id,mode:'retail',content:defaultContent(designs[1].id)},saved).error);
}
assert.equal(readDesignDocument(null,'telefon-aksesuar'),null);
for (const id of DESIGN_IDS) assert.ok(sectors.includes(designSector(id)));
console.log('PASS: Beş sektörde üçer tema; çapraz sektör reddi, ayrı alanlar, içerik koruma, URL ve bozuk veri kontrolleri.');

for (const {id: themeId} of [...designsForSector('tekstil'), ...designsForSector('hirdavat'), ...designsForSector('kozmetik')]) {
  const content = {...defaultContent(themeId), accentColor:'#2458a0', backgroundColor:'#fafafa', surfaceColor:'#e1e9ef'};
  const result = update(designSector(themeId), {themeId, mode:'retail', content}, null);
  assert.ok(!result.error);
  assert.ok(update(designSector(themeId), {themeId, mode:'retail', content:{...content, accentColor:'red;display:none'}}, null).error);
  assert.equal(result.document.content[themeId].accentColor, '#2458a0');
}
console.log('PASS: Tekstil, hırdavat ve kozmetik renk alanları kabul ediliyor; geçersiz renkler reddediliyor.');
