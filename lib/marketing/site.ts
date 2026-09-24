// Pazarlama sitesi sabitleri (20 Eyl 2026 toptancı/freemium konumlandırması).
// Şirket künyesi (unvan, adres, vergi no) kullanıcıdan gelince doldurulacak;
// boş alanlar alt bilgide gösterilmez, uydurma bilgi yazılmaz.

export const SITE = {
  name: "eKatalox",
  domain: "ekatalox.com",
  url: "https://www.ekatalox.com",
  demoUrl: "https://demotoptan.ekatalox.com",
  demoPassword: "1111",
  // Şifre ekranını atlayıp demo kataloğu doğrudan açar (api/storefront/demo-enter).
  demoEnterUrl: "https://demotoptan.ekatalox.com/api/storefront/demo-enter",
  phone: "+90 535 417 25 10",
  phoneHref: "tel:+905354172510",
  whatsappHref: "https://wa.me/905354172510",
  salesEmail: "satis@ekatalox.com",
  supportEmail: "destek@ekatalox.com",
  setupMinutes: 5,
  company: {
    legalName: null as string | null,
    address: null as string | null,
    taxOffice: null as string | null,
    taxNumber: null as string | null,
  },
} as const;

export const NAV_LINKS = [
  { href: "/nasil-calisir", label: "Nasıl çalışır" },
  { href: "/ozellikler", label: "Özellikler" },
  { href: "/fiyatlandirma", label: "Fiyatlandırma" },
  { href: "/sss", label: "SSS" },
] as const;

export const SIGNUP_CTA = "Ücretsiz kur";

// Ana sayfadaki "siparişlerini eKatalox'tan alan firmalar" şeridi. YALNIZ
// gerçek, izin alınmış müşteriler (uydurma isim yok). Liste boşsa şerit
// gösterilmez.
export const CUSTOMER_NAMES: readonly string[] = ["Lucatech", "Genax"];
