'use client'

import { SiteNavbar, SiteFooter, PageHero } from '@/components/site-chrome'
// Sayfadaki "Son güncelleme" tarihi ile kabul kaydına yazılan sürüm tek
// kaynaktan gelsin diye (bkz. terms_acceptances.terms_version).
import { TERMS_VERSION_LABEL } from '@/lib/legal/terms'
import { getCompanyIdentityLines } from '@/lib/legal/company'

// 6563 sayılı Kanun m.3 ve TTK m.39 tanıtıcı bilgileri. lib/legal/company.ts
// doldurulmadıysa boş dizi döner ve bölüm gösterilmez.
const identityLines = getCompanyIdentityLines()

const sections = [
  {
    title: '1. Taraflar ve Kabul',
    body: [
      'Bu Kullanım Şartları ("Şartlar"), eKatalox ("eKatalox", "biz") tarafından işletilen ekatalox.com web sitesi ve buna bağlı tüm alt alan adları, panel ve uygulamalar ("Hizmet") ile Hizmet\'i kullanan gerçek veya tüzel kişiler ("Kullanıcı", "siz") arasındaki ilişkiyi düzenler.',
      'Kayıt formundaki onay kutusunu işaretleyerek veya Hizmet\'i herhangi bir şekilde kullanarak bu Şartları okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan edersiniz. Şartları kabul etmiyorsanız Hizmet\'i kullanmamalısınız.',
      ...(identityLines.length
        ? ['Hizmet sağlayıcının 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve Türk Ticaret Kanunu m. 39 kapsamındaki tanıtıcı bilgileri aşağıdadır:']
        : []),
    ],
    list: identityLines.length ? identityLines : undefined,
  },
  {
    // 6563 sayılı Kanun m.3, hizmet sağlayıcıya sözleşme kurulmadan ÖNCE
    // bu üç başlıkta bilgi verme yükümlülüğü getiriyor: teknik adımlar,
    // metnin saklanıp saklanmayacağı, veri girişi hatalarının düzeltilmesi.
    title: '2. Sözleşmenin Kurulması, Saklanması ve Hataların Düzeltilmesi',
    body: [
      'Sözleşme, ekatalox.com üzerindeki kayıt formunun doldurulması, bu Şartların onay kutusu işaretlenerek kabul edilmesi ve başvurunun tarafımızca onaylanarak hesabın açılması adımlarıyla elektronik ortamda kurulur.',
      'Bu Şartların kabul edildiği tarih, saat, kabul edilen metin sürümü ve bağlantı bilgileri tarafımızca kayıt altına alınır ve saklanır. Yürürlükteki Şartların güncel metnine her zaman ekatalox.com/kullanim-sartlari adresinden erişebilir, dilerseniz çıktı alabilir veya kaydedebilirsiniz.',
      'Kayıt formunda hatalı veri girişi yaptığınızı fark ederseniz, formu göndermeden önce ilgili alanı doğrudan düzeltebilirsiniz. Gönderim sonrasında fark edilen hatalar için info@ekatalox.com adresine yazmanız yeterlidir; düzeltme talebiniz gecikmeksizin karşılanır.',
    ],
  },
  {
    title: '3. Hizmetin Tanımı',
    body: [
      'eKatalox; toptancı, imalatçı ve esnafların ürün ve fiyat listelerini dijital bir B2B vitrine dönüştürmesini, müşterilerinin bu vitrinden ürün seçip WhatsApp veya panel üzerinden sipariş oluşturmasını sağlayan bir SaaS (Hizmet Olarak Yazılım) platformudur.',
      'eKatalox, Kullanıcı ile Kullanıcının müşterileri arasındaki alım-satım ilişkisinin tarafı değildir; yalnızca bu ilişkinin dijital altyapısını sağlar. Satılan ürünlerin niteliği, fiyatı, stok durumu ve teslimatından münhasıran Kullanıcı sorumludur.',
    ],
  },
  {
    title: '4. Hesap Oluşturma ve Güvenlik',
    body: [
      'Hizmet\'i kullanabilmek için doğru, güncel ve eksiksiz bilgilerle bir hesap oluşturmanız gerekir. Hesap bilgilerinizin gizliliğinden ve hesabınız altında gerçekleşen tüm işlemlerden siz sorumlusunuz.',
      'Hesabınızla ilgili yetkisiz bir erişim veya güvenlik ihlali şüphesi durumunda derhal info@ekatalox.com adresinden bize bildirimde bulunmalısınız.',
    ],
  },
  {
    title: '5. Abonelik, Ücretlendirme ve İptal',
    body: [
      'Hizmet, /fiyatlandırma sayfasında ilan edilen paketler üzerinden yıllık veya aylık abonelik esasıyla sunulur. Fiyatlara KDV dahil değildir. Ücretler, seçilen paket ve ödeme periyoduna göre önceden tahsil edilir.',
      '14 günlük ücretsiz deneme süresi boyunca herhangi bir ücret talep edilmez. Deneme süresi sonunda bir paket seçilmezse hesap askıya alınabilir.',
      'Aboneliğinizi dilediğiniz zaman iptal edebilirsiniz. Yıllık ödemede iptal sonrası kalan dönem için ücret iadesi yapılmaz; aylık ödemede iptal sonrası kalan günler için ayrıca ücret tahsil edilmez. İptal talepleri info@ekatalox.com üzerinden iletilir.',
      'Kredi kartı ile taksitli ödemelerde, taksit sayısına bağlı banka vade farkı uygulanabilir; bu durum ödeme ekranında ayrıca belirtilir.',
    ],
  },
  {
    title: '6. Kullanıcı Yükümlülükleri',
    body: [
      'Hizmet\'i yalnızca yürürlükteki mevzuata uygun, yasal ürün ve hizmetlerin pazarlanması amacıyla kullanacağınızı kabul edersiniz.',
      'Hizmet üzerinden paylaştığınız ürün bilgisi, fiyat, görsel ve içeriklerin doğruluğundan, üçüncü kişilerin fikri mülkiyet haklarını ihlal etmediğinden ve yürürlükteki tüketici mevzuatına uygunluğundan tek başınıza sorumlusunuz.',
      'Hizmet\'in güvenliğini, bütünlüğünü veya işleyişini bozmaya yönelik faaliyetler (kötü amaçlı yazılım, aşırı otomatik istek, yetkisiz erişim denemesi vb.) kesinlikle yasaktır ve hesabın derhal askıya alınmasına neden olabilir.',
    ],
  },
  {
    title: '7. Fikri Mülkiyet',
    body: [
      'eKatalox markası, yazılımı, arayüz tasarımı ve platforma ait tüm teknik altyapı eKatalox\'a aittir. Bu Şartlar, size platform üzerinde sınırlı, devredilemez bir kullanım hakkı tanır; mülkiyet hakkı devretmez.',
      'Panel üzerinden yüklediğiniz ürün görselleri, metinler ve markanıza ait içerikler size aittir; bu içerikleri yalnızca Hizmet\'i sunmak amacıyla barındırma ve görüntüleme hakkını bize verirsiniz.',
    ],
  },
  {
    title: '8. Hizmetin Kullanılabilirliği',
    body: [
      'Hizmet\'in kesintisiz veya hatasız çalışacağını taahhüt etmemekle birlikte, yüksek erişilebilirlik hedefiyle işletilen bulut altyapısı kullanırız. Planlı bakım çalışmaları önceden duyurulmaya çalışılır.',
      'Mücbir sebepler (doğal afet, altyapı sağlayıcı kesintisi, siber saldırı vb.) nedeniyle oluşabilecek kesintilerden eKatalox sorumlu tutulamaz.',
    ],
  },
  {
    title: '9. Sorumluluğun Sınırlandırılması',
    body: [
      'eKatalox, Hizmet\'in kullanımından doğabilecek dolaylı, arızi veya sonuç niteliğindeki zararlardan (kâr kaybı, veri kaybı, iş kaybı dahil) yürürlükteki mevzuatın izin verdiği azami ölçüde sorumlu tutulamaz.',
      'eKatalox\'un toplam sorumluluğu, herhangi bir durumda, ilgili olayın gerçekleştiği tarihten önceki 12 ay içinde ödenen abonelik bedeliyle sınırlıdır.',
    ],
  },
  {
    title: '10. Fesih',
    body: [
      'Bu Şartların ihlali halinde, önceden bildirimde bulunarak veya bulunmaksızın hesabınızı askıya alma veya sonlandırma hakkımız saklıdır.',
      'Hesabınızı istediğiniz zaman kapatabilirsiniz; kapatma talebinden sonra verileriniz, yürürlükteki mevzuatın gerektirdiği süreler saklı kalmak kaydıyla makul bir süre içinde silinir.',
    ],
  },
  {
    title: '11. Değişiklikler',
    body: [
      'Bu Şartları zaman zaman güncelleyebiliriz. Önemli değişiklikler, panel içi bildirim veya kayıtlı e-posta adresinize gönderilecek bir bildirimle duyurulur. Güncellemeden sonra Hizmet\'i kullanmaya devam etmeniz, yeni şartları kabul ettiğiniz anlamına gelir.',
    ],
  },
  {
    // KVKK m.12/2: veri sorumlusu, veri işleyenle birlikte müştereken
    // sorumlu. Bu ilişkinin sözleşmede tanımlanması gerekiyordu; metinde
    // hiç yoktu.
    title: '12. Kişisel Verilerin Korunması ve Veri İşleyen Sıfatı',
    body: [
      'Kullanıcının vitrini üzerinden toplanan müşteri verileri (ad, telefon, adres, sipariş içeriği vb.) bakımından KVKK anlamında VERİ SORUMLUSU Kullanıcıdır; eKatalox bu veriler bakımından yalnızca VERİ İŞLEYEN sıfatıyla, Kullanıcının talimatları doğrultusunda ve Hizmet\'in sunulması amacıyla hareket eder.',
      'Kullanıcı; kendi müşterilerine karşı aydınlatma yükümlülüğünü yerine getirmek, gereken hallerde açık rıza almak, VERBİS kaydı gerekiyorsa yaptırmak ve ilgili kişi başvurularını yanıtlamakla yükümlüdür. eKatalox bu başvuruların yanıtlanmasında Kullanıcıya makul teknik desteği sağlar.',
      'eKatalox, Hizmet\'i sunmak için alt veri işleyen (bulut altyapı, e-posta gönderimi, ödeme kuruluşu vb.) kullanır. Güncel alt yüklenici listesi Gizlilik ve KVKK metninde yayımlanır; listede yapılacak değişiklikler aynı metin üzerinden duyurulur.',
      'eKatalox, kendi sistemlerinde bir kişisel veri ihlali tespit ederse Kullanıcıya gecikmeksizin ve her hâlde 48 saat içinde bildirimde bulunur. Kurul\'a ve ilgili kişilere bildirim yükümlülüğü, veri sorumlusu sıfatıyla Kullanıcıya aittir.',
      'Abonelik sona erdiğinde Kullanıcı verileri 30 gün süreyle dışa aktarılabilir durumda tutulur; bu sürenin sonunda, mevzuatın öngördüğü saklama yükümlülükleri saklı kalmak kaydıyla silinir, yok edilir veya anonim hâle getirilir.',
    ],
  },
  {
    // Alkollü içki ve tütün mamullerinin internet üzerinden nihai
    // tüketiciye satışı yasak; ihlalde 5651 sayılı Kanun uyarınca ERİŞİM
    // ENGELLEME kararı verilebiliyor. Bu, eKatalox'un kendi alan adını da
    // riske attığı için sözleşmede açıkça düzenlenmesi şart.
    title: '13. Düzenlemeye Tabi Ürünler (Alkol, Tütün ve Benzeri)',
    body: [
      'Alkollü içki ve tütün mamulleri başta olmak üzere satışı özel mevzuata tabi ürünlerde; satış yetki belgesi (TAPDK/Tarım ve Orman Bakanlığı belgesi) bulundurma, yaş doğrulaması yapma, reklam ve tanıtım yasaklarına uyma ve internet üzerinden nihai tüketiciye satış yasağına riayet etme yükümlülüğü münhasıran Kullanıcıya aittir.',
      'Kullanıcı, vitrinini bu ürünlerin internet üzerinden satışı amacıyla KULLANMAYACAĞINI; vitrinin yalnızca ürün tanıtımı, stok bilgisi ve mağazadan elden teslim alınacak siparişlerin iletilmesi amacıyla kullanılacağını kabul ve taahhüt eder.',
      'Bu yükümlülüklerin ihlali hâlinde doğacak idari para cezaları, erişim engelleme kararları ve üçüncü kişi talepleri dâhil her türlü sonuçtan Kullanıcı sorumludur. eKatalox, ihlal tespiti veya yetkili merci bildirimi üzerine ilgili vitrini önceden bildirimde bulunmaksızın askıya alma hakkını saklı tutar.',
    ],
  },
  {
    title: '14. Uygulanacak Hukuk ve Uyuşmazlık Çözümü',
    body: [
      'Bu Şartlar Türkiye Cumhuriyeti kanunlarına tabidir. Bu Şartlardan doğabilecek uyuşmazlıklarda İstanbul (Merkez) Mahkemeleri ve İcra Daireleri yetkilidir.',
      'Taraflar tacir sıfatını haizdir. Türk Ticaret Kanunu m. 5/A uyarınca, konusu bir miktar paranın ödenmesi olan alacak ve tazminat talepleri bakımından dava açılmadan önce arabulucuya başvurulmuş olması dava şartıdır.',
    ],
  },
  {
    title: '15. İletişim',
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
        subtitle={`eKatalox'u kullanmadan önce lütfen bu şartları dikkatlice okuyun. Son güncelleme: ${TERMS_VERSION_LABEL}.`}
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
                {s.list && (
                  <ul className="space-y-2 pt-1">
                    {s.list.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm md:text-base text-slate-400 leading-relaxed">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#10b981] flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
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
