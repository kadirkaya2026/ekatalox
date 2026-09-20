import type { Metadata } from "next";
import { PlanCards } from "@/components/marketing/plan-cards";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { TOPTAN_PLANS } from "@/lib/billing/toptan-plans";
import { SITE } from "@/lib/marketing/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Fiyatlandırma — Ücretsiz plan ve yıllık paketler",
  description:
    "Toptancılar için online katalog: Ücretsiz plan süresiz, kart istenmez. Başlangıç 5.000 ₺, Profesyonel 10.000 ₺, Kurumsal 15.000 ₺ / yıl. Komisyon yok, KDV hariç.",
  alternates: { canonical: "/fiyatlandirma" },
  openGraph: {
    title: "Fiyatlandırma | eKatalox",
    description: "Ücretsiz başlayın; Başlangıç, Profesyonel ve Kurumsal paketler yıllık, komisyonsuz.",
    url: `${SITE.url}/fiyatlandirma`,
  },
};

type Cell = string | boolean;
type Row = { label: string; cells: [Cell, Cell, Cell, Cell] };

const COMPARISON: Row[] = [
  { label: "Yıllık ücret (KDV hariç)", cells: ["0 ₺", "5.000 ₺", "10.000 ₺", "15.000 ₺"] },
  { label: "eKatalox reklamları", cells: ["Görünür", "Yok", "Yok", "Yok"] },
  { label: "Ürün sayısı", cells: ["200", "1.000", "2.500", "5.000"] },
  { label: "Fiyat listesi (bayi / perakende / özel)", cells: ["1", "3", "Sınırsız", "Sınırsız"] },
  { label: "Aylık ziyaretçi", cells: ["1.000", "5.000", "20.000", "50.000"] },
  { label: "Şifreli bayi girişi", cells: [true, true, true, true] },
  { label: "WhatsApp'a PDF sipariş", cells: [true, true, true, true] },
  { label: "Koli / paket / varyant", cells: [true, true, true, true] },
  { label: "Banner, kampanya kartı, indirim, öne çıkanlar", cells: [true, true, true, true] },
  { label: "Tema, gelişmiş görünüm, ana sayfa düzenleyici", cells: [true, true, true, true] },
  { label: "Raporlar (ziyaret, ürün, il)", cells: [false, true, true, true] },
  { label: "Kendi alan adınız", cells: [false, false, false, true] },
  { label: "Bayilere bildirim gönderme", cells: [false, false, true, true] },
  { label: "Ödeme ve vade ayarları", cells: [false, false, true, true] },
  { label: "Satış ve kârlılık raporu", cells: [false, false, false, true] },
  { label: "Destek", cells: ["E-posta", "WhatsApp ve e-posta", "WhatsApp ve e-posta", "Öncelikli hat"] },
];

const FAQ = [
  {
    q: "Ücretsiz planın süresi var mı?",
    a: "Yok. Deneme değildir; kart bilgisi istemeyiz, hesap kapanmaz. 200 ürün ve 1 fiyat listesiyle istediğiniz kadar kullanırsınız. Karşılığında kataloğunuzda küçük eKatalox tanıtımları görünür.",
  },
  {
    q: "Reklamlar tam olarak nerede görünür?",
    a: "Katalog sayfasının altında ince bir bant, ürün listesinde arada bir tanıtım kartı, ürün detayında ve sipariş fişinin altında bir satır. Rakip ya da üçüncü taraf reklamı değildir, yalnız eKatalox'un kendi tanıtımıdır. Ücretli paketlerin hepsinde kalkar.",
  },
  {
    q: "Ücretli pakete nasıl geçerim, ödeme nasıl?",
    a: "Kayıt formunda ya da sonradan panelden paketi seçersiniz; temsilcimiz arar, havale/EFT ya da temsilci aracılığıyla kartla ödersiniz, faturanız kesilir. Ödeme sonrası paket aynı gün açılır, reklamlar kalkar. Ürünleriniz ve şifreleriniz olduğu gibi kalır.",
  },
  {
    q: "Fiyatlara KDV dahil mi, aylık ödeme var mı?",
    a: "Tutarlar KDV hariçtir, faturada KDV ayrıca gösterilir. Ücretli paketler yıllık peşin ödenir; aylık ödeme seçeneği yoktur.",
  },
  {
    q: "Komisyon ya da sipariş başına ücret var mı?",
    a: "Yok. Ne kadar sipariş alırsanız alın yalnız paket bedelini ödersiniz. Sipariş doğrudan sizin WhatsApp numaranıza gelir; aracı yok.",
  },
  {
    q: "Ürün limitim dolarsa?",
    a: "Bir üst pakete geçersiniz ya da +1.000 ürün eklentisi alırsınız. Limit dolduğunda yeni ürün eklenemez ama mevcut katalog çalışmaya devam eder.",
  },
  {
    q: "Yıl bitince ne olur?",
    a: "Yenilemezseniz hesabınız Ücretsiz plana düşer: kataloğunuz açık kalır, reklamlar geri gelir, limitler ücretsiz planın limitleri olur. Fazla ürünler silinmez, yalnız yayında ilk 200'ü görünür.",
  },
];

function CellValue({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-brand-green-soft text-brand-green" aria-label="Var">
        <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10.5l4 4 8-9" />
        </svg>
      </span>
    );
  }
  if (value === false) {
    return <span className="text-brand-muted" aria-label="Yok">—</span>;
  }
  return <span className="font-plex-mono text-sm tabular-nums">{value}</span>;
}

export default function Page() {
  return (
    <>
      <Section tone="white" className="border-b border-brand-line">
        <Container>
          <SectionHeading
            eyebrow="Fiyatlandırma"
            title="Ücretsiz başlayın. Büyüyünce paket seçin."
            lead="Komisyon yok, sipariş başına ücret yok. Ücretli paketler yıllık ve KDV hariçtir; hepsinde reklam görünmez."
          />
          <div className="mt-10">
            <PlanCards />
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading eyebrow="Karşılaştırma" title="Paketlerde ne var, ne yok" />
          <div className="mt-8 overflow-x-auto rounded-lg border border-brand-line bg-white">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-brand-line text-left">
                  <th className="px-4 py-3 font-semibold text-brand-muted">Özellik</th>
                  {TOPTAN_PLANS.map((plan) => (
                    <th key={plan.slug} className={cn("px-4 py-3 font-semibold text-brand-navy", plan.featured && "bg-brand-navy-soft/40")}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.label} className="border-b border-brand-line last:border-0">
                    <td className="px-4 py-3 text-brand-ink">{row.label}</td>
                    {row.cells.map((cell, i) => (
                      <td key={i} className={cn("px-4 py-3", TOPTAN_PLANS[i].featured && "bg-brand-navy-soft/40")}>
                        <CellValue value={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-brand-muted">
            Eklentiler (yıllık): +1.000 ürün 2.000 ₺ · +10.000 ziyaretçi 1.000 ₺ · kendi alan adı 2.000 ₺ · bildirim gönderme 1.500 ₺.
            Eklenti toplamı bir üst pakete yaklaşıyorsa üst paket daha uygundur; temsilciniz söyler.
          </p>
        </Container>
      </Section>

      <Section tone="white">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <SectionHeading eyebrow="Sık sorulanlar" title="Ödeme ve paketler hakkında" />
          <dl className="divide-y divide-brand-line">
            {FAQ.map((item) => (
              <div key={item.q} className="py-5 first:pt-0">
                <dt className="text-base font-semibold text-brand-navy">{item.q}</dt>
                <dd className="mt-2 text-base leading-relaxed text-brand-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      <Section tone="navy">
        <Container className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-4xl">
              Hangi paket size uyar, emin değil misiniz?
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/75">
              Ücretsiz kurun, kullanın; ürün sayınız ve bayi sayınız netleşince birlikte karar veririz.
            </p>
          </div>
          <div className="flex flex-col gap-4 lg:items-end">
            <ButtonLink href="/basvuru" tone="white" size="lg">
              Ücretsiz kataloğumu kur
            </ButtonLink>
            <a href={SITE.phoneHref} className="font-plex-mono text-lg text-white/85 hover:text-white">
              {SITE.phone}
            </a>
          </div>
        </Container>
      </Section>
    </>
  );
}
