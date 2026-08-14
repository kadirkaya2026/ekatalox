// asyasanalmarket.com'un kendi ürünlerini (barkod, isim, fiyat, görsel,
// kategori — hepsi kendi sitesinden) Master Katalog'a YENİ satırlar olarak
// ekler (source='asya_crawl'). Eşleştirme değil, doğrudan yeni ürün ekleme —
// çünkü bu sitenin kendi gerçek ürün görselleri var (static.ticimax.cloud).
//
// Girdi: /tmp/asya_full_products.json (crawl_asya_full.js çıktısı, her satır
// {barcode, name, image, price, category}).
//
// Kullanım:
//   node scripts/apply-asya-full-catalog.js            (dry-run)
//   node scripts/apply-asya-full-catalog.js --apply

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PROJECT_ROOT = path.join(__dirname, "..");
const NEW_SOURCE = "asya_crawl";
const INPUT_FILE = "/tmp/asya_full_products.json";
const CATALOG_PAGE_SIZE = 1000;
const INSERT_CHUNK_SIZE = 200;

function loadDotEnvLocal() {
  const envPath = path.join(PROJECT_ROOT, ".env.local");
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

async function fetchExistingBarcodes(supabase) {
  const set = new Set();
  for (let from = 0; ; from += CATALOG_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("market_catalog_products")
      .select("sku_code")
      .range(from, from + CATALOG_PAGE_SIZE - 1);
    if (error) throw error;
    for (const row of data) set.add(row.sku_code.trim().toUpperCase());
    if (data.length < CATALOG_PAGE_SIZE) break;
  }
  return set;
}

async function main() {
  loadDotEnvLocal();
  const apply = process.argv.includes("--apply");
  const supabase = getSupabaseClient();

  console.log("[1/3] asya crawl dosyası okunuyor...");
  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));
  console.log(`  ${raw.length} ürün.`);

  console.log("[2/3] mevcut market_catalog_products barkodları okunuyor (çakışma kontrolü)...");
  const existingBarcodes = await fetchExistingBarcodes(supabase);
  console.log(`  ${existingBarcodes.size} mevcut barkod.`);

  const seen = new Set();
  const rows = [];
  let skippedInvalid = 0, skippedDupFile = 0, skippedExisting = 0, skippedIncomplete = 0;
  for (const p of raw) {
    if (!p.barcode || !p.name || !p.image || !p.price) {
      skippedIncomplete++;
      continue;
    }
    const bc = p.barcode.trim();
    if (!isValidEanUpc(bc)) {
      skippedInvalid++;
      continue;
    }
    const bcUpper = bc.toUpperCase();
    if (seen.has(bcUpper)) {
      skippedDupFile++;
      continue;
    }
    seen.add(bcUpper);
    if (existingBarcodes.has(bcUpper)) {
      skippedExisting++;
      continue;
    }
    rows.push({
      source: NEW_SOURCE,
      sku_code: bc,
      product_name: p.name,
      brand: null,
      category_name: p.category || "Kategorisiz",
      image_url: p.image,
    });
  }

  console.log(
    `  eklenecek: ${rows.length} (atlanan: eksik veri ${skippedIncomplete}, geçersiz barkod ${skippedInvalid}, dosya içi tekrar ${skippedDupFile}, katalogda mevcut ${skippedExisting})`,
  );

  if (!apply) {
    console.log("\nDry-run modundasınız, hiçbir şey yazılmadı. Uygulamak için --apply ekleyin.");
    console.log("\n-- örnekler --");
    for (const r of rows.slice(0, 10)) {
      console.log(`  [${r.category_name}] "${r.product_name}" (${r.sku_code}) -> ${r.image_url}`);
    }
    return;
  }

  console.log("[3/3] market_catalog_products'a ekleniyor...");
  let inserted = 0;
  for (const chunk of chunkArray(rows, INSERT_CHUNK_SIZE)) {
    const { error, count } = await supabase
      .from("market_catalog_products")
      .insert(chunk, { count: "exact" });
    if (error) {
      console.error("  chunk hata:", error.message);
      continue;
    }
    inserted += count ?? chunk.length;
  }
  console.log(`  ${inserted}/${rows.length} yeni katalog satırı eklendi.`);
  console.log("\nTamamlandı.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
