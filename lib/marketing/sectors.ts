export type Sector = {
  slug: string; name: string; shortName: string; registration: string;
  /** Arama motoru başlığı ve H1 üst satırı: sektörün aranan ifadesi. */
  seoTitle: string;
  title: string; description: string; problem: string;
  demo?: { url: string; name: string; description: string };
  example: { title: string; body: string; steps: string[] };
  benefits: { title: string; body: string; href: string }[];
  faq: { q: string; a: string }[];
};

export const WHOLESALE_SECTORS: Sector[] = [
  {
    demo: { url: "https://demo-giyim.ekatalox.com/", name: "VELIRA — Giyim demosu", description: "VELIRA giyim demosunda elbise, üst giyim, dış giyim, alt giyim ve aksesuar kategorilerini inceleyin. Ürünlerin görselli sunumunu ve katalogdan sipariş akışını deneyin." },
    slug: "tekstil-giyim", seoTitle: "Toptan giyim kataloğu ve bayi sipariş sistemi", name: "Tekstil & Giyim Toptancıları", shortName: "Tekstil & Giyim", registration: "tekstil",
    title: "Yeni koleksiyonunuzu bayilerinizle tek katalogdan paylaşın.",
    description: "Tekstil ve giyim toptancıları için online ürün kataloğu, bayiye özel fiyat listeleri ve WhatsApp sipariş sistemi. Koleksiyonlarınızı görsellerle sunun, siparişleri panelden takip edin.",
    problem: "Her koleksiyonda yeniden PDF hazırlamak, model görsellerini ayrı ayrı göndermek ve bayi fiyatlarını mesajlardan takip etmek zaman alır. Güncel ürünlerinizi tek katalogda toplayın; bayileriniz aynı bağlantıdan inceleyip sipariş oluştursun.",
    example: { title: "Yeni sezon koleksiyonu satışa açılıyor", body: "Mağazalarınıza yeni ürünlerinizi tanıtmak için ayrı dosyalar göndermek yerine katalog bağlantınızı paylaşın.", steps: ["Ürünleri koleksiyon ve kategori düzeniyle, model bilgileriyle yükleyin.", "Bayi grubuna uygun fiyat listesi erişimini paylaşın.", "Bayiniz ürün ve adetleri seçsin; siparişini WhatsApp üzerinden iletsin."] },
    benefits: [
      { title: "Koleksiyonunuzu görsellerle anlatın", body: "Ürün fotoğraflarını ve model açıklamalarını aynı sayfada sunun. Ürünlerinizde kullandığınız renk ve beden bilgilerini açıklamalara veya tanımladığınız varyantlara ekleyin.", href: "toplu-urun-yukleme" },
      { title: "Mağaza gruplarına ayrı fiyat listeleri", body: "Farklı bayi gruplarınıza ayrı fiyat listeleri tanımlayın. Bayiniz kendisine verilen erişimle ilgili fiyatları görsün.", href: "bayi-fiyat-listeleri" },
      { title: "Yeni sezonu müşterilerinize duyurun", body: "Bildirim izni veren bayilere yeni koleksiyon ve kampanyalarınızı duyurun. Bildirim gönderme Profesyonel ve Kurumsal paketlerde bulunur.", href: "kampanya-bildirimleri" },
    ],
    faq: [
      { q: "Renk ve beden bilgisini gösterebilir miyim?", a: "Ürün açıklamalarında renk ve beden bilgisi sunabilir, kullandığınız ürün varyantlarını tanımlayabilirsiniz. Bayiniz seçim yaparken ürün bilgilerini katalogda görür." },
      { q: "Yeni koleksiyon için katalog bağlantısı değişir mi?", a: "Ürünlerinizi mevcut kataloğunuzda güncelleyebilirsiniz. Aynı katalog bağlantısını bayilerinizle paylaşmaya devam edersiniz." },
    ],
  },
  {
    slug: "elektronik-aksesuar", seoTitle: "Telefon aksesuarı toptan katalog ve sipariş programı", name: "Elektronik & Aksesuar Dağıtıcıları", shortName: "Elektronik & Aksesuar", registration: "telefon-aksesuar",
    title: "Geniş aksesuar kataloğunuzu kolay bulunan ürünlere dönüştürün.",
    description: "Elektronik ve telefon aksesuarı dağıtıcıları için dijital bayi kataloğu. Ürün kodları, toplu yükleme, farklı fiyat listeleri ve WhatsApp siparişlerini tek yerde yönetin.",
    problem: "Kablo, adaptör ve aksesuar çeşitleri arttıkça müşterinin doğru ürünü bulması zorlaşır. Ürün adı, kodu ve açıklamasını düzenli tutarak bayinizin katalogdan seçim yapmasını kolaylaştırın.",
    example: { title: "Bayiniz eksilen aksesuarlarını tamamlıyor", body: "Ürün fotoğrafı ve teknik açıklama aynı yerde olduğunda, hangi ürünün istendiğini mesajlar arasında aramanız gerekmez.", steps: ["Ürünleri marka ve kategori düzeniyle, kod ve bağlantı türü bilgileriyle ekleyin.", "Bayi veya özel müşteri grubuna uygun fiyat listesini sunun.", "Bayiniz aradığı ürünleri sepete eklesin, ürün ve adetleri sipariş fişinde birlikte görün."] },
    benefits: [
      { title: "Ürün kodu ve açıklaması bir arada", body: "Model, bağlantı türü ve teknik özellikleri ürün bilgilerinde belirtin. Bayileriniz isim veya ürün koduyla aradığında doğru ürüne ulaşabilsin.", href: "whatsapp-siparis" },
      { title: "Binlerce ürünü topluca aktarın", body: "Excel/CSV ile ürün bilgilerini, toplu görsel yüklemeyle fotoğrafları kataloğunuza aktarın. Ürün kapasitenizi mevcut paket limitlerine göre seçin.", href: "toplu-urun-yukleme" },
      { title: "Müşteri grubuna göre fiyat sunun", body: "Perakende, bayi ve özel müşteri listelerini tek katalogda yönetin. Yeni fiyatlar için herkese ayrı PDF dağıtmak yerine katalogdaki bilgileri güncelleyin.", href: "bayi-fiyat-listeleri" },
    ],
    faq: [
      { q: "Bayiler ürün koduyla arayabilir mi?", a: "Ürün kodlarını katalogda tanımlayarak ürün adı ve kod üzerinden aramayı kullanabilirsiniz. Kodların düzenli ve eksiksiz girilmesi ürün bulmayı kolaylaştırır." },
      { q: "Demo hangi ürünlerle çalışıyor?", a: "Bağlantı verdiğimiz genel toptancı demosunda elektronik ve aksesuar ürünleri bulunur. Katalog ve sipariş akışını incelemek için kullanabilirsiniz." },
    ],
  },
  {
    slug: "mobilya-dekorasyon", seoTitle: "Mobilya bayi kataloğu ve fiyat listesi programı", name: "Mobilya & Dekorasyon Üreticileri", shortName: "Mobilya & Dekorasyon", registration: "ev-mutfak",
    title: "Ürünlerinizin detayını gösterin, bayi siparişini netleştirin.",
    description: "Mobilya ve dekorasyon üreticileri için görselli dijital katalog, bayi fiyat listeleri ve kurumsal site. Ölçü, malzeme ve ürün açıklamalarını müşterilerinize birlikte sunun.",
    problem: "Ürün fotoğrafları bir mesajda, ölçüler başka dosyada, fiyatlar ayrı listede kalmasın. Bayinizin karar vermek için ihtiyaç duyduğu bilgileri ürün sayfasında bir araya getirin.",
    example: { title: "Bir mağaza yeni dekorasyon serinizi inceliyor", body: "Katalog, bayinizin ürünleri ve sipariş edeceği adetleri karşılaştırabileceği ortak başvuru noktası olur.", steps: ["Ürün görselleriyle birlikte ölçü, malzeme ve model açıklamalarını ekleyin.", "Bayiniz kendisine ait fiyat listesiyle koleksiyonu incelesin.", "Seçtiği ürünleri ve sipariş notunu size iletsin; kayıtları panelde takip edin."] },
    benefits: [
      { title: "Ölçü ve malzeme bilgisini görünür kılın", body: "Ürün sayfalarında görselleri, ölçüleri ve malzeme açıklamalarını birlikte sunun. Sipariş öncesi tekrar tekrar sorulan bilgileri katalogdan paylaşın.", href: "toplu-urun-yukleme" },
      { title: "Markanız için kurumsal tanıtım", body: "Kurumsal pakete dahil tanıtım sitesiyle markanızı ve ürünlerinizi anlatın. Bayimiz ol formuyla yeni bayi başvurularını toplayın.", href: "kurumsal-site" },
      { title: "Bayi fiyatları ayrı, ürün tanıtımı açık", body: "Ürünlerinizi kurumsal sitenizde tanıtırken bayi fiyatlarını erişim kontrollü katalogda sunun. Farklı gruplar için ayrı fiyat listeleri kullanın.", href: "bayi-fiyat-listeleri" },
    ],
    faq: [
      { q: "Ürün ölçülerini ve malzemeyi gösterebilir miyim?", a: "Evet. Ürün açıklamalarına ölçü, malzeme ve model bilgilerini ekleyebilir, görsellerle birlikte sunabilirsiniz." },
      { q: "Kurumsal site ayrıca ücretli mi?", a: "Kurumsal tanıtım sitesi ve Bayimiz ol formu Kurumsal pakete dahildir. Alan adı satın alma ve yenileme giderleri ile varsa özel hizmet kapsamı ayrıca değerlendirilir." },
    ],
  },
  {
    slug: "otomotiv-yedek-parca", seoTitle: "Yedek parça kataloğu ve bayi sipariş sistemi", name: "Otomotiv Yedek Parça Satıcıları", shortName: "Otomotiv Yedek Parça", registration: "yedek-parca",
    title: "Bayiniz parçayı koduyla bulsun, siparişini ürün listesiyle iletsin.",
    description: "Otomotiv yedek parça satıcıları için ürün koduyla arama, kategorili online katalog, bayi fiyatları ve WhatsApp sipariş takibi.",
    problem: "Benzer isimli parçaları yalnızca mesajla tarif etmek sipariş takibini zorlaştırır. Ürün kodu, fotoğrafı ve sizin eklediğiniz uyumluluk açıklamalarıyla bayinizin seçimini netleştirin.",
    example: { title: "Servis, ihtiyaç duyduğu parçaları listeliyor", body: "Servis veya bayi, paylaştığınız katalogdan ürün kodunu arayıp ihtiyaç duyduğu adetleri seçebilir.", steps: ["Ürün kodlarını, görselleri ve uygunluk açıklamalarını kataloğa ekleyin.", "Servis ve bayi gruplarınız için ilgili fiyat listesini paylaşın.", "Sipariş fişindeki ürün ve adetleri kontrol ederek hazırlığa geçin."] },
    benefits: [
      { title: "Kodla bulunabilen ürünler", body: "Ürün kodlarını tutarlı biçimde tanımlayın. Kategori ve arama düzeniyle müşterinizin geniş parça listesini incelemesini kolaylaştırın.", href: "whatsapp-siparis" },
      { title: "Servis ve bayiye ayrı fiyat listeleri", body: "Müşteri gruplarınıza uygun listeler hazırlayın. Her gruba aynı ürün kataloğunu kendi fiyatlarıyla sunun.", href: "bayi-fiyat-listeleri" },
      { title: "Aranan ürünlere göre aksiyon alın", body: "Başlangıç ve üstü paketlerde arama ve sepete ekleme raporlarını inceleyin. İlgi gören ürünlerin katalog bilgilerini ve kampanyalarını buna göre düzenleyin.", href: "raporlar" },
    ],
    faq: [
      { q: "Araç uyumluluğunu nasıl gösterebilirim?", a: "Ürün açıklamalarına kendi doğruladığınız marka, model ve uygunluk bilgilerini yazabilirsiniz. Bu anlatım otomatik şasi numarası sorgulama veya araç-parça eşleştirme hizmeti anlamına gelmez." },
      { q: "Çok sayıda parçayı tek tek mi eklemem gerekir?", a: "Ürün bilgilerini Excel/CSV dosyasıyla topluca aktarabilirsiniz. Toplu görsel yükleme de kullanabilirsiniz; ürün kapasitesi seçtiğiniz pakete bağlıdır." },
    ],
  },
  {
    slug: "gida-toptancilari", seoTitle: "Gıda toptan sipariş programı: koli ve adet", name: "Gıda Toptancıları", shortName: "Gıda Toptan", registration: "gida",
    title: "Koli ve adet siparişlerini güncel kataloğunuzda toplayın.",
    description: "Gıda toptancıları için dijital ürün kataloğu, koli ve adet bazlı sipariş, minimum sepet ve müşteriye özel fiyat listeleri. Siparişlerinizi panelden takip edin.",
    problem: "Market, kafe ve restoran müşterilerinizin siparişlerini dağınık mesajlardan toparlamak yerine ürün ve adetleri belirli bir liste halinde alın. Fiyat ve ambalaj bilgisini güncel katalogda sunun.",
    example: { title: "Restoran müşteriniz haftalık alımını hazırlıyor", body: "Müşteriniz kendi fiyat listesinde ürünleri inceler; tanımladığınız satış birimine göre siparişini oluşturur.", steps: ["Ürünlerin gramaj, ambalaj ve satış birimi bilgilerini ekleyin.", "Market, restoran veya özel müşteri listelerinizin fiyatlarını tanımlayın.", "Minimum sepet koşulunu sağlayan müşteri siparişini tamamlasın; siz panelden takip edin."] },
    benefits: [
      { title: "Adet ve koli bilgisiyle sipariş", body: "Ürünlerinizin satış birimlerini tanımlayın. Ambalaj ve gramaj açıklamalarını görünür tutarak müşterinizin ne sipariş verdiğini netleştirin.", href: "whatsapp-siparis" },
      { title: "Minimum sepet ve gerekli müşteri bilgileri", body: "Minimum sepet tutarını belirleyin; sipariş için gerekli adres ve telefon alanlarını zorunlu tutun. Minimum tutar kontrolü tek para birimli sepetlerde uygulanır.", href: "whatsapp-siparis" },
      { title: "Müşteri grubuna uygun fiyat", body: "Restoran, market ve bayi müşterilerinize ayrı fiyat listeleri sunun. Ürünler bir katalogda kalırken müşteriniz ilgili liste üzerinden alışveriş yapsın.", href: "bayi-fiyat-listeleri" },
    ],
    faq: [
      { q: "Koli ve adet bazında sipariş alabilir miyim?", a: "Ürünlerde kullandığınız satış birimlerini tanımlayarak adet, paket veya koliyle sipariş oluşturulmasını sağlayabilirsiniz. Ambalaj içeriğini ürün açıklamasında belirtin." },
      { q: "Mahalleye teslimat yapan bir marketim; bu sayfa bana uygun mu?", a: "Bu sayfa işletmelere toplu satış yapan gıda toptancılarını anlatır. Son tüketiciye satış, konumlu sipariş ve QR magnet kullanımı için Market & Bakkallar sayfasını inceleyebilirsiniz." },
    ],
  },
  {
    slug: "kozmetik-temizlik", seoTitle: "Kozmetik ve temizlik toptan katalog, bayi sipariş", name: "Kozmetik & Temizlik Markaları", shortName: "Kozmetik & Temizlik", registration: "kozmetik",
    title: "Ürün serilerinizi tanıtın, bayilerinizi tekrar siparişe davet edin.",
    description: "Kozmetik ve temizlik markaları için online bayi kataloğu, ürün serileri, farklı fiyat listeleri ve kampanya bildirimleri. Bayi başvuruları ve siparişleri yönetin.",
    problem: "Ürün serileri, ambalaj çeşitleri ve kampanyalar sık değişirken eski kataloglar dolaşımda kalmasın. Bayilerinize güncel içerikleri inceleyebilecekleri tek bağlantı verin.",
    example: { title: "Yeni ürün seriniz için kampanya hazırlıyorsunuz", body: "Ürünleri güncel katalogda sunup bildirim izni veren müşterilerinize kampanyanızı duyurabilirsiniz.", steps: ["Ürün serisini, ambalaj miktarını ve kullanım açıklamalarını ekleyin.", "Bayi grubuna uygun fiyatları ve kampanya kartlarını düzenleyin.", "İzin veren müşterileri kampanya bildirimiyle kataloğa davet edin; siparişleri panelde takip edin."] },
    benefits: [
      { title: "Ürün serileri anlaşılır bir düzende", body: "Seri, kategori ve ambalaj bilgilerini ürün görselleriyle birlikte sunun. Müşteriniz seçimini yaparken sizin sağladığınız açıklamalara ulaşsın.", href: "toplu-urun-yukleme" },
      { title: "Kampanyayla yeniden siparişi teşvik edin", body: "Bildirim izni veren, bir süredir sipariş oluşturmayan müşterilerinize özel kampanyanızı duyurun. Bildirim gönderme Profesyonel ve Kurumsal paketlerde bulunur.", href: "kampanya-bildirimleri" },
      { title: "Yeni bayi başvurularını toplayın", body: "Kurumsal pakete dahil kurumsal site ve Bayimiz ol formuyla markanızı tanıtın, başvuruları alın. Mevcut bayilere ayrı fiyat listeleri sunun.", href: "kurumsal-site" },
    ],
    faq: [
      { q: "Farklı ambalajları nasıl anlatabilirim?", a: "Ürün adında ve açıklamasında ambalaj miktarını, paket içeriğini ve kullanım bilgisini belirtebilirsiniz. Kullandığınız ürün varyantları veya ayrı ürün kayıtlarıyla seçenekleri düzenleyebilirsiniz." },
      { q: "Eski müşterilerime kampanya bildirimi gönderebilir miyim?", a: "Bildirim izni veren müşterilerinize kampanyanızı göndererek yeniden sipariş oluşturmalarını teşvik edebilirsiniz. Bildirim gönderme Profesyonel ve Kurumsal paketlerde sunulur." },
    ],
  },
];
