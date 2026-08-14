// Belirtilen tenant'ın kendi products tablosundan GERÇEK barkodu olmayan
// (sku_code EAN/UPC checksum'ını geçmiyorsa) ürünleri siler. Marketgo'nun
// migros_crawl kaynaklı barkodsuz ürünleri Master Katalog'dan temizlendikten
// sonra, kendi mağazasına zaten aktardığı barkodsuz kopyaları da silip
// XLS dosyasından katalog üzerinden yeniden (gerçek barkodlu) aktarım
// yapabilmesi için.
//
// products.id, product_variants/product_prices/storefront_sections/
// storefront_product_analytics hepsi "on delete cascade" — bu ürünlere ait
// varyant/fiyat/vitrin kayıtları otomatik silinir. Geçmiş siparişler
// products'a FK ile bağlı değil (snapshot text), etkilenmez.
//
// Kullanım:
//   node scripts/delete-tenant-no-barcode-products.js <subdomain>            (dry-run, yedek yazar)
//   node scripts/delete-tenant-no-barcode-products.js <subdomain> --apply

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PROJECT_ROOT = path.join(__dirname, "..");
const PAGE_SIZE = 1000;
const DELETE_CHUNK_SIZE = 200;

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

async function fetchTenantProducts(supabase, tenantId) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("products")
      .select("id, sku_code, product_name, is_in_stock, created_at")
      .eq("tenant_id", tenantId)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

async function main() {
  loadDotEnvLocal();
  const subdomain = process.argv[2];
  const apply = process.argv.includes("--apply");
  if (!subdomain) {
    console.error("Kullanım: node scripts/delete-tenant-no-barcode-products.js <subdomain> [--apply]");
    process.exit(1);
  }

  const supabase = getSupabaseClient();

  const { data: tenant, error: tErr } = await supabase
    .from("tenants")
    .select("id, company_name, subdomain")
    .eq("subdomain", subdomain)
    .single();
  if (tErr || !tenant) throw tErr ?? new Error("Tenant bulunamadı.");
  console.log(`Tenant: ${tenant.company_name} (${tenant.subdomain})`);

  console.log("[1/3] tenant ürünleri okunuyor...");
  const rows = await fetchTenantProducts(supabase, tenant.id);
  console.log(`  toplam ${rows.length} ürün.`);

  const toDelete = rows.filter((r) => !r.sku_code || !isValidEanUpc(r.sku_code.trim()));
  const keeping = rows.length - toDelete.length;
  console.log(`  gerçek barkodu olan (korunacak): ${keeping}`);
  console.log(`  barkodsuz (silinecek): ${toDelete.length}`);

  const backupFile = path.join("/tmp", `${subdomain}_no_barcode_backup_${Date.now()}.json`);
  console.log(`[2/3] yedek yazılıyor: ${backupFile}`);
  fs.writeFileSync(backupFile, JSON.stringify(toDelete, null, 2));
  console.log(`  ${toDelete.length} satır yedeklendi.`);

  if (!apply) {
    console.log("\nDry-run modundasınız, hiçbir şey silinmedi. Uygulamak için --apply ekleyin.");
    console.log("\n-- örnekler (silinecek) --");
    for (const r of toDelete.slice(0, 10)) {
      console.log(`  "${r.sku_code}" - ${r.product_name}`);
    }
    return;
  }

  console.log("[3/3] siliniyor (varyant/fiyat/vitrin kayıtları cascade ile birlikte)...");
  let deleted = 0;
  for (const chunk of chunkArray(toDelete.map((r) => r.id), DELETE_CHUNK_SIZE)) {
    const { error, count } = await supabase.from("products").delete({ count: "exact" }).in("id", chunk);
    if (error) {
      console.error("  chunk hata:", error.message);
      continue;
    }
    deleted += count ?? chunk.length;
  }
  console.log(`  ${deleted}/${toDelete.length} ürün silindi.`);
  console.log(`\nTamamlandı. Yedek: ${backupFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
