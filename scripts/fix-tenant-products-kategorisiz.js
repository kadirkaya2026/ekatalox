// classify-kategorisiz-products.js Master Katalog'daki category_name'i
// düzeltti, ama bu ürünleri DAHA ÖNCE kendi mağazasına aktarmış tenant'ların
// (ör. Marketgo — "Market Kataloğunu Yükle" butonuyla tüm katalog kopyalanmıştı)
// kendi products.category_id'si hâlâ o tenant'ın kendi "Kategorisiz"
// kategorisine bağlı duruyor — çünkü tenant import sırasında kategori adını
// bir kerelik KOPYALAR, market_catalog_products'a canlı referans tutmaz.
//
// Bu script her market tipi tenant için: kendi "Kategorisiz" kategorisindeki
// ürünlerin sku_code'unu Master Katalog'daki (artık) doğru category_name ile
// eşleştirip, doğru kategoriye (ensureCategoryPath ile, gerekirse oluşturarak)
// taşır.
//
// Kullanım:
//   node scripts/fix-tenant-products-kategorisiz.js            (dry-run)
//   node scripts/fix-tenant-products-kategorisiz.js --apply

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { resolveCategoryPath } = require("../lib/market-catalog/category-taxonomy.ts");
const { buildCategoryCache, ensureCategoryPath, normalizeCategoryName } = require("../lib/categories/ensure-hierarchy.ts");

const PROJECT_ROOT = path.join(__dirname, "..");
const PAGE_SIZE = 1000;

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

async function fetchAllPaged(supabase, table, select, filters) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    for (const [col, val] of filters) query = query.eq(col, val);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

async function main() {
  loadDotEnvLocal();
  const apply = process.argv.includes("--apply");
  const supabase = getSupabaseClient();

  console.log("[1/3] Master Katalog barkod -> güncel kategori haritası okunuyor...");
  const catalogRows = await fetchAllPaged(supabase, "market_catalog_products", "sku_code, category_name", []);
  const categoryBySku = new Map(catalogRows.map((r) => [r.sku_code, r.category_name]));
  console.log(`  ${categoryBySku.size} ürün.`);

  const { data: tenants, error: tErr } = await supabase
    .from("tenants")
    .select("id, company_name, subdomain")
    .eq("business_type", "market");
  if (tErr) throw tErr;

  console.log(`[2/3] ${tenants.length} market tipi tenant kontrol edilecek.\n`);

  let grandTotal = 0;
  for (const tenant of tenants) {
    const categories = await fetchAllPaged(supabase, "categories", "id, name, parent_id", [["tenant_id", tenant.id]]);
    const kategorisizCat = categories.find((c) => normalizeCategoryName(c.name) === normalizeCategoryName("Kategorisiz"));

    if (!kategorisizCat) {
      console.log(`=== ${tenant.company_name}: "Kategorisiz" kategorisi yok, atlanıyor ===`);
      continue;
    }

    const products = await fetchAllPaged(supabase, "products", "id, sku_code, category_id", [
      ["tenant_id", tenant.id],
      ["category_id", kategorisizCat.id],
    ]);

    const toMove = [];
    for (const product of products) {
      const newCategoryName = categoryBySku.get(product.sku_code);
      if (newCategoryName && newCategoryName !== "Kategorisiz") {
        toMove.push({ product, newCategoryName });
      }
    }

    console.log(`=== ${tenant.company_name} (${tenant.subdomain}): ${toMove.length}/${products.length} "Kategorisiz" ürün taşınacak ===`);
    if (!toMove.length) continue;

    const byNewCategory = {};
    for (const m of toMove) byNewCategory[m.newCategoryName] = (byNewCategory[m.newCategoryName] ?? 0) + 1;
    for (const [cat, count] of Object.entries(byNewCategory).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
      console.log(`    ${cat}: ${count}`);
    }

    grandTotal += toMove.length;

    if (!apply) continue;

    const cache = buildCategoryCache(categories);
    const { data: lastCategory } = await supabase
      .from("categories")
      .select("display_order")
      .eq("tenant_id", tenant.id)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextDisplayOrder = { value: (lastCategory?.display_order ?? 0) + 1 };

    const categoryIdByName = new Map();
    let updated = 0;
    for (const { product, newCategoryName } of toMove) {
      let categoryId = categoryIdByName.get(newCategoryName);
      if (!categoryId) {
        categoryId = await ensureCategoryPath(supabase, tenant.id, cache, resolveCategoryPath(newCategoryName), nextDisplayOrder);
        categoryIdByName.set(newCategoryName, categoryId);
      }
      const { error } = await supabase.from("products").update({ category_id: categoryId }).eq("id", product.id);
      if (!error) updated += 1;
    }
    console.log(`    -> ${updated}/${toMove.length} ürün taşındı.`);
  }

  console.log(`\nToplam: ${grandTotal} ürün ${apply ? "taşındı" : "taşınacak"}.`);
  if (!apply) console.log("Dry-run modundasınız. Uygulamak için --apply ekleyin.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
