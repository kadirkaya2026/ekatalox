// Mağazanın yasal satıcı bilgileri ve sözleşme metinleri (0178, 17 Eki 2026).
// Online ödeme (sanal POS) açılmadan önce ZORUNLU: ödeme kuruluşları üye işyeri
// başvurusunda sitede satıcı künyesi, mesafeli satış sözleşmesi, ön bilgilendirme
// formu, iptal/iade koşulları ve gizlilik/KVKK metnini görmek ister; 6502 sayılı
// Kanun ve Mesafeli Sözleşmeler Yönetmeliği de tüketiciye satışta bunları şart koşar.
//
// Metinler mağazanın girdiği bilgilerle otomatik üretilen GENEL ŞABLONLARDIR;
// mağaza dilerse kendi metnini yazar (Satıcı Bilgileri hariç, o hep bilgilerden
// üretilir). Panelde avukat kontrolü önerisi gösterilir.

export type LegalEntityType = "sahis" | "sirket";

export const LEGAL_DOC_SLUGS = [
  "satici-bilgileri",
  "on-bilgilendirme-formu",
  "mesafeli-satis-sozlesmesi",
  "iptal-iade-kosullari",
  "gizlilik-ve-kvkk",
] as const;
export type LegalDocSlug = (typeof LEGAL_DOC_SLUGS)[number];

export const LEGAL_DOC_TITLES: Record<LegalDocSlug, string> = {
  "satici-bilgileri": "Satıcı Bilgileri",
  "on-bilgilendirme-formu": "Ön Bilgilendirme Formu",
  "mesafeli-satis-sozlesmesi": "Mesafeli Satış Sözleşmesi",
  "iptal-iade-kosullari": "İptal, İade ve Cayma Koşulları",
  "gizlilik-ve-kvkk": "Gizlilik ve KVKK Aydınlatma Metni",
};

/** Satıcı Bilgileri her zaman bilgilerden üretilir; diğerleri özelleştirilebilir. */
export const CUSTOMIZABLE_LEGAL_DOCS: LegalDocSlug[] = LEGAL_DOC_SLUGS.filter(
  (slug) => slug !== "satici-bilgileri",
);

export interface TenantLegalProfile {
  entity_type?: LegalEntityType | null;
  /** Şahıs: ad soyad; şirket: tam ticaret unvanı. */
  legal_name?: string | null;
  tax_office?: string | null;
  /** Şahıs: TC kimlik no (11) ya da VKN (10); şirket: VKN (10). */
  tax_number?: string | null;
  /** Şirkette zorunlu (16 hane). */
  mersis_no?: string | null;
  trade_registry_no?: string | null;
  address?: string | null;
  district?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  kep_address?: string | null;
  /** Siparişin en geç kaç günde teslim/kargo edileceği (yasal üst sınır 30). */
  delivery_days?: number | null;
  /** Kargo firması, ücret vb. serbest not. */
  shipping_note?: string | null;
  /** İade/cayma için ek mağaza koşulları. */
  return_note?: string | null;
  /** Mağaza "bilgiler doğru" onayını verdiği an (ISO). */
  confirmed_at?: string | null;
  documents?: Partial<Record<LegalDocSlug, { custom?: string | null }>> | null;
}

const digits = (value: string | null | undefined) => (value ?? "").replace(/\D/g, "");
const text = (value: string | null | undefined) => (value ?? "").trim();

export function readLegalProfile(raw: unknown): TenantLegalProfile {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as TenantLegalProfile) : {};
}

/** Eksik ya da hatalı zorunlu alanlar (kullanıcıya gösterilecek etiketlerle). */
export function getLegalProfileProblems(profile: TenantLegalProfile): string[] {
  const problems: string[] = [];
  const entity = profile.entity_type;
  if (entity !== "sahis" && entity !== "sirket") problems.push("İşletme türü (şahıs / şirket)");
  if (text(profile.legal_name).length < 3) {
    problems.push(entity === "sirket" ? "Ticaret unvanı" : "Ad soyad / işletme sahibi");
  }
  if (text(profile.tax_office).length < 2) problems.push("Vergi dairesi");
  const tax = digits(profile.tax_number);
  if (entity === "sirket" ? tax.length !== 10 : tax.length !== 10 && tax.length !== 11) {
    problems.push(
      entity === "sirket" ? "Vergi numarası (10 hane)" : "TC kimlik no (11 hane) ya da vergi no (10 hane)",
    );
  }
  if (entity === "sirket" && digits(profile.mersis_no).length !== 16) problems.push("MERSİS numarası (16 hane)");
  if (text(profile.address).length < 10) problems.push("Açık adres");
  if (text(profile.district).length < 2) problems.push("İlçe");
  if (text(profile.city).length < 2) problems.push("İl");
  if (digits(profile.phone).length < 10) problems.push("Telefon");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(profile.email))) problems.push("E-posta");
  const days = Number(profile.delivery_days);
  if (!Number.isInteger(days) || days < 1 || days > 30) problems.push("Teslimat süresi (1–30 gün)");
  if (!profile.confirmed_at) problems.push("Bilgilerin doğruluğunu onaylama");
  return problems;
}

export function isLegalProfileComplete(profile: TenantLegalProfile) {
  return getLegalProfileProblems(profile).length === 0;
}

// ─── Belgeler ──────────────────────────────────────────────────────────────

export interface LegalSection {
  heading?: string;
  paragraphs: string[];
}

export interface LegalDocument {
  slug: LegalDocSlug;
  title: string;
  sections: LegalSection[];
  /** Mağazanın kendi yazdığı metin mi? */
  isCustom: boolean;
}

interface DocContext {
  profile: TenantLegalProfile;
  storeName: string;
  storeUrl: string;
}

function sellerLines({ profile, storeName, storeUrl }: DocContext) {
  const company = profile.entity_type === "sirket";
  const lines = [
    `${company ? "Ticaret unvanı" : "Satıcı"}: ${text(profile.legal_name)}`,
    `Mağaza: ${storeName} (${storeUrl})`,
    `Adres: ${text(profile.address)}, ${text(profile.district)} / ${text(profile.city)}`,
    `Vergi dairesi / no: ${text(profile.tax_office)} / ${digits(profile.tax_number)}`,
  ];
  if (digits(profile.mersis_no)) lines.push(`MERSİS no: ${digits(profile.mersis_no)}`);
  if (text(profile.trade_registry_no)) lines.push(`Ticaret sicil no: ${text(profile.trade_registry_no)}`);
  lines.push(`Telefon: ${text(profile.phone)}`, `E-posta: ${text(profile.email)}`);
  if (text(profile.kep_address)) lines.push(`KEP adresi: ${text(profile.kep_address)}`);
  return lines;
}

const ORDER_DETAIL =
  "Sözleşme konusu ürünlerin cinsi, adedi, birim ve toplam satış fiyatı (vergiler dahil), teslimat ücreti ve ödeme şekli, sipariş verilmeden önce sepet ve sipariş özetinde gösterilir ve sipariş fişinde yer alır. Bu bilgiler sözleşmenin ayrılmaz parçasıdır.";

function deliveryParagraphs({ profile }: DocContext) {
  const out = [
    `Ürünler, siparişin onaylanmasından itibaren en geç ${Number(profile.delivery_days)} gün içinde Alıcı'nın bildirdiği adrese teslim edilir ya da kargoya verilir. Bu süre yasal üst sınır olan 30 günü aşamaz.`,
  ];
  if (text(profile.shipping_note)) out.push(text(profile.shipping_note));
  return out;
}

const WITHDRAWAL_PARAGRAPHS = [
  "Alıcı tüketici ise, ürünü teslim aldığı tarihten itibaren 14 (on dört) gün içinde herhangi bir gerekçe göstermeden ve cezai şart ödemeden sözleşmeden cayma hakkına sahiptir.",
  "Cayma hakkının kullanıldığına dair bildirimin bu süre içinde Satıcı'ya yazılı olarak ya da kalıcı veri saklayıcısıyla (e-posta vb.) yapılması yeterlidir. Ürün, bildirimden itibaren 10 gün içinde Satıcı'ya geri gönderilir.",
  "Satıcı, cayma bildiriminin kendisine ulaşmasından itibaren 14 gün içinde, teslimat masrafları dahil tahsil edilen tüm ödemeleri Alıcı'nın kullandığı ödeme aracına uygun şekilde iade eder.",
  "Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesindeki istisnalar (Alıcı'nın istekleri doğrultusunda kişiye özel hazırlanan ürünler, çabuk bozulabilen ürünler, teslimden sonra ambalajı açılmış ve sağlık/hijyen açısından iadesi uygun olmayan ürünler vb.) için cayma hakkı kullanılamaz.",
  "Alıcı'nın ürünü ticari veya mesleki amaçla (bayi, esnaf, tacir olarak) satın alması halinde 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve cayma hakkı hükümleri uygulanmaz; iade ve değişim taraflar arasındaki ticari teamül ve Satıcı'nın koşullarına göre yapılır.",
];

function buildTemplate(slug: LegalDocSlug, ctx: DocContext): LegalSection[] {
  const seller = sellerLines(ctx);
  switch (slug) {
    case "satici-bilgileri":
      return [
        {
          paragraphs: [
            "6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun kapsamında satıcıya ait tanıtıcı bilgiler:",
            ...seller,
          ],
        },
      ];
    case "on-bilgilendirme-formu":
      return [
        { heading: "1. Satıcı bilgileri", paragraphs: seller },
        { heading: "2. Sözleşme konusu ürünler ve fiyat", paragraphs: [ORDER_DETAIL] },
        {
          heading: "3. Ödeme",
          paragraphs: [
            "Ödeme, sepette seçilen yöntemle (nakit, havale/EFT, kapıda kart veya online kart ödemesi) yapılır. Online ödemelerde kart bilgileri Satıcı tarafından saklanmaz; işlem lisanslı ödeme kuruluşunun güvenli sayfasında gerçekleşir.",
          ],
        },
        { heading: "4. Teslimat", paragraphs: deliveryParagraphs(ctx) },
        { heading: "5. Cayma hakkı", paragraphs: WITHDRAWAL_PARAGRAPHS },
        {
          heading: "6. Şikâyet ve itirazlar",
          paragraphs: [
            "Alıcı, şikâyetlerini Satıcı'nın yukarıdaki iletişim bilgilerine iletebilir. Tüketici Alıcılar, Ticaret Bakanlığı'nca her yıl ilan edilen parasal sınırlar dahilinde yerleşim yerindeki Tüketici Hakem Heyeti'ne veya Tüketici Mahkemesi'ne başvurabilir.",
          ],
        },
        {
          heading: "7. Sözleşmenin saklanması",
          paragraphs: [
            "Bu form ve mesafeli satış sözleşmesi, siparişle birlikte Satıcı tarafından saklanır; sipariş fişi Alıcı'ya iletilir.",
          ],
        },
      ];
    case "mesafeli-satis-sozlesmesi":
      return [
        {
          heading: "1. Taraflar",
          paragraphs: [
            "SATICI:",
            ...seller,
            "ALICI: Siparişi veren ve sipariş formunda ad, telefon ve adres bilgilerini bildiren kişi veya işletme.",
          ],
        },
        {
          heading: "2. Konu",
          paragraphs: [
            `Bu sözleşmenin konusu, Alıcı'nın ${ctx.storeUrl} adresindeki mağazadan elektronik ortamda sipariş verdiği ürünlerin satışı ve teslimine ilişkin tarafların hak ve yükümlülükleridir.`,
            ORDER_DETAIL,
          ],
        },
        { heading: "3. Teslimat", paragraphs: deliveryParagraphs(ctx) },
        {
          heading: "4. Ödeme",
          paragraphs: [
            "Alıcı, sipariş özetinde gösterilen toplam bedeli seçtiği ödeme yöntemiyle öder. Online kart ödemesinde bankanın ödemeyi herhangi bir nedenle Satıcı'ya aktarmaması halinde Satıcı teslim yükümlülüğünden kurtulur.",
          ],
        },
        { heading: "5. Cayma hakkı", paragraphs: WITHDRAWAL_PARAGRAPHS },
        {
          heading: "6. Genel hükümler",
          paragraphs: [
            "Alıcı, sipariş vermeden önce Ön Bilgilendirme Formu'nu okuduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul eder.",
            "Satıcı, stok veya mücbir sebep nedeniyle siparişi karşılayamazsa Alıcı'yı bilgilendirir ve tahsil edilen bedeli 14 gün içinde iade eder.",
            "Ayıplı ürünlerde Alıcı'nın yasal hakları saklıdır.",
          ],
        },
        {
          heading: "7. Uyuşmazlıklar",
          paragraphs: [
            "Tüketici Alıcılar için Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri, ticari amaçla satın alan Alıcılar için Satıcı'nın bulunduğu yer mahkemeleri ve icra daireleri yetkilidir.",
            "Bu sözleşme, Alıcı'nın siparişi onaylamasıyla kurulmuş sayılır.",
          ],
        },
      ];
    case "iptal-iade-kosullari": {
      const sections: LegalSection[] = [
        {
          heading: "Sipariş iptali",
          paragraphs: [
            "Henüz hazırlanmamış veya kargoya verilmemiş siparişler, Satıcı'nın iletişim bilgileri üzerinden ücretsiz iptal edilebilir. Online ödenmiş siparişlerde bedel 14 gün içinde aynı ödeme aracına iade edilir.",
          ],
        },
        { heading: "Cayma hakkı ve iade", paragraphs: WITHDRAWAL_PARAGRAPHS },
        {
          heading: "Ayıplı veya hatalı ürün",
          paragraphs: [
            "Teslim alınan ürün ayıplı, hasarlı veya siparişten farklıysa Alıcı durumu teslimden itibaren makul süre içinde fotoğrafla birlikte Satıcı'ya bildirir; ürün değiştirilir, onarılır ya da bedeli iade edilir. Bu durumda iade kargo masrafı Satıcı'ya aittir.",
          ],
        },
        {
          heading: "İletişim",
          paragraphs: [`İade ve iptal talepleri için: ${text(ctx.profile.phone)} · ${text(ctx.profile.email)}`],
        },
      ];
      if (text(ctx.profile.return_note)) {
        sections.splice(3, 0, { heading: "Mağazaya özel koşullar", paragraphs: [text(ctx.profile.return_note)] });
      }
      return sections;
    }
    case "gizlilik-ve-kvkk":
      return [
        {
          heading: "Veri sorumlusu",
          paragraphs: [
            `6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu ${text(ctx.profile.legal_name)}'dır (${text(ctx.profile.address)}, ${text(ctx.profile.district)} / ${text(ctx.profile.city)}).`,
          ],
        },
        {
          heading: "İşlenen veriler ve amaçlar",
          paragraphs: [
            "Sipariş sırasında bildirdiğiniz ad soyad / işletme adı, telefon, adres, sipariş içeriği ve not bilgileri; siparişin alınması, hazırlanması, teslimi, faturalandırılması, iletişim ve yasal saklama yükümlülükleri amacıyla işlenir.",
            "Online ödemede kart bilgileriniz Satıcı tarafından görülmez ve saklanmaz; ödeme, lisanslı ödeme kuruluşu tarafından işlenir.",
          ],
        },
        {
          heading: "Hukuki sebep",
          paragraphs: [
            "Verileriniz KVKK m.5/2 (c) sözleşmenin kurulması ve ifası, (ç) hukuki yükümlülüğün yerine getirilmesi ve (f) meşru menfaat hukuki sebeplerine dayanılarak işlenir.",
          ],
        },
        {
          heading: "Aktarım",
          paragraphs: [
            "Verileriniz yalnız yukarıdaki amaçlarla sınırlı olarak kargo ve lojistik firmalarına, ödeme kuruluşlarına, muhasebe/e-fatura hizmet sağlayıcılarına, mağazanın altyapı hizmet sağlayıcısına (eKatalox, veri işleyen sıfatıyla) ve talep halinde yetkili kamu kurumlarına aktarılabilir.",
          ],
        },
        {
          heading: "Haklarınız",
          paragraphs: [
            "KVKK m.11 kapsamında verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini isteme, aktarıldığı üçüncü kişileri bilme ve itiraz etme haklarına sahipsiniz.",
            `Başvurularınızı ${text(ctx.profile.email)}${text(ctx.profile.kep_address) ? ` veya KEP adresi ${text(ctx.profile.kep_address)}` : ""} üzerinden yazılı olarak iletebilirsiniz; başvurular en geç 30 gün içinde yanıtlanır.`,
          ],
        },
        {
          heading: "Çerezler",
          paragraphs: [
            "Mağaza; sepetinizin saklanması, giriş şifresinin hatırlanması ve ziyaret istatistikleri için zorunlu ve analitik çerezler kullanır.",
          ],
        },
      ];
  }
}

function customSections(body: string): LegalSection[] {
  return [
    {
      paragraphs: body
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
    },
  ];
}

export function buildLegalDocument(
  slug: LegalDocSlug,
  profile: TenantLegalProfile,
  storeName: string,
  storeUrl: string,
): LegalDocument {
  const custom = slug === "satici-bilgileri" ? "" : text(profile.documents?.[slug]?.custom);
  return {
    slug,
    title: LEGAL_DOC_TITLES[slug],
    sections: custom ? customSections(custom) : buildTemplate(slug, { profile, storeName, storeUrl }),
    isCustom: Boolean(custom),
  };
}

/** Şablonun düz metin hali (panelde "kendi metnim" alanını başlatmak için). */
export function legalDocumentToText(doc: LegalDocument) {
  return doc.sections
    .map((section) => [section.heading, ...section.paragraphs].filter(Boolean).join("\n\n"))
    .join("\n\n");
}

export function isLegalDocSlug(value: string): value is LegalDocSlug {
  return (LEGAL_DOC_SLUGS as readonly string[]).includes(value);
}
