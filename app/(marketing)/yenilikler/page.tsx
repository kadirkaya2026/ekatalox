import Link from 'next/link'
import { Container, Section, SectionHeading } from '@/components/marketing/ui'

const releases = [
  {
    version: 'v3.4', date: '12 Haziran 2025', badge: 'major',
    title: 'AI Akıllı Eşleştirme 2.0',
    summary: 'Excel sütun başlıklarını otomatik tanıma sistemini tamamen yeniledik. Artık Türkçe, İngilizce ve karışık dosyaları aynı doğrulukla işliyor.',
    items: [
      ['feature', 'Kolon başlıkları için %94 doğruluk oranı (önceki: %78)'],
      ['feature', '3 derinliğe kadar otomatik kategori ağacı oluşturma'],
      ['feature', 'Çoklu para birimi tek dosyadan otomatik standardizasyon'],
      ['improvement', 'İşlem süresi %40 hızlandı, ortalama 2.9 saniye'],
    ],
  },
  {
    version: 'v3.3', date: '28 Mayıs 2025', badge: 'feature',
    title: 'Drag & Drop Sıralama Paneli',
    summary: 'Yönetim panelinde ürünleri sürükle-bırak ile sıralayabilirsiniz. Vitrindeki görünüm sırası anında güncellenir.',
    items: [
      ['feature', 'Sürükle-bırak ile gerçek zamanlı sıralama'],
      ['feature', 'Toplu seçim ile yığın taşıma (Shift + Click)'],
      ['improvement', 'Vitrin önbelleği akıllı invalidation'],
    ],
  },
  {
    version: 'v3.2', date: '10 Mayıs 2025', badge: 'feature',
    title: '3:1 Akıllı Banner Kilidi',
    summary: 'Banner yüklemelerinde tasarım disiplini garantisi. Hiçbir layout bir daha kırılmayacak.',
    items: [
      ['feature', '1200x400 oranına otomatik akıllı crop'],
      ['feature', 'Edge case algılama (yüz, logo, metin alanı korunur)'],
      ['feature', 'CDN üzerinde WebP/AVIF optimize'],
    ],
  },
  {
    version: 'v3.1', date: '22 Nisan 2025', badge: 'improvement',
    title: 'B2B Sipariş Akışı İyileştirmeleri',
    summary: 'MOQ (minimum sipariş), KDV ve bayi onay süreçleri tek panelde toplandı.',
    items: [
      ['feature', 'MOQ kuralları ürün/kategori/müşteri bazlı'],
      ['feature', 'Otomatik KDV hesaplaması (8%, 18%, 20%)'],
      ['improvement', 'Sipariş özet PDF\'i yeniden tasarlandı'],
      ['fix', 'Bayi panelinde stok yenileme gecikmesi giderildi'],
    ],
  },
  {
    version: 'v3.0', date: '5 Nisan 2025', badge: 'major',
    title: 'eKatalox 3.0 — Yeni Nesil Vitrin',
    summary: 'Apple tarzı tamamen yeniden tasarlanmış vitrin teması, 4x daha hızlı render ve mobil first deneyim.',
    items: [
      ['feature', 'Yeni vitrin teması (Studio Dark + Studio Light)'],
      ['feature', 'Mobil sipariş akışı, tek el ile kullanım'],
      ['feature', 'Lazy image loading ve edge caching'],
      ['improvement', 'Sayfa açılış süresi 1.2sn → 0.3sn'],
    ],
  },
  {
    version: 'v2.8', date: '18 Mart 2025', badge: 'fix',
    title: 'Stabilite & Performans',
    summary: '12 farklı hata düzeltildi, yapay zeka eşleştirme performansı %22 artırıldı.',
    items: [
      ['fix', 'Türkçe karakter içeren Excel kolonlarındaki hata'],
      ['fix', 'Banner yüklemede nadir görülen 504 hatası'],
      ['improvement', 'Sunucu yanıt süresi %22 azaltıldı'],
    ],
  },
]

const badgeLabel: Record<string, string> = { major: 'Büyük sürüm', feature: 'Yeni özellik', improvement: 'İyileştirme', fix: 'Düzeltme' }
const itemLabel: Record<string, string> = { feature: 'Yeni', improvement: 'İyileştirme', fix: 'Düzeltme' }

export const metadata = { title: 'Yenilikler', description: 'eKatalox sürüm notları: yeni özellikler, iyileştirmeler ve düzeltmeler.' }

const Page = () => {
  return (
    <>
      <Section tone="white" className="pb-8 sm:pb-10">
        <Container>
          <SectionHeading eyebrow="Yenilikler" title="Sürüm notları" lead="Yeni özellikler, iyileştirmeler ve düzeltmeler. Geri bildiriminizle şekilleniyor." />
        </Container>
      </Section>
      <Section className="pt-0">
        <Container className="max-w-3xl">
          <div className="space-y-8">
            {releases.map((r) => (
              <article key={r.version} className="rounded-lg border border-brand-line bg-white p-6">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-plex-mono font-medium text-brand-navy">{r.version}</span>
                  <span className="text-brand-muted">{r.date}</span>
                  <span className="rounded-full bg-brand-navy-soft px-2.5 py-0.5 text-xs font-semibold text-brand-navy">{badgeLabel[r.badge] ?? r.badge}</span>
                </div>
                <h2 className="mt-3 text-xl font-semibold">{r.title}</h2>
                <p className="mt-2 text-brand-muted">{r.summary}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {r.items.map(([type, text], j) => (
                    <li key={j} className="flex gap-3">
                      <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-brand-green">{itemLabel[type] ?? type}</span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="mt-10 text-sm text-brand-muted">
            Bir özellik önermek ister misiniz? <Link href="/iletisim" className="font-semibold text-brand-green">Bize yazın.</Link>
          </p>
        </Container>
      </Section>
    </>
  )
}

export default Page
