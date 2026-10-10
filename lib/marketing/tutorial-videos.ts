// YouTube "nasıl yapılır" videoları (10 Eki 2026'da hepsi yayına alındı). Sayfa:
// /egitim (Eğitim Merkezi). Süreler kaynak dosyalardan (saniye).
export type TutorialVideo = { id: string; title: string; description: string; seconds: number };
export type TutorialGroup = { slug: string; title: string; lead: string; videos: TutorialVideo[] };

export const TUTORIAL_PUBLISHED_AT = "2026-10-10";

export const TUTORIAL_GROUPS: TutorialGroup[] = [
  {
    slug: "urunler",
    title: "Ürünler ve katalog",
    lead: "Ürün ekleme, toplu yükleme, kategori ve stok.",
    videos: [
      { id: "W93pKNK77_Q", title: "Kataloğa Ürün Ekleme: Görsel, Kod, Fiyat ve Açıklama", description: "Tek bir ürünü görseli, model kodu, fiyat listeleri ve açıklamasıyla kataloğa ekliyoruz.", seconds: 231 },
      { id: "axypdnQLEio", title: "Excel ile Toplu Ürün Yükleme (Hazır Şablonla)", description: "Yüzlerce ürünü Excel şablonuyla tek seferde kataloğa yüklüyoruz. Şablonu ücretsiz indirebilirsiniz.", seconds: 178 },
      { id: "FORZt5NxKDY", title: "Ürün Görsellerini Toplu Yükleme: Model Koduyla Eşleştirme", description: "Dosyaları model koduyla adlandırıp yüzlerce ürün görselini tek seferde doğru ürünlere yüklüyoruz.", seconds: 111 },
      { id: "Tz1qaPHNucM", title: "Excel ile Toplu Fiyat Güncelleme", description: "Fiyat değişikliğini Excel dosyasını yeniden yükleyerek bütün ürünlerde tek seferde yapıyoruz.", seconds: 98 },
      { id: "yf3uwcWDqdw", title: "Renk ve Model Seçenekli Ürün (Varyant) Ekleme", description: "Aynı ürünün renklerini ya da modellerini tek ürün altında varyant olarak ekleme; varyanta ayrı fiyat, satışa kapatma ve bayinin renk renk adet seçmesi.", seconds: 117 },
      { id: "sFXfnym_nzE", title: "Paket ve Koli Adedi Tanımlama", description: "Ürüne paket ve koli adedi tanımlama; bayi adet, paket ya da koli seçerek sipariş verir, toplam adedi ve tutarı sistem hesaplar.", seconds: 96 },
      { id: "vqePBAwiexg", title: "Katalogda Kategori Oluşturma ve Sıralama", description: "Kategori açmayı, görsel eklemeyi ve bayinin göreceği sırayı değiştirmeyi gösteriyoruz.", seconds: 117 },
      { id: "9mFFHk6fQWc", title: "Stokta Olmayan Ürünleri Gizleme ya da Gösterme", description: "Stokta olmayan ürünlerin katalogda nasıl görüneceğini seçiyoruz: gizle, göster ya da yakında.", seconds: 72 },
    ],
  },
  {
    slug: "bayiler",
    title: "Bayiler ve fiyat listeleri",
    lead: "Bayiye özel fiyat, şifre ve bayi tarafından sipariş.",
    videos: [
      { id: "rmfIQJIpIX0", title: "Bayiye Özel Fiyat Listesi Nasıl Yapılır?", description: "Bayi, perakende ve özel müşteri gruplarına ayrı fiyat listesi tanımlıyoruz; herkes yalnız kendi fiyatını görüyor.", seconds: 143 },
      { id: "N7SrwblbMFA", title: "Bayi Katalogdan WhatsApp'a Nasıl Sipariş Verir?", description: "Bayinin gözünden: şifreyle giriş, sepeti doldurma ve PDF sipariş fişiyle WhatsApp'tan gönderme.", seconds: 134 },
      { id: "63y80dbuH0Q", title: "Bayi Başvurusu Onaylama ve Şifre Gönderme", description: "Kurumsal sitedeki formdan gelen bayilik başvurusunu panelde onaylama, fiyat listesi seçip kişiye özel şifre verme ve şifreyi WhatsApp'tan gönderme.", seconds: 131 },
      { id: "K9uwmLDLzPI", title: "Müşteriler Sayfası: Bayilerinizi Takip Edin", description: "Kişiye özel şifreli bayileri tek listede görme, elle bayi ekleme, bayinin siparişlerini durumlarına göre takip etme ve şifreyi WhatsApp'tan gönderme.", seconds: 119 },
    ],
  },
  {
    slug: "siparisler",
    title: "Siparişler ve sepet",
    lead: "Sipariş yönetimi, sipariş fişi, sepet ve ödeme ayarları.",
    videos: [
      { id: "uTPYgkv-vrI", title: "Siparişleri Onaylama, İptal ve Düzenleme", description: "Katalogdan gelen siparişleri arama, detayını görme, PDF fişini indirme, müşteri isteğiyle düzenleme, onaylama ve iptal etme.", seconds: 84 },
      { id: "uYBvdv9xCcY", title: "PDF Sipariş Fişini Özelleştirme", description: "Sipariş fişine logo, firma bilgisi ve notlar ekleyerek fişi kendi düzeninize getiriyoruz.", seconds: 70 },
      { id: "QOb0yIxkytk", title: "Minimum Sipariş Tutarı ve Sepet Ayarları", description: "Minimum sepet tutarını ve siparişte istenecek zorunlu bilgileri ayarlıyoruz.", seconds: 120 },
      { id: "-VZrbJKE8Us", title: "Ödeme Yöntemleri ve IBAN'ı Sipariş Fişine Ekleme", description: "Sepette görünecek ödeme yöntemlerini (nakit, havale, kart) seçme ve havale bilgilerini sipariş fişinin altına sipariş numarasıyla ekleme.", seconds: 75 },
      { id: "-Tb_eBRplug", title: "Çalışma Saatlerini Ayarlama", description: "Sipariş alma saatlerinizi ve kapalı günleri katalogda gösteriyoruz.", seconds: 83 },
    ],
  },
  {
    slug: "vitrin",
    title: "Katalog görünümü",
    lead: "Tema, logo, banner ve ana sayfa bölümleri.",
    videos: [
      { id: "Ydx_VExUwvU", title: "Katalog Teması ve Marka Renklerini Değiştirme", description: "Sektörünüze uygun katalog temasını seçme ve canlı düzenleyicide başlık, renkler, duyuru şeridi ve satış biçimini kendi mağazanızın üzerinde değiştirme.", seconds: 146 },
      { id: "qRC9DL5mvH8", title: "Mağaza Kimliği: Logo, Ad ve Görünüm Ayarları", description: "Logo, mağaza adı, telefon ve adres bilgilerini güncelliyoruz.", seconds: 107 },
      { id: "VBV4I1b6rGg", title: "Katalog Ana Sayfasına Banner Ekleme", description: "Katalog ana sayfasındaki kayan banner alanına 1200x400 kampanya görseli ekleme; başlık, bağlantı, mobil gösterim ve sıra.", seconds: 83 },
      { id: "TO0JxSC6qzg", title: "Katalog Ana Sayfa İçeriklerini Düzenleme", description: "Ana sayfanın en üstündeki karşılama alanını (başlık ve düğme) açma ve ana sayfa bölümlerinin sırasını ve görünürlüğünü değiştirme.", seconds: 93 },
      { id: "GOBrBEjinPk", title: "Öne Çıkan Ürün Bölümleri Oluşturma", description: "Katalog ana sayfasında yeni gelenler, kampanyalı ya da sezon ürünleri için öne çıkan bölüm oluşturma ve ürün ekleme.", seconds: 98 },
      { id: "Mon_bxs_MaI", title: "En Çok Satanlar Bölümü: Kendiliğinden Güncellenir", description: "Son 30 günde en çok sepete eklenen ürünleri ana sayfada otomatik gösteren En Çok Satanlar bölümünü açma; başlık ve ürün sayısı.", seconds: 73 },
      { id: "FeC62y5PgHc", title: "Sayfa Altı (Footer) Bilgilerini Düzenleme", description: "Kataloğun en altındaki bölümü açma; adres, telefon, e-posta ve sosyal medya hesaplarını ekleme.", seconds: 81 },
    ],
  },
  {
    slug: "pazarlama",
    title: "Kampanya ve raporlar",
    lead: "Bildirimler, duyurular ve katalog raporları.",
    videos: [
      { id: "8HyGaKEvwj0", title: "Bayilere Kampanya Bildirimi Gönderme", description: "Bayilerin telefonuna kişiye özel kampanya bildirimi hazırlama; fiyat listesine göre hedefleme ve mağazadaki Kampanyalar bölümüne kampanya kartı ekleme.", seconds: 140 },
      { id: "8gyQc2K6OAw", title: "Katalogda Duyuru Penceresi Gösterme", description: "Bayi kataloğa girer girmez açılan duyuru penceresi hazırlama; başlık, metin, gösterim sayısı ve yoğunluk modu.", seconds: 83 },
      { id: "h6VUZw8D-ag", title: "Katalog Raporları: Bayileriniz Ne Arıyor?", description: "Kataloğa kaç bayinin girdiği, en çok tıklanan ve sepete eklenen ürünler, aramalar, fiyat listesi kullanımı ve saat-gün dağılımı.", seconds: 91 },
    ],
  },
  {
    slug: "kurumsal",
    title: "Kurumsal site ve alan adı",
    lead: "Google'da çıkan tanıtım sitesi ve kendi alan adınız.",
    videos: [
      { id: "igfBf7Sw9fI", title: "Toptancı Kurumsal Web Sitesi Açma", description: "Google'da çıkan, şifre sormayan kurumsal tanıtım sitesini 8 adımlık sihirbazla hazırlama: firma bilgileri, sektör, başlık, hakkımızda, görünüm ve yayınlama.", seconds: 171 },
      { id: "6oxp0vIiCKI", title: "Kataloğa Kendi Alan Adınızı Bağlama", description: "Kataloğu ve kurumsal siteyi firmaniz.com gibi kendi alan adınızla yayınlama; mevcut alan adını bağlama ya da yeni alan adı seçme (Kurumsal paket).", seconds: 95 },
    ],
  },
];

export const TUTORIAL_VIDEOS: TutorialVideo[] = TUTORIAL_GROUPS.flatMap((group) => group.videos);

/** "Buradan başlayın": yeni müşterinin sırayla izleyeceği videolar. */
export const START_HERE_IDS = ["W93pKNK77_Q", "axypdnQLEio", "rmfIQJIpIX0", "N7SrwblbMFA", "uTPYgkv-vrI"];
