// Delicando crawler'ının çektiği ürünlerin sku_code'u gerçek barkod değil,
// kaynak URL'sinden türetilmiş bir slug'dı (ör. "6386-pernod-absinthe-...").
// Ama Delicando'nun ürün sayfası JSON-LD'sindeki "description" alanının
// içine gerçek EAN/UPC barkodu düz metin olarak gömülü çıktı (ör.
// "6386 690265 3047100052161 Pernod" — ortadaki 13 haneli sayı checksum'ı
// geçerli bir EAN-13). Bu script, zaten crawler'dan çekilip
// market_catalog_products.description'da duran bu veriyi okuyup sku_code'u
// gerçek barkoda düzeltiyor — hiçbir yeni ağ isteği atmadan. Ardından aynı
// düzeltmeyi, bu ürünleri daha önce içe aktarmış tenant'ların kendi
// products.sku_code'una da yayıyor (barkod çakışması olan yerler atlanır).
//
// Idempotent'tir — tekrar çalıştırmak zaten düzeltilmiş satırları atlar.
//
// Kullanım:
//   node scripts/backfill-delicando-barcodes.js            (dry-run, yazmaz)
//   node scripts/backfill-delicando-barcodes.js --apply     (gerçekten yazar)
//   USE_PROD_ENV=1 node scripts/backfill-delicando-barcodes.js --apply

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PROJECT_ROOT = path.join(__dirname, "..");
const SOURCE = "delicando_crawl";
const CATALOG_PAGE_SIZE = 1000;
const LOOKUP_CHUNK_SIZE = 60; // uzun slug sku_code'ları .in() URL'sini şişiriyor
const UPDATE_CONCURRENCY = 20;

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
    throw new Error(
      "SUPABASE_URL (veya NEXT_PUBLIC_SUPABASE_URL) ve SUPABASE_SERVICE_ROLE_KEY ortam değişkenleri gerekli.",
    );
  }

  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
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
  const calcCheck = (10 - (sum % 10)) % 10;
  return calcCheck === check;
}

function extractBarcode(description) {
  const matches = (description || "").match(/\b\d{12,14}\b/g) || [];
  const valid = [...new Set(matches.filter(isValidEanUpc))];
  return valid.length === 1 ? valid[0] : null;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

async function fetchAllCatalogRows(supabase) {
  const rows = [];
  for (let from = 0; ; from += CATALOG_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("market_catalog_products")
      .select("id, sku_code, description")
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
  const supabase = getSupabaseClient();

  console.log(`[1/5] ${SOURCE} kataloğu okunuyor...`);
  const catalogRows = await fetchAllCatalogRows(supabase);
  console.log(`  ${catalogRows.length} satır bulundu.`);

  console.log("[2/5] Barkodlar description'dan çıkarılıyor...");
  const extracted = [];
  for (const row of catalogRows) {
    const barcode = extractBarcode(row.description);
    if (barcode) extracted.push({ id: row.id, oldSku: row.sku_code, newBarcode: barcode });
  }

  const countByBarcode = new Map();
  for (const entry of extracted) {
    countByBarcode.set(entry.newBarcode, (countByBarcode.get(entry.newBarcode) ?? 0) + 1);
  }
  const cleanMappings = extracted.filter((entry) => countByBarcode.get(entry.newBarcode) === 1);
  const collisionCount = extracted.length - cleanMappings.length;
  const alreadyCorrect = cleanMappings.filter((m) => m.oldSku === m.newBarcode);
  const toApply = cleanMappings.filter((m) => m.oldSku !== m.newBarcode);

  console.log(`  Geçerli barkod çıkarılan: ${extracted.length}`);
  console.log(`  Birden fazla üründe aynı barkod (atlanıyor): ${collisionCount}`);
  console.log(`  Zaten doğru: ${alreadyCorrect.length}`);
  console.log(`  Düzeltilecek: ${toApply.length}`);

  if (!apply) {
    console.log("\nDry-run modundasınız, hiçbir şey yazılmadı. Uygulamak için --apply ekleyin.");
    console.log("Örnek düzeltmeler:");
    for (const m of toApply.slice(0, 5)) {
      console.log(`  ${m.oldSku} -> ${m.newBarcode}`);
    }
    return;
  }

  console.log("[3/5] market_catalog_products.sku_code güncelleniyor...");
  let catalogUpdated = 0;
  for (const chunk of chunkArray(toApply, UPDATE_CONCURRENCY)) {
    const results = await Promise.all(
      chunk.map((m) => supabase.from("market_catalog_products").update({ sku_code: m.newBarcode }).eq("id", m.id)),
    );
    catalogUpdated += results.filter((r) => !r.error).length;
  }
  console.log(`  ${catalogUpdated}/${toApply.length} katalog satırı güncellendi.`);

  console.log("[4/5] Bu ürünleri içe aktarmış tenant ürünleri taranıyor...");
  const oldSkuToNewBarcode = new Map(toApply.map((m) => [m.oldSku, m.newBarcode]));
  const tenantProducts = [];
  for (const chunk of chunkArray(toApply.map((m) => m.oldSku), LOOKUP_CHUNK_SIZE)) {
    const { data, error } = await supabase.from("products").select("id, tenant_id, sku_code").in("sku_code", chunk);
    if (error) throw error;
    tenantProducts.push(...data);
  }
  console.log(`  ${tenantProducts.length} tenant ürünü etkileniyor.`);

  console.log("[5/5] Tenant ürünlerinde sku_code düzeltiliyor (çakışanlar atlanıyor)...");
  const candidateBarcodesByTenant = new Map();
  for (const product of tenantProducts) {
    const newBarcode = oldSkuToNewBarcode.get(product.sku_code);
    if (!candidateBarcodesByTenant.has(product.tenant_id)) candidateBarcodesByTenant.set(product.tenant_id, new Set());
    candidateBarcodesByTenant.get(product.tenant_id).add(newBarcode);
  }

  const ownerByTenantAndBarcode = new Map(); // `${tenantId}:${barcode}` -> productId
  for (const [tenantId, barcodes] of candidateBarcodesByTenant) {
    for (const chunk of chunkArray([...barcodes], LOOKUP_CHUNK_SIZE)) {
      const { data, error } = await supabase
        .from("products")
        .select("id, sku_code")
        .eq("tenant_id", tenantId)
        .in("sku_code", chunk);
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

  console.log(`  ${tenantUpdated}/${tenantUpdates.length} tenant ürünü güncellendi.`);
  console.log(`  ${tenantSkipped} tenant ürünü barkod çakışması nedeniyle atlandı.`);
  console.log("\nTamamlandı.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
