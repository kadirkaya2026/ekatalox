"use client";
import { useState } from "react";
import { PlanAudienceSelector, type PlanAudience } from "@/components/marketing/plan-audience";

import { PlanCards } from "@/components/marketing/plan-cards";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { formatTry, TOPTAN_PLANS } from "@/lib/billing/toptan-plans";
import { SITE } from "@/lib/marketing/site";
import { cn } from "@/lib/utils";

type Cell = string | boolean;
type Row = { label: string; cells: Cell[] };

const COMPARISON: Row[] = [
  { label: "Yıllık ücret (KDV hariç)", cells: TOPTAN_PLANS.map((plan) => formatTry(plan.yearlyPrice)) },
  { label: "eKatalox reklamları", cells: ["Görünür", "Yok", "Yok", "Yok"] },
  { label: "Ürün sayısı", cells: TOPTAN_PLANS.map((plan) => plan.productLimit.toLocaleString("tr-TR")) },
  { label: "Fiyat listesi (bayi / perakende / özel)", cells: TOPTAN_PLANS.map((plan) => plan.priceListLimit === null ? "Sınırsız" : String(plan.priceListLimit)) },
  { label: "Aylık ziyaretçi", cells: TOPTAN_PLANS.map((plan) => plan.visitorLimit.toLocaleString("tr-TR")) },
  { label: "Şifreli bayi girişi", cells: [true, true, true, true] },
  { label: "WhatsApp ile PDF sipariş fişi bağlantısı", cells: [true, true, true, true] },
  { label: "Siparişlerim ve yeni sipariş bildirimi (izinle)", cells: [true, true, true, true] },
  { label: "Minimum sepet ve zorunlu müşteri alanları", cells: [true, true, true, true] },
  { label: "WhatsApp sabit numara / alıcı seçimi", cells: [true, true, true, true] },
  { label: "Excel/CSV ürün ve toplu görsel yükleme", cells: [true, true, true, true] },
  { label: "Duyuru penceresi, çalışma saatleri, kapalı modu", cells: [true, true, true, true] },
  { label: "Koli / paket / varyant", cells: [true, true, true, true] },
  { label: "Banner, kampanya kartı, indirim, öne çıkanlar", cells: [true, true, true, true] },
  { label: "Tema, gelişmiş görünüm, ana sayfa düzenleyici", cells: [true, true, true, true] },
  { label: "Raporlar (arama, sepete ekleme, il–fiyat listesi)", cells: [false, true, true, true] },
  { label: "Kurumsal site ve Bayimiz ol formu", cells: [false, false, false, "Pakete dahil"] },
  { label: "İyzico/Paytr ile online ödeme", cells: [false, false, false, true] },
  { label: "Kendi alan adınız", cells: [false, false, false, true] },
  { label: "Bayilere bildirim gönderme", cells: [false, false, true, true] },
  { label: "Ödeme ve vade ayarları", cells: [false, false, true, true] },
  { label: "Satış ve kârlılık raporu", cells: [false, false, false, true] },
  { label: "Destek", cells: ["E-posta", "WhatsApp ve e-posta", "WhatsApp ve e-posta", "Öncelikli hat"] },
];

const FAQ = [
  { q: "Kurumsal site için ayrıca ücret öder miyim?", a: "Kurumsal tanıtım sitesi ve Bayimiz ol formu Kurumsal pakete dahildir; ayrıca kurumsal site paket ücreti yoktur. Alan adı satın alma/yenileme giderleri ve varsa özel hizmet kapsamı ayrıca netleştirilir." },
  { q: "Katalogdan ödeme alabilir miyim?", a: "İyzico/Paytr entegrasyonuyla kataloğunuzdan ödeme alın. Kurumsal pakette sağlayıcı başvurusu, entegrasyon kapsamı ve varsa ek kurulum hizmeti birlikte netleştirilir; sağlayıcı işlem ücretleri paket bedeline dahil değildir." },
  {
    q: "Ücretsiz planın süresi var mı?",
    a: "Süre sınırı yoktur. 250 ürün, 2 fiyat listesi ve aylık 1.000 ziyaretçi limitiyle kullanılır. Kart bilgisi istenmez; kataloğunuzda eKatalox tanıtımları görünür. Ücretli paketlerin 14 günlük denemesinden ayrıdır.",
  },
  {
    q: "14 günlük deneme bitince ne olur?",
    a: "Ücretli paket seçerek kayıt olduğunuzda o paketin özelliklerini 14 gün denersiniz. Ödeme yapılmazsa hesabınız Ücretsiz plana geçer; ücretsiz plan limitleri ve reklamları uygulanır. Devam etmek isterseniz ödeme süreci için temsilcimizle görüşebilirsiniz.",
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
    a: "eKatalox sipariş başına komisyon almaz. Online ödeme kullanırsanız İyzico/Paytr gibi sağlayıcıların işlem ücretleri kendi sözleşmenize göre ayrıca uygulanır.",
  },
  {
    q: "Ürün limitim dolarsa?",
    a: "Bir üst pakete geçersiniz ya da +1.000 ürün eklentisi alırsınız. Limit dolduğunda yeni ürün eklenemez ama mevcut katalog çalışmaya devam eder.",
  },
  {
    q: "Yıl bitince ne olur?",
    a: "Yenilemezseniz hesabınız Ücretsiz plana geçer. eKatalox reklamları geri gelir; 250 ürün, 2 fiyat listesi ve aylık 1.000 ziyaretçi limiti uygulanır.",
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

export function PricingContent({ initialAudience }: { initialAudience: PlanAudience }) {
  const [audience, setAudience] = useState(initialAudience);
  const market = audience === "market";
  const comparison = COMPARISON.map(row => ({ ...row, label: market ? ({
    "Şifreli bayi girişi": "Şifreli katalog erişimi (isteğe bağlı)",
    "Bayilere bildirim gönderme": "İzin veren müşterilere kampanya bildirimi",
    "Kurumsal site ve Bayimiz ol formu": "Kurumsal tanıtım sitesi",
  }[row.label] ?? row.label) : row.label }));
  if (market) comparison.push({ label: "Market işletmelerine QR magnet hediyesi", cells: [false, false, false, "200 adet"] });
  const faq = market ? [{ q: "200 adet magnet hangi pakette hediye?", a: "Market işletmelerine Kurumsal (Full) pakette 200 adet QR kodlu magnet hediye edilir. Müşterileriniz magneti okutarak kataloğunuza ulaşır ve sipariş oluşturur." }, ...FAQ.filter(item => !item.q.startsWith("Kurumsal site"))] : FAQ;
  return (
    <>
      <Section tone="white" className="border-b border-brand-line">
        <Container>
          <SectionHeading
            eyebrow="Fiyatlandırma"
            as="h1"
            title="İşletmenize uygun paketi seçin."
            lead="İlk kataloğunuz için süresiz ücretsiz plan; daha fazla ürün, rapor ve müşteri yönetimi için ücretli paketler. Ücretli paketleri 14 gün deneyin. Yıllık fiyatlar KDV hariçtir; sipariş komisyonu yoktur."
          />
          <div className="mt-10">
            <PlanAudienceSelector value={audience} onChange={setAudience} />
            <PlanCards audience={audience} />
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
                {comparison.map((row) => (
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
            {faq.map((item) => (
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
              Ürün sayınıza ve ihtiyaç duyduğunuz özelliklere göre seçim yapın. Ücretsiz başlayabilir veya paket seçimi için bize ulaşabilirsiniz.
            </p>
          </div>
          <div className="flex flex-col gap-4 lg:items-end">
            <ButtonLink href="/basvuru" tone="white" size="lg">
              Ücretsiz başla
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
