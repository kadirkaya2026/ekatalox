// IndexNow (Bing, Yandex vb.): site haritasındaki tüm adresleri arama motorlarına
// anında bildirir. ChatGPT araması büyük ölçüde Bing'i kullanır (7 Eki 2026).
// Kullanım: node scripts/indexnow.mjs            → sitemap.xml'deki tüm adresler
//           node scripts/indexnow.mjs /blog/x ... → yalnız verilen yollar
// Anahtar dosyası: public/<KEY>.txt (içeriği anahtarın kendisi, herkese açık olması gerekir).
const HOST = "www.ekatalox.com";
const KEY = "1f73b14d4bd979a591cf191302c2abc9";

async function sitemapUrls() {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

const args = process.argv.slice(2);
const urls = args.length ? args.map((p) => `https://${HOST}${p.startsWith("/") ? p : "/" + p}`) : await sitemapUrls();

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow: ${urls.length} adres → HTTP ${response.status}`, await response.text());
