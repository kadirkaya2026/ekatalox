// Kullanıcının bulduğu market.xlsx (16.065 satır: Ürün Adı, Barkod, Fiyat,
// Kategori — gerçek barkodlu bir market ürün listesi) ile migros_crawl
// kaynaklı Master Katalog ürünlerini isimle eşleştirip sku_code'u gerçek
// barkoda düzeltir. Kapsam düşük (~%1, delicando gibi bulk bir kazanım
// değil) — her dış kaynak Migros'un spesifik SKU'larıyla sınırlı örtüşüyor
// — ama güvenlik eşiği yüksek tutuldu (skor >= 0.72 + miktar/boyut
// çakışması yok + aynı hedef ürüne birden fazla satır düşerse ikisi de
// reddedilir) ve elle önceden gözden geçirildi (bkz. konuşma geçmişi).
//
// Kullanım:
//   node scripts/backfill-market-xlsx-migros-barcodes.js /path/to/market.xlsx           (dry-run)
//   node scripts/backfill-market-xlsx-migros-barcodes.js /path/to/market.xlsx --apply

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const { createClient } = require("@supabase/supabase-js");

const PROJECT_ROOT = path.join(__dirname, "..");
const SOURCE = "migros_crawl";
const CATALOG_PAGE_SIZE = 1000;
const LOOKUP_CHUNK_SIZE = 60;
const UPDATE_CONCURRENCY = 20;
const FUZZY_HIGH_SCORE_THRESHOLD = 0.9;
const FUZZY_HIGH_MARGIN = 0.08;
const MANUAL_ACCEPT_THRESHOLD = 0.72;

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

function isValidEanUpc(code) {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;
  const digits = code.split("").map(Number);
  const check = digits.pop();
  let sum = 0;
  const len = digits.length;
  for (let i = 0; i < len; i++) {
    const posFromRight = len - i;
    sum += digits[i] * (posFromRight % 2 === 1 ? 3 : 1);
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
function scoreMatch(a, b) {
  const na = normalizeText(a), nb = normalizeText(b);
  const ta = new Set(tokenize(a)), tb = new Set(tokenize(b));
  return 0.5 * jaccard(ta, tb) + 0.5 * levRatio(na, nb);
}
function canonUnit(u) {
  return u === "gr" ? "g" : u === "lt" ? "l" : u;
}
function extractQuantity(name) {
  const matches = [...normalizeText(name).matchAll(/\b(\d+(?:[.,]\d+)?)\s*(g|gr|kg|ml|l|lt|cl|adet)\b/g)];
  if (matches.length !== 1) return null;
  return `${matches[0][1].replace(",", ".")}${canonUnit(matches[0][2])}`;
}
function hasQuantityConflict(a, b) {
  const qa = extractQuantity(a), qb = extractQuantity(b);
  return Boolean(qa && qb && qa !== qb);
}

// İki isim de yüksek skor alsa bile farklı markalara ait olabilir (ör.
// "Whiskas ..." vs "Purina One ..." — aynı ürün tipi, farklı marka). İlk
// anlamlı kelime (marka) her iki tarafta da (herhangi bir konumda, yakın
// yazımla da olsa) geçmiyorsa eşleşme reddedilir. Test sırasında 149
// eşleşmenin 15'inin gerçek marka hatası olduğu bulundu.
function brandMismatch(nameA, nameB) {
  const ta = tokenize(nameA), tb = tokenize(nameB);
  const setA = new Set(ta), setB = new Set(tb);
  const brandA = ta[0], brandB = tb[0];
  if (!brandA || !brandB) return false;
  const aInB = setB.has(brandA) || [...setB].some((t) => levRatio(t, brandA) >= 0.8);
  const bInA = setA.has(brandB) || [...setA].some((t) => levRatio(t, brandB) >= 0.8);
  return !aInB && !bInA;
}

function readMarketXlsx(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  return rows
    .slice(1)
    .map((r) => ({ name: String(r[0] || "").trim(), barcode: String(r[1] || "").trim() }))
    .filter((e) => e.name && e.barcode && isValidEanUpc(e.barcode));
}

async function fetchMigrosCrawlCatalog(supabase) {
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
  const inputPath = process.argv[2];
  if (!inputPath || inputPath.startsWith("--")) {
    console.error("Kullanım: node scripts/backfill-market-xlsx-migros-barcodes.js <market.xlsx yolu> [--apply]");
    process.exit(1);
  }
  const supabase = getSupabaseClient();

  console.log("[1/4] market.xlsx okunuyor...");
  const entries = readMarketXlsx(inputPath);
  console.log(`  ${entries.length} geçerli (checksum doğrulanmış) satır.`);

  console.log(`[2/4] ${SOURCE} kataloğu okunuyor...`);
  const products = await fetchMigrosCrawlCatalog(supabase);
  console.log(`  ${products.length} ürün.`);

  const bySku = new Map(products.map((p) => [p.sku_code.trim().toUpperCase(), p]));
  const tokenIndex = new Map();
  products.forEach((p, i) => {
    for (const t of tokenize(p.product_name)) {
      if (!tokenIndex.has(t)) tokenIndex.set(t, []);
      tokenIndex.get(t).push(i);
    }
  });

  console.log("[3/4] eşleştiriliyor...");
  const results = [];
  for (const entry of entries) {
    const exactMatch = bySku.get(entry.barcode.toUpperCase());
    if (exactMatch) continue; // zaten doğru

    const tokens = tokenize(entry.name);
    const candidateIdx = new Set();
    for (const t of tokens) {
      const idxs = tokenIndex.get(t);
      if (idxs) for (const idx of idxs) candidateIdx.add(idx);
    }
    const scored = [...candidateIdx]
      .map((idx) => ({ product: products[idx], score: scoreMatch(entry.name, products[idx].product_name) }))
      .sort((a, b) => b.score - a.score);

    const top = scored[0], second = scored[1];
    if (!top || hasQuantityConflict(entry.name, top.product.product_name)) continue;
    if (brandMismatch(entry.name, top.product.product_name)) continue;

    if (top.score >= FUZZY_HIGH_SCORE_THRESHOLD && (!second || top.score - second.score >= FUZZY_HIGH_MARGIN)) {
      results.push({ entry, product: top.product, score: top.score });
    } else if (top.score >= MANUAL_ACCEPT_THRESHOLD) {
      results.push({ entry, product: top.product, score: top.score });
    }
  }

  const countByProduct = new Map();
  for (const r of results) countByProduct.set(r.product.id, (countByProduct.get(r.product.id) ?? 0) + 1);
  const clean = results.filter((r) => countByProduct.get(r.product.id) === 1);

  console.log(`  aday: ${results.length}, çakışmasız uygulanacak: ${clean.length}`);

  if (!apply) {
    console.log("\nDry-run modundasınız, hiçbir şey yazılmadı. Uygulamak için --apply ekleyin.");
    for (const r of clean.slice(0, 10)) {
      console.log(`  [${r.score.toFixed(2)}] "${r.entry.name}" -> "${r.product.product_name}" (${r.entry.barcode})`);
    }
    return;
  }

  console.log("[4/4] market_catalog_products.sku_code güncelleniyor + tenant ürünlerine yayılıyor...");
  let catalogUpdated = 0;
  for (const chunk of chunkArray(clean, UPDATE_CONCURRENCY)) {
    const res = await Promise.all(
      chunk.map((r) => supabase.from("market_catalog_products").update({ sku_code: r.entry.barcode }).eq("id", r.product.id)),
    );
    catalogUpdated += res.filter((x) => !x.error).length;
  }
  console.log(`  ${catalogUpdated}/${clean.length} katalog satırı güncellendi.`);

  const oldSkuToNewBarcode = new Map(clean.map((r) => [r.product.sku_code, r.entry.barcode]));
  const tenantProducts = [];
  for (const chunk of chunkArray(clean.map((r) => r.product.sku_code), LOOKUP_CHUNK_SIZE)) {
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
    const res = await Promise.all(chunk.map((u) => supabase.from("products").update({ sku_code: u.newBarcode }).eq("id", u.id)));
    tenantUpdated += res.filter((x) => !x.error).length;
  }

  console.log(`  ${tenantProducts.length} tenant ürünü etkilendi, ${tenantUpdated} güncellendi, ${tenantSkipped} çakışma nedeniyle atlandı.`);
  console.log("\nTamamlandı.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
