// Pazarlama sitesi sabitleri (8 Eyl 2026 yeniden konumlandırma).
// Şirket künyesi (unvan, adres, vergi no) kullanıcıdan gelince doldurulacak;
// boş alanlar alt bilgide gösterilmez, uydurma bilgi yazılmaz.

export const SITE = {
  name: "eKatalox",
  domain: "ekatalox.com",
  url: "https://www.ekatalox.com",
  demoUrl: "https://tekelsiparis.ekatalox.com",
  phone: "+90 535 417 25 10",
  phoneHref: "tel:+905354172510",
  whatsappHref: "https://wa.me/905354172510",
  salesEmail: "satis@ekatalox.com",
  supportEmail: "destek@ekatalox.com",
  trialDays: 30,
  setupHours: 2,
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
  { href: "/musteriler", label: "Müşteriler" },
] as const;
