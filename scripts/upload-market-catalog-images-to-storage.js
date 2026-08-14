// market_catalog_products satırlarından image_url'i HÂLÂ dış bir CDN'e
// (kaynağın kendi sitesi) işaret edenleri bulur, görseli indirip
// `market-catalog-images` bucket'ına (bkz. 0061_market_catalog_images_
// bucket.sql) yükler, sonra image_url'i kendi storage'ımızdaki genel
// (public) URL'e günceller.
//
// Bu bucket TEK MERKEZİ kopya için var — tüm tenant'lar aynı dosyayı
// gösterir, tenant başına ayrı dosya YOK. Dosya adı olarak barkod
// (sku_code) kullanılıyor, aynı barkod tekrar yüklenirse upsert ile
// üzerine yazılır (yeniden çalıştırma güvenli).
//
// Kullanım:
//   node scripts/upload-market-catalog-images-to-storage.js            (dry-run, sadece sayar)
//   node scripts/upload-market-catalog-images-to-storage.js --apply

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PROJECT_ROOT = path.join(__dirname, "..");
const BUCKET = "market-catalog-images";
const CATALOG_PAGE_SIZE = 1000;
const UPLOAD_CONCURRENCY = 12;
const DB_UPDATE_CHUNK_SIZE = 200;
const DOWNLOAD_TIMEOUT_MS = 20000;

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

function sanitizeFileName(skuCode) {
  return skuCode.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
}

function extensionFromContentType(contentType, fallbackUrl) {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("gif")) return "gif";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return "jpg";
  const urlExt = fallbackUrl.split("?")[0].split(".").pop();
  if (urlExt && /^[a-z]{3,4}$/i.test(urlExt)) return urlExt.toLowerCase();
  return "jpg";
}

async function fetchExternalImageRows(supabase) {
  const rows = [];
  for (let from = 0; ; from += CATALOG_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("market_catalog_products")
      .select("id, sku_code, image_url, source")
      .range(from, from + CATALOG_PAGE_SIZE - 1);
    if (error) throw error;
    for (const row of data) {
      if (row.image_url && !row.image_url.includes(BUCKET)) rows.push(row);
    }
    if (data.length < CATALOG_PAGE_SIZE) break;
  }
  return rows;
}

async function downloadImage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: controller.signal });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    const buffer = Buffer.from(await res.arrayBuffer());
    if (!buffer.length) return null;
    return { buffer, contentType };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function processRow(supabase, row, publicUrlBase) {
  const downloaded = await downloadImage(row.image_url);
  if (!downloaded) return { row, ok: false, reason: "indirilemedi" };

  const ext = extensionFromContentType(downloaded.contentType, row.image_url);
  const fileName = `${sanitizeFileName(row.sku_code)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, downloaded.buffer, {
      contentType: downloaded.contentType || `image/${ext}`,
      upsert: true,
    });

  if (uploadError) return { row, ok: false, reason: uploadError.message };

  const newUrl = `${publicUrlBase}/${fileName}`;
  return { row, ok: true, newUrl };
}

async function main() {
  loadDotEnvLocal();
  const apply = process.argv.includes("--apply");
  const supabase = getSupabaseClient();

  console.log("[1/3] dış URL'e işaret eden market_catalog_products satırları okunuyor...");
  const rows = await fetchExternalImageRows(supabase);
  console.log(`  ${rows.length} satır bulundu.`);

  const bySource = {};
  for (const r of rows) bySource[r.source] = (bySource[r.source] ?? 0) + 1;
  console.log("  kaynak bazında:", JSON.stringify(bySource));

  if (!apply) {
    console.log("\nDry-run modundasınız, hiçbir şey indirilmedi/yüklenmedi. Uygulamak için --apply ekleyin.");
    console.log("\n-- örnekler --");
    for (const r of rows.slice(0, 5)) console.log(`  [${r.source}] ${r.sku_code} -> ${r.image_url}`);
    return;
  }

  const {
    data: { publicUrl: sampleUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl("_probe");
  const publicUrlBase = sampleUrl.replace(/\/_probe$/, "");

  console.log(`[2/3] görseller indirilip ${BUCKET} bucket'ına yükleniyor...`);
  let done = 0;
  let succeeded = 0;
  const failures = [];
  const dbUpdates = [];

  for (const chunk of chunkArray(rows, UPLOAD_CONCURRENCY)) {
    const results = await Promise.all(chunk.map((row) => processRow(supabase, row, publicUrlBase)));
    for (const result of results) {
      if (result.ok) {
        succeeded += 1;
        dbUpdates.push({ id: result.row.id, image_url: result.newUrl });
      } else {
        failures.push({ sku_code: result.row.sku_code, source: result.row.source, reason: result.reason });
      }
    }
    done += chunk.length;
    if (done % 120 === 0 || done === rows.length) {
      console.log(`  ${done}/${rows.length} işlendi, ${succeeded} başarılı, ${failures.length} başarısız...`);
    }
  }

  console.log(`[3/3] ${dbUpdates.length} satırın image_url'i güncelleniyor...`);
  let dbUpdated = 0;
  for (const chunk of chunkArray(dbUpdates, DB_UPDATE_CHUNK_SIZE)) {
    const results = await Promise.all(
      chunk.map((u) => supabase.from("market_catalog_products").update({ image_url: u.image_url }).eq("id", u.id)),
    );
    dbUpdated += results.filter((r) => !r.error).length;
  }

  console.log(`  ${dbUpdated}/${dbUpdates.length} satır güncellendi.`);
  console.log(`\nToplam: ${succeeded} başarılı, ${failures.length} başarısız.`);
  if (failures.length) {
    const failLogPath = path.join("/tmp", `market_catalog_image_upload_failures_${Date.now()}.json`);
    fs.writeFileSync(failLogPath, JSON.stringify(failures, null, 2));
    console.log(`  Başarısız satırlar: ${failLogPath}`);
  }
  console.log("\nTamamlandı.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
