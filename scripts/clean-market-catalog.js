// market_catalog_products tablosundan belirli bir "source" değerine sahip
// satırları siler. Varsayılan hedef "migros_export" — canlı API'den izinsiz
// çekilmiş veriyi tablodan temizlemek için kullanıldı.
//
// Kullanım:
//   TARGET_SOURCE=migros_export USE_PROD_ENV=1 node scripts/clean-market-catalog.js

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PROJECT_ROOT = path.join(__dirname, "..");

function loadEnvFile(fileName) {
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
  loadEnvFile(process.env.USE_PROD_ENV === "1" ? path.join(".vercel", ".env.production.local") : ".env.local");

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL (veya NEXT_PUBLIC_SUPABASE_URL) ve SUPABASE_SERVICE_ROLE_KEY ortam değişkenleri gerekli."
    );
  }

  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

async function main() {
  const targetSource = process.env.TARGET_SOURCE ?? "migros_export";
  const supabase = getSupabaseClient();

  const { data: existing, error: selectError } = await supabase
    .from("market_catalog_products")
    .select("id, sku_code, product_name")
    .eq("source", targetSource);

  if (selectError) {
    throw new Error(`Sorgu başarısız: ${selectError.message}`);
  }

  if (!existing || existing.length === 0) {
    console.log(`"${targetSource}" kaynağına ait kayıt bulunamadı, silinecek bir şey yok.`);
    return;
  }

  console.log(`"${targetSource}" kaynağına ait ${existing.length} kayıt silinecek:`);
  for (const row of existing) {
    console.log(`  - ${row.sku_code}: ${row.product_name}`);
  }

  const { error: deleteError, count } = await supabase
    .from("market_catalog_products")
    .delete({ count: "exact" })
    .eq("source", targetSource);

  if (deleteError) {
    throw new Error(`Silme başarısız: ${deleteError.message}`);
  }

  console.log(`Tamamlandı: ${count ?? existing.length} kayıt silindi.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
