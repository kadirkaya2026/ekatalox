// marketkarsilastir.com'un 8 marketinin (migros, şok, a101, carrefoursa,
// mopas, metro, file, bizim-market) TÜM ürünlerini barkod+isim+fiyat+
// kategori ile çekip, görseli de sitenin KENDİ barkod-adlı deposundan
// (https://marketkarsilastir.com/urunler/{barkod}.jpg) alarak Master
// Katalog'a yeni satırlar ekler.
//
// Önceki script'lerde (crawl-sok-karsilastir-new-products.js,
// crawl-marketkarsilastir-extra-markets.js) görsel için her marketin KENDİ
// sitesine (sokmarket.com.tr, mopas.com.tr...) ayrı ayrı gidiliyordu —
// A101/CarrefourSA Cloudflare koruması yüzünden, Metro/File de ürüne özel
// link vermediği için tamamen elenmişti. Bu script marketkarsilastir'ın
// kendi görsel deposunu kullandığı için TÜM 8 market için çalışıyor, hiçbir
// marketin kendi sitesine hiç gidilmiyor.
//
// Barkod doğrudan sitenin kendi verisinden geldiği için (fuzzy isim
// eşleştirmesi YOK) marka/miktar/aroma çakışma kontrollerine gerek yok —
// tek risk aynı barkodun birden fazla markette farklı fiyatla geçmesi, o da
// zaten barkod bazlı dedupe ile (ilk görülen kazanır) çözülüyor.
//
// Kullanım:
//   node scripts/crawl-marketkarsilastir-all-markets.js            (dry-run)
//   node scripts/crawl-marketkarsilastir-all-markets.js --apply

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PROJECT_ROOT = path.join(__dirname, "..");
const NEW_SOURCE = "marketkarsilastir";
const CATALOG_PAGE_SIZE = 1000;
const INSERT_CHUNK_SIZE = 100;
const LIST_REQUEST_DELAY_MS = 300;
const IMAGE_CHECK_CONCURRENCY = 15;
const IMAGE_CHECK_DELAY_MS = 80;
const MAX_PAGES_PER_MARKET = 300;
const EMPTY_STREAK_LIMIT = 2;

const MARKET_SLUGS = ["migros", "sok", "a101", "carrefoursa", "mopas", "metro", "file", "bizim-market"];

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
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function imageUrlForBarcode(barcode) {
  return `https://marketkarsilastir.com/urunler/${barcode}.jpg`;
}

async function crawlMarket(slug) {
  const byBarcode = new Map();
  let emptyStreak = 0;

  for (let page = 0; page <= MAX_PAGES_PER_MARKET && emptyStreak < EMPTY_STREAK_LIMIT; page++) {
    const res = await fetch(`https://marketkarsilastir.com/marketler/${slug}?page=${page}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await res.text();
    const matches = [...html.matchAll(/data-product-data="([^"]*)"/g)];

    if (!matches.length) {
      emptyStreak++;
      await sleep(LIST_REQUEST_DELAY_MS);
      continue;
    }
    emptyStreak = 0;

    for (const m of matches) {
      const decoded = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&");
      let obj;
      try {
        obj = JSON.parse(decoded);
      } catch {
        continue;
      }
      if (!obj.name || !obj.barcode || !isValidEanUpc(obj.barcode)) continue;
      if (byBarcode.has(obj.barcode)) continue;
      byBarcode.set(obj.barcode, {
        barcode: obj.barcode,
        name: obj.name,
        brand: obj.brand || null,
        category: obj.category || null,
        price: Number(obj.price) || null,
      });
    }
    await sleep(LIST_REQUEST_DELAY_MS);
  }

  return [...byBarcode.values()];
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

async function imageExists(barcode) {
  try {
    const res = await fetch(imageUrlForBarcode(barcode), { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" } });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  loadDotEnvLocal();
  const apply = process.argv.includes("--apply");
  const supabase = getSupabaseClient();

  console.log("[1/4] marketkarsilastir.com'un 8 marketi taranıyor...");
  const allByBarcode = new Map();
  for (const slug of MARKET_SLUGS) {
    process.stdout.write(`  ${slug}...`);
    const entries = await crawlMarket(slug);
    let added = 0;
    for (const e of entries) {
      if (!allByBarcode.has(e.barcode)) {
        allByBarcode.set(e.barcode, e);
        added++;
      }
    }
    console.log(` ${entries.length} ürün, ${added} yeni benzersiz barkod (toplam: ${allByBarcode.size})`);
  }
  const entries = [...allByBarcode.values()];
  console.log(`  toplam benzersiz barkod: ${entries.length}`);

  console.log("[2/4] mevcut market_catalog_products barkodları okunuyor (çakışma kontrolü)...");
  const existingBarcodes = await fetchExistingBarcodes(supabase);
  console.log(`  ${existingBarcodes.size} mevcut barkod.`);

  const candidates = entries.filter((e) => !existingBarcodes.has(e.barcode.toUpperCase()));
  console.log(`  ${entries.length - candidates.length} zaten katalogda, ${candidates.length} yeni aday.`);

  console.log("[3/4] her aday için marketkarsilastir.com'un kendi görsel deposu kontrol ediliyor...");
  const withImageFlag = [];
  let done = 0;
  for (const chunk of chunkArray(candidates, IMAGE_CHECK_CONCURRENCY)) {
    const results = await Promise.all(
      chunk.map(async (c) => ({ ...c, hasImage: await imageExists(c.barcode) })),
    );
    withImageFlag.push(...results);
    done += chunk.length;
    if (done % 300 === 0 || done === candidates.length) {
      console.log(`  ${done}/${candidates.length} kontrol edildi, ${withImageFlag.filter((x) => x.hasImage).length} görsel bulundu...`);
    }
    await sleep(IMAGE_CHECK_DELAY_MS);
  }

  const ready = withImageFlag.filter((x) => x.hasImage);
  console.log(`  ${ready.length} ürün için görsel bulundu, ${withImageFlag.length - ready.length} görselsiz kaldı (atlanacak).`);

  console.log(`[4/4] toplam eklenecek: ${ready.length}`);

  if (!apply) {
    console.log("\nDry-run modundasınız, hiçbir şey yazılmadı. Uygulamak için --apply ekleyin.");
    console.log("\n-- örnekler --");
    for (const r of ready.slice(0, 15)) {
      console.log(`  [${r.category || "Kategorisiz"}] "${r.name}" (${r.barcode}) ${r.price ?? "?"}TL -> ${imageUrlForBarcode(r.barcode)}`);
    }
    return;
  }

  const rows = ready.map((r) => ({
    source: NEW_SOURCE,
    sku_code: r.barcode,
    product_name: r.name,
    brand: r.brand,
    category_name: r.category || "Kategorisiz",
    image_url: imageUrlForBarcode(r.barcode),
  }));

  let inserted = 0;
  for (const chunk of chunkArray(rows, INSERT_CHUNK_SIZE)) {
    const { error, count } = await supabase.from("market_catalog_products").insert(chunk, { count: "exact" });
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
