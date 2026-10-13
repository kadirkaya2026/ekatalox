// Beacons tarzı "etiket bulutu" paket kartları (taslak, 14 Eki 2026): iki
// kart hafif eğik, özellikler madde listesi değil yuvarlak rozetler.
import Link from "next/link";
import { formatTry, TOPTAN_PLANS } from "@/lib/billing/toptan-plans";
import { cn } from "@/lib/utils";

const FREE_TAGS = ["250 ürün", "2 fiyat listesi", "Şifreli bayi girişi", "WhatsApp'ta PDF fiş", "Kampanya kartları", "Tema düzenleyici", "Süre sınırı yok", "Kart istenmez"];
const PRO_TAGS = ["Ücretsizin tamamı", "5.000 ürün", "15 fiyat listesi", "Reklamsız katalog", "Bayilere anlık bildirim", "Arama ve sepet raporları", "Ödeme ve vade ayarları", "20.000 ziyaretçi / ay", "14 gün deneme"];

const ROTATIONS = [-2, 1.5, -1, 2, -1.5, 1, -2.5, 0.5, 1.8];

function TagCloud({ tags, dark }: { tags: string[]; dark?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {tags.map((t, i) => (
        <span
          key={t}
          style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]}deg)` }}
          className={cn(
            "inline-block rounded-full border px-3.5 py-2 text-sm font-semibold shadow-sm",
            dark ? "border-white/15 bg-white/10 text-white" : "border-brand-line bg-white text-brand-navy",
          )}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export function PlanTagCards() {
  const pro = TOPTAN_PLANS.find((p) => p.slug === "professional")!;
  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-8">
      <div className="rotate-[-3deg] rounded-[28px] border border-brand-line bg-brand-paper p-2 shadow-[0_40px_80px_-40px_rgba(18,40,74,0.35)] transition-transform hover:rotate-0">
        <div className="rounded-[22px] bg-[#E6EBF1] px-6 pb-4 pt-6 text-center">
          <span className="rounded-full bg-brand-dark px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Başlamak için</span>
          <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-navy">Sonsuza kadar ücretsiz</h3>
        </div>
        <div className="p-6">
          <TagCloud tags={FREE_TAGS} />
          <div className="mt-8 flex items-end justify-between">
            <div>
              <p className="text-5xl font-extrabold tracking-tight text-brand-navy">0 ₺</p>
              <p className="text-sm text-brand-muted">Kataloğunuzda küçük eKatalox reklamı görünür</p>
            </div>
            <Link href="/basvuru?plan=free" className="rounded-full bg-brand-dark px-5 py-3 text-sm font-semibold text-white hover:bg-brand-navy">
              Ücretsiz başla
            </Link>
          </div>
        </div>
      </div>

      <div className="rotate-[3deg] rounded-[28px] bg-brand-dark p-2 text-white shadow-[0_40px_80px_-40px_rgba(0,0,0,0.7)] transition-transform hover:rotate-0">
        <div className="rounded-[22px] bg-white/5 px-6 pb-4 pt-6 text-center">
          <span className="rounded-full bg-brand-neon px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-dark">En çok seçilen</span>
          <h3 className="mt-3 text-3xl font-extrabold tracking-tight">{pro.name}</h3>
        </div>
        <div className="p-6">
          <TagCloud tags={PRO_TAGS} dark />
          <div className="mt-8 flex items-end justify-between">
            <div>
              <p className="text-5xl font-extrabold tracking-tight">
                {formatTry(pro.yearlyPrice)} <span className="text-lg font-semibold text-white/60">/ yıl</span>
              </p>
              <p className="text-sm text-white/60">KDV hariç · sipariş komisyonu yok</p>
            </div>
            <Link href="/basvuru?plan=professional" className="rounded-full bg-brand-neon px-5 py-3 text-sm font-semibold text-brand-dark hover:bg-[#1ea952]">
              14 gün dene
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
