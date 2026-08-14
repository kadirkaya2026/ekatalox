// guleckapinda.com (genel market/online kasap sitesi) ürün sayfalarında
// "Stok Kodu" alanı gerçek EAN barkodu içeriyor (checksum doğrulandı, ~%84
// geçerli). Bu script sitenin tüm sitemap'inden ürünleri tarayıp isimle
// migros_crawl kataloğundaki ürünlerle eşleştiriyor ve yüksek güvenli
// (skor >= 0.85, miktar/boyut çakışması yok) eşleşmelerde sku_code'u
// gerçek barkoda düzeltiyor. Kapsam düşük (~%2, delicando gibi bulk bir
// kazanım değil) ama eşleşen satırların kalitesi çok yüksek (test
// örnekleminde tamamı %100 tam isim eşleşmesiydi) — barkodbankasi
// script'iyle aynı güvenlik disiplini (backfill-migros-barcodes.js).
//
// Kullanım:
//   node scripts/backfill-guleckapinda-barcodes.js            (dry-run)
//   node scripts/backfill-guleckapinda-barcodes.js --apply
//   node scripts/backfill-guleckapinda-barcodes.js --apply --limit=200

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PROJECT_ROOT = path.join(__dirname, "..");
const SOURCE = "migros_crawl";
const CATALOG_PAGE_SIZE = 1000;
const LOOKUP_CHUNK_SIZE = 60;
const UPDATE_CONCURRENCY = 20;
const REQUEST_DELAY_MS = 600;
const SCORE_THRESHOLD = 0.85;

function loadDotEnvLocal() {
  const fileName = process.env.USE_PROD_ENV === "1" ? path.join(".vercel", ".env.production.local") : ".env.local";
  const envPath = path.join(PROJECT_ROOT, fileName);
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ortam değişkenleri gerekli.");
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidEanUpc(code) {
  if (!/^\d{12,14}$/.test(code)) return false;
  const digits = code.split("").map(Number);
  const check = digits.pop();
  let sum = 0;
  const len = digits.length;
  for (let i = 0; i < len; i++) {
    const posFromRight = len - i;
    const weight = posFromRight % 2 === 1 ? 3 : 1;
    sum += digits[i] * weight;
  }
  return (10 - (sum % 10)) % 10 === check;
}

function normalizeText(value) {
  return value.trim().toLocaleLowerCase("tr-TR").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}
function tokenize(value) {
  return normalizeText(value).split(" ").filter(Boolean);
}
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur.push(Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost));
    }
    prev = cur;
  }
  return prev[n];
}
function levRatio(a, b) {
  const maxLen = Math.max(a.length, b.length, 1);
  return 1 - levenshtein(a, b) / maxLen;
}
function scoreMatch(ourName, candidateName) {
  const a = normalizeText(ourName);
  const b = normalizeText(candidateName);
  const tA = new Set(tokenize(ourName));
  const tB = new Set(tokenize(candidateName));
  return 0.5 * jaccard(tA, tB) + 0.5 * levRatio(a, b);
}
function extractQuantity(name) {
  const matches = [...normalizeText(name).matchAll(/\b(\d+(?:[.,]\d+)?)\s*(g|gr|kg|ml|l|lt|cl|adet)\b/g)];
  if (matches.length !== 1) return null;
  return `${matches[0][1].replace(",", ".")}${matches[0][2]}`;
}
function hasQuantityConflict(ourName, candidateName) {
  const a = extractQuantity(ourName);
  const b = extractQuantity(candidateName);
  return Boolean(a && b && a !== b);
}

async function fetchGuleckapindaCatalog(limit) {
  const sitemapUrls = [];
  for (let i = 1; i <= 4; i++) {
    const res = await fetch(`https://www.guleckapinda.com/xml/sitemap_product_${i}.xml`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const xml = await res.text();
    sitemapUrls.push(...[...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]));
  }
  const urls = limit ? sitemapUrls.slice(0, limit) : sitemapUrls;

  const entries = [];
  for (let i = 0; i < urls.length; i++) {
    try {
      const res = await fetch(urls[i], { headers: { "User-Agent": "Mozilla/5.0" } });
      const html = await res.text();
      const nameMatch = html.match(/<h1>([^<]*)<\/h1>/);
      const codeMatch = html.match(/product-stock-code-content">([^<]*)</);
      const name = nameMatch ? nameMatch[1].trim() : null;
      const code = codeMatch ? codeMatch[1].trim() : null;
      if (name && code && isValidEanUpc(code)) entries.push({ barcode: code, name });
    } catch {
      // atla
    }
    if ((i + 1) % 200 === 0) console.log(`  ${i + 1}/${urls.length} guleckapinda sayfası tarandı...`);
    await sleep(REQUEST_DELAY_MS);
  }
  return entries;
}

async function fetchAllCatalogRows(supabase) {
  const rows = [];
  for (let from = 0; ; from += CATALOG_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("market_catalog_products")
      .select("id, sku_code, product_name")
      .eq("source", SOURCE)
      .range(from, from + CATALOG_PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < CATALOG_PAGE_SIZE) break;
  }
  return rows;
}

async function main() {
  loadDotEnvLocal();
  const apply = process.argv.includes("--apply");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : null;
  const supabase = getSupabaseClient();

  console.log("[1/4] guleckapinda.com taranıyor...");
  const gulecEntries = await fetchGuleckapindaCatalog(limit);
  console.log(`  ${gulecEntries.length} geçerli barkod bulundu.`);

  const tokenIndex = new Map();
  gulecEntries.forEach((e, i) => {
    for (const t of tokenize(e.name)) {
      if (!tokenIndex.has(t)) tokenIndex.set(t, []);
      tokenIndex.get(t).push(i);
    }
  });

  console.log(`[2/4] ${SOURCE} kataloğu okunuyor ve eşleştiriliyor...`);
  const catalogRows = (await fetchAllCatalogRows(supabase)).filter((row) => !/^\d{12,14}$/.test(row.sku_code));
  console.log(`  ${catalogRows.length} satır (zaten düzeltilmiş olanlar hariç) taranıyor.`);

  const toApply = [];
  for (const row of catalogRows) {
    const tokens = tokenize(row.product_name);
    const candidateIdx = new Set();
    for (const t of tokens) {
      const idxs = tokenIndex.get(t);
      if (idxs) for (const idx of idxs) candidateIdx.add(idx);
    }
    let best = null;
    for (const idx of candidateIdx) {
      const entry = gulecEntries[idx];
      const score = scoreMatch(row.product_name, entry.name);
      if (!best || score > best.score) best = { score, ...entry };
    }
    if (best && best.score >= SCORE_THRESHOLD && !hasQuantityConflict(row.product_name, best.name)) {
      toApply.push({ id: row.id, oldSku: row.sku_code, newBarcode: best.barcode, ours: row.product_name, matchedName: best.name, score: best.score });
    }
  }

  const countByBarcode = new Map();
  for (const entry of toApply) countByBarcode.set(entry.newBarcode, (countByBarcode.get(entry.newBarcode) ?? 0) + 1);
  const clean = toApply.filter((entry) => countByBarcode.get(entry.newBarcode) === 1);

  console.log(`  Yüksek güvenli eşleşme: ${toApply.length}, çakışan hariç uygulanacak: ${clean.length}`);

  if (!apply) {
    console.log("\nDry-run modundasınız, hiçbir şey yazılmadı. Uygulamak için --apply ekleyin.");
    for (const m of clean.slice(0, 15)) {
      console.log(`  [${m.score.toFixed(2)}] "${m.ours}" -> "${m.matchedName}" (${m.newBarcode})`);
    }
    return;
  }

  console.log("[3/4] market_catalog_products.sku_code güncelleniyor...");
  let catalogUpdated = 0;
  for (const chunk of chunkArray(clean, UPDATE_CONCURRENCY)) {
    const results = await Promise.all(
      chunk.map((m) => supabase.from("market_catalog_products").update({ sku_code: m.newBarcode }).eq("id", m.id)),
    );
    catalogUpdated += results.filter((r) => !r.error).length;
  }
  console.log(`  ${catalogUpdated}/${clean.length} katalog satırı güncellendi.`);

  console.log("[4/4] Tenant ürünlerine yayılıyor...");
  const oldSkuToNewBarcode = new Map(clean.map((m) => [m.oldSku, m.newBarcode]));
  const tenantProducts = [];
  for (const chunk of chunkArray(clean.map((m) => m.oldSku), LOOKUP_CHUNK_SIZE)) {
    const { data, error } = await supabase.from("products").select("id, tenant_id, sku_code").in("sku_code", chunk);
    if (error) throw error;
    tenantProducts.push(...data);
  }

  const candidateBarcodesByTenant = new Map();
  for (const product of tenantProducts) {
    const newBarcode = oldSkuToNewBarcode.get(product.sku_code);
    if (!candidateBarcodesByTenant.has(product.tenant_id)) candidateBarcodesByTenant.set(product.tenant_id, new Set());
    candidateBarcodesByTenant.get(product.tenant_id).add(newBarcode);
  }
  const ownerByTenantAndBarcode = new Map();
  for (const [tenantId, barcodes] of candidateBarcodesByTenant) {
    for (const chunk of chunkArray([...barcodes], LOOKUP_CHUNK_SIZE)) {
      const { data, error } = await supabase.from("products").select("id, sku_code").eq("tenant_id", tenantId).in("sku_code", chunk);
      if (error) throw error;
      for (const row of data) ownerByTenantAndBarcode.set(`${tenantId}:${row.sku_code}`, row.id);
    }
  }

  const tenantUpdates = [];
  let tenantSkipped = 0;
  for (const product of tenantProducts) {
    const newBarcode = oldSkuToNewBarcode.get(product.sku_code);
    const ownerId = ownerByTenantAndBarcode.get(`${product.tenant_id}:${newBarcode}`);
    if (ownerId && ownerId !== product.id) {
      tenantSkipped += 1;
      continue;
    }
    tenantUpdates.push({ id: product.id, newBarcode });
  }

  let tenantUpdated = 0;
  for (const chunk of chunkArray(tenantUpdates, UPDATE_CONCURRENCY)) {
    const results = await Promise.all(
      chunk.map((u) => supabase.from("products").update({ sku_code: u.newBarcode }).eq("id", u.id)),
    );
    tenantUpdated += results.filter((r) => !r.error).length;
  }

  console.log(`  ${tenantProducts.length} tenant ürünü etkilendi, ${tenantUpdated} güncellendi, ${tenantSkipped} çakışma nedeniyle atlandı.`);
  console.log("\nTamamlandı.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
