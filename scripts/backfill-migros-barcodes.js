// migros_crawl kaynaklı ürünlerin sku_code'u Migros'un kendi iç ürün kodu
// (barkod değil — Migros barkodu hiçbir yerde yayınlamıyor, bkz. proje notu).
// Bu script her ürünü barkodbankasi.com'da (Via POS Bilişim Teknolojileri'nin
// halka açık barkod arama motoru) adıyla arayıp, yüksek güvenli (skor >= 0.85)
// ve miktar/boyut çakışması olmayan eşleşmelerde sku_code'u gerçek barkoda
// düzeltir. delicando_crawl'daki gibi %90+ kapsam YOK — deneme örneklemesinde
// ~%5-7 civarı bir kapsam bulundu, yine de riski sıfıra yakın (yüksek eşik +
// miktar kontrolü) ve zamanla organik onarımı hızlandırıyor.
//
// Kullanım (yavaş, binlerce HTTP isteği atar — arka planda çalıştırın):
//   node scripts/backfill-migros-barcodes.js                (dry-run)
//   node scripts/backfill-migros-barcodes.js --apply
//   node scripts/backfill-migros-barcodes.js --apply --limit=200   (test için)
//
// Idempotent'tir — tekrar çalıştırmak zaten düzeltilmiş satırları atlar.

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PROJECT_ROOT = path.join(__dirname, "..");
const SOURCE = "migros_crawl";
const CATALOG_PAGE_SIZE = 1000;
const LOOKUP_CHUNK_SIZE = 60;
const UPDATE_CONCURRENCY = 20;
const REQUEST_DELAY_MS = 900;
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

// "76 g", "1 kg", "0,33 l" gibi miktar/boyut ifadelerini çıkarır. İki üründe
// de TEK ve BİRBİRİNDEN FARKLI bir miktar bulunursa (ör. "76 g" vs "63 g")
// isim çok benzese bile farklı ambalaj/barkod demektir — otomatik uygulamayı
// engeller. Bu olmadan "Eti Pizza Kraker 76 G" ile "Eti Pizza Kraker 63 G"
// yanlışlıkla eşleşebiliyordu (test sırasında yakalandı).
function extractQuantity(name) {
  const matches = [
    ...normalizeText(name).matchAll(/\b(\d+(?:[.,]\d+)?)\s*(g|gr|kg|ml|l|lt|cl|adet)\b/g),
  ];
  if (matches.length !== 1) return null;
  return `${matches[0][1].replace(",", ".")}${matches[0][2]}`;
}
function hasQuantityConflict(ourName, candidateName) {
  const a = extractQuantity(ourName);
  const b = extractQuantity(candidateName);
  return Boolean(a && b && a !== b);
}

let cookie = "";
async function searchBarkodBankasi(query) {
  const url = "https://barkodbankasi.com/index.php?search=" + encodeURIComponent(query);
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://barkodbankasi.com/index.php",
      Cookie: cookie,
    },
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const html = await res.text();

  const rows = [];
  const rowRegex = /barkod\.php\?barkod=(\d+)"[^>]*>\s*(\d+)\s*<\/a>\s*<\/td>\s*<td[^>]*>([^<]*)<\/td>/g;
  let match;
  while ((match = rowRegex.exec(html))) {
    rows.push({ barcode: match[1], name: match[3].trim() });
  }
  return rows;
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

  // warm up cookie
  await fetch("https://barkodbankasi.com/index.php", { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => {
    const sc = r.headers.get("set-cookie");
    if (sc) cookie = sc.split(";")[0];
  });

  console.log(`[1/4] ${SOURCE} kataloğu okunuyor...`);
  let catalogRows = await fetchAllCatalogRows(supabase);
  // Migros'un kendi iç kodu 8 haneli (ör. "35402129") — gerçek barkod (EAN/UPC)
  // 12-14 hane. sku_code zaten bu uzunluktaysa önceki koşuda düzeltilmiş demektir.
  catalogRows = catalogRows.filter((row) => !/^\d{12,14}$/.test(row.sku_code));
  if (limit) catalogRows = catalogRows.slice(0, limit);
  console.log(`  ${catalogRows.length} satır işlenecek (zaten düzeltilmiş olanlar hariç).`);

  console.log("[2/4] barkodbankasi.com'da aranıyor (bu uzun sürebilir)...");
  const toApply = [];
  let processed = 0;
  let matched = 0;

  for (const row of catalogRows) {
    const query = tokenize(row.product_name).slice(0, 3).join(" ");
    let hits = [];
    try {
      hits = await searchBarkodBankasi(query);
    } catch {
      hits = [];
    }

    let best = null;
    for (const hit of hits) {
      const score = scoreMatch(row.product_name, hit.name);
      if (!best || score > best.score) best = { score, ...hit };
    }

    if (best && best.score >= SCORE_THRESHOLD && !hasQuantityConflict(row.product_name, best.name)) {
      toApply.push({ id: row.id, oldSku: row.sku_code, newBarcode: best.barcode, ours: row.product_name, matchedName: best.name, score: best.score });
      matched += 1;
    }

    processed += 1;
    if (processed % 200 === 0) {
      console.log(`  ${processed}/${catalogRows.length} tarandı, ${matched} eşleşme bulundu...`);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`  Tamamlandı: ${processed} ürün tarandı, ${toApply.length} yüksek güvenli eşleşme bulundu.`);

  const countByBarcode = new Map();
  for (const entry of toApply) countByBarcode.set(entry.newBarcode, (countByBarcode.get(entry.newBarcode) ?? 0) + 1);
  const clean = toApply.filter((entry) => countByBarcode.get(entry.newBarcode) === 1);
  console.log(`  Çakışan (aynı barkod birden fazla üründe): ${toApply.length - clean.length}`);
  console.log(`  Uygulanacak: ${clean.length}`);

  if (!apply) {
    console.log("\nDry-run modundasınız, hiçbir şey yazılmadı. Uygulamak için --apply ekleyin.");
    console.log("Örnek eşleşmeler:");
    for (const m of clean.slice(0, 10)) {
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
