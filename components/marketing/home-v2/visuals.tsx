// Ana sayfa taslağı (Beacons tarzı, 14 Eki 2026) için CSS ile kurulmuş küçük
// ürün parçaları. Ekran görüntüsü değil; panelden/vitrinden kesilmiş gibi
// duran kompozisyonlar. Sunucu bileşenleri, veri sabit.
import { BellRing, Check, FileText, KeyRound, Lock, MessageCircle, Package, Pencil, Sparkles, Tags } from "lucide-react";
import { PhoneFrame } from "@/components/marketing/phone-frame";
import { WhatsAppGlyph } from "@/components/marketing/contact-dock";
import { cn } from "@/lib/utils";

/* ---------- Hero kolajı: iki telefon + yüzen rozetler + daireler ---------- */
export function HeroCollage() {
  const bubbles = [
    { icon: Lock, className: "left-[6%] top-[14%] size-20 bg-[#DDF6E7] text-[#157A5B] sm:size-24", delay: "0s" },
    { icon: Tags, className: "left-[18%] bottom-[12%] size-14 bg-[#EEE6FF] text-[#6D4AFF] sm:size-20", delay: "0.6s" },
    { icon: FileText, className: "right-[8%] top-[10%] size-16 bg-[#FFEBD6] text-[#D97706] sm:size-24", delay: "1.1s" },
    { icon: BellRing, className: "right-[20%] bottom-[10%] size-14 bg-[#DBEAFE] text-[#2563EB] sm:size-20", delay: "0.3s" },
    { icon: Package, className: "left-[36%] top-[6%] size-12 bg-[#FCE7F3] bg-opacity-90 text-[#DB2777] sm:size-16", delay: "0.9s" },
  ];
  return (
    <div className="relative mx-auto mt-14 h-[440px] w-full max-w-5xl overflow-hidden rounded-[32px] bg-[#EEF1F5] sm:h-[600px]">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35]" />
      {bubbles.map((b, i) => (
        <div
          key={i}
          aria-hidden
          style={{ animationDelay: b.delay }}
          className={cn(
            "absolute flex items-center justify-center rounded-full shadow-[0_18px_40px_-20px_rgba(18,40,74,0.35)] animate-float motion-reduce:animate-none",
            b.className,
          )}
        >
          <b.icon className="size-[40%]" />
        </div>
      ))}

      {/* Telefonlar */}
      <div className="absolute left-1/2 top-14 w-[140px] -translate-x-[112%] rotate-[-7deg] sm:top-16 sm:w-[190px]">
        <PhoneFrame src="/site/toptan-giris-v2.png" alt="Bayinin şifreyle giriş ekranı" className="w-full sm:w-full" />
      </div>
      <div className="absolute left-1/2 top-24 w-[140px] -translate-x-[-12%] rotate-[6deg] sm:top-28 sm:w-[190px]">
        <PhoneFrame src="/site/toptan-sepet-v2.png" alt="Bayinin sepeti ve WhatsApp düğmesi" className="w-full sm:w-full" />
      </div>

      {/* Yüzen rozetler */}
      <Pill className="left-[8%] top-[52%] sm:left-[10%]" tone="green">
        <Check className="size-3.5" /> Fiyat listesi: Bayi
      </Pill>
      <Pill className="right-[6%] top-[46%] sm:right-[9%]" tone="wa">
        <WhatsAppGlyph className="size-3.5" /> Sipariş fişi gönderildi
      </Pill>
      <Pill className="bottom-[6%] left-1/2 -translate-x-1/2" tone="dark">
        <Sparkles className="size-3.5" /> 1.481 ürün Excel&apos;den yüklendi
      </Pill>
    </div>
  );
}

function Pill({ children, className, tone }: { children: React.ReactNode; className?: string; tone: "green" | "wa" | "dark" }) {
  return (
    <div
      className={cn(
        "absolute z-10 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold shadow-[0_12px_30px_-12px_rgba(0,0,0,0.35)] sm:text-sm",
        tone === "green" && "bg-white text-brand-green",
        tone === "wa" && "bg-[#25D366] text-white",
        tone === "dark" && "bg-brand-dark text-white",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ---------- Özellik kartı zemini: pastel degrade + hafif eğik iç kart ---------- */
export function GradientPanel({
  from,
  to,
  children,
  tilt = -3,
  className,
}: {
  from: string;
  to: string;
  children: React.ReactNode;
  tilt?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-[28px] p-8 sm:min-h-[420px] sm:p-12", className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
    >
      <div style={{ transform: `rotate(${tilt}deg)` }} className="w-full max-w-[380px]">
        {children}
      </div>
    </div>
  );
}

/* ---------- 1. Şifre kapısı ---------- */
export function GateMock() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_30px_60px_-30px_rgba(18,40,74,0.45)]">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-dark text-sm font-bold text-white">DT</div>
        <div>
          <p className="text-sm font-semibold text-brand-navy">Demotoptan</p>
          <p className="text-xs text-brand-muted">demotoptan.ekatalox.com</p>
        </div>
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-green">Bayi girişi</p>
      <div className="mt-2 flex items-center justify-between rounded-xl border border-brand-line bg-brand-paper px-4 py-3">
        <span className="font-plex-mono text-lg tracking-[0.4em] text-brand-navy">1111</span>
        <Lock className="size-4 text-brand-muted" />
      </div>
      <div className="mt-3 rounded-xl bg-brand-neon py-3 text-center text-sm font-semibold text-brand-dark">Mağazaya gir</div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {["Bayi", "Perakende", "Özel müşteri"].map((t, i) => (
          <span key={t} className={cn("rounded-full px-2.5 py-1 text-xs font-medium", i === 0 ? "bg-brand-green text-white" : "bg-brand-paper text-brand-muted")}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- 2. WhatsApp mesajı + fiş ---------- */
export function WhatsAppMock() {
  return (
    <div className="relative">
      <div className="rounded-2xl rounded-tl-sm bg-white p-4 text-[13px] leading-relaxed text-brand-ink shadow-[0_30px_60px_-30px_rgba(0,0,0,0.4)]">
        <p>Merhaba, <b>Demotoptan</b> için sipariş oluşturmak istiyorum</p>
        <p className="mt-1">👤 Müşteri: Örnek Bayi</p>
        <p>📞 Telefon: 05•• ••• •• ••</p>
        <p>
          📄 Sipariş fişi: <span className="text-[#1d6fd3] underline">demotoptan.ekatalox.com/f/a3k9</span>
        </p>
        <p className="mt-2 text-right text-[10px] text-brand-muted">11:54 ✓✓</p>
      </div>
      <div className="absolute -bottom-10 -right-4 w-[220px] rotate-[5deg] rounded-xl bg-white p-3 text-[10px] shadow-[0_24px_50px_-24px_rgba(0,0,0,0.5)] sm:-right-10">
        <div className="flex items-center justify-between border-b border-brand-line pb-1.5">
          <span className="font-bold text-brand-navy">Sipariş Fişi</span>
          <span className="text-brand-muted">#100017</span>
        </div>
        {[
          ["BSU-001 · 20W Kablo", "12", "5.988 ₺"],
          ["BSU-003 · 27W Kablo", "6", "2.994 ₺"],
          ["BSU-007 · 100W Kablo", "4", "2.396 ₺"],
        ].map(([n, q, t]) => (
          <div key={n} className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-brand-line/60 py-1 text-brand-ink">
            <span className="truncate">{n}</span>
            <span className="tabular-nums text-brand-muted">{q}×</span>
            <span className="tabular-nums">{t}</span>
          </div>
        ))}
        <div className="flex justify-between pt-1.5 font-bold text-brand-navy">
          <span>Toplam</span>
          <span>11.378 ₺</span>
        </div>
      </div>
      <div className="absolute -left-3 -top-5 flex size-10 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg sm:-left-8">
        <MessageCircle className="size-5" />
      </div>
    </div>
  );
}

/* ---------- 3. Aynı ürün, üç fiyat ---------- */
export function PriceListMock() {
  const rows = [
    { label: "Bayi", code: "1111", price: "499 ₺", tone: "bg-brand-green text-white" },
    { label: "Perakende", code: "2222", price: "649 ₺", tone: "bg-white text-brand-navy" },
    { label: "Özel müşteri", code: "3333", price: "479 ₺", tone: "bg-white text-brand-navy" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_30px_60px_-30px_rgba(18,40,74,0.45)]">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-paper">
          <Package className="size-7 text-brand-navy" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-navy">Baseus Pudding USB-C Lightning 20W</p>
          <p className="text-xs text-brand-muted">BSU-001 · Koli: 12 adet</p>
        </div>
      </div>
      {rows.map((r) => (
        <div key={r.label} className={cn("flex items-center justify-between rounded-xl px-4 py-2.5 shadow-[0_12px_30px_-18px_rgba(18,40,74,0.4)]", r.tone)}>
          <span className="flex items-center gap-2 text-sm font-medium">
            <KeyRound className="size-4 opacity-70" />
            {r.label} <span className="font-plex-mono text-xs opacity-60">· {r.code}</span>
          </span>
          <span className="text-base font-bold tabular-nums">{r.price}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- 5. BizimHesap: onaylanan sipariş → taslak satış fişi ---------- */
export function BizimHesapMock() {
  return (
    <div className="relative">
      <div className="rounded-2xl bg-white p-4 shadow-[0_30px_60px_-30px_rgba(18,40,74,0.45)]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wide text-brand-muted">Sipariş #100277</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">Onaylandı</span>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          {[
            ["Cari", "Autovale Malatya"],
            ["Ürün eşleşmesi", "12 / 12 barkodla"],
            ["Depo", "Bahçelievler"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-lg bg-brand-paper px-3 py-2">
              <span className="text-brand-muted">{k}</span>
              <span className="font-semibold text-brand-navy">{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-brand-muted">
          <span className="h-px flex-1 bg-brand-line" />
          aktarılıyor
          <span className="h-px flex-1 bg-brand-line" />
        </div>
        <div className="mt-3 rounded-xl border border-brand-line p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-brand-navy">BizimHesap</span>
            <span className="rounded-full bg-brand-dark px-2 py-0.5 text-[11px] font-semibold text-white">Taslak satış fişi</span>
          </div>
          <p className="mt-1 text-xs text-brand-muted">Ürün, adet, birim fiyat ve KDV fişe yazıldı. Kaydedince stok düşer.</p>
        </div>
      </div>
      <div className="absolute -right-3 -top-5 flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-2 text-xs font-semibold text-white shadow-lg sm:-right-8">
        <Check className="size-3.5" /> İkinci kez yazılmadı
      </div>
    </div>
  );
}

/* ---------- 6. Bildirim: bayinin telefonuna kampanya ---------- */
export function NotifyMock() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-4 shadow-[0_30px_60px_-30px_rgba(18,40,74,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Panel · Bildirim gönder</p>
        <p className="mt-2 text-sm font-semibold text-brand-navy">Yeni sezon kabloları geldi, bayi fiyatı bu hafta %10 indirimli.</p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
          <span className="rounded-full bg-brand-green text-white px-2 py-0.5">Bayi listesi · 48 kişi</span>
          <span className="rounded-full bg-brand-paper text-brand-navy px-2 py-0.5">Kategori: Kablolar</span>
        </div>
      </div>
      <div className="ml-auto w-[88%] rounded-2xl border border-brand-line bg-[#F2F2F7] p-3 text-[13px] shadow-md">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-dark text-[10px] font-bold text-white">DT</span>
          <span className="font-semibold text-brand-navy">Demotoptan</span>
          <span className="ml-auto text-[11px] text-brand-muted">şimdi</span>
        </div>
        <p className="mt-1.5 text-brand-ink">Yeni sezon kabloları geldi, bayi fiyatı bu hafta %10 indirimli.</p>
      </div>
    </div>
  );
}

/* ---------- 7. Raporlar: en çok aranan ve sepete eklenen ---------- */
export function ReportMock() {
  const rows = [
    ["usb c 20w", 142, 88],
    ["lightning kablo", 97, 60],
    ["wifi adaptör", 64, 41],
    ["100w kablo", 51, 34],
  ] as const;
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_30px_60px_-30px_rgba(18,40,74,0.45)]">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wide text-brand-muted">En çok aranan · 30 gün</span>
        <span className="text-brand-muted">arama / sepet</span>
      </div>
      <div className="mt-3 space-y-2">
        {rows.map(([term, s, c]) => (
          <div key={term} className="text-sm">
            <div className="flex justify-between"><span className="font-medium text-brand-navy">{term}</span><span className="tabular-nums text-brand-muted">{s} / {c}</span></div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-brand-paper"><div className="h-full rounded-full bg-brand-green" style={{ width: `${Math.round((s / 142) * 100)}%` }} /></div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-brand-muted">Sonuçsuz arama: &quot;type c hub&quot; · 23 kez → kataloğa ekleyin</p>
    </div>
  );
}

/* ---------- 4. Panel: sipariş satırları ---------- */
export function OrdersMock() {
  const rows = [
    { no: "#100017", who: "Takı Funda", total: "11.378 ₺", status: "Yeni", tone: "bg-amber-100 text-amber-800" },
    { no: "#100016", who: "Angelovia", total: "4.760 ₺", status: "Onaylandı", tone: "bg-emerald-100 text-emerald-800" },
    { no: "#100015", who: "Nimet Takı", total: "8.215 ₺", status: "Teslim", tone: "bg-slate-200 text-slate-700" },
  ];
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_30px_60px_-30px_rgba(18,40,74,0.45)]">
        <div className="flex items-center justify-between border-b border-brand-line px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-brand-muted">
          <span>Siparişler</span>
          <span>Bugün · 3</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.no} className="flex items-center gap-3 border-b border-brand-line/70 px-4 py-3 text-sm last:border-b-0">
            <span className="w-16 tabular-nums text-brand-muted">{r.no}</span>
            <span className="flex-1 truncate font-medium text-brand-navy">{r.who}</span>
            <span className="tabular-nums text-brand-ink">{r.total}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", r.tone)}>{r.status}</span>
            {i === 0 ? (
              <span className="hidden gap-1 sm:flex">
                <span className="rounded-md bg-brand-neon px-2 py-1 text-[11px] font-semibold text-brand-dark">Onayla</span>
                <span className="inline-flex items-center gap-1 rounded-md border border-brand-line px-2 py-1 text-[11px] font-semibold text-brand-navy">
                  <Pencil className="size-3" /> Düzelt
                </span>
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="absolute -right-3 -top-6 flex items-center gap-2 rounded-full bg-brand-dark px-3 py-2 text-xs font-semibold text-white shadow-lg sm:-right-8">
        <BellRing className="size-3.5 text-brand-neon" /> Yeni sipariş geldi
      </div>
    </div>
  );
}
