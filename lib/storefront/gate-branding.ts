import type { StorefrontLocale } from "@/lib/storefront/i18n/dictionary";

// Şifre kapısı için tenant'a özel marka arka planı. Ayar paneline taşınana
// kadar kod içinde tutulur; subdomain eşleşmezse kapı sade görünümde kalır.
export type GateBrandingCopy = {
  eyebrow: string;
  headline: string;
  tagline: string;
  chips: string[];
  helpLine?: string;
};

export type GateBranding = {
  // public/ altındaki yatay arka plan görseli (koyu, sağ tarafta ürün)
  backgroundImage: string;
  // public/ altındaki logo işareti (beyaz, şeffaf zemin)
  logoMark: string;
  wordmark: string;
  accentColor: string;
  // İsteğe bağlı döngü arka plan videosu (sessiz, kısa). backgroundImage
  // video yüklenene kadar ve hareket azaltma/veri tasarrufunda gösterilir.
  backgroundVideo?: { src: string; mobileSrc?: string };
  copy: Partial<Record<StorefrontLocale, GateBrandingCopy>> & { tr: GateBrandingCopy };
};

const GATE_BRANDING: Record<string, GateBranding> = {
  "isego-ticaret": {
    backgroundImage: "/gate/isego-ticaret/bg.jpg",
    logoMark: "/gate/isego-ticaret/logo-mark-v2.png",
    wordmark: "İSEGO TİCARET",
    accentColor: "#F97316",
    copy: {
      tr: {
        eyebrow: "Bayi Portalı",
        headline: "Aksesuarda Güvenilir Tedarik.",
        tagline:
          "Fulltech şarj aletleri, kablolar, powerbank, kulaklık, telefon tutucu ve akım korumalı prizler; güncel toptan fiyat listesi bayilerimize özel.",
        chips: ["Şarj Aleti", "Şarj Kablosu", "Powerbank", "Kulaklık", "Telefon Tutucu", "Akım Korumalı Priz"],
        helpLine: "Şifreniz yok mu? WhatsApp'tan bize yazın.",
      },
      en: {
        eyebrow: "Dealer Portal",
        headline: "Reliable Supply in Accessories.",
        tagline:
          "Fulltech chargers, cables, power banks, earbuds, phone holders and surge-protected power strips; the current wholesale price list, exclusively for our dealers.",
        chips: ["Chargers", "Cables", "Power Banks", "Earbuds", "Phone Holders", "Power Strips"],
        helpLine: "No password? Message us on WhatsApp.",
      },
    },
  },
  lucatech: {
    backgroundImage: "/gate/lucatech/bg.jpg",
    logoMark: "/gate/lucatech/logo-mark.png",
    wordmark: "LUCATECH",
    accentColor: "#F58220",
    copy: {
      tr: {
        eyebrow: "Bayi Portalı",
        headline: "Kaliteyi Keşfet.",
        tagline:
          "Kulaklıktan powerbank'e, şarj aletinden hoparlöre; Lucatech ürünlerinin güncel toptan fiyat listesi bayilerimize özel.",
        chips: ["Kulaklık", "Hoparlör", "Powerbank", "Şarj Aleti", "Kablo", "2 Yıl Garanti"],
        helpLine: "Şifreniz yok mu? Whatsapp'tan Bize Yazın, Gönderelim.",
      },
      en: {
        eyebrow: "Dealer Portal",
        headline: "Discover Quality.",
        tagline:
          "From headphones to power banks, chargers to speakers; the current wholesale price list of Lucatech products, exclusively for our dealers.",
        chips: ["Headphones", "Speakers", "Power Banks", "Chargers", "Cables", "2-Year Warranty"],
        helpLine: "No password? Message us on WhatsApp and we'll send it.",
      },
      de: {
        eyebrow: "Händlerportal",
        headline: "Qualität entdecken.",
        tagline:
          "Von Kopfhörern bis Powerbanks, von Ladegeräten bis Lautsprechern; die aktuelle Großhandelspreisliste von Lucatech, exklusiv für unsere Händler.",
        chips: ["Kopfhörer", "Lautsprecher", "Powerbanks", "Ladegeräte", "Kabel", "2 Jahre Garantie"],
        helpLine: "Kein Passwort? Schreiben Sie uns auf WhatsApp, wir schicken es Ihnen.",
      },
      ru: {
        eyebrow: "Портал дилера",
        headline: "Откройте качество.",
        tagline:
          "От наушников до пауэрбанков, от зарядных устройств до колонок; актуальный оптовый прайс-лист Lucatech только для наших дилеров.",
        chips: ["Наушники", "Колонки", "Пауэрбанки", "Зарядные устройства", "Кабели", "Гарантия 2 года"],
        helpLine: "Нет пароля? Напишите нам в WhatsApp, и мы его отправим.",
      },
    },
  },
  // 5 Eki 2026: Börü Tech (Lucatech bayisi) — Lucatech kapısının düzeni, kendi kurdu ve markasız arka planla.
  borutech: {
    backgroundImage: "/gate/borutech/bg.jpg",
    logoMark: "/gate/borutech/logo-mark.png",
    wordmark: "BÖRÜ TECH",
    accentColor: "#F58F1E",
    copy: {
      tr: {
        eyebrow: "Bayi Portalı",
        headline: "Börü Güvencesiyle.",
        tagline:
          "Şarj aletinden kabloya, kulaklıktan powerbank'e; güncel toptan fiyat listemiz bayilerimize özel.",
        chips: ["Şarj Aleti", "Kablo", "Kulaklık", "Powerbank", "Hoparlör", "Garantili"],
        helpLine: "Şifreniz yok mu? WhatsApp'tan bize yazın.",
      },
      en: {
        eyebrow: "Dealer Portal",
        headline: "Backed by Börü.",
        tagline:
          "From chargers to cables, earbuds to power banks; our current wholesale price list, exclusively for our dealers.",
        chips: ["Chargers", "Cables", "Earbuds", "Power Banks", "Speakers", "Warranty"],
        helpLine: "No password? Message us on WhatsApp.",
      },
      de: {
        eyebrow: "Händlerportal",
        headline: "Mit Börü-Garantie.",
        tagline:
          "Von Ladegeräten bis Kabeln, von Ohrhörern bis Powerbanks; unsere aktuelle Großhandelspreisliste, exklusiv für unsere Händler.",
        chips: ["Ladegeräte", "Kabel", "Ohrhörer", "Powerbanks", "Lautsprecher", "Garantie"],
        helpLine: "Kein Passwort? Schreiben Sie uns auf WhatsApp.",
      },
      ru: {
        eyebrow: "Портал дилера",
        headline: "С гарантией Börü.",
        tagline:
          "От зарядных устройств до кабелей, от наушников до пауэрбанков; наш актуальный оптовый прайс-лист только для наших дилеров.",
        chips: ["Зарядные устройства", "Кабели", "Наушники", "Пауэрбанки", "Колонки", "Гарантия"],
        helpLine: "Нет пароля? Напишите нам в WhatsApp.",
      },
    },
  },
  // 10 Eki 2026: Genax — müşterinin verdiği mor dalga animasyonu kapıda döngü video.
  genax: {
    backgroundImage: "/gate/genax/poster.jpg",
    backgroundVideo: { src: "/gate/genax/bg.mp4", mobileSrc: "/gate/genax/bg-mobile.mp4" },
    logoMark: "/gate/genax/logo-mark.png",
    wordmark: "GENAX",
    accentColor: "#C81E85",
    copy: {
      tr: {
        eyebrow: "Bayi Portalı",
        headline: "Feel The Power.",
        tagline:
          "Şarj cihazından kabloya, powerbank'ten kulaklığa; Genax ürünlerinin güncel toptan fiyat listesi bayilerimize özel.",
        chips: ["Şarj Cihazı", "Şarj Kablosu", "Powerbank", "Kulaklık", "Araç Şarjı", "Telefon Tutucu"],
        helpLine: "Şifreniz yok mu? WhatsApp'tan bize yazın.",
      },
      en: {
        eyebrow: "Dealer Portal",
        headline: "Feel The Power.",
        tagline:
          "From chargers to cables, power banks to earbuds; the current wholesale price list of Genax products, exclusively for our dealers.",
        chips: ["Chargers", "Cables", "Power Banks", "Earbuds", "Car Chargers", "Phone Holders"],
        helpLine: "No password? Message us on WhatsApp.",
      },
    },
  },
  demotoptan: {
    backgroundImage: "/gate/demotoptan/bg.jpg",
    logoMark: "/gate/demotoptan/logo-mark.png",
    wordmark: "DEMOTOPTAN",
    accentColor: "#3B82F6",
    copy: {
      tr: {
        eyebrow: "Bayi Portalı",
        headline: "Aksesuarda Toptan Güç.",
        tagline:
          "Baseus ve Toocki telefon aksesuarları; kablodan şarj aletine, kılıftan USB-C hub'a güncel toptan fiyat listesi bayilerimize özel.",
        chips: ["Şarj Kablosu", "Şarj Adaptörü", "USB-C Hub", "Telefon Kılıfı", "Araç İçi", "3 Fiyat Kademesi"],
        helpLine: "Şifreniz yok mu? WhatsApp'tan bize yazın.",
      },
      en: {
        eyebrow: "Dealer Portal",
        headline: "Wholesale Power in Accessories.",
        tagline:
          "Baseus and Toocki phone accessories; from cables to chargers, cases to USB-C hubs, the current wholesale price list exclusively for our dealers.",
        chips: ["Cables", "Chargers", "USB-C Hubs", "Phone Cases", "Car Accessories", "3 Price Tiers"],
        helpLine: "No password? Message us on WhatsApp.",
      },
      de: {
        eyebrow: "Händlerportal",
        headline: "Großhandelsstärke bei Zubehör.",
        tagline:
          "Baseus- und Toocki-Handyzubehör; von Kabeln bis Ladegeräten, von Hüllen bis USB-C-Hubs, die aktuelle Großhandelspreisliste exklusiv für unsere Händler.",
        chips: ["Kabel", "Ladegeräte", "USB-C-Hubs", "Handyhüllen", "Auto-Zubehör", "3 Preisstufen"],
        helpLine: "Kein Passwort? Schreiben Sie uns über WhatsApp.",
      },
      ru: {
        eyebrow: "Портал дилера",
        headline: "Оптовая сила в аксессуарах.",
        tagline:
          "Аксессуары Baseus и Toocki; от кабелей до зарядных устройств, от чехлов до USB-C хабов, актуальный оптовый прайс-лист только для наших дилеров.",
        chips: ["Кабели", "Зарядные устройства", "USB-C хабы", "Чехлы", "Автоаксессуары", "3 уровня цен"],
        helpLine: "Нет пароля? Напишите нам в WhatsApp.",
      },
    },
  },
  // 9 Eki 2026: QOOP (tekstil aksesuar toptancısı) — arka plan kendi ürün fotoğraflarından
  // (bere, şal, şapka mankenli çekimler), işaret logodaki Q harfi.
  qoop: {
    backgroundImage: "/gate/qoop/bg.jpg",
    logoMark: "/gate/qoop/logo-mark.png",
    wordmark: "QOOP",
    accentColor: "#B23A3A",
    copy: {
      tr: {
        eyebrow: "Bayi Portalı",
        headline: "Sezonun Şık Aksesuarları.",
        tagline:
          "Şaldan bereye, eldivenden fular ve şapkaya; QOOP yeni sezon koleksiyonunun güncel toptan fiyat listesi bayilerimize özel.",
        chips: ["Şal", "Bere", "Eldiven", "Fular", "Şapka", "Panço"],
        helpLine: "Şifreniz yok mu? WhatsApp'tan bize yazın.",
      },
      en: {
        eyebrow: "Dealer Portal",
        headline: "The Season's Finest Accessories.",
        tagline:
          "From shawls to beanies, gloves to scarves and hats; the current wholesale price list of the new QOOP collection, exclusively for our dealers.",
        chips: ["Shawls", "Beanies", "Gloves", "Scarves", "Hats", "Ponchos"],
        helpLine: "No password? Message us on WhatsApp.",
      },
      de: {
        eyebrow: "Händlerportal",
        headline: "Die schönsten Accessoires der Saison.",
        tagline:
          "Von Schals bis Mützen, von Handschuhen bis Tüchern und Hüten; die aktuelle Großhandelspreisliste der neuen QOOP-Kollektion, exklusiv für unsere Händler.",
        chips: ["Schals", "Mützen", "Handschuhe", "Tücher", "Hüte", "Ponchos"],
        helpLine: "Kein Passwort? Schreiben Sie uns über WhatsApp.",
      },
      ru: {
        eyebrow: "Портал дилера",
        headline: "Самые стильные аксессуары сезона.",
        tagline:
          "От шалей до шапок, от перчаток до платков и шляп; актуальный оптовый прайс-лист новой коллекции QOOP только для наших дилеров.",
        chips: ["Шали", "Шапки", "Перчатки", "Платки", "Шляпы", "Пончо"],
        helpLine: "Нет пароля? Напишите нам в WhatsApp.",
      },
    },
  },
  // Moda/tekstil demo vitrini (VELIRA, 28 Eyl 2026). Arka plan gerçek ürün
  // fotoğraflarından derlendi (~/setre-aktarim/velira).
  "demo-giyim": {
    backgroundImage: "/gate/demo-giyim/bg.jpg",
    logoMark: "/gate/demo-giyim/logo-mark.png",
    wordmark: "VELIRA",
    accentColor: "#C8A27A",
    copy: {
      tr: {
        eyebrow: "Bayi Portalı",
        headline: "Yeni Sezon, Toptan Fiyatla.",
        tagline:
          "Elbiseden ceket ve takıma, dış giyimden pantolona; VELIRA kadın giyim koleksiyonunun güncel toptan fiyat listesi bayilerimize özel.",
        chips: ["Elbise", "Ceket", "Takım", "Pantolon", "Dış Giyim", "3 Fiyat Kademesi"],
        helpLine: "Şifreniz yok mu? WhatsApp'tan bize yazın.",
      },
      en: {
        eyebrow: "Dealer Portal",
        headline: "New Season, Wholesale Prices.",
        tagline:
          "From dresses to jackets and sets, outerwear to trousers; the current wholesale price list of the VELIRA women's collection, exclusively for our dealers.",
        chips: ["Dresses", "Jackets", "Sets", "Trousers", "Outerwear", "3 Price Tiers"],
        helpLine: "No password? Message us on WhatsApp.",
      },
      de: {
        eyebrow: "Händlerportal",
        headline: "Neue Saison, Großhandelspreise.",
        tagline:
          "Von Kleidern bis Jacken und Sets, von Oberbekleidung bis Hosen; die aktuelle Großhandelspreisliste der VELIRA Damenkollektion, exklusiv für unsere Händler.",
        chips: ["Kleider", "Jacken", "Sets", "Hosen", "Oberbekleidung", "3 Preisstufen"],
        helpLine: "Kein Passwort? Schreiben Sie uns über WhatsApp.",
      },
      ru: {
        eyebrow: "Портал дилера",
        headline: "Новый сезон по оптовым ценам.",
        tagline:
          "От платьев до жакетов и костюмов, от верхней одежды до брюк; актуальный оптовый прайс-лист женской коллекции VELIRA только для наших дилеров.",
        chips: ["Платья", "Жакеты", "Костюмы", "Брюки", "Верхняя одежда", "3 уровня цен"],
        helpLine: "Нет пароля? Напишите нам в WhatsApp.",
      },
    },
  },
};

// 6 Eki 2026: Börü Tech adresi borutech → borutechtoptan oldu; aynı kapı iki adla da çalışır.
GATE_BRANDING.borutechtoptan = GATE_BRANDING.borutech;

export function getGateBranding(subdomain: string): GateBranding | null {
  return GATE_BRANDING[subdomain.toLowerCase()] ?? null;
}

export function getGateBrandingCopy(branding: GateBranding, locale: StorefrontLocale): GateBrandingCopy {
  return branding.copy[locale] ?? branding.copy.tr;
}
