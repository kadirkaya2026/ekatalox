// data/products.json içindeki ürünleri Supabase market_catalog_products
// tablosuna toplu upsert eder. Çakışma anahtarı (source, sku_code) olduğu
// için aynı kaynaktan tekrar çalıştırmak var olan satırları günceller.
//
// Kullanım:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-products.js
//
// data/products.json şu şemada bir dizi bekler:
//   [
//     {
//       "source": "manual",          // opsiyonel, verilmezse "manual"
//       "sku_code": "1234567890123", // zorunlu
//       "product_name": "...",       // zorunlu
//       "brand": "...",              // opsiyonel
//       "category_name": "...",      // zorunlu
//       "image_url": "https://...",  // zorunlu
//       "reference_price": 24.95,    // opsiyonel, TL cinsinden
//       "description": "..."         // opsiyonel
//     }
//   ]

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PROJECT_ROOT = path.join(__dirname, "..");
const DATA_FILE = path.join(PROJECT_ROOT, "data", "products.json");
const BATCH_SIZE = 500;

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
      "SUPABASE_URL (veya NEXT_PUBLIC_SUPABASE_URL) ve SUPABASE_SERVICE_ROLE_KEY ortam değişkenleri gerekli."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function loadProducts() {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`Veri dosyası bulunamadı: ${DATA_FILE}`);
  }

  const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  if (!Array.isArray(raw)) {
    throw new Error("data/products.json bir dizi (array) içermeli.");
  }

  return raw.map((item, index) => {
    const skuCode = item.sku_code != null ? String(item.sku_code).trim() : "";
    const productName = typeof item.product_name === "string" ? item.product_name.trim() : "";
    const categoryName = typeof item.category_name === "string" ? item.category_name.trim() : "";
    const imageUrl = typeof item.image_url === "string" ? item.image_url.trim() : "";
    const referencePrice =
      typeof item.reference_price === "number" && Number.isFinite(item.reference_price)
        ? item.reference_price
        : null;
    const description =
      typeof item.description === "string" && item.description.trim() ? item.description.trim() : null;

    if (!skuCode || !productName || !categoryName || !imageUrl) {
      throw new Error(
        `data/products.json[${index}]: sku_code, product_name, category_name ve image_url zorunlu.`
      );
    }

    return {
      source: typeof item.source === "string" && item.source.trim() ? item.source.trim() : "manual",
      sku_code: skuCode,
      product_name: productName,
      brand: typeof item.brand === "string" && item.brand.trim() ? item.brand.trim() : null,
      category_name: categoryName,
      image_url: imageUrl,
      reference_price: referencePrice,
      description,
    };
  });
}

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  loadDotEnvLocal();

  const supabase = getSupabaseClient();
  const products = loadProducts();

  console.log(`${products.length} ürün data/products.json içinden okundu.`);

  let upserted = 0;
  for (const batch of chunk(products, BATCH_SIZE)) {
    const { error, count } = await supabase
      .from("market_catalog_products")
      .upsert(batch, { onConflict: "source,sku_code", count: "exact" });

    if (error) {
      throw new Error(`Upsert başarısız: ${error.message}`);
    }

    upserted += count ?? batch.length;
    console.log(`  ${upserted}/${products.length} ürün aktarıldı...`);
  }

  console.log(`Tamamlandı: ${upserted} ürün market_catalog_products tablosuna yazıldı.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
