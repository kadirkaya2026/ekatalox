// Sektörler: pazarlama sayfaları, kayıt formundaki "ben neciyim" seçimi ve
// otomatik tema ataması buradan beslenir. Sıra menüdeki sıradır.

export type MarketingThemeKey = "vitrin" | "taze" | "dukkan" | "toptanci";

export interface SectorDefinition {
  slug: string;
  /** Menü ve form etiketi */
  label: string;
  /** Sayfa başlığında kullanılan uzun ad */
  name: string;
  /** Tek cümlelik vaat */
  headline: string;
  sub: string;
  /** Bu sektörün telefonla sipariş dertleri */
  pains: string[];
  /** eKatalox ile ne değişir */
  wins: string[];
  /** Vitrinde örnek olacak ürün/kategori isimleri (gerçek raf dili) */
  sampleCategories: string[];
  theme: MarketingThemeKey;
  /** Alkol/tütün bayii: teslimat yok, sipariş listesi hazırlatma akışı */
  pickupOnly?: boolean;
  /** Toptancı: mevcut B2B akışı, esnaf paketleri değil */
  wholesale?: boolean;
}

export const SECTORS: SectorDefinition[] = [
  {
    slug: "market",
    label: "Market / Bakkal",
    name: "Market ve bakkallar",
    headline: "Mahallenin marketi siparişi WhatsApp'tan alsın.",
    sub: "Müşteriniz rafınızı telefonundan gezsin, sepetini doldursun; sipariş adresiyle, telefonuyla, yazılı gelsin. Komisyon yok.",
    pains: [
      "Telefonda \"hangi marka, kaç tane\" diye dakikalarca tarif",
      "Yanlış anlaşılan sipariş, geri dönen poşet",
      "\"Nerede kaldı?\" diye çalan telefon",
    ],
    wins: [
      "Fotoğraflı, fiyatlı ürün listesi; müşteri seçer, siz hazırlarsınız",
      "Hazırlanıyor ve yola çıktı bildirimleri kendiliğinden gider",
      "Kampanya ve indirimli ürün sayfasıyla tozlanan stok döner",
      "Veresiye defteri panelde, tahsilat hatırlatması tek dokunuş",
    ],
    sampleCategories: ["Su ve içecek", "Atıştırmalık", "Süt ürünleri", "Kahvaltılık", "Temizlik"],
    theme: "vitrin",
  },
  {
    slug: "tekel",
    label: "Tekel Bayii",
    name: "Tekel bayileri",
    headline: "Müşteri listesini hazırlasın, dükkândan alsın.",
    sub: "Tekel bayilerinde teslimat yoktur; müşteri siparişini telefonundan hazırlatır, siz paketlersiniz, gelip alır. Telefon trafiği biter, kuyruk kısalır.",
    pains: [
      "Kapıda \"şu markadan var mı\" sorusuyla uzayan kuyruk",
      "Telefonla söylenen listenin yarısının unutulması",
      "Yaş doğrulamasız satış riski",
    ],
    wins: [
      "Hazırlat akışı: müşteri listesini gönderir, siz poşeti hazır tutarsınız",
      "Yaş doğrulama sipariş öncesinde, sizin adınıza",
      "Kampanya bildirimleri müşterinin telefonuna düşer",
      "Hangi magnetin müşteri getirdiğini panelde görürsünüz",
    ],
    sampleCategories: ["Atıştırmalık", "Soğuk içecek", "Kuruyemiş", "Sigara aksesuarı", "Buz"],
    theme: "vitrin",
    pickupOnly: true,
  },
  {
    slug: "manav",
    label: "Manav",
    name: "Manavlar",
    headline: "Günün tezgâhı, müşterinin cebinde.",
    sub: "Sabah gelen malı fotoğrafıyla ve kilo fiyatıyla yayınlayın; müşteri \"iki kilo domates, bir demet maydanoz\" diye yazılı sipariş versin.",
    pains: [
      "Fiyatın her gün değişmesi, telefonda tek tek söylemek",
      "\"Olgun olsun\" gibi notların kaybolması",
      "Akşam elde kalan mal",
    ],
    wins: [
      "Kilo ve adet birimiyle sipariş; sipariş notu her kalemde",
      "Günlük fiyat panelden saniyede güncellenir",
      "Akşam indirimi kampanyası tek dokunuşla tüm müşterilere",
      "Teslimat ücreti ve ücretsiz teslimat barajı sizin elinizde",
    ],
    sampleCategories: ["Sebze", "Meyve", "Yeşillik", "Kuru bakliyat", "Günün ürünü"],
    theme: "taze",
  },
  {
    slug: "kasap",
    label: "Kasap / Şarküteri",
    name: "Kasap ve şarküteriler",
    headline: "\"Yarım kilo kıyma, az yağlı\" yazılı gelsin.",
    sub: "Et siparişi ayrıntı ister; telefonda anlatılan, tezgâhta unutulur. Müşteri kesim tercihini ve gramajı yazsın, siz hazırlayıp bildirin.",
    pains: [
      "Kesim ve yağ oranı gibi tercihlerin telefonda karışması",
      "Bayram ve hafta sonu yığılan aramalar",
      "Fiyat sorusu için gün boyu çalan telefon",
    ],
    wins: [
      "Ürün başına sipariş notu: kesim, gramaj, paketleme",
      "Kilo fiyatı güncel, müşteri tutarı görerek sipariş verir",
      "Hazır olduğunda müşteriye bildirim, kapıda bekleme yok",
      "Sadık müşteriye özel kupon ve \"sizi özledik\" bildirimi",
    ],
    sampleCategories: ["Dana", "Kuzu", "Tavuk", "Şarküteri", "Sucuk ve sosis"],
    theme: "taze",
  },
  {
    slug: "cicekci",
    label: "Çiçekçi",
    name: "Çiçekçiler",
    headline: "Buketiniz fotoğrafıyla satsın.",
    sub: "Müşteri buketi ve saksıyı fotoğrafından seçsin, teslimat adresini ve kart notunu yazsın; sipariş size WhatsApp'tan düşsün.",
    pains: [
      "Telefonda buket tarif etmenin imkânsızlığı",
      "Özel günlerde kaçırılan aramalar",
      "Not ve adres hataları",
    ],
    wins: [
      "Fotoğraflı vitrin, ürün başına not alanı (kart mesajı)",
      "Teslimat adresi ve konum sipariş içinde",
      "Anneler Günü, Sevgililer Günü kampanyaları tek tuşla",
      "Sipariş takibi: hazırlanıyor, yola çıktı",
    ],
    sampleCategories: ["Buketler", "Saksı çiçekleri", "Aranjman", "Teraryum", "Özel gün"],
    theme: "taze",
  },
  {
    slug: "petshop",
    label: "Petshop",
    name: "Petshoplar",
    headline: "Mama bitmeden sipariş gelsin.",
    sub: "Düzenli alınan mama ve kum siparişleri telefon yerine sayfanızdan gelsin; müşteri geçmiş siparişini tek dokunuşla yenilesin.",
    pains: [
      "Her ay aynı siparişi telefonla yeniden almak",
      "Marka ve gramaj karışıklığı",
      "Stokta olmayan ürün için boşa giden arama",
    ],
    wins: [
      "Geçmiş siparişi yenileme, düzenli müşteriye kupon",
      "Stok durumu vitrinde: var, azaldı, tükendi",
      "Ağır çuvallar için teslimat ücreti ve baraj ayarı",
      "Kampanya bildirimi telefonuna düşer",
    ],
    sampleCategories: ["Kedi maması", "Köpek maması", "Kum", "Aksesuar", "Akvaryum"],
    theme: "dukkan",
  },
  {
    slug: "kirtasiye",
    label: "Kırtasiye",
    name: "Kırtasiyeler",
    headline: "Okul listesi sayfanıza gelsin, siz hazırlayın.",
    sub: "Veliler listeyi telefonda okumasın; ürünleri sayfanızdan seçip sipariş versin. Okul sezonunda kuyruk yerine hazır paket.",
    pains: [
      "Sezonda telefonla okunan uzun listeler",
      "Marka ve adet hataları",
      "Fotokopi ve baskı taleplerinin karışması",
    ],
    wins: [
      "Kategori bazlı liste, sipariş notu ile özel talepler",
      "Hazır olduğunda bildirim, mağazadan teslim ya da kurye",
      "Sezon kampanyaları tüm müşterilere tek tuşla",
      "Veresiye takibi (okul ve kurum müşterileri için)",
    ],
    sampleCategories: ["Defter", "Kalem", "Okul seti", "Ofis", "Sanat malzemesi"],
    theme: "dukkan",
  },
  {
    slug: "toptanci",
    label: "Toptancı",
    name: "Toptancı ve distribütörler",
    headline: "Bayilerinize özel fiyat listesi, WhatsApp'tan sipariş.",
    sub: "Şifre korumalı katalog, bayi bazlı fiyat listeleri, Excel'den ürün yükleme ve yapılandırılmış B2B sipariş akışı. Mevcut toptancı altyapımız aynen sürüyor.",
    pains: [
      "Her bayiye ayrı PDF fiyat listesi göndermek",
      "Telefonla alınan siparişlerde adet ve kod hataları",
      "Kur değişiminde listeyi baştan hazırlamak",
    ],
    wins: [
      "Bayi başına fiyat listesi, şifreli katalog",
      "Excel'den dakikalar içinde canlı katalog",
      "Kur senkronizasyonu, stok durumu, sipariş PDF'i",
      "Plasiyer ve saha ekibi için sipariş girişi",
    ],
    sampleCategories: ["Elektronik", "Hırdavat", "Gıda toptan", "Tekstil", "Kozmetik"],
    theme: "toptanci",
    wholesale: true,
  },
];

export const SIGNUP_SECTOR_OPTIONS = [
  ...SECTORS.filter((s) => !s.wholesale).map((s) => ({ value: s.slug, label: s.label })),
  { value: "diger", label: "Diğer" },
];

export function getSector(slug: string) {
  return SECTORS.find((s) => s.slug === slug) ?? null;
}
