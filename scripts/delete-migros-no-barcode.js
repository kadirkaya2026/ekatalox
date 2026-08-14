// migros_crawl kaynaklı Master Katalog ürünlerinden hâlâ GERÇEK barkodu
// olmayanları (sku_code EAN/UPC checksum'ını geçmiyorsa — orijinal crawl'da
// görsel URL'sinden türetilmiş sahte kod) siler. Bu oturumda çeşitli
// kaynaklardan (delicando açıklaması, guleckapinda, market.xlsx,
// asyasanalmarket, marketkarsilastir) barkodu bulunup düzeltilen 2.118 ürün
// dokunulmadan kalır, geri kalan 10.859 silinir.
//
// Not: products (tenant) tablosu market_catalog_products'a foreign key ile
// bağlı değil (sadece sku_code ile içe aktarılıyor) — bu silme tenant'ların
// zaten içe aktardığı ürünleri ETKİLEMEZ, sadece merkezi kataloğu temizler.
//
// Kullanım:
//   node scripts/delete-migros-no-barcode.js            (dry-run, yedek dosyasını yazar)
//   node scripts/delete-migros-no-barcode.js --apply     (yedek yazar + siler)

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PROJECT_ROOT = path.join(__dirname, "..");
const SOURCE = "migros_crawl";
const CATALOG_PAGE_SIZE = 1000;
const DELETE_CHUNK_SIZE = 200;
const BACKUP_FILE = path.join("/tmp", `migros_no_barcode_backup_${Date.now()}.json`);

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

async function fetchMigrosCrawlCatalog(supabase) {
  const rows = [];
  for (let from = 0; ; from += CATALOG_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("market_catalog_products")
      .select("id, sku_code, product_name, brand, category_name, image_url, created_at")
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

  console.log(`[1/3] ${SOURCE} kataloğu okunuyor...`);
  const rows = await fetchMigrosCrawlCatalog(supabase);
  console.log(`  toplam ${rows.length} ürün.`);

  const toDelete = rows.filter((r) => !isValidEanUpc(r.sku_code.trim()));
  const keeping = rows.length - toDelete.length;
  console.log(`  gerçek barkodu olan (korunacak): ${keeping}`);
  console.log(`  barkodsuz (silinecek): ${toDelete.length}`);

  console.log(`[2/3] yedek yazılıyor: ${BACKUP_FILE}`);
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(toDelete, null, 2));
  console.log(`  ${toDelete.length} satır yedeklendi.`);

  if (!apply) {
    console.log("\nDry-run modundasınız, hiçbir şey silinmedi. Uygulamak için --apply ekleyin.");
    console.log("\n-- örnekler (silinecek) --");
    for (const r of toDelete.slice(0, 10)) {
      console.log(`  "${r.sku_code}" - ${r.product_name}`);
    }
    return;
  }

  console.log("[3/3] siliniyor...");
  let deleted = 0;
  for (const chunk of chunkArray(toDelete.map((r) => r.id), DELETE_CHUNK_SIZE)) {
    const { error, count } = await supabase
      .from("market_catalog_products")
      .delete({ count: "exact" })
      .in("id", chunk);
    if (error) {
      console.error("  chunk hata:", error.message);
      continue;
    }
    deleted += count ?? chunk.length;
  }
  console.log(`  ${deleted}/${toDelete.length} satır silindi.`);
  console.log(`\nTamamlandı. Yedek: ${BACKUP_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
