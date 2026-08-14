// "Kategorisiz" kalan Master Katalog ürünlerini (kaynak sitede kategori
// bilgisi hiç verilmemiş — marketkarsilastir, mopas/bizim-market/şok
// köprüleme, birkaç asya_crawl satırı) ürün ADINDAN anahtar kelime tabanlı
// sınıflandırma ile gerçek bir alt kategoriye atar. Kural sırası önemli:
// ilk eşleşen kural kazanır, bu yüzden spesifik marka/ürün kalıpları en
// üstte, genel kelimeler en altta.
//
// Hedef kategoriler lib/market-catalog/category-taxonomy.ts'teki MEVCUT
// yaprak isimlerinden seçildi ki yeni eklenen kategori otomatik doğru kökün
// altına otursun (resolveCategoryPath zaten bunu çözüyor).
//
// Kullanım:
//   node scripts/classify-kategorisiz-products.js            (dry-run, örnekleri gösterir)
//   node scripts/classify-kategorisiz-products.js --apply

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { MARKET_CATEGORY_ANCESTORS } = require("../lib/market-catalog/category-taxonomy.ts");

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

function normalizeText(value) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Dosyada birçok ürün Türkçe karaktersiz yazılmış (ör. "SUTAS", "ICIM",
// "CAYKUR") — kural örüntüleri Türkçe karakterli yazıldığı için hem ürün
// adı hem kuralın kendisi ASCII'ye katlanarak karşılaştırılıyor.
function asciiFold(value) {
  return value
    .replace(/ç/g, "c")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u");
}

function foldedRegex(regex) {
  return new RegExp(asciiFold(regex.source), regex.flags);
}

// [regex (normalize edilmiş metne uygulanır), hedef yaprak kategori]
const RULES = [
  // --- Bebek (marka + tür bazlı, önce çünkü bazı marka isimleri genel kelimelerle çakışabilir) ---
  [/\b(aptamil|sma optipro|bebelac|hipp|arı mama)\b/, "Bebek Sütü ve İçecekler"],
  [/\b(molfix|prima|sleepy.*bez|canped.*bez)\b/, "Bebek Bezi ve Islak Mendil"],
  [/\bislak (havlu|mendil)\b.*\b(bebek|baby|uni baby)\b|\b(baby ?turco|uni baby).*(havlu|mendil)\b/, "Bebek Bezi ve Islak Mendil"],
  [/\bdalin\b|\bbebek (şampuan|sabun|kolonya)/, "Bebek Bakım ve Temizlik"],
  [/johnson.?s baby|bebek şampuan/, "Bebek Bakım ve Temizlik"],
  [/\bbebek bakım örtüsü|yatak koruyu\b/, "Bebek Araç ve Gereçleri"],
  [/hasta bezi|belbantlı/, "Yetişkin ve Hasta Bakım"],

  // --- Evcil Hayvan ---
  [/\b(whiskas|purina|felix|friskies|dreamies|pedigree|proline)\b/, "Diğer Evcil Hayvan Ürünleri"],
  [/kedi maması|kedi ödül|köpek maması|köpek ödül/, "Diğer Evcil Hayvan Ürünleri"],

  // --- Kişisel Bakım ---
  [/\b(molped|orkid|kotex)\b/, "Hijyenik Ped ve Kadın Sağlığı"],
  [/\bdurex\b|okey.*prezervatif|prezervatif/, "Prezervatif ve Kondom"],
  [/diş (macunu|fırçası)|ağız bakım suyu|sensodyne|colgate/, "Ağız ve Diş Sağlığı"],
  [/tıraş (bıçağı|jeli|köpüğü)|gillette|jilet/, "Tıraş ve Epilasyon"],
  [/(şampuan|saç kremi|saç köpüğü|saç boya|fön suyu|palette|sitil|\bboya\b)\b/, "Saç Bakım ve Şekillendirme"],
  [/\bduş jeli|duş jel|banyo sabunu|sabun\b/, "Duş ve Banyo"],
  [/deodorant|deo\b|parfüm|kolonya/, "Parfüm ve Kolonya"],
  [/kağıt mendil|puf mendil|mendil\b/, "Kişisel Bakım Aksesuarları"],
  [/pamuklu (kulak|ürünleri)|kulak çubuğu|pam\.?\s*kulak|kulak cub/, "Kişisel Bakım Aksesuarları"],
  [/vücut temizleme (havlusu|mendili)/, "El, Ayak ve Vücut Bakımı"],
  [/eyüp sabri tuncer/, "Cilt Bakımı"],
  [/(?:^(?!.*bulaşık)(?!.*deterjan).*losyon)|krem\b.*(zeytinyağ|nem)/, "Cilt Bakımı"],
  [/çorap\b/, "İç Giyim ve Çorap"],

  // --- Ev Bakım ---
  [/tuvalet kağıdı|kağıt havlu|kağıt peçete|peçete\b|mutfak havlusu|\bhavlu\b|islak havlu/, "Kağıt Ürünleri ve Islak Mendil"],
  [/çöp torbası|çöp poşeti|streç film|alüminyum folyo|buzdolabı poşeti|dondurulmuş gıda torbası|kilitli poşet|sar pişir/, "Çöp Torbaları ve Saklama Ürünleri"],
  [/çamaşır (deterjanı|sodası)|matik|tursil|omo\b|ariel\b|bingo (matik|toz|soft)|abc toz|vanish/, "Çamaşır Yıkama Ürünleri"],
  [/bulaşık (deterjanı|makine)|fairy|finish\b/, "Bulaşık Yıkama Ürünleri"],
  [/çamaşır suyu|domestos|ace sprey|wc (blok|power)|lavabo açıcı|bref\b|porçöz/, "Banyo ve Tuvalet Temizliği"],
  [/yumuşatıcı|peros konsantre|yumoş/, "Diğer Ev Bakım Ürünleri"],
  [/yüzey temizleyici|cam temizle|clin\b|genel temizlik|pas ve kireç|makine temizleyici/, "Yüzey ve Genel Temizlik"],
  [/sünger\b|temizlik bezi|çelik sünger|vileda/, "Temizlik Aksesuarları ve Ekipmanları"],
  [/pişirme kağıdı|fırın torbası/, "Ev Gereçleri ve Aksesuarlar"],

  // --- Ev & Yaşam ---
  [/borcam|cam tepsi|tencere|bardak\b|çay bardağı|paşabahçe/, "Sofra & Servis"],
  [/pastelboya|rotring|kırtasiye|fotokopi kağıdı|pritt stick/, "Kırtasiye & Parti"],
  [/kamp\b|piknik\b|mangal\b/, "Kamp & Piknik"],
  [/buz torbası|koroplast(?!.*(çöp|streç|folyo))/, "Mutfak Gereçleri"],

  // --- Teknoloji ---
  [/\bpil\b|duracell|philips ledbulb|ampul/, "Pil ve Güç Kaynakları"],

  // --- Sigara ---
  [/sigara\b|camel\b|lark\b/, "Sigara ve Tütün Ürünleri"],
  [/çakmak\b/, "Çakmak"],
  [/sigara filtresi/, "Sigara Aksesuarları ve Gereçleri"],

  // --- Fit & Form ---
  [/glutensiz/, "Diyet ve Sağlıklı Gıda Ürünleri"],
  [/tatlandırıcı|stevia/, "Diyet ve Sağlıklı Gıda Ürünleri"],
  [/nesfit/, "Sağlıklı Atıştırmalıklar ve Barlar"],

  // --- Dondurma (Algida, Magnum vb. çok belirgin) ---
  [/algida|magnum|cornetto|carte ?d.?or|maraşim|golf (bravo|maraşim|maraşım|royal|roko)|dondurma\b|sorbe/, "Dondurma"],

  // --- Su & İçecek ---
  [/maden suyu|soda\b|freşa|\bc plus\b/, "Maden Suyu & Soda"],
  [/\bsu\b.*\bpet\b|doğal kaynak suyu|\bsu\s*\d|hayat su|erikli|sarıkız|kardelen su|özkaynak su|sultan su|rioba.*su/, "Su"],
  [/enerji içeceği|red ?bull|burn\b|monster\b|bruin\b|powerade|maltana/, "Enerji & Spor İçeceği"],
  [/ice tea|soğuk çay|fuse tea|didi\b.*çay|lipton.*soğuk/, "Soğuk Çay"],
  [/meyve suyu|nektar|cappy|tamek|meysu|aroma\b.*nektar|juss\b|frutti|dimes|capri.?sun|portakal suyu/, "Meyve Suyu & Nektarı"],
  [/bitki çayı/, "Bitki Çayı"],
  [/gazoz|gazlı içecek|kola\b|coca cola|cola turka|fanta|sprite|schweppes|pepsi|yedigün|çamlıca|damla minera|uludağ/, "Gazlı İçecek"],
  [/limonata/, "Diğer Ürünler"],
  [/şalgam/, "Diğer Ürünler"],
  [/badem sütü|alpro/, "Süt ve Bitkisel Süt"],
  [/soğuk kahve|starbucks|obsesso/, "Soğuk Kahve"],

  // --- Süt Ürünleri ---
  [/(?:^(?!.*çikolata)(?!.*milka).*\byoğurt\b)|danone|activia|danino/, "Yoğurt"],
  [/\bpuding\b/, "Sütlü Tatlılar"],
  [/kefir\b/, "Kefir ve Ayran"],
  [/\bayran\b/, "Kefir ve Ayran"],
  [/kaşar|beyaz peynir|lor\b|tulum peyniri|mozzarella|krem peynir|labne|süzme peynir|tost peyniri|köy peyniri|mavi küflü|çeçil|kuymak|peynir/, "Peynir"],
  [/\bkrema\b|margarin\b|sana\b|becel\b|teremyağ|doyella/, "Krema ve Margarin"],
  [/tereyağ/, "Tereyağı ve Kaymak"],
  [/\bsüt\b|sütaş|teksüt|silivri arslan/, "Süt"],

  // --- Fırından ---
  [/\bekmek\b|lavaş|sandviç ekmeği|hamburger ekmeği|bazlama|yufka|\buno\b(?!.*kruvasan)/, "Ekmek ve Unlu Mamuller"],
  [/kruvasan|kek\b|pasta\b/, "Pasta ve Kek"],
  [/börek|mantı\b/, "Börek ve Hamur İşleri"],

  // --- Kahvaltılık ---
  [/\bçay\b|çaykur|doğuş.*çay|lipton|obaçay|karali|beta.*çay|çampion|demlik poşet|bardak poşet|earl grey/, "Çay"],
  [/\bkahve\b|nescafe|jacobs|tchibo|mehmet efendi|coffee mate|cafe crown/, "Kahve"],
  [/corn ?flakes|coco ?pops|cheerios|müsli|yulaf|gevrek\b|kellog|haylayf/, "Kahvaltılık Gevrek ve Granola"],
  [/reçel\b|bal\b|çiçek balı|ezme\b(?!.*fındık)/, "Reçel, Bal ve Ezme"],
  [/\byumurta\b|bıldırcın/, "Yumurta"],
  [/votka|smırnoff|smirnoff/, "Votka"],
  [/zeytin\b|marmarabirlik|meze\b/, "Zeytin ve Meze"],

  // --- Atıştırmalık ---
  [/çikolata|kinder|milka|ülker (albeni|metro|halley|çokoprens|dido|hobby|caramio|çokomilk|coco ?star|dankek(?!.*ekmek))|toblerone|ferrero|raffaello|snickers|mars\b|twix|m ?& ?ms|nesquik|biscolata|eti karam/, "Çikolata"],
  [/gofret|wafer|tadelle/, "Gofret"],
  [/bisküvi|kraker|krispi|eti (burçak|form|petito|puf|cin|kombo|frigo(?!.*dondurma)|browni|gong|alaska(?!.*dondurma)|paykek|popkek|maximus|musli|benimo|cici ?bebe|bidolu|canga)|petibör|potibör|çubuk kraker|hanımeller/, "Bisküvi"],
  [/sakız|falım|vivident|mentos|bigbabol|oneo|tipitip/, "Sakız"],
  [/cips\b|çerezza|cheetos|doritos|lays|patos/, "Cips"],
  [/kuruyemiş|antep fıstığı|çiğ ceviz|fındık\b(?!.*krema|.*ezme)|kavrulmuş.*kuruyemiş/, "Kuruyemiş"],
  [/kuru meyve/, "Kuru Meyve"],
  [/lokum|helva|tahin|pekmez/, "Helva"],
  [/şeker\b(?!.*tuz)|bonbon|jelibon|haribo|toffifee|missbon|kent (tofita|mis ?bon)|drop bomb|first\b|rocco|yupo|bebeto|chupa chups|lolipop/, "Şekerleme"],
  [/fındık (ezme|kreması)|sürülebilir çikolata|nutella|banada/, "Fındık Ezmesi & Kreması"],
  [/musli bar|atıştırmalık bar/, "Atıştırmalık Bar"],
  [/granola/, "Granola"],
  [/patlamış mısır/, "Patlamış Mısır"],
  [/kurabiye/, "Kurabiye"],

  // --- Et, Tavuk & Balık ---
  [/sucuk|salam\b|sosis\b|pastırma|jambon|kavurma|kangal|füme/, "Şarküteri & Hazır Et"],
  [/piliç\b|tavuk\b(?!.*sebze)|banvit|lezita|nugget|schnitzel|şinitzel|döner\b/, "Tavuk"],
  [/karides|kalamar|balık\b|hamsi|levrek|mezgit|uskumru|somon|torik|lakerda|ançuez|ahtapot|dardanel|deniz ürünleri/, "Balık & Konserve"],

  // --- Dondurulmuş ---
  [/dondurulmuş (sebze|patates|et)|patates.*(çubuk|kızartmalık|kroket)|çıtır (halka|patates)/, "Dondurulmuş Patates ve Kızartmalıklar"],
  [/milföy/, "Dondurulmuş Börek ve Hamur İşleri"],
  [/superfresh (mısır|bamya|ıspanak|bezelye)|feast (ıspanak|bamya)/, "Dondurulmuş Sebze"],
  [/(superfresh|pınar) .*(burger|köfte)/, "Hazır Yemek ve Yemeklikler"],
  [/donuk\b|dondurulmuş/, "Atıştırmalık ve Diğer"],
  [/pizza\b/, "Pizza ve Pide"],

  // --- Pratik Yemek / Temel Gıda ---
  [/çorba\b|knorr.*çorba|ezogelin/, "Çorba"],
  [/makarna sos|salça|ketçap|mayonez|sos\b(?!lu|yalı)/, "Sos"],
  [/turşu\b|konserve(?!.*balık)/, "Konserve"],
  [/noodle/, "Makarna ve Noodle"],

  [/\bmakarna\b|spagetti|fusilli|tagliatelle|farfalle|pappardelle|burgu|erişte|şehriye/, "Makarna & Şehriye"],
  [/\bun\b|irmik\b|nişasta/, "Un & Nişasta"],
  [/pirinç\b|bulgur\b|mercimek\b|nohut\b|fasulye\b|bakliyat/, "Bakliyat & Pirinç"],
  [/ayçiçek yağ|zeytinyağ|sızma|riviera|pastacılık yağı|kızartmalık yağ|\bolive\b/, "Sıvı Yağlar"],
  [/\btuz\b/, "Tuz"],
  [/toz şeker|küp şeker/, "Şeker & Tatlandırıcılar"],
  [/baharat|karabiber|pul biber|kimyon|kekik|fesleğen|zencefil|isot|nane\b(?!.*sakız)|biberiye|köri|cajun|tarçın|bağdat/, "Baharatlar"],
  [/kabartma tozu|maya\b|vanilin|pudra şekeri|krem şanti|süsleme glazürü|çikolata soslu kek malzeme|creme ole|cheesecake/, "Pasta Malzemeleri"],
  [/sirke/, "Sirke & Nar Ekşisi"],
  [/aşurelik/, "Bakliyat & Pirinç"],

  // --- Meyve & Sebze ---
  [/soğan\b|mantar\b|kabak çiçeği|arpacık|bamya\b/, "Sebze"],

  // --- Fit & Form (protein vb kalan) ---
  [/protein/, "Protein ve Sporcu Gıdaları"],

  // --- Sigara aksesuarları / kağıt vb genel ---
  [/kağıt mendil/, "Kişisel Bakım Aksesuarları"],
];

// Hem taxonomy'deki yaprak isimleri (map key'leri) hem de 21 kök adının
// kendisi geçerli hedef — "Dondurma" gibi bazı kökler haritada key olarak
// yer almaz, doğrudan kendi kendinin kökü olarak çözülür.
const KNOWN_LEAF_SET = new Set([
  ...Object.keys(MARKET_CATEGORY_ANCESTORS),
  ...new Set(Object.values(MARKET_CATEGORY_ANCESTORS).map((path) => path[0])),
]);

function classify(productName) {
  const normalized = asciiFold(normalizeText(productName));
  for (const [regex, leaf] of RULES) {
    if (foldedRegex(regex).test(normalized)) {
      if (!KNOWN_LEAF_SET.has(leaf)) {
        throw new Error(`Kural hedefi taxonomy'de yok: "${leaf}" (ürün: "${productName}")`);
      }
      return leaf;
    }
  }
  return null;
}

async function main() {
  loadDotEnvLocal();
  const apply = process.argv.includes("--apply");
  const supabase = getSupabaseClient();

  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("market_catalog_products")
      .select("id, sku_code, product_name")
      .eq("category_name", "Kategorisiz")
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }

  console.log(`[1/2] ${rows.length} "Kategorisiz" ürün sınıflandırılıyor...`);

  const classified = [];
  const stillUnknown = [];
  for (const row of rows) {
    const leaf = classify(row.product_name);
    if (leaf) classified.push({ ...row, newCategory: leaf });
    else stillUnknown.push(row);
  }

  const byLeaf = {};
  for (const c of classified) byLeaf[c.newCategory] = (byLeaf[c.newCategory] ?? 0) + 1;

  console.log(`  sınıflandırılan: ${classified.length}/${rows.length} (%${Math.round((classified.length / rows.length) * 100)})`);
  console.log(`  hâlâ Kategorisiz kalan: ${stillUnknown.length}`);
  console.log("\n-- kategori dağılımı --");
  for (const [leaf, count] of Object.entries(byLeaf).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${leaf}: ${count}`);
  }

  if (!apply) {
    console.log("\nDry-run modundasınız, hiçbir şey yazılmadı. Uygulamak için --apply ekleyin.");
    console.log("\n-- örnekler --");
    for (const c of classified.slice(0, 20)) console.log(`  [${c.newCategory}] ${c.product_name}`);
    console.log("\n-- hâlâ sınıflandırılamayan örnekler --");
    for (const u of stillUnknown.slice(0, 30)) console.log(`  ${u.product_name}`);
    return;
  }

  console.log("\n[2/2] market_catalog_products.category_name güncelleniyor...");
  let updated = 0;
  const chunkSize = 20;
  for (let i = 0; i < classified.length; i += chunkSize) {
    const chunk = classified.slice(i, i + chunkSize);
    const results = await Promise.all(
      chunk.map((c) =>
        supabase.from("market_catalog_products").update({ category_name: c.newCategory }).eq("id", c.id),
      ),
    );
    updated += results.filter((r) => !r.error).length;
  }
  console.log(`  ${updated}/${classified.length} ürün güncellendi.`);
  console.log("\nTamamlandı.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
