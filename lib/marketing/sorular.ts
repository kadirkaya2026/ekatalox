// Toptancıların Google'a yazdığı sorular ve kısa, dürüst yanıtlar (30 Eyl 2026).
// Kaynak: Google otomatik tamamlama ("toptancı katalog nasıl…", "fiyat listesi nasıl…"
// gibi gerçek sorgular). /sorular sayfasında FAQPage JSON-LD ile ve llms.txt'de
// düz metin olarak yayınlanır. Yanıtlar ürünün bugünkü özelliklerine göre yazıldı;
// olmayan bir özellik (online ödeme vb.) vaat edilmez.

export interface Soru {
  q: string;
  a: string;
  /** Yanıtın altında gösterilen ilgili sayfalar. */
  links?: { href: string; label: string }[];
}

export interface SoruGrubu {
  slug: string;
  title: string;
  items: Soru[];
}

export const SORU_GRUPLARI: SoruGrubu[] = [
  {
    slug: "katalog",
    title: "Katalog hazırlama",
    items: [
      {
        q: "Toptancı kataloğu nasıl yapılır?",
        a: "Önce ürün listenizi bir Excel dosyasında toplayın: ürün kodu, ürün adı, kategori, koli içi adet ve her fiyat listesi için fiyat. Sonra ürün görsellerini kodla aynı adla kaydedin. Bu iki dosya hazırsa katalog bir günde kurulur: Excel içe aktarılır, görseller koda göre eşleşir, fiyat listelerine şifre verilir ve bayilere firmaniz.ekatalox.com bağlantısı gönderilir. Basılı ya da PDF katalogdan farkı, fiyat değişince tek yerden güncellenmesi ve bayinin katalogdan doğrudan sipariş verebilmesidir.",
        links: [
          { href: "/nasil-calisir", label: "Nasıl çalışır" },
          { href: "/basvuru", label: "Ücretsiz katalog aç" },
        ],
      },
      {
        q: "Ürün kataloğu nasıl hazırlanır, içinde neler olmalı?",
        a: "İyi bir toptan ürün kataloğunda her üründe şunlar bulunur: ürün kodu (bayinin sipariş verirken kullandığı kısa kod), açık ürün adı, kategori, en az bir net görsel, koli veya paket içi adet, varsa varyantlar (renk, model uyumu) ve bayi grubuna göre fiyat. Açıklamayı kısa tutun; bayi ürünü zaten tanır, hızlı bulmak ister. Arama ve kategori düzeni, uzun bir listeden daha değerlidir.",
        links: [{ href: "/blog/dijital-katalog-nedir", label: "Dijital katalog rehberi" }],
      },
      {
        q: "Dijital katalog nasıl yapılır?",
        a: "Dijital katalog, ürünlerin tarayıcıdan açılan bir bağlantıda listelenmesidir. En pratik yol bir katalog yazılımı kullanmaktır: ürünleri Excel ile yükler, görselleri eklersiniz, size özel bir adres oluşur. Tasarım programıyla sayfa sayfa hazırlanan PDF kataloglar da dijitaldir; ancak her fiyat değişiminde yeniden hazırlanıp gönderilmesi gerekir. Ürün sayısı yüksekse ya da fiyatlar sık değişiyorsa bağlantıyla açılan katalog daha az iş çıkarır.",
        links: [{ href: "/blog/dijital-katalog-nedir", label: "Dijital katalog nedir?" }],
      },
      {
        q: "Online katalog nasıl yapılır, web sitesi gerekir mi?",
        a: "Ayrı bir web sitesi kurmanız gerekmez. eKatalox'ta hesap açtığınızda firmaniz.ekatalox.com adresinde kataloğunuz hazır olur; ürünleri yükleyip şifreleri belirlemeniz yeterlidir. Üst paketlerde kendi alan adınızı (katalog.firmaniz.com) bağlayabilirsiniz. Ücretsiz planda kredi kartı istenmez; 250 ürün ve 2 fiyat listesiyle yayına girebilirsiniz.",
        links: [{ href: "/fiyatlandirma", label: "Paketler" }],
      },
      {
        q: "PDF katalog nasıl yapılır, online katalogdan farkı ne?",
        a: "PDF katalog için ürünleri bir tasarım şablonuna yerleştirip dosyayı dışa aktarırsınız; e-posta ve WhatsApp ile paylaşılır, çevrimdışı açılır. Zayıf yanı güncellemedir: fiyat değişince yeni dosya hazırlanır ve eski dosyayı saklayan bayi eski fiyatı görmeye devam eder. Online katalogda bayi her açtığında güncel listeyi görür ve seçtiği ürünleri sepete atıp sipariş verebilir. Fuar ve tanıtım için PDF, günlük bayi siparişi için online katalog daha uygundur.",
      },
      {
        q: "WhatsApp katalog nedir, nasıl yapılır?",
        a: "WhatsApp Business uygulamasının kendi kataloğu, ürünleri tek tek fotoğrafla eklediğiniz kısa bir vitrindir; onlarca ürün için uygundur, fiyat gizliliği ve bayi grubuna göre fiyat yoktur. Toptancıların 'WhatsApp katalog' dediği şey çoğunlukla şudur: bayiye WhatsApp'tan bir katalog bağlantısı gönderilir, bayi şifresiyle girer, sipariş fişi yine WhatsApp'tan geri gelir. eKatalox bu ikinci modeli kullanır: ürün sayısı sınırlı değildir, fiyatlar şifreyle görünür, sipariş PDF fişi olarak WhatsApp'a düşer.",
        links: [{ href: "/nasil-calisir", label: "WhatsApp sipariş akışı" }],
      },
    ],
  },
  {
    slug: "fiyat-listesi",
    title: "Fiyat listesi",
    items: [
      {
        q: "Bayilere fiyat listesi nasıl gönderilir?",
        a: "En yaygın yöntem Excel ya da PDF dosyasını WhatsApp'tan atmaktır; sorunu, her değişiklikte herkese yeniden göndermek ve kimin hangi sürümü elinde tuttuğunu bilememektir. Diğer yol, bayiye bir kez katalog bağlantısı ve şifre göndermektir: fiyatı panelden değiştirdiğinizde bayi kataloğu açtığında yeni fiyatı görür, ayrıca dosya göndermeniz gerekmez. Bayi gruplarına farklı fiyat uyguluyorsanız her grubun kendi şifresi olur; aynı bağlantı, farklı fiyat.",
        links: [{ href: "/ozellikler", label: "Şifreli fiyat listeleri" }],
      },
      {
        q: "Fiyat listesi nasıl hazırlanır?",
        a: "Excel'de her satır bir ürün olacak şekilde ürün kodu, ürün adı, birim (adet/koli), koli içi adet ve fiyat sütunlarını açın. Bayi ve perakende gibi ayrı gruplarla çalışıyorsanız her grup için ayrı fiyat sütunu ekleyin; ayrı dosya tutmayın, tek dosyada sütun olarak dursun. Para birimini ve KDV durumunu (dahil/hariç) başlıkta belirtin. Bu dosya eKatalox'a doğrudan içe aktarılır ve her sütun bir fiyat listesine dönüşür.",
      },
      {
        q: "Fiyat listesi nasıl olmalı?",
        a: "Kısa, güncel ve tek sürümlü. Bayinin en çok sorduğu şey fiyatın güncel olup olmadığıdır; bu yüzden liste tarihini ya da 'güncel' bilgisini bayinin görebileceği yerde tutun. Ürün kodu mutlaka olsun, sipariş kodla verilir. Koli fiyatı ile adet fiyatını karıştırmayın; ikisi de gerekiyorsa ayrı gösterin. Fiyatı herkese açık yayınlamak istemiyorsanız listeyi şifreyle erişilir yapın.",
      },
      {
        q: "Cari fiyat listesi nedir?",
        a: "Belirli bir müşteriye (cariye) özel uygulanan fiyat listesidir; genel bayi fiyatından farklı, o müşteriyle anlaşılmış fiyatları içerir. Uygulamada 'özel liste' ya da 'anlaşmalı fiyat' olarak da geçer. eKatalox'ta bunun karşılığı ayrı bir fiyat listesi açıp yalnız o müşteriye şifresini vermektir; Kurumsal pakette bayilere kişiye özel şifre de tanımlanabilir.",
      },
      {
        q: "Farklı bayilere farklı fiyat nasıl gösterilir?",
        a: "Her bayi grubu için bir fiyat listesi ve o listeye ait bir şifre oluşturulur. Bayi hangi şifreyle giriş yaparsa o listenin fiyatlarını görür; ürünler, görseller ve stok bilgisi ortaktır. Ücretsiz planda 2, Başlangıç'ta 3, Profesyonel'de 15, Kurumsal'da sınırsız fiyat listesi bulunur. Şifresiz ziyaretçiye ürünleri fiyatsız göstermek de mümkündür.",
        links: [{ href: "/fiyatlandirma", label: "Paket limitleri" }],
      },
    ],
  },
  {
    slug: "siparis",
    title: "Sipariş ve bayi yönetimi",
    items: [
      {
        q: "B2B sipariş nedir?",
        a: "İşletmeden işletmeye (toptancıdan bayiye, üreticiden distribütöre) verilen siparişlerdir. Perakendeden farkı, alıcının kayıtlı bir müşteri olması, fiyatın anlaşmaya göre değişmesi ve siparişin koli ya da paket bazında verilmesidir. B2B sipariş sistemi bu akışı telefon ve WhatsApp mesajlarından çıkarıp bayinin kendi giriş yaptığı bir kataloğa taşır.",
      },
      {
        q: "B2B e-ticaret nedir, toptancı için ne anlama gelir?",
        a: "Bayilerin ve kurumsal müşterilerin internet üzerinden sipariş verdiği satış modelidir. Perakende e-ticaretten farkı fiyatların herkese açık olmaması, müşteriye özel fiyat ve minimum sipariş tutarı gibi kuralların bulunmasıdır. Toptancı için pratik anlamı şudur: bayi, telefonla fiyat sormak yerine şifresiyle kataloğa girer, sepetini doldurur, sipariş fişi size ulaşır. Ödeme çoğu toptancıda cari hesap üzerinden, katalog dışında yürür.",
        links: [{ href: "/sektorler", label: "Sektöre göre kullanım" }],
      },
      {
        q: "Bayi yönetimi nasıl yapılır?",
        a: "Üç şeyi düzenli tutmak gerekir: hangi bayi hangi fiyat listesini görüyor, kim ne sipariş verdi ve bayi ürün bilgisine nasıl ulaşıyor. Katalog tabanlı bir sistemde bayi grupları fiyat listesiyle, siparişler panelde Siparişlerim sayfasıyla, ürün bilgisi de tek katalogla yönetilir. Kurumsal pakette bayiler başvuru formundan gelir, onayladığınızda kişiye özel şifre alır; böylece kimin ne yaptığı şifre bazında görülür.",
        links: [{ href: "/ozellikler", label: "Bayi ve sipariş özellikleri" }],
      },
      {
        q: "Bayi sipariş sistemi nedir?",
        a: "Bayinin sizi aramadan, kendi başına sipariş oluşturabildiği ekrandır. Ürünü bulur, adet veya koli girer, sepetini onaylar; sistem sipariş fişini oluşturur ve size iletir. Toptancı tarafında bu, telefonda not tutmayı ve yanlış kod yazmayı ortadan kaldırır. eKatalox'ta fiş PDF olarak oluşur, bayi WhatsApp üzerinden gönderir, kayıt panelde tutulur ve bildirimi açan yöneticilere yeni sipariş uyarısı gelir.",
        links: [{ href: "/nasil-calisir", label: "Sipariş akışı" }],
      },
      {
        q: "Toptancılar nasıl çalışır, siparişi nasıl alır?",
        a: "Çoğu toptancı bugün üç kanaldan sipariş alır: telefon, WhatsApp mesajı ve sahadaki plasiyer. Fiyat listesi Excel ya da PDF olarak dolaşır, sipariş ise mesajdan elle sisteme girilir. Katalog tabanlı düzende bu kanallar tek bir bağlantıda toplanır; bayi ne alacağını kendi seçer, toptancı gelen fişi işler. Plasiyer de aynı kataloğu telefonundan açıp bayi adına sipariş girebilir.",
      },
    ],
  },
  {
    slug: "toptancilik",
    title: "Toptancılık",
    items: [
      {
        q: "Toptan satış nasıl yapılır?",
        a: "Toptan satış, ürünü perakendeciye ya da başka bir işletmeye koli veya parti bazında, birim fiyatı düşürerek satmaktır. İşleyiş için üç şey gerekir: bayilerin görebileceği bir ürün ve fiyat listesi, minimum sipariş kuralı (tutar veya koli) ve düzenli bir sipariş toplama yolu. Bayi bulmak genelde sektör toptancı sitelerinde, fuarlarda ve WhatsApp gruplarında olur; bulduktan sonra bayinin ürüne ve fiyata kolay ulaşması satışın devamını belirler.",
      },
      {
        q: "Toptancı nasıl olunur, toptancı olmak için ne yapmalıyım?",
        a: "Vergi kaydı olan bir işletme (şahıs ya da şirket) kurmanız, satacağınız ürün grubunda tedarik bulmanız ve stok tutacak bir yer edinmeniz gerekir. İthalat yapacaksanız gümrük müşaviriyle çalışmak ve ürün uygunluk belgelerini (örneğin elektronik ürünlerde TSE/CE) takip etmek gerekir. Ticari tarafta ilk günden bir ürün kataloğu ve bayi fiyat listesi hazırlamak, ilk bayileri bulmayı ve onlara güven vermeyi kolaylaştırır.",
      },
      {
        q: "Toptancılar ne kadar kazanır?",
        a: "Sektöre ve ürüne göre çok değişir; genel kural, perakendeye göre düşük birim kâr ve yüksek adet olmasıdır. Kazancı belirleyen şey liste fiyatı değil, ürünün depoya giriş maliyetidir: alış fiyatının üstüne nakliye, gümrük, iade ve kargo gibi masraflar eklenince gerçek marj çıkar. Bu yüzden toptancıların çoğu ürün bazında gerçek kârını hesaplamaz; kâr, ciroyla karıştırılır. Hangi ürünün gerçekten kazandırdığını görmek için satış verisini ürün bazında tutmak gerekir.",
      },
    ],
  },
];

export const TUM_SORULAR = SORU_GRUPLARI.flatMap((g) => g.items);
