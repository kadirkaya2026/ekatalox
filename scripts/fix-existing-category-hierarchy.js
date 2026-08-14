// lib/market-catalog/category-taxonomy.ts'ye 13-14 Ağustos'ta eklenen yeni
// eşleştirmeler (marketkarsilastir, asya_crawl vb. kaynaklardan gelen ~180
// kategori adı) sadece BUNDAN SONRAKİ import'ları düzeltir — mevcut
// tenant'larda (ör. Marketgo, Happy Market) bu isimlerle ZATEN oluşturulmuş
// kategoriler hâlâ yanlış (kopuk kök) yerde duruyor. Bu script her
// tenant'ın var olan kategorilerini, güncel taxonomy'ye göre yeniden
// çözüp (ensureCategoryPath'in kendi self-healing mantığıyla, bkz.
// lib/categories/ensure-hierarchy.ts) doğru üst kategorinin altına taşır.
//
// Ürünlerin category_id'si DEĞİŞMEZ (sadece kategori satırının parent_id'si
// güncellenir) — hiçbir ürün-kategori bağı kopmaz, sadece ağaçtaki yeri
// düzelir.
//
// Kullanım:
//   node scripts/fix-existing-category-hierarchy.js            (dry-run)
//   node scripts/fix-existing-category-hierarchy.js --apply

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { resolveCategoryPath } = require("../lib/market-catalog/category-taxonomy.ts");
const { buildCategoryCache, ensureCategoryPath } = require("../lib/categories/ensure-hierarchy.ts");

const PROJECT_ROOT = path.join(__dirname, "..");

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

async function fixTenant(supabase, tenant, apply) {
  const { data: categoryRows, error } = await supabase
    .from("categories")
    .select("id, name, parent_id")
    .eq("tenant_id", tenant.id);
  if (error) throw error;

  const { data: lastCategory } = await supabase
    .from("categories")
    .select("display_order")
    .eq("tenant_id", tenant.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextDisplayOrder = { value: (lastCategory?.display_order ?? 0) + 1 };

  const cache = buildCategoryCache(categoryRows);

  // Sadece şu an KÖK (parent_id null) olan ama taxonomy'de artık bir üst
  // kategorisi olması gereken kategoriler taşınacak — zaten doğru yerde
  // olanlara veya taxonomy'de eşleşmeyenlere (ör. "Kategorisiz") dokunulmaz.
  const rootCategories = categoryRows.filter((c) => c.parent_id === null);
  const toFix = [];
  for (const cat of rootCategories) {
    const path = resolveCategoryPath(cat.name);
    // Ardışık aynı isim (kendi kendinin ebeveyni olma) durumuna karşı ekstra
    // güvenlik — taxonomy'de böyle bir hata olmamalı ama olursa sessizce atla.
    const hasSelfReference = path.some((name, i) => i > 0 && name === path[i - 1]);
    if (path.length > 1 && !hasSelfReference) {
      toFix.push({ category: cat, correctPath: path });
    }
  }

  if (!toFix.length) return { tenant, fixedCount: 0, details: [] };

  const details = toFix.map((f) => `    "${f.category.name}" -> ${f.correctPath.join(" > ")}`);

  if (!apply) {
    return { tenant, fixedCount: toFix.length, details };
  }

  let fixedCount = 0;
  for (const f of toFix) {
    await ensureCategoryPath(supabase, tenant.id, cache, f.correctPath, nextDisplayOrder);
    fixedCount += 1;
  }

  return { tenant, fixedCount, details };
}

async function main() {
  loadDotEnvLocal();
  const apply = process.argv.includes("--apply");
  const supabase = getSupabaseClient();

  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id, company_name, subdomain")
    .eq("business_type", "market");
  if (error) throw error;

  console.log(`${tenants.length} market tipi tenant kontrol edilecek.\n`);

  let totalFixed = 0;
  for (const tenant of tenants) {
    const result = await fixTenant(supabase, tenant, apply);
    console.log(`=== ${tenant.company_name} (${tenant.subdomain}): ${result.fixedCount} kategori ${apply ? "taşındı" : "taşınacak"} ===`);
    for (const line of result.details.slice(0, 15)) console.log(line);
    if (result.details.length > 15) console.log(`    ... ve ${result.details.length - 15} tane daha`);
    totalFixed += result.fixedCount;
  }

  console.log(`\nToplam: ${totalFixed} kategori ${apply ? "taşındı" : "taşınacak"}.`);
  if (!apply) {
    console.log("Dry-run modundasınız. Uygulamak için --apply ekleyin.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
