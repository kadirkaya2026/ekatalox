'use client'

import { SiteNavbar, SiteFooter, PageHero } from '@/components/site-chrome'

const sections = [
  {
    title: '1. Taraflar ve Kabul',
    body: [
      'Bu Kullanım Şartları ("Şartlar"), eKatalox ("eKatalox", "biz") tarafından işletilen ekatalox.com web sitesi ve buna bağlı tüm alt alan adları, panel ve uygulamalar ("Hizmet") ile Hizmet\'i kullanan gerçek veya tüzel kişiler ("Kullanıcı", "siz") arasındaki ilişkiyi düzenler.',
      'Hesap oluşturarak veya Hizmet\'i herhangi bir şekilde kullanarak bu Şartları okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan edersiniz. Şartları kabul etmiyorsanız Hizmet\'i kullanmamalısınız.',
    ],
  },
  {
    title: '2. Hizmetin Tanımı',
    body: [
      'eKatalox; toptancı, imalatçı ve esnafların ürün ve fiyat listelerini dijital bir B2B vitrine dönüştürmesini, müşterilerinin bu vitrinden ürün seçip WhatsApp veya panel üzerinden sipariş oluşturmasını sağlayan bir SaaS (Hizmet Olarak Yazılım) platformudur.',
      'eKatalox, Kullanıcı ile Kullanıcının müşterileri arasındaki alım-satım ilişkisinin tarafı değildir; yalnızca bu ilişkinin dijital altyapısını sağlar. Satılan ürünlerin niteliği, fiyatı, stok durumu ve teslimatından münhasıran Kullanıcı sorumludur.',
    ],
  },
  {
    title: '3. Hesap Oluşturma ve Güvenlik',
    body: [
      'Hizmet\'i kullanabilmek için doğru, güncel ve eksiksiz bilgilerle bir hesap oluşturmanız gerekir. Hesap bilgilerinizin gizliliğinden ve hesabınız altında gerçekleşen tüm işlemlerden siz sorumlusunuz.',
      'Hesabınızla ilgili yetkisiz bir erişim veya güvenlik ihlali şüphesi durumunda derhal info@ekatalox.com adresinden bize bildirimde bulunmalısınız.',
    ],
  },
  {
    title: '4. Abonelik, Ücretlendirme ve İptal',
    body: [
      'Hizmet, /fiyatlandırma sayfasında ilan edilen paketler üzerinden yıllık veya aylık abonelik esasıyla sunulur. Fiyatlara KDV dahil değildir. Ücretler, seçilen paket ve ödeme periyoduna göre önceden tahsil edilir.',
      '14 günlük ücretsiz deneme süresi boyunca herhangi bir ücret talep edilmez. Deneme süresi sonunda bir paket seçilmezse hesap askıya alınabilir.',
      'Aboneliğinizi dilediğiniz zaman iptal edebilirsiniz. Yıllık ödemede iptal sonrası kalan dönem için ücret iadesi yapılmaz; aylık ödemede iptal sonrası kalan günler için ayrıca ücret tahsil edilmez. İptal talepleri info@ekatalox.com üzerinden iletilir.',
      'Kredi kartı ile taksitli ödemelerde, taksit sayısına bağlı banka vade farkı uygulanabilir; bu durum ödeme ekranında ayrıca belirtilir.',
    ],
  },
  {
    title: '5. Kullanıcı Yükümlülükleri',
    body: [
      'Hizmet\'i yalnızca yürürlükteki mevzuata uygun, yasal ürün ve hizmetlerin pazarlanması amacıyla kullanacağınızı kabul edersiniz.',
      'Hizmet üzerinden paylaştığınız ürün bilgisi, fiyat, görsel ve içeriklerin doğruluğundan, üçüncü kişilerin fikri mülkiyet haklarını ihlal etmediğinden ve yürürlükteki tüketici mevzuatına uygunluğundan tek başınıza sorumlusunuz.',
      'Hizmet\'in güvenliğini, bütünlüğünü veya işleyişini bozmaya yönelik faaliyetler (kötü amaçlı yazılım, aşırı otomatik istek, yetkisiz erişim denemesi vb.) kesinlikle yasaktır ve hesabın derhal askıya alınmasına neden olabilir.',
    ],
  },
  {
    title: '6. Fikri Mülkiyet',
    body: [
      'eKatalox markası, yazılımı, arayüz tasarımı ve platforma ait tüm teknik altyapı eKatalox\'a aittir. Bu Şartlar, size platform üzerinde sınırlı, devredilemez bir kullanım hakkı tanır; mülkiyet hakkı devretmez.',
      'Panel üzerinden yüklediğiniz ürün görselleri, metinler ve markanıza ait içerikler size aittir; bu içerikleri yalnızca Hizmet\'i sunmak amacıyla barındırma ve görüntüleme hakkını bize verirsiniz.',
    ],
  },
  {
    title: '7. Hizmetin Kullanılabilirliği',
    body: [
      'Hizmet\'in kesintisiz veya hatasız çalışacağını taahhüt etmemekle birlikte, yüksek erişilebilirlik hedefiyle işletilen bulut altyapısı kullanırız. Planlı bakım çalışmaları önceden duyurulmaya çalışılır.',
      'Mücbir sebepler (doğal afet, altyapı sağlayıcı kesintisi, siber saldırı vb.) nedeniyle oluşabilecek kesintilerden eKatalox sorumlu tutulamaz.',
    ],
  },
  {
    title: '8. Sorumluluğun Sınırlandırılması',
    body: [
      'eKatalox, Hizmet\'in kullanımından doğabilecek dolaylı, arızi veya sonuç niteliğindeki zararlardan (kâr kaybı, veri kaybı, iş kaybı dahil) yürürlükteki mevzuatın izin verdiği azami ölçüde sorumlu tutulamaz.',
      'eKatalox\'un toplam sorumluluğu, herhangi bir durumda, ilgili olayın gerçekleştiği tarihten önceki 12 ay içinde ödenen abonelik bedeliyle sınırlıdır.',
    ],
  },
  {
    title: '9. Fesih',
    body: [
      'Bu Şartların ihlali halinde, önceden bildirimde bulunarak veya bulunmaksızın hesabınızı askıya alma veya sonlandırma hakkımız saklıdır.',
      'Hesabınızı istediğiniz zaman kapatabilirsiniz; kapatma talebinden sonra verileriniz, yürürlükteki mevzuatın gerektirdiği süreler saklı kalmak kaydıyla makul bir süre içinde silinir.',
    ],
  },
  {
    title: '10. Değişiklikler',
    body: [
      'Bu Şartları zaman zaman güncelleyebiliriz. Önemli değişiklikler, panel içi bildirim veya kayıtlı e-posta adresinize gönderilecek bir bildirimle duyurulur. Güncellemeden sonra Hizmet\'i kullanmaya devam etmeniz, yeni şartları kabul ettiğiniz anlamına gelir.',
    ],
  },
  {
    title: '11. Uygulanacak Hukuk ve Uyuşmazlık Çözümü',
    body: [
      'Bu Şartlar Türkiye Cumhuriyeti kanunlarına tabidir. Bu Şartlardan doğabilecek uyuşmazlıklarda İstanbul (Merkez) Mahkemeleri ve İcra Daireleri yetkilidir.',
    ],
  },
  {
    title: '12. İletişim',
    body: [
      'Bu Şartlarla ilgili sorularınız için info@ekatalox.com adresinden bize ulaşabilirsiniz.',
    ],
  },
]

const Page = () => {
  return (
    <main className="relative min-h-screen bg-[#090d16] text-white overflow-hidden">
      <SiteNavbar />
      <PageHero
        tag="Yasal"
        title={<>Kullanım <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#10b981] to-[#00ff87]">Şartları</span></>}
        subtitle="eKatalox'u kullanmadan önce lütfen bu şartları dikkatlice okuyun. Son güncelleme: 2 Ağustos 2026."
      />

      <section className="px-6 pb-28">
        <div className="max-w-3xl mx-auto space-y-12">
          {sections.map((s) => (
            <div key={s.title} className="border-t border-white/10 pt-8 first:border-t-0 first:pt-0">
              <h2 className="text-xl md:text-2xl font-semibold text-white">{s.title}</h2>
              <div className="mt-4 space-y-3">
                {s.body.map((p, i) => (
                  <p key={i} className="text-sm md:text-base text-slate-400 leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

export default Page
