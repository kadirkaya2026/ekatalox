// Ana sayfa taslağı ek blokları (14 Eki 2026, B2B Wave toptancı sayfasından
// uyarlanan düzenler): biz yükleriz, önce/sonra, sonuç kartları, güven üçlüsü,
// bağlantı haritası. Sunucu bileşenleri; sayılar yalnız gerçek müşteri verisi.
import Link from "next/link";
import { AlertCircle, ArrowRight, Check, FileSpreadsheet, FileText, Globe, Headset, Languages, ShieldCheck, Sparkles } from "lucide-react";
import { WhatsAppGlyph } from "@/components/marketing/contact-dock";
import { SITE } from "@/lib/marketing/site";

// "Dosyanızı WhatsApp'tan gönderin": sohbet hazır mesajla açılır (kullanıcı isteği, 14 Eki 2026).
export const UPLOAD_WHATSAPP_HREF = `${SITE.whatsappHref}?text=${encodeURIComponent("Merhaba, Ürünlerimin Yüklenmesini istiyorum.")}`;
import { ButtonLink, Container } from "@/components/marketing/ui";
import { cn } from "@/lib/utils";
import { pastelStyle } from "@/components/marketing/home-v2/page-kit";

/* ---------- Ürünlerinizi biz yükleyelim (ücretsiz pakette bile) ---------- */
const INPUTS = [
  { icon: FileText, label: "PDF kataloğunuz" },
  { icon: Globe, label: "Web sitenizin adresi" },
  { icon: FileSpreadsheet, label: "Excel / fiyat listeniz" },
];
const WE_DO = ["Ürünleri, kodları ve fiyatları yükleriz", "Görselleri ürünlerle eşleştiririz", "Kategorileri ve fiyat listelerini kurarız", "Temayı, renkleri, logoyu ve şifre kapısını ayarlarız"];

export function WeUploadSection() {
  return (
    <section className="bg-white pb-20 sm:pb-28">
      <Container>
        <div className="grid items-center gap-8 overflow-hidden rounded-[32px] p-8 sm:p-12 lg:grid-cols-[1.1fr_1fr]" style={pastelStyle(0)}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-navy/60">Ücretsiz pakette bile</p>
            <h2 className="mt-3 text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-navy sm:text-5xl">
              Ürünlerinizi <span className="text-brand-green">biz yükleyelim.</span>
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-brand-navy/70">
              Elinizde ne varsa onu gönderin: PDF kataloğunuz, web sitenizin adresi ya da Excel listeniz. Ürünleri, görselleri, fiyat listelerini ve kataloğun tasarımını biz kurarız; siz hazır kataloğa şifreleri verirsiniz.
            </p>
            <ul className="mt-6 space-y-2.5">
              {WE_DO.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-brand-navy">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-dark text-white"><Check className="size-3" /></span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={UPLOAD_WHATSAPP_HREF} tone="navy" size="lg" external>
                <WhatsAppGlyph className="size-5 text-[#25D366]" /> Dosyanızı WhatsApp&apos;tan gönderin
              </ButtonLink>
              <ButtonLink href="/ozellikler/kurulum-destegi" tone="white" size="lg">Nasıl işliyor?</ButtonLink>
            </div>
          </div>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {INPUTS.map((i) => (
                <div key={i.label} className="flex flex-col items-center gap-2 rounded-2xl bg-white/85 p-4 text-center shadow-sm">
                  <i.icon className="size-7 text-brand-navy" />
                  <span className="text-sm font-semibold text-brand-navy">{i.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-navy/60">
              <span className="h-px w-10 bg-brand-navy/20" /> biz kurarız <span className="h-px w-10 bg-brand-navy/20" />
            </div>
            <div className="rounded-2xl bg-brand-dark p-5 text-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">firmaniz.ekatalox.com</span>
                <span className="rounded-full bg-brand-neon px-2.5 py-1 text-[11px] font-bold text-brand-dark">HAZIR</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Ürünler", "Görseller", "Fiyat listeleri", "Kategoriler", "Tema ve logo", "Şifre kapısı"].map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1.5 text-[11px] font-medium"><Check className="size-3 text-brand-neon" />{t}</span>
                ))}
              </div>
              <p className="mt-4 text-xs text-white/60">Genelde 1-3 iş günü · ücretsiz planda da geçerli · kart istenmez</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Önce / sonra (ikonlu iki kolon) ---------- */
export function BeforeAfter({ rows, title = "Operasyon yükünden kendi kendine işleyen düzene." }: { rows: Array<{ before: string; after: string }>; title?: string }) {
  return (
    <section className="bg-white pb-20 sm:pb-28">
      <Container>
        <h2 className="mx-auto max-w-3xl text-balance text-center text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-navy sm:text-5xl">{title}</h2>
        <div className="mx-auto mt-12 grid max-w-5xl gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-rose-200/70 bg-rose-50/60 p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">eKatalox&apos;tan önce</p>
            <ul className="mt-5 space-y-4">
              {rows.map((r) => (
                <li key={r.before} className="flex gap-3 text-[15px] leading-relaxed text-brand-navy/80">
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-500" />
                  {r.before}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[28px] border border-emerald-200/70 bg-emerald-50/60 p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-green">eKatalox ile</p>
            <ul className="mt-5 space-y-4">
              {rows.map((r) => (
                <li key={r.after} className="flex gap-3 text-[15px] font-medium leading-relaxed text-brand-navy">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-green text-white"><Check className="size-3" /></span>
                  {r.after}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Sonuç kartları (yalnız izinli, gerçek rakamlar) ---------- */
export function ResultCards({ items }: { items: Array<{ company: string; stat: string; statLabel: string; body: string; href?: string; index: number }> }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {items.map((it) => (
        <div key={it.company} className="flex flex-col rounded-[28px] p-7 sm:p-9" style={pastelStyle(it.index)}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-navy/60">{it.company}</p>
          <p className="mt-3 text-5xl font-extrabold leading-none tracking-[-0.04em] text-brand-navy sm:text-6xl">{it.stat}</p>
          <p className="mt-2 text-base font-semibold text-brand-navy">{it.statLabel}</p>
          <p className="mt-4 flex-1 leading-relaxed text-brand-navy/70">{it.body}</p>
          {it.href ? (
            <Link href={it.href} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-navy hover:underline">
              Nasıl kullanıyorlar <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ---------- Güven üçlüsü ---------- */
const TRUST = [
  { icon: ShieldCheck, title: "Fiyatlarınız şifrenin arkasında", body: "Her bayi grubu ayrı şifre, istenirse IP engelleme ve kişiye özel giriş. Açık kurumsal sayfalarda bayi fiyatı yayınlanmaz." },
  { icon: Languages, title: "Türkçe, İngilizce, Almanca, Rusça", body: "Yabancı bayileriniz kataloğu kendi dilinde açar; ürün adları ve düğmeler çevrilir, fiyat listeleri aynı kalır." },
  { icon: Headset, title: "WhatsApp'tan kurulum desteği", body: "Listenizi gönderirsiniz, kataloğu biz kurarız. Sorunuz olduğunda aynı ekip cevap verir; aracı yok, çağrı merkezi yok." },
];
export function TrustTrio() {
  return (
    <section className="bg-white pb-20 sm:pb-28">
      <Container>
        <h2 className="mx-auto max-w-3xl text-balance text-center text-3xl font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-navy sm:text-5xl">Kendiniz kuracak kadar basit, yalnız kalmayacak kadar destekli.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TRUST.map((t, i) => (
            <div key={t.title} className="rounded-[24px] border border-brand-line bg-white p-6 shadow-[0_24px_50px_-36px_rgba(18,40,74,0.4)]">
              <span className="flex size-12 items-center justify-center rounded-2xl" style={pastelStyle(i)}><t.icon className="size-6 text-brand-navy" /></span>
              <h3 className="mt-4 text-xl font-extrabold tracking-[-0.02em] text-brand-navy">{t.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-brand-muted">{t.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Bağlantı haritası ---------- */
const LINKS: Array<{ label: string; sub: string; href?: string }> = [
  { label: "BizimHesap", sub: "Onaylanan sipariş → satış fişi", href: "/ozellikler/bizimhesap-entegrasyonu" },
  { label: "WhatsApp", sub: "Sipariş fişi ve kampanya mesajı", href: "/ozellikler/whatsapp-siparis" },
  { label: "Excel / CSV", sub: "Ürün, fiyat ve stok yükleme", href: "/ozellikler/toplu-urun-yukleme" },
  { label: "iyzico / PayTR", sub: "Katalogdan kartla ödeme", href: "/ozellikler/online-odeme" },
  { label: "Anlık bildirim", sub: "Bayinin telefonuna kampanya", href: "/ozellikler/kampanya-bildirimleri" },
  { label: "Google ve ChatGPT", sub: "llms.txt ve işletme kartı", href: "/ozellikler/kurumsal-site" },
];
export function IntegrationMap() {
  return (
    <section className="bg-white pb-20 sm:pb-28">
      <Container>
        <div className="rounded-[32px] bg-brand-paper p-8 sm:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-navy sm:text-5xl">Elle veri taşımak yok; kullandığınız araçlarla <span className="text-brand-green">bağlı çalışır.</span></h2>
          </div>
          <div className="relative mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3">
            {LINKS.slice(0, 3).map((l, i) => <LinkChip key={l.label} {...l} index={i} />)}
            <div className="col-span-2 flex items-center justify-center py-2 sm:col-span-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-6 py-3 text-base font-bold text-white shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]">
                <Sparkles className="size-4 text-brand-neon" /> eKatalox kataloğunuz
              </div>
            </div>
            {LINKS.slice(3).map((l, i) => <LinkChip key={l.label} {...l} index={i + 3} />)}
          </div>
        </div>
      </Container>
    </section>
  );
}
function LinkChip({ label, sub, href, index }: { label: string; sub: string; href?: string; index: number }) {
  const cls = cn("flex flex-col rounded-2xl p-4 transition-transform", href && "hover:-translate-y-0.5");
  const inner = (
    <>
      <span className="text-base font-extrabold tracking-[-0.01em] text-brand-navy">{label}</span>
      <span className="mt-1 text-xs text-brand-navy/70">{sub}</span>
    </>
  );
  return href ? (
    <Link href={href} className={cls} style={pastelStyle(index)}>{inner}</Link>
  ) : (
    <div className={cls} style={pastelStyle(index)}>{inner}</div>
  );
}
