// classify-kategorisiz-products.js sadece category_name='Kategorisiz' olan
// satırları işledi — ama 9 ürün, "Kategorisiz" değil ama taxonomy'de de
// olmayan garip/yetim kategori isimleriyle (marka adı, kod numarası vb.)
// duruyordu ("BENCISER", "Dp", "Diş Fırçası", "TÜM ÜRÜNLER" ve 3 tane
// numaralı kod). İncelendiğinde bunların neredeyse tamamı aslında net bir
// şekilde sınıflandırılabiliyor (ör. "BENCISER" altındaki ürün gerçekte
// "Finish Quantum" bulaşık tableti) — bu yüzden Kategorisiz'e atmak yerine
// doğru kategorilerine taşınıyor.
//
// Kullanım:
//   node scripts/fix-remaining-stray-categories.js            (dry-run)
//   node scripts/fix-remaining-stray-categories.js --apply

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { resolveCategoryPath } = require("../lib/market-catalog/category-taxonomy.ts");
const { buildCategoryCache, ensureCategoryPath, normalizeCategoryName } = require("../lib/categories/ensure-hierarchy.ts");

const PROJECT_ROOT = path.join(__dirname, "..");
const PAGE_SIZE = 1000;

// sku_code -> yeni doğru kategori (elle, ürün adına bakarak belirlendi)
const RECLASSIFY_BY_SKU_NAME_HINT = [
  { match: (name) => /sarikiz.*mineralli su/i.test(name), category: "Su" },
  { match: (name) => /superfresh.*firinda/i.test(name), category: "Dondurulmuş Börek ve Hamur İşleri" },
  { match: (name) => /eti petito/i.test(name), category: "Bisküvi" },
  { match: (name) => /finish quantum/i.test(name), category: "Bulaşık Yıkama Ürünleri" },
  { match: (name) => /diş fırçası/i.test(name), category: "Ağız ve Diş Sağlığı" },
  { match: (name) => /daily perfection.*şampuan/i.test(name), category: "Saç Bakım ve Şekillendirme" },
  { match: (name) => /ezine peynir|keçi peyniri/i.test(name), category: "Peynir" },
];

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

const STRAY_CATEGORIES = [
  "12- SU SODA MEYV SUY",
  "18- SALCA KONSER DIG",
  "4- BISKUVI CIKOLATA",
  "BENCISER",
  "Diş Fırçası",
  "Dp",
  "TÜM ÜRÜNLER",
];

async function main() {
  loadDotEnvLocal();
  const apply = process.argv.includes("--apply");
  const supabase = getSupabaseClient();

  console.log("[1/3] yetim kategorilerdeki ürünler okunuyor...");
  const rows = await fetchAllPaged(supabase, "market_catalog_products", "id, sku_code, product_name, category_name", []);
  const strayRows = rows.filter((r) => STRAY_CATEGORIES.includes(r.category_name));
  console.log(`  ${strayRows.length} ürün.`);

  const resolved = strayRows.map((r) => {
    const hint = RECLASSIFY_BY_SKU_NAME_HINT.find((h) => h.match(r.product_name));
    return { ...r, newCategory: hint ? hint.category : "Kategorisiz" };
  });

  console.log("\n-- planlanan taşımalar --");
  for (const r of resolved) console.log(`  [${r.category_name}] "${r.product_name}" -> ${r.newCategory}`);

  if (!apply) {
    console.log("\nDry-run modundasınız, hiçbir şey yazılmadı. Uygulamak için --apply ekleyin.");
    return;
  }

  console.log("\n[2/3] market_catalog_products güncelleniyor...");
  for (const r of resolved) {
    const { error } = await supabase.from("market_catalog_products").update({ category_name: r.newCategory }).eq("id", r.id);
    if (error) console.error("  hata:", r.product_name, error.message);
  }
  console.log(`  ${resolved.length} satır güncellendi.`);

  console.log("[3/3] bu barkodları içe aktarmış tenant ürünleri de taşınıyor...");
  const { data: tenants, error: tErr } = await supabase.from("tenants").select("id, company_name").eq("business_type", "market");
  if (tErr) throw tErr;

  const newCategoryBySku = new Map(resolved.map((r) => [r.sku_code, r.newCategory]));

  for (const tenant of tenants) {
    const categories = await fetchAllPaged(supabase, "categories", "id, name, parent_id", [["tenant_id", tenant.id]]);
    const strayCatIds = new Set(
      categories.filter((c) => STRAY_CATEGORIES.some((s) => normalizeCategoryName(s) === normalizeCategoryName(c.name))).map((c) => c.id),
    );
    if (!strayCatIds.size) continue;

    const products = await fetchAllPaged(supabase, "products", "id, sku_code, category_id", [["tenant_id", tenant.id]]);
    const toMove = products.filter((p) => strayCatIds.has(p.category_id) && newCategoryBySku.has(p.sku_code));
    if (!toMove.length) continue;

    console.log(`  ${tenant.company_name}: ${toMove.length} ürün taşınıyor...`);
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
    for (const product of toMove) {
      const newCategoryName = newCategoryBySku.get(product.sku_code);
      let categoryId = categoryIdByName.get(newCategoryName);
      if (!categoryId) {
        categoryId = await ensureCategoryPath(supabase, tenant.id, cache, resolveCategoryPath(newCategoryName), nextDisplayOrder);
        categoryIdByName.set(newCategoryName, categoryId);
      }
      await supabase.from("products").update({ category_id: categoryId }).eq("id", product.id);
    }

    // Artık boş kalan yetim kategorileri sil.
    for (const catId of strayCatIds) {
      const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", catId);
      if (!count) await supabase.from("categories").delete().eq("id", catId);
    }
  }

  console.log("\nTamamlandı.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
