'use client'

import { SiteNavbar, SiteFooter, PageHero } from '@/components/site-chrome'

const sections = [
  {
    title: '1. Veri Sorumlusu',
    body: [
      '6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, ekatalox.com web sitesi ve panelinin işletmecisi eKatalox ("Veri Sorumlusu", "biz"), kimliğiniz belirli veya belirlenebilir gerçek kişiye ait kişisel verilerinizi aşağıda açıklanan kapsamda işlemektedir.',
      'Bu metin; ekatalox.com üzerinden hizmet aldığınız işletmenin (Kullanıcı) tenant yöneticisi, çalışanı, müşterisi veya ziyaretçisi olarak sizinle ilgili kişisel verilerin nasıl işlendiğini açıklar ve KVKK m. 10 kapsamındaki aydınlatma yükümlülüğümüzü yerine getirmek amacıyla hazırlanmıştır.',
    ],
  },
  {
    title: '2. Toplanan Veriler',
    body: [
      'Üyelik ve hizmet sürecinde aşağıdaki kişisel veri kategorileri toplanabilir:',
    ],
    list: [
      'Kimlik ve iletişim bilgileri: ad soyad, e-posta, telefon, firma bilgileri',
      'Hesap bilgileri: kullanıcı adı, şifrelenmiş şifre, hesap rolü',
      'İşlem güvenliği bilgileri: IP adresi, oturum çerezleri, giriş zaman damgaları',
      'Müşteri işlem bilgileri: verilen siparişler, fiyat listesi erişim şifreleri, WhatsApp üzerinden iletilen sipariş içerikleri',
      'Ziyaretçi/analitik bilgileri: anonimleştirilmiş ziyaretçi kimliği, görüntülenen ürünler, arama sorguları',
      'Ödeme bilgileri: yalnızca Sanal POS sağlayıcısı (iyzico, PayTR vb.) tarafından işlenir; kart bilgileri eKatalox sunucularında saklanmaz',
    ],
  },
  {
    title: '3. Verilerin İşlenme Amacı',
    list: [
      'Katalog/vitrin hizmetinin sunulması ve hesabınızın yönetilmesi',
      'Sanal POS ile ödeme doğrulama ve abonelik işlemlerinin yürütülmesi',
      'Sipariş ve fiyat listesi erişim süreçlerinin yürütülmesi',
      'Teknik destek taleplerinin yanıtlanması',
      'Hizmet güvenliğinin sağlanması, kötüye kullanımın önlenmesi',
      'Yasal yükümlülüklerin (fatura, muhasebe, KVKK dahil) yerine getirilmesi',
    ],
  },
  {
    title: '4. İşlemenin Hukuki Sebebi',
    body: [
      'Kişisel verileriniz, KVKK m. 5 ve 6\'da belirtilen; bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması, hukuki yükümlülüğümüzün yerine getirilmesi, meşru menfaatimiz için veri işlenmesinin zorunlu olması ve açık rızanızın bulunduğu hallerde açık rıza hukuki sebeplerine dayanılarak işlenir.',
    ],
  },
  {
    title: '5. Üçüncü Taraflarla Paylaşım',
    body: [
      'Verileriniz asla üçüncü şahıslara satılmaz veya pazarlama amacıyla paylaşılmaz. Yalnızca; hizmetin sunulması için zorunlu olan bulut altyapı sağlayıcıları (veritabanı/barındırma), Sanal POS/ödeme kuruluşları ve yasal olarak yetkili kamu kurum ve kuruluşlarının talebi doğrultusunda paylaşılabilir.',
      'Altyapı sağlayıcılarımızın bir kısmı Avrupa Birliği sınırları içinde hizmet vermektedir; yurt dışına aktarım söz konusu olduğunda KVKK\'nın öngördüğü uygun güvenceler (sözleşmesel taahhütler, açık rıza vb.) sağlanmaya çalışılır.',
    ],
  },
  {
    title: '6. Veri Güvenliği',
    body: [
      'Verileriniz, yüksek güvenlikli cloud veritabanlarında (Supabase altyapısı, SSL/TLS şifrelemesi ile) saklanır. Erişim, yalnızca yetkilendirilmiş sistemler ve personelle sınırlıdır; veriler düzenli olarak yedeklenir.',
    ],
  },
  {
    title: '7. Veri Toplama Yöntemi',
    body: [
      'Kişisel verileriniz; web sitesi ve panel üzerindeki formlar, WhatsApp üzerinden iletilen sipariş mesajları, çerezler ve benzeri teknolojiler aracılığıyla elektronik ortamda otomatik veya kısmen otomatik yollarla toplanır.',
    ],
  },
  {
    title: '8. Saklama Süresi',
    body: [
      'Kişisel verileriniz, işlenme amacının gerektirdiği süre boyunca ve ilgili mevzuatta öngörülen zamanaşımı süreleri (örneğin Türk Ticaret Kanunu ve vergi mevzuatı kapsamındaki 10 yıla varan saklama yükümlülükleri) saklı kalmak kaydıyla saklanır. Bu sürelerin sonunda verileriniz silinir, yok edilir veya anonim hale getirilir.',
    ],
  },
  {
    title: '9. KVKK m. 11 Kapsamındaki Haklarınız',
    body: [
      'KVKK\'nın 11. maddesi uyarınca bize başvurarak;',
    ],
    list: [
      'Kişisel verilerinizin işlenip işlenmediğini öğrenme',
      'İşlenmişse buna ilişkin bilgi talep etme',
      'İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme',
      'Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme',
      'Eksik/yanlış işlenmişse düzeltilmesini isteme',
      'KVKK m. 7\'de öngörülen şartlar çerçevesinde silinmesini/yok edilmesini isteme',
      'Düzeltme, silme ve yok edilme işlemlerinin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme',
      'İşlenen verilerin münhasıran otomatik sistemlerle analiz edilmesi nedeniyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme',
      'Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme',
    ],
  },
  {
    title: '10. Başvuru Yöntemi',
    body: [
      'Yukarıdaki haklarınızı kullanmak için talebinizi info@ekatalox.com adresine iletebilirsiniz. Başvurunuz, niteliğine göre en kısa sürede ve en geç 30 gün içinde ücretsiz olarak sonuçlandırılır; işlemin ayrıca bir maliyet gerektirmesi halinde Kişisel Verileri Koruma Kurulu\'nca belirlenen tarifedeki ücret talep edilebilir.',
    ],
  },
]

const Page = () => {
  return (
    <main className="relative min-h-screen bg-[#090d16] text-white overflow-hidden">
      <SiteNavbar />
      <PageHero
        tag="Yasal"
        title={<>Gizlilik Politikası ve <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#10b981] to-[#00ff87]">KVKK</span></>}
        subtitle="eKatalox olarak kişisel verilerinizin güvenliğine önem veriyoruz. Son güncelleme: 2 Ağustos 2026."
      />

      <section className="px-6 pb-28">
        <div className="max-w-3xl mx-auto space-y-12">
          {sections.map((s) => (
            <div key={s.title} className="border-t border-white/10 pt-8 first:border-t-0 first:pt-0">
              <h2 className="text-xl md:text-2xl font-semibold text-white">{s.title}</h2>
              <div className="mt-4 space-y-3">
                {s.body?.map((p, i) => (
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
