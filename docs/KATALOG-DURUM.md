# Master Katalog — Durum Notu (21 Ağustos 2026, 05:00)

Bu dosya, `market_catalog_products` (Master Katalog) üzerindeki işin **nerede
kaldığını** ve tekrarlanmaması gereken hataları hatırlamak için tutuluyor.
Buradaki tüm sayılar 21 Ağu 2026'da canlı Supabase'e ve yerel crawler DB'sine
sorgu atılarak **doğrulandı** — tahmin değil.

Kalıcı mimari/deploy notları için `AGENTS.md` ve proje memory'lerine bakın;
bu dosya sadece "nerede kaldık" fotoğrafıdır.

Önceki fotoğraf 18 Ağu 2026 tarihliydi; 20-21 Ağu oturumunda katalog baştan
denetlendi, mükerrerler temizlendi ve barkod doğruluğu ölçülebilir hale
getirildi. Değişenler 9. bölümde özetli.

---

## 1. İki repo, iş bölümü

| Repo | Yol | Rolü |
|---|---|---|
| eKatalox | `~/.verdent/verdent-projects/proje-ad-ekatalox-multitenant` (Desktop'ta symlink) | Uygulama + canlı Supabase. Kategori ağacını `resolveCategoryPath` / `ensureCategoryPath` kurar. |
| json-kaydetme | `~/Desktop/json-kaydetme` | Ürün crawler'ı (SQLite `data/app.db`) + kategori sınıflandırma + katalog bakım script'leri. Git repo DEĞİL, versiyonlanmıyor. |

Kimlik bilgileri:
- eKatalox: `.env.local` içindeki `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` **çalışıyor** (`.vercel/.env.production.local` Vercel'de "Sensitive" olduğu için boş gelir, ona güvenme).
- json-kaydetme: `.env` içinde `GEMINI_API_KEY` mevcut.

---

## 2. ⚠️ ASLA YAPILMAYACAK: `seed-products.js`'i tam `products.json` ile çalıştırma

20 Ağu 2026'da yapıldı ve iki ayrı hasar verdi. `data/products.json` canlı
katalogla **senkron değil** ve `seed-products.js` dosyadaki HER satırı
`(source, sku_code)` üzerinden upsert eder:

1. Dosyadaki delicando kayıtlarının `sku_code`'u **Shopify slug'ı**
   (`42731-sacchetto-prosecco-…`), canlıdakiler ise **barkod**. Eşleşme
   olmadığı için 8.575 satır **mükerrer olarak eklendi**.
2. Dosyada snowymarket ve hapeloglu satırları `category_name: "Kategorisiz"`
   yazıyor. Upsert, canlıdaki gerçek kategorilerin üzerine yazdı —
   snowymarket'in 1.777 ürününün kategorisi tamamen kayboldu.

**Doğru yöntem:** tek kaynağı ayırıp seed etmek, ya da doğrudan kataloğa yazan
`json-kaydetme/scripts/syncNewProductsToMarketCatalog.mjs`'i kullanmak (aşağıda).

`data/products.json` artık **canlının aynası değildir**; referans olarak
kullanmayın.

---

## 3. Canlı katalog fotoğrafı (21 Ağu 2026)

`market_catalog_products` toplam **43.363** satır.

| Ölçü | Adet | Oran |
|---|---|---|
| Kontrol hanesi doğrulanmış **gerçek barkod** | **40.917** | %94,4 |
| **Mükerrer barkod** | **0** | — |
| `MIGROS-` önekli (barkodu bulunamadı) | 45 | %0,1 |
| Diğer barkodsuz | 2.401 | %5,5 |
| `Kategorisiz` | 3.682 | %8,5 |

| source | satır | gerçek barkod | Kategorisiz |
|---|---|---|---|
| `migros_crawl` | 10.577 | 10.532 | 0 |
| `delicando_crawl` | 9.892 | 9.255 | 0 |
| `sarpermarket_crawl` | 9.355 | 8.796 | 0 |
| `hapeloglu_crawl` | 4.780 | 4.396 | **3.615** |
| `asya_crawl` | 2.367 | 2.367 | 0 |
| `marketkarsilastir` | 2.318 | 2.318 | 41 |
| `iyisarap_crawl` | 1.270 | 1.152 | 0 |
| `snowymarket_crawl` | 968 | 864 | 8 |
| `mahsen_crawl` | 414 | 290 | 0 |
| `mopas_karsilastir` | 302 | 302 | 3 |
| `ddbvape_crawl` | 289 | **0** | 0 |
| `bizim_market_karsilastir` | 160 | 160 | 3 |
| `apikoglu_crawl` | 156 | 29 | 0 |
| `tenant_suggestion` | 143 | 142 | 0 |
| `sok_karsilastir` | 138 | 138 | 2 |
| `tenant_stock_import` | 96 | 96 | 8 |
| `stok_xls_sigara` | 63 | 63 | 0 |
| `usmarmarket_crawl` | 34 | **0** | 0 |
| `onual_crawl` | 29 | 17 | 2 |
| `manual` | 12 | **0** | 0 |

---

## 4. Barkod doğruluğunun ölçüsü: GTIN kontrol hanesi

"13 hane, hepsi rakam" bir şey kanıtlamaz. Migros'un iç stok numarası da 8
haneli ve tamamen rakam. Ayrım **kontrol hanesi** ile yapılıyor (EAN-8/12/13/14
ortak algoritması: sağdan başlayarak 3-1-3-1 ağırlıklandır, toplamı 10'a
tamamla). Bu testi geçen **40.917** satır gerçek barkodlu sayılıyor.

Yeni bir kaynak eklerken barkod kapsamını bu testle ölçün; format kontrolü
yanıltıcıdır.

### ⭐ Migros barkodu: `barcode-by-id` uç noktası

**Migros barkodu ürün sayfasında, aramada ve bilinen üç ürün API'sinde
yayınlamıyor** — hepsi tek tek ölçüldü (144 ve 129 alan tarandı, tek bir 13
haneli değer yok; site araması barkodu tanımıyor; Google Merchant feed'i yok).
Bu yüzden migros satırları uzun süre Migros'un 8 haneli iç stok numarasıyla
duruyordu.

Barkod aslında hep oradaydı, ayrı bir uç noktada. Sitenin JavaScript
paketlerinde (17 dosya, 7 MB) FlixMedia zengin içerik entegrasyonu için yazılmış
`getBarcodeById()` fonksiyonu bulundu:

```
GET https://www.migros.com.tr/rest/products/{id}/barcode-by-id
→ {"successful":true,"data":{"barcodes":["8693374201306"]}}
```

`id` aramaya gerek bırakmıyor: **`200000` + sıfırla doldurulmuş 8 haneli stok
numarası**. Yani `01010085` → `20000001010085`. Katalogda zaten duran koddan
doğrudan türüyor; isim eşleştirmesi, üçüncü taraf veya aday listesi gerekmiyor.

`scripts/fetchMigrosBarcodesFromApi.mjs` bunu yapıyor. 21 Ağu'da 10.781 üründen
**10.736'sı** gerçek GTIN'ine kavuştu (yazılan her barkod ayrıca kontrol
hanesinden geçirildi).

**⚠️ Cloudflare hız sınırı:** İlk tur 6 eşzamanlı istekle çalıştı; 1.700 üründen
sonra `429 / error 1015` başladı ve 9.076 ürün alınamadı. Ayarlar **2 eşzamanlı
istek + istekler arası 250 ms + 429'da tüm işçileri 60 sn durdurma** yapılınca
ikinci tur **tek bir 429 almadan** bitti. Migros'a toplu istek atan her yeni
script bu ayarları kullanmalı; blok kalkması ~40 dakika sürüyor.

### `MIGROS-` öneki konvansiyonu (artık sadece 45 satır)

Barkodu hâlâ bulunamayan satırların `sku_code`'u `MIGROS-35402129` biçiminde
önekli kalıyor: 44'ünde Migros'un verdiği kod GTIN kontrol hanesini geçmiyor
(tartılı manav/kasap ürünlerinin iç kodları), 1'inde Migros hiç barkod
tanımlamamış. Önek, barkodla eşleştirme yapan kodun bunlara yanlışlıkla
eşleşmesini engelliyor; silinince eski değer geri gelir. (`apikoglu_crawl`
satırlarındaki `APK1…` öneki aynı desenin daha eski bir örneği.)

---

## 5. Mükerrer temizliği (21 Ağu, tamamlandı)

Katalog 58.927 satırdan **43.363**'e indi (12.217 + 937 + 2.410 satır).
Silinenlerin tamamı **barkodla doğrulanarak** silindi, isim benzerliğiyle değil:

- `sku_code`'u zaten GTIN olanlar → aynı GTIN'i taşıyan diğer satırlarla eşleşti.
- `sku_code`'u slug olanlar → `app.db`'deki ürün URL'si üzerinden gerçek
  barkoda çözüldü, ancak o barkodun katalogda başka satırı varsa silindi.
- Barkoda bağlanamayan 1.721 satıra **dokunulmadı** (mükerrer olduğu
  kanıtlanamadığı için).

**Hayatta kalan seçimi:** görseli kendi bucket'ımızda olan > gerçek kategorisi
olan > açıklaması olan > en eski satır (kanonik kural).

**Migros birleştirmesinde kural terstir ve öyle kalmalı:** gerçek GTIN'i taşıyan
satır her zaman kalır, Migros satırı silinir; Migros'un görseli/kategorisi/
açıklaması eksikse kalan satıra aktarılır. İlk denemede "daha zengin satır
kalsın" kuralı 926 gerçek barkodu silmek üzereydi — uygulanmadan yakalandı.

Son parti 2.410 satır, Migros'un gerçek barkodu öğrenilince ortaya çıktı: o
ürünlerin katalogda zaten başka bir marketin satırı varmış. Gerçek barkodlu
satır korundu, Migros'un görseli/kategorisi/açıklaması ona aktarıldı (1.559
satır zenginleşti).

Yedekler: `json-kaydetme/data/backups/katalog-mukerrer-2026-08-21.json`,
`migros-birlestirme-2026-08-21.json`, `migros-api-birlestirme-2026-08-21.json`,
`delicando-mukerrer-2026-08-20.json`.

---

## 6. json-kaydetme'deki bakım script'leri

Hepsi `--apply` olmadan kuru çalışır ve sildiği/değiştirdiği her satırı önce
`data/backups/` altına yazar.

| Script | Ne yapar |
|---|---|
| `enrichDelicandoFromShopify.mjs` | delicando'nun `/products.json`'ından (10.063 ürün, 41 istek) gerçek EAN'i çeker. Barkod, ürün **açıklamasının içinde**: `"1045 670101 5011007003005 Jameson Whiskey"`. 9.707 satır düzeltildi. |
| `enrichSnowymarketCategories.mjs` | snowymarket kategorisini **ürün URL'sinden** çıkarır (`/urun/x/6/icecekler/160/Su%20&%20Maden%20Suyu/…`). Kampanya kökleri (`haftanin-firsatlari`) kategori sayılmaz. |
| `dedupeProductsByBarcode.mjs` | Yerel `app.db`'yi barkod başına tek satıra indirir. |
| `dedupeMarketCatalogByBarcode.mjs` | Canlı kataloğu barkod başına tek satıra indirir; slug'ları `app.db` üzerinden barkoda çözer. |
| `applyLocalCategoriesToMarketCatalog.mjs` | `app.db`'deki kategoriyi barkodla eşleştirip canlıya yazar. **Sadece `Kategorisiz` satırlara dokunur**, elle düzeltilmiş kategoriyi ezmez. |
| `syncNewProductsToMarketCatalog.mjs` | Parametrik (`--url-like`, `--source`). Barkod + kategori + yerel görseli olan, katalogda **barkodu henüz olmayan** ürünleri doğrudan kataloğa yazar. `products.json` akışının yerini alır. |
| `backfillMigrosBarcodesFromCatalog.mjs` | migros satırlarını kataloğun kendi doğrulanmış barkodlu havuzuna karşı isimle eşleştirir (miktar/marka/aroma çakışma kontrolü + belirsizlik reddi). |
| `finalizeMigrosBarcodes.mjs` | Eşleşenleri birleştirir, eşleşmeyenleri `MIGROS-` ile işaretler. |
| **`fetchMigrosBarcodesFromApi.mjs`** | **Migros'un `barcode-by-id` uç noktasından gerçek barkodu çeker (4. bölüm). 10.736 ürünü kesin olarak çözdü — asıl kullanılacak script budur; yukarıdaki iki tahmin tabanlı script artık gereksiz.** |

Ayrıca crawler tarafında düzeltilenler (`src/lib/crawler/`): yol tabanlı
sayfalama tespiti (`/page/N/`), listeleme kartlarının ürün sayfası olarak
kuyruğa alınması (barkod/açıklama oradan gelir), kategori ağacının breadcrumb
ve çoklu `product:category` etiketinden çıkarılması, sayısal HTML entity
çözümü (`46&#8217;lı`).

WordPress/WooCommerce siteleri için **crawler yerine** `npm run import:wp-rest`
kullanın: `/wp-json/wp/v2/product` stokta olmayan ürünleri de listeler
(sarpermarket'te 12.285 ürünün 10.204'ü stok dışıydı ve hiçbir listeleme
sayfasında görünmüyordu).

---

## 7. Değişmez kural — hatırlatma

Master Kataloğa **her** yeni satır eklerken (crawler, barkod köprüleme, dosya
eşleştirme, fark etmez) `image_url` mutlaka kendi `market-catalog-images`
Supabase Storage bucket'ımıza `{sku_code}.{ext}` (upsert:true) olarak
yüklenmiş URL olmalı. Ham kaynak/CDN linki asla yazılmaz. Bu kural 13-14
Ağu'da bir kez ihlal edildi (5.338 satır dış URL'e işaret eder halde kaldı),
tekrarlanmasın.

Supabase Storage yoğun yüklemede **429 `too_many_connections`** döndürür;
yeniden deneme olmadan o ürünler sessizce partiden düşer (sarpermarket
turunda 267 ürün böyle kayboldu, ikinci turda toplandı). Yükleme fonksiyonunda
429/5xx için backoff şart.

---

## 8. Açık uçlar

1. **3.682 `Kategorisiz` ürün, 3.615'i hapeloglu.** Barkod eşleştirmesiyle
   çözülebilecekler bitti. Kalanı için Gemini boru hattı gerekiyor:
   `classifyCatalog.mjs` (`MODEL=gemini-flash-lite-latest`, `classify_status`
   üzerinden resumable) → `applyClassificationToMarketCatalog.mjs`
   (`EKATALOX_SUPABASE_*` env isimleriyle). `data/catalog-classification.db`
   snapshot'ı 17 Ağu tarihli ve **artık çok bayat** (katalog 58.927 → 43.363'e
   indi, barkodlar değişti); önce `fetchCatalogForClassification.mjs` ile
   tazeleyin.
2. **2.401 barkodsuz satır.** Dökümü: delicando 637 (sitede EAN'i olmayan
   ürünler), sarpermarket 559, hapeloglu 384, **ddbvape 289 (hiç barkod yok —
   site barkodu delicando'daki gibi gizli bir alanda yayınlıyor olabilir,
   bakılmadı)**, apikoglu 127 (`APK1…` iç kodu), mahsen 124, iyisarap 118,
   snowymarket 104, usmarmarket 34, manual 12.
3. **45 Migros ürünü** hâlâ `MIGROS-` önekli (44'ü kontrol hanesini geçmeyen
   tartılı ürün kodu, 1'i Migros'ta hiç barkod tanımlı değil). Kapanmış sayılır.
4. **snowymarket'te eksik tek ürün:** barkod `8680304283952`, "Alkan Gemlik
   Kuru Sele Zeytin 2xs(351-380) 400 g". Görseli kaynakta 404 olduğu için sync
   filtresinden geçmiyor; istenirse elle görsel atanıp eklenebilir.

---

## 9. 20-21 Ağu oturumunda ne değişti

- sarpermarket.com baştan tarandı, sonra WP REST ile tamamı alındı: **9.358
  ürün** kataloğa girdi (12.285 üründen barkodu+görseli olan ve katalogda
  olmayanlar).
- delicando'nun sahte barkodları (kendi ürün numarası) **9.707 gerçek EAN** ile
  değiştirildi.
- snowymarket'in kategorileri URL'den türetildi; 1.362 satır onarıldı
  (2. bölümdeki hatanın sildiği kategoriler dahil).
- hapeloglu'nun 1.667 ürünü, aynı barkodun başka kaynaktaki kategorisinden
  kategorilendi.
- Katalog barkod başına tekilleştirildi: 58.927 → **43.363** satır, mükerrer 0.
- Migros'un iç stok numaraları GTIN kontrol hanesiyle ayrıştırıldı; ardından
  Migros'un kendi `barcode-by-id` uç noktası bulunup **10.736 ürünün gerçek
  barkodu** yazıldı (2.410'u mükerrer çıkıp birleştirildi). Gerçek barkod oranı
  %55 → **%94,4**.
- json-kaydetme dashboard'una **Ürünler sekmesi** eklendi (kaynak/kategori/stok/
  barkod filtreli tablo, `/api/products`).
