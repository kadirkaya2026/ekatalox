// Kurumsal site sihirbazının sektör hazır metinleri. YAPAY ZEKÂ YOK: tüm
// metinler burada elle yazıldı. Şablonlarda yer tutucular:
//   {firma}   firma / mağaza adı
//   {sehir}   il (yalın hâl: "İstanbul merkezli" gibi eksiz kullanılır)
//   {yil}     kuruluş yılı ("2012 yılından bu yana")
//   {musteri} müşteri tipi, YÖNELME hâlinde ("bayilere ve toptancılara")
// renderTemplate, değeri olmayan yer tutucuyu içeren CÜMLEYİ tamamen düşürür;
// böylece bayinin girmediği bir bilgi (kuruluş yılı, şehir) asla uydurulmaz.
// Öne çıkan özellikler varsayılan olarak doğrulanabilir, genel ifadelerdir
// (katalog, bayiye özel fiyat, hızlı sipariş); garanti süresi gibi iddialar
// yalnız bayinin kendi yazdığı rozetle eklenir.

export type KurumsalSectorKey =
  | "telefon-aksesuar"
  | "elektronik"
  | "gida-toptan"
  | "kozmetik"
  | "tekstil"
  | "hirdavat"
  | "genel";

export interface KurumsalHighlightOption {
  title: string;
  body: string;
}

export interface KurumsalSectorPreset {
  key: KurumsalSectorKey;
  label: string;
  /** Sektör kartında görünen kısa açıklama */
  hint: string;
  eyebrows: string[];
  headlines: string[];
  taglines: string[];
  about: string[];
  highlights: KurumsalHighlightOption[];
}

export type KurumsalTemplateVars = Partial<Record<"firma" | "sehir" | "yil" | "musteri", string>>;

export interface KurumsalCustomerType {
  key: string;
  label: string;
  /** Şablonlardaki {musteri} karşılığı (yönelme hâli) */
  dative: string;
}

export const KURUMSAL_CUSTOMER_TYPES: KurumsalCustomerType[] = [
  { key: "bayi", label: "Bayiler / Toptan", dative: "bayilere ve toptancılara" },
  { key: "perakende", label: "Perakende mağazalar", dative: "perakende mağazalara" },
  { key: "market", label: "Market & bakkallar", dative: "market ve bakkallara" },
  { key: "kurumsal", label: "Kurumsal firmalar", dative: "kurumsal firmalara" },
];

export const DEFAULT_CUSTOMER_TYPE = KURUMSAL_CUSTOMER_TYPES[0];

export function getCustomerType(key: string | null | undefined): KurumsalCustomerType | null {
  return KURUMSAL_CUSTOMER_TYPES.find((type) => type.key === key) ?? null;
}

// Her sektörde ortak, doğrulanabilir özellikler (eKatalox bayi portalının
// gerçekten sunduğu şeyler).
const COMMON_HIGHLIGHTS: KurumsalHighlightOption[] = [
  {
    title: "Güncel Katalog",
    body: "Tüm ürünlerimiz güncel görselleri ve bilgileriyle bayi portalımızda 7/24 hazır.",
  },
  {
    title: "Bayilere Özel Fiyat",
    body: "Fiyat listemiz yalnızca bayilerimize açıktır; güncel fiyatlar portalda her zaman hazır.",
  },
  {
    title: "Hızlı Sipariş",
    body: "Katalogdan sepetinizi oluşturun, siparişinizi tek dokunuşla bize iletin.",
  },
  {
    title: "7/24 Bayi Portalı",
    body: "Mesai saatini beklemeden ürünlere göz atın, siparişinizi istediğiniz an hazırlayın.",
  },
];

// Yalnız kuruluş yılı girildiyse seçeneklerde çıkar (cümle düşerse gövde boş kalır).
const YEAR_HIGHLIGHT: KurumsalHighlightOption = {
  title: "Köklü Tecrübe",
  body: "{yil} yılından bu yana sektörde edindiğimiz tecrübeyle hizmet veriyoruz.",
};

export const KURUMSAL_PRESETS: KurumsalSectorPreset[] = [
  {
    key: "telefon-aksesuar",
    label: "Telefon Aksesuarı",
    hint: "Kulaklık, şarj aleti, kablo, powerbank, kılıf",
    eyebrows: ["Akıllı Telefon Aksesuarları", "Telefon Aksesuarı Toptan", "Mobil Aksesuar Tedarikçisi"],
    headlines: ["Kaliteyi Keşfet.", "Aksesuarda güvenilir tedarikçiniz.", "Rafınızdaki her aksesuar tek adreste."],
    taglines: [
      "Kulaklıktan powerbank'e, şarj aletinden kabloya; {firma} ürünleri bayilerimiz aracılığıyla raflarda.",
      "{firma}, {musteri} geniş telefon aksesuarı yelpazesiyle toptan tedarik sağlar.",
      "Güncel ürünler, bayilere özel fiyatlar ve hızlı sipariş; hepsi {firma} bayi portalında.",
    ],
    about: [
      "{firma}, akıllı telefon ve elektronik aksesuarları alanında faaliyet gösteren bir toptan tedarikçidir. {yil} yılından bu yana sektörde hizmet veriyoruz. {sehir} merkezli olarak Türkiye'nin dört bir yanındaki müşterilerimize ulaşıyoruz. Kulaklık, şarj aleti, kablo, powerbank ve araç aksesuarlarından oluşan geniş bir ürün yelpazesi sunuyoruz.",
      "Satışlarımızı bayi ve toptan kanalıyla yapıyoruz. {musteri} özel fiyat listemize bayi portalımız üzerinden 7/24 ulaşılabilir. Siparişler katalogdan birkaç dokunuşla oluşturulur ve doğrudan bize iletilir.",
      "Ürün seçimimizi piyasanın talebine göre sürekli güncelliyoruz. Amacımız {musteri} doğru ürünü, doğru zamanda ve rekabetçi fiyatla ulaştırmak.",
    ],
    highlights: [
      {
        title: "Geniş Ürün Yelpazesi",
        body: "Kulaklıktan kabloya, powerbank'ten araç tutucuya tek tedarikçiden eksiksiz raf.",
      },
      {
        title: "Yeni Ürünler Anında Katalogda",
        body: "Yeni gelen ürünler kataloğa eklendiği anda bayilerimizin ekranında.",
      },
      ...COMMON_HIGHLIGHTS,
    ],
  },
  {
    key: "elektronik",
    label: "Elektronik",
    hint: "Küçük ev aletleri, bilgisayar çevre birimleri, aydınlatma",
    eyebrows: ["Elektronik Toptan", "Elektronik Ürün Tedarikçisi", "Teknoloji Ürünleri"],
    headlines: ["Teknolojide güvenilir çözüm ortağınız.", "Elektronikte doğru ürün, doğru fiyat.", "Rafınızı teknolojiyle buluşturun."],
    taglines: [
      "{firma}, elektronik ürünlerde {musteri} toptan tedarik sağlar.",
      "Güncel elektronik ürünler ve bayilere özel fiyatlar {firma} bayi portalında.",
      "Küçük ev aletlerinden bilgisayar çevre birimlerine, aradığınız ürünler tek katalogda.",
    ],
    about: [
      "{firma}, elektronik ürünlerin toptan satışı alanında faaliyet göstermektedir. {yil} yılından bu yana sektörde hizmet veriyoruz. {sehir} merkezli olarak Türkiye'nin dört bir yanındaki müşterilerimize ulaşıyoruz. Ürün yelpazemizi piyasanın ihtiyaçlarına göre sürekli genişletiyoruz.",
      "Satışlarımızı bayi ve toptan kanalıyla yapıyoruz. {musteri} özel fiyat listemize bayi portalımız üzerinden 7/24 ulaşılabilir. Siparişler katalogdan birkaç dokunuşla oluşturulur ve doğrudan bize iletilir.",
      "Her ürünü kodu, görselleri ve açıklamasıyla kataloğumuzda listeliyoruz. Amacımız {musteri} doğru ürünü hızlı ve sorunsuz bir şekilde ulaştırmak.",
    ],
    highlights: [
      {
        title: "Geniş Ürün Yelpazesi",
        body: "Küçük ev aletlerinden bilgisayar çevre birimlerine, ihtiyacınız olan ürünler tek katalogda.",
      },
      {
        title: "Model Bazlı Ürün Bilgisi",
        body: "Her ürünün kodu, görselleri ve açıklaması katalogda; doğru modeli kolayca bulun.",
      },
      ...COMMON_HIGHLIGHTS,
    ],
  },
  {
    key: "gida-toptan",
    label: "Gıda Toptan",
    hint: "Temel gıda, içecek, atıştırmalık, temizlik",
    eyebrows: ["Gıda Toptan", "Gıda ve İçecek Tedarikçisi", "Toptan Gıda Dağıtımı"],
    headlines: ["Rafınız hiç boş kalmasın.", "Gıdada güvenilir tedarik.", "İhtiyacınız olan her şey tek listede."],
    taglines: [
      "{firma}, gıda ve içecek ürünlerinde {musteri} toptan tedarik sağlar.",
      "Temel gıdadan içeceğe, atıştırmalıktan temizliğe; güncel ürünler ve fiyatlar {firma} bayi portalında.",
      "Siparişinizi katalogdan hazırlayın, gerisini {firma} olarak biz halledelim.",
    ],
    about: [
      "{firma}, gıda ve içecek ürünlerinin toptan satışı alanında faaliyet göstermektedir. {yil} yılından bu yana sektörde hizmet veriyoruz. {sehir} merkezli olarak müşterilerimize ulaşıyoruz. Temel gıdadan içeceğe, atıştırmalıktan temizlik ürünlerine kadar geniş bir ürün çeşidi sunuyoruz.",
      "Satışlarımızı toptan kanalıyla yapıyoruz. {musteri} özel fiyat listemize bayi portalımız üzerinden 7/24 ulaşılabilir. Siparişler katalogdan birkaç dokunuşla oluşturulur ve doğrudan bize iletilir.",
      "Ürünlerin koli ve paket bilgilerini kataloğumuzda paylaşıyoruz. Amacımız {musteri} ihtiyaç duydukları ürünleri doğru miktarda ve zamanında ulaştırmak.",
    ],
    highlights: [
      {
        title: "Geniş Ürün Çeşidi",
        body: "Temel gıdadan içeceğe, atıştırmalıktan temizliğe rafınız için gereken ürünler tek listede.",
      },
      {
        title: "Koli ve Paket Bilgisi",
        body: "Ürünlerin koli ve paket adetleri katalogda; siparişinizi doğru miktarda verin.",
      },
      ...COMMON_HIGHLIGHTS,
    ],
  },
  {
    key: "kozmetik",
    label: "Kozmetik & Kişisel Bakım",
    hint: "Cilt ve saç bakımı, makyaj, parfüm, kişisel bakım",
    eyebrows: ["Kozmetik Toptan", "Kişisel Bakım Ürünleri", "Kozmetik Tedarikçisi"],
    headlines: ["Güzelliğin toptan adresi.", "Bakım ürünlerinde güvenilir tedarik.", "Rafınıza özenle seçilmiş ürünler."],
    taglines: [
      "{firma}, kozmetik ve kişisel bakım ürünlerinde {musteri} toptan tedarik sağlar.",
      "Cilt bakımından saç bakımına; güncel ürünler ve bayilere özel fiyatlar {firma} bayi portalında.",
      "Aradığınız bakım ürünleri, düzenli ve güncel bir katalogda.",
    ],
    about: [
      "{firma}, kozmetik ve kişisel bakım ürünlerinin toptan satışı alanında faaliyet göstermektedir. {yil} yılından bu yana sektörde hizmet veriyoruz. {sehir} merkezli olarak müşterilerimize ulaşıyoruz. Cilt ve saç bakımından kişisel bakıma kadar geniş bir ürün yelpazesi sunuyoruz.",
      "Satışlarımızı bayi ve toptan kanalıyla yapıyoruz. {musteri} özel fiyat listemize bayi portalımız üzerinden 7/24 ulaşılabilir. Siparişler katalogdan birkaç dokunuşla oluşturulur ve doğrudan bize iletilir.",
      "Her ürünü görseli ve açıklamasıyla kataloğumuzda paylaşıyoruz. Amacımız {musteri} doğru ürünü doğru bilgiyle ulaştırmak.",
    ],
    highlights: [
      {
        title: "Kategorilere Ayrılmış Katalog",
        body: "Cilt bakımından saç bakımına, ürünler kategorilere ayrılmış düzenli bir katalogda.",
      },
      {
        title: "Görsel ve Açıklamalar",
        body: "Her ürünün görseli ve açıklaması katalogda; müşterinize doğru bilgiyi verin.",
      },
      ...COMMON_HIGHLIGHTS,
    ],
  },
  {
    key: "tekstil",
    label: "Tekstil & Giyim",
    hint: "Hazır giyim, ev tekstili, iç giyim, aksesuar",
    eyebrows: ["Tekstil Toptan", "Hazır Giyim Tedarikçisi", "Toptan Giyim"],
    headlines: ["Yeni sezon, ilk sizin rafınızda.", "Tekstilde güvenilir tedarik.", "Modayı toptan buluşturuyoruz."],
    taglines: [
      "{firma}, tekstil ve giyim ürünlerinde {musteri} toptan tedarik sağlar.",
      "Yeni sezon ürünleri ve bayilere özel fiyatlar {firma} bayi portalında.",
      "Model ve seçenek bilgileriyle tüm ürünlerimiz tek katalogda.",
    ],
    about: [
      "{firma}, tekstil ve giyim ürünlerinin toptan satışı alanında faaliyet göstermektedir. {yil} yılından bu yana sektörde hizmet veriyoruz. {sehir} merkezli olarak müşterilerimize ulaşıyoruz. Ürün yelpazemizi her sezon yeni modellerle güncelliyoruz.",
      "Satışlarımızı bayi ve toptan kanalıyla yapıyoruz. {musteri} özel fiyat listemize bayi portalımız üzerinden 7/24 ulaşılabilir. Siparişler katalogdan birkaç dokunuşla oluşturulur ve doğrudan bize iletilir.",
      "Her modeli görselleri ve seçenekleriyle kataloğumuzda paylaşıyoruz. Amacımız {musteri} sezonun doğru ürünlerini zamanında ulaştırmak.",
    ],
    highlights: [
      {
        title: "Sezon Ürünleri Katalogda",
        body: "Yeni sezon ürünleri kataloğa eklendiği anda bayilerimizin ekranında.",
      },
      {
        title: "Model ve Seçenek Bilgisi",
        body: "Ürünlerin model ve seçenek bilgileri katalogda; siparişinizi netleştirin.",
      },
      ...COMMON_HIGHLIGHTS,
    ],
  },
  {
    key: "hirdavat",
    label: "Hırdavat & Nalburiye",
    hint: "El aletleri, bağlantı elemanları, elektrik, tesisat",
    eyebrows: ["Hırdavat Toptan", "Nalburiye Tedarikçisi", "Yapı ve Hırdavat Ürünleri"],
    headlines: ["Aradığınız parça burada.", "Hırdavatta güvenilir tedarik.", "Nalburunuzun eksiksiz rafı."],
    taglines: [
      "{firma}, hırdavat ve nalburiye ürünlerinde {musteri} toptan tedarik sağlar.",
      "El aletinden bağlantı elemanına; güncel ürünler ve bayilere özel fiyatlar {firma} bayi portalında.",
      "Ürün koduyla arayın, siparişinizi dakikalar içinde hazırlayın.",
    ],
    about: [
      "{firma}, hırdavat ve nalburiye ürünlerinin toptan satışı alanında faaliyet göstermektedir. {yil} yılından bu yana sektörde hizmet veriyoruz. {sehir} merkezli olarak müşterilerimize ulaşıyoruz. El aletlerinden bağlantı elemanlarına kadar geniş bir ürün yelpazesi sunuyoruz.",
      "Satışlarımızı bayi ve toptan kanalıyla yapıyoruz. {musteri} özel fiyat listemize bayi portalımız üzerinden 7/24 ulaşılabilir. Siparişler katalogdan birkaç dokunuşla oluşturulur ve doğrudan bize iletilir.",
      "Her ürünü koduyla birlikte kataloğumuzda listeliyoruz. Amacımız {musteri} aradıkları parçayı hızlıca bulmalarını ve zamanında teslim almalarını sağlamak.",
    ],
    highlights: [
      {
        title: "Geniş Ürün Yelpazesi",
        body: "El aletinden bağlantı elemanına, nalburiye rafınız için gereken ürünler tek katalogda.",
      },
      {
        title: "Ürün Koduyla Kolay Arama",
        body: "Her ürün koduyla listelenir; aradığınız parçayı saniyeler içinde bulun.",
      },
      ...COMMON_HIGHLIGHTS,
    ],
  },
  {
    key: "genel",
    label: "Genel / Diğer",
    hint: "Birden fazla sektör ya da listede olmayan bir alan",
    eyebrows: ["Toptan Satış", "Bayi Portalı", "Güvenilir Tedarikçi"],
    headlines: ["Güvenilir tedarikçiniz.", "Toptan alışverişin kolay yolu.", "Bayilerimizle birlikte büyüyoruz."],
    taglines: [
      "{firma}, {musteri} geniş ürün yelpazesiyle toptan tedarik sağlar.",
      "Güncel ürünler, bayilere özel fiyatlar ve hızlı sipariş; hepsi {firma} bayi portalında.",
      "Tüm ürünlerimiz tek katalogda, siparişiniz birkaç dokunuş uzağınızda.",
    ],
    about: [
      "{firma}, toptan satış alanında faaliyet göstermektedir. {yil} yılından bu yana sektörde hizmet veriyoruz. {sehir} merkezli olarak müşterilerimize ulaşıyoruz. Ürün yelpazemizi müşterilerimizin ihtiyaçlarına göre sürekli genişletiyoruz.",
      "Satışlarımızı bayi ve toptan kanalıyla yapıyoruz. {musteri} özel fiyat listemize bayi portalımız üzerinden 7/24 ulaşılabilir. Siparişler katalogdan birkaç dokunuşla oluşturulur ve doğrudan bize iletilir.",
      "Amacımız {musteri} doğru ürünü, doğru zamanda ve rekabetçi fiyatla ulaştırmak.",
    ],
    highlights: [
      {
        title: "Geniş Ürün Yelpazesi",
        body: "Farklı kategorilerdeki ürünlerimiz tek katalogda, düzenli ve güncel.",
      },
      {
        title: "Kolay Arama",
        body: "Ürün adı veya koduyla arayın, aradığınızı saniyeler içinde bulun.",
      },
      ...COMMON_HIGHLIGHTS,
    ],
  },
];

const PRESET_BY_KEY = new Map(KURUMSAL_PRESETS.map((preset) => [preset.key, preset]));

export function getKurumsalPreset(key: string | null | undefined): KurumsalSectorPreset {
  return PRESET_BY_KEY.get(key as KurumsalSectorKey) ?? PRESET_BY_KEY.get("genel")!;
}

// Self-servis kayıttaki serbest "sektör" metnini (tenants.sector) en yakın
// hazır sektöre eşler; eşleşmezse "genel".
export function resolveSectorKey(value: string | null | undefined): KurumsalSectorKey {
  if (value && PRESET_BY_KEY.has(value as KurumsalSectorKey)) return value as KurumsalSectorKey;
  const text = (value ?? "").toLocaleLowerCase("tr-TR");
  if (!text) return "genel";
  if (/telefon|aksesuar|gsm|mobil/.test(text)) return "telefon-aksesuar";
  if (/elektronik|teknoloji|bilgisayar|beyaz eşya/.test(text)) return "elektronik";
  if (/gıda|gida|içecek|market|şarküteri|bakkal/.test(text)) return "gida-toptan";
  if (/kozmetik|bakım|parfüm/.test(text)) return "kozmetik";
  if (/tekstil|giyim|konfeksiyon|moda/.test(text)) return "tekstil";
  if (/hırdavat|hirdavat|nalbur|yapı|inşaat/.test(text)) return "hirdavat";
  return "genel";
}

const PLACEHOLDER_RE = /\{(firma|sehir|yil|musteri)\}/g;

function capitalizeFirst(value: string) {
  return value ? value.charAt(0).toLocaleUpperCase("tr-TR") + value.slice(1) : value;
}

/**
 * Şablonu doldurur. Değeri boş olan yer tutucuyu içeren cümle TAMAMEN düşer
 * (ör. kuruluş yılı girilmediyse "{yil} yılından bu yana..." cümlesi hiç
 * yazılmaz). Hiç cümle kalmazsa boş string döner.
 */
export function renderTemplate(template: string, vars: KurumsalTemplateVars): string {
  const sentences = template.split(/(?<=[.!?])\s+/);
  const kept: string[] = [];

  for (const sentence of sentences) {
    const keys = [...sentence.matchAll(PLACEHOLDER_RE)].map((match) => match[1] as keyof KurumsalTemplateVars);
    if (keys.some((key) => !vars[key]?.trim())) continue;
    const filled = sentence.replace(PLACEHOLDER_RE, (_, key: keyof KurumsalTemplateVars) => vars[key]!.trim());
    kept.push(capitalizeFirst(filled.trim()));
  }

  return kept.join(" ").trim();
}

/** Bir listedeki şablonları doldurur, boş kalanları ve tekrarları atar. */
export function renderTemplates(templates: string[], vars: KurumsalTemplateVars): string[] {
  return [...new Set(templates.map((template) => renderTemplate(template, vars)).filter(Boolean))];
}

/** Sektörün öne çıkan özellik seçenekleri (yer tutucular doldurulmuş). */
export function renderHighlightOptions(
  sector: string | null | undefined,
  vars: KurumsalTemplateVars,
): KurumsalHighlightOption[] {
  const preset = getKurumsalPreset(sector);
  return [...preset.highlights, YEAR_HIGHLIGHT]
    .map((option) => ({ title: option.title, body: renderTemplate(option.body, vars) }))
    .filter((option) => option.body);
}

/** Sihirbaz ilk açıldığında seçili gelen 4 özellik: sektörün ilki + ortak üçü. */
export function pickDefaultHighlights(
  sector: string | null | undefined,
  vars: KurumsalTemplateVars,
): KurumsalHighlightOption[] {
  const options = renderHighlightOptions(sector, vars);
  const wanted = [options[0]?.title, "Güncel Katalog", "Bayilere Özel Fiyat", "Hızlı Sipariş"];
  return wanted
    .map((title) => options.find((option) => option.title === title))
    .filter((option): option is KurumsalHighlightOption => Boolean(option));
}

/** İçerikten şablon değişkenlerini üretir. */
export function buildTemplateVars(params: {
  firma: string;
  city?: string | null;
  foundedYear?: number | null;
  customerType?: string | null;
}): KurumsalTemplateVars {
  return {
    firma: params.firma,
    sehir: params.city ?? undefined,
    yil: params.foundedYear ? String(params.foundedYear) : undefined,
    musteri: getCustomerType(params.customerType)?.dative,
  };
}
