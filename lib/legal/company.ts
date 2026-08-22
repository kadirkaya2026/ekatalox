// ŞİRKET KİMLİK BİLGİLERİ — DOLDURULMASI ZORUNLU
//
// Bu bilgilerin sitede yayınlanması mevzuat gereği ZORUNLU:
//
//   - 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun m.3:
//     hizmet sağlayıcı, sözleşme kurulmadan ÖNCE alıcının kolayca
//     ulaşabileceği şekilde ve GÜNCEL olarak tanıtıcı bilgilerini sunmak
//     zorunda.
//   - TTK m.39: tacirin işletmesiyle ilgili belgelerde (internet sitesi
//     dahil) ticaret unvanı, sicil numarası, merkezi ve MERSİS numarası
//     bulunmalı.
//
// Şu an sitede bunların HİÇBİRİ yok — sadece e-posta ve telefon var.
// Aşağıdaki alanları gerçek değerlerle doldur; boş bırakılanlar sayfada
// gösterilmiyor, dolayısıyla eksik doldurursan eksik yayınlanır.
//
// Şahıs işletmesiysen: legalName yerine "Ad Soyad" yaz; tradeRegistryNo ve
// mersisNo boş kalabilir ama vergi dairesi ve vergi/TC kimlik no gerekir.

export const COMPANY = {
  /** Tam ticaret unvanı — örn. "Örnek Yazılım Ticaret Limited Şirketi" */
  legalName: "",
  /** Markanın günlük kullanımdaki adı */
  brandName: "eKatalox",
  /** MERSİS numarası (16 hane) */
  mersisNo: "",
  /** Ticaret sicil numarası */
  tradeRegistryNo: "",
  /** Kayıtlı ticaret sicil müdürlüğü — örn. "İstanbul Ticaret Sicil Müdürlüğü" */
  tradeRegistryOffice: "",
  /** Vergi dairesi */
  taxOffice: "",
  /** Vergi kimlik numarası (şahıs işletmesinde TC kimlik no) */
  taxNumber: "",
  /** Merkez açık adresi */
  address: "",
  /** KEP adresi — KVKK başvurularında Tebliğ'in saydığı kanallardan biri */
  kepAddress: "",
  phone: "+90 535 417 25 10",
  email: "info@ekatalox.com",
  website: "https://www.ekatalox.com",
} as const;

/** Doldurulmuş kimlik alanlarını "Etiket: Değer" listesine çevirir. */
export function getCompanyIdentityLines(): string[] {
  const alanlar: Array<[string, string]> = [
    ["Ticaret unvanı", COMPANY.legalName],
    ["MERSİS numarası", COMPANY.mersisNo],
    ["Ticaret sicil numarası", COMPANY.tradeRegistryNo],
    ["Ticaret sicil müdürlüğü", COMPANY.tradeRegistryOffice],
    ["Vergi dairesi", COMPANY.taxOffice],
    ["Vergi kimlik numarası", COMPANY.taxNumber],
    ["Merkez adresi", COMPANY.address],
    ["KEP adresi", COMPANY.kepAddress],
    ["Telefon", COMPANY.phone],
    ["E-posta", COMPANY.email],
  ];

  return alanlar
    .filter(([, deger]) => deger.trim().length > 0)
    .map(([etiket, deger]) => `${etiket}: ${deger}`);
}

/** Kimlik bilgileri doldurulmadıysa true — sayfalarda uyarı göstermek için. */
export function isCompanyIdentityMissing(): boolean {
  return !COMPANY.legalName.trim() || !COMPANY.mersisNo.trim() || !COMPANY.address.trim();
}
