export interface MarketingFeature {
  slug: string; title: string; lead: string; plan: string;
  sections: { title: string; body: string }[];
  example: string; related: string[];
}

export const MARKETING_FEATURES: MarketingFeature[] = [
  {
    "slug": "whatsapp-siparis",
    "title": "Toptancılar için WhatsApp sipariş sistemi",
    "lead": "Minimum sepet tutarını ve gerekli müşteri bilgilerini belirleyin. Siparişlerinizi Siparişlerim sayfasından takip edin; PDF fişi bağlantısını WhatsApp üzerinden paylaşın.",
    "plan": "Temel sipariş araçları tüm paketlerde",
    "sections": [
      {
        "title": "Siparişin kurallarını siz belirleyin",
        "body": "Adet, paket veya koliyle çalışan ürünlerinizi kataloğa ekleyin. Minimum sepet tutarı belirleyerek müşterinizi siparişi tamamlamaya yönlendirin. Bu tutar kontrolü tek para birimli sepetlerde uygulanır; farklı para birimleri içeren sepetlerde uygulanmaz."
      },
      {
        "title": "Her müşteriden aynı bilgiyi istemeyin",
        "body": "Sipariş formunda ad, telefon, adres ve not alanlarından hangilerinin gösterileceğini ve hangilerinin zorunlu olacağını seçin. Teslimat için gerekli bilgileri isteyin, işletmeniz için gerekmeyen alanları kaldırarak formu sadeleştirin."
      },
      {
        "title": "Siparişlerim ve yeni sipariş bildirimi",
        "body": "Oluşan siparişleri yönetim panelindeki Siparişlerim sayfasından takip edin. Bildirimleri açtıysanız yeni sipariş geldiğinde haberdar olun. Ürün, adet ve tutar bilgilerini PDF sipariş fişinde birlikte inceleyin."
      },
      {
        "title": "WhatsApp alıcısını işinize göre seçin",
        "body": "Siparişi sitenizde kayıtlı WhatsApp numarasına yönlendirin. Sabit alıcı seçeneğini kapatırsanız müşteriniz WhatsApp üzerinden göndereceği kişiyi kendisi seçer. Böylece kendi toptancısına da iletebilir. Mesaj, müşteri WhatsApp’ta gönderdiğinde paylaşılır."
      }
    ],
    "example": "Örneğin teslimat yapan bir işletme telefon ve adresi zorunlu tutabilir. Mağazadan teslim alan bayilerle çalışan işletme ise adres alanını kapatabilir. Aynı katalog, kendi sipariş düzeninize uyum sağlar.",
    "related": [
      "bayi-fiyat-listeleri",
      "online-odeme"
    ]
  },
  {
    "slug": "bayi-fiyat-listeleri",
    "title": "Şifreli bayi kataloğu ve farklı fiyat listeleri",
    "lead": "Ürünlerinizi tek katalogda yönetin; bayi, perakende ve özel müşteri gruplarınıza ayrı fiyat listeleri sunun.",
    "plan": "Ücretsiz: 2 · Başlangıç: 3 · Profesyonel: 15 · Kurumsal: sınırsız liste",
    "sections": [
      {
        "title": "Her gruba kendi fiyatı",
        "body": "Fiyat listelerinizi tanımlayın ve giriş şifrelerini ilgili listeye bağlayın. Bayi, kullandığı şifrenin bağlı olduğu fiyatları görür. Aynı ürün için farklı müşterilere ayrı PDF dosyaları hazırlamak yerine listelerinizi panelden güncellersiniz."
      },
      {
        "title": "Ürün tanıtımı açık, bayi fiyatları kontrollü",
        "body": "Kataloğu şifreyle açılacak şekilde kullanın veya şifresiz ziyaretçilere ürünleri fiyatsız gösterin. Herkese açık kurumsal ürün sayfaları bayi fiyatlarını yayınlamaz; fiyatlar geçerli katalog erişimiyle görüntülenir."
      },
      {
        "title": "Google’da ürününüz tanıtılsın",
        "body": "Kurumsal sitenizde ürün adı, açıklaması ve görselleri arama motorlarına açık olabilir. Şifreli fiyat listeleri bu açık tanıtımın parçası değildir. Herkese açık açıklama veya görsellere ayrıca fiyat yazmamanız, bu ayrımı korumanıza yardımcı olur."
      },
      {
        "title": "Erişim düzenini güncel tutun",
        "body": "Müşteri grubunuz değiştiğinde ilgili listeyi ve giriş şifrelerini panelden yönetin. Liste şifresi, onu bilen kişiler tarafından kullanılabilir; dağıtımını işletmenizin erişim politikasına göre yapın."
      }
    ],
    "example": "Bayi, perakende ve özel müşteri için üç liste açabilirsiniz. Bayiniz bağlantıya kendi şifresiyle girdiğinde bayi listesini görür; siz ürün bilgisini tek yerden güncellersiniz.",
    "related": [
      "whatsapp-siparis",
      "kurumsal-site"
    ]
  },
  {
    "slug": "toplu-urun-yukleme",
    "title": "Excel’den toplu ürün ve görsel yükleme",
    "lead": "Ürünlerinizi Excel/CSV dosyasından aktarın; fotoğraflarınızı ürün kodlarıyla eşleştirerek toplu yükleyin.",
    "plan": "Tüm paketlerde, paketinizin ürün limiti içinde",
    "sections": [
      {
        "title": "Listeyi şablonla hazırlayın",
        "body": "Paneldeki ürün şablonunu kullanın. Ürün kodu, ad, birim, koli içi adet ve fiyat gibi alanları doldurun; kategori düzeninizi hazırlayın. Excel/XLSX ve CSV dosyalarıyla çok sayıda ürünü tek seferde aktarın."
      },
      {
        "title": "Görselleri ürün koduyla eşleştirin",
        "body": "Toplu görsel yüklemede fotoğrafları ürünlerin model veya SKU kodlarıyla eşleştirin. Dosya adlarını kodlarla tutarlı hazırlamak, görselin doğru ürüne bağlanmasını kolaylaştırır. Toplu görsel aracı ZIP dosyalarını da işler."
      },
      {
        "title": "Aktarmadan önce kontrol edin",
        "body": "Yükleme ekranındaki eşleşmeleri ve hatalı satırları kontrol edin. Eksik ürün kodlarını veya yanlış fiyat hücrelerini kaynak dosyada düzeltin. Aynı kodu farklı ürünlerde kullanmamak, sonraki güncellemelerin de düzenli kalmasını sağlar."
      },
      {
        "title": "Yeni PDF hazırlamak yerine güncelleyin",
        "body": "Ürünleri ve fiyatları panelden ya da desteklenen toplu işlemlerle güncelleyin. Bayiniz katalog bağlantısını açtığında güncel listeye ulaşır. Aktarım, seçtiğiniz paketin ürün kapasitesiyle sınırlıdır."
      }
    ],
    "example": "Örneğin ürün kodunuz ABC-100 ise ilgili fotoğrafı da bu kodla hazırlayın. Önce birkaç ürünle eşleşmeyi kontrol edip ardından kalan dosyayı yüklemek, büyük listelerde yanlış görsel eşleşmelerini azaltır.",
    "related": [
      "bayi-fiyat-listeleri",
      "whatsapp-siparis"
    ]
  },
  {
    "slug": "kurumsal-site",
    "title": "Kurumsal site ve Bayimiz ol formu",
    "lead": "Kurumsal pakete dahil sitenizle firmanızı ve ürünlerinizi tanıtın; Bayimiz ol formuyla yeni bayi başvuruları toplayın.",
    "plan": "Kurumsal pakete dahil; kurumsal site için ayrıca paket ücreti yok",
    "sections": [
      {
        "title": "Kataloğunuzun yanında firmanızı anlatın",
        "body": "Logonuz, firma bilgileriniz ve ürün tanıtımlarınızla kurumsal sitenizi oluşturun. Ziyaretçilere kim olduğunuzu anlatın; alışveriş yapacak bayileri şifreli kataloğunuza yönlendirin. Kurumsal site, Kurumsal paketin içindedir."
      },
      {
        "title": "Bayi başvurularını tek yerde toplayın",
        "body": "Sitenizdeki Bayimiz ol formu üzerinden başvuru alın. Gelen talepleri yönetim panelinden inceleyin ve bayi ilişkinizi başvurudaki bilgiler üzerinden değerlendirin. Yeni bir ziyaretçinin sizi aramasını beklemeden iletişim talebi toplarsınız."
      },
      {
        "title": "Google ve yapay zekâ destekli aramalar için açık içerik",
        "body": "Firma ve ürün tanıtım sayfaları taranabilir içerik, sayfa başlıkları, site haritası ve yapılandırılmış verilerle sunulur. Bu altyapı arama sistemlerinin içeriği anlamasına yardımcı olur. Görünürlük, içerik ve ilgili arama sisteminin değerlendirmesine bağlıdır."
      },
      {
        "title": "Kendi adresiniz, kontrollü fiyat erişimi",
        "body": "Kendi alan adınızı bağlayarak markanızla yayın yapın. Açık kurumsal ürün sayfaları fiyat göstermez; bayi fiyatlarına katalog erişimiyle ulaşılır. Alan adı satın alma ve yenileme giderlerini bağlantı öncesinde ayrıca netleştirin."
      }
    ],
    "example": "Yeni bir bayi firmanızı aramada bulabilir, ürün grubunuzu inceleyip başvuru formunu doldurabilir. Siz başvuruyu panelde değerlendirir, uygun fiyat listesiyle çalışmasını sağlarsınız.",
    "related": [
      "bayi-fiyat-listeleri",
      "raporlar"
    ]
  },
  {
    "slug": "raporlar",
    "title": "Katalog arama, ürün ve il raporları",
    "lead": "Müşterilerinizin ne aradığını, hangi ürünleri sepete eklediğini ve hangi illerden hangi fiyat listelerine giriş yapıldığını görün.",
    "plan": "Başlangıç ve üzeri paketlerde",
    "sections": [
      {
        "title": "Aranan ve bulunamayan ürünleri görün",
        "body": "Arama terimlerini, arama sayılarını ve sonuçsuz aramaları inceleyin. Sık aranan bir ürün sizde varsa adını, kodunu ve kategori konumunu kontrol edin. Sonuçsuz aramalar, müşterinin katalogda bulamadığı talepleri fark etmenize yardımcı olur."
      },
      {
        "title": "Görüntülenme ile sepete eklemeyi karşılaştırın",
        "body": "Hangi ürünlerin ilgi çektiğini, hangilerinin sepete eklendiğini takip edin. Çok görüntülenip az sepete eklenen üründe fiyatı, fotoğrafı ve açıklamayı gözden geçirin. Bu göstergeler ilgi ve sepet davranışını anlatır; tamamlanmış satış sayısı değildir."
      },
      {
        "title": "İl ve fiyat listesi girişlerini inceleyin",
        "body": "Hangi illerden hangi fiyat listelerine giriş yapıldığını karşılaştırın. Bölgesel talebi ve bayi gruplarınızın katalog kullanımını değerlendirin. İl bilgisi yaklaşık konum göstergesidir; müşterinin kesin adresi olarak kullanılmaz."
      },
      {
        "title": "Raporu günlük işe dönüştürün",
        "body": "İlgi gören ürünü öne çıkarın, bulunamayan ürünün bilgisini düzeltin veya ilgili gruba kampanya hazırlayın. Değişiklikten sonra raporları yeniden inceleyin. Hangi aksiyonu alacağınıza siz karar verirsiniz."
      }
    ],
    "example": "Örneğin “Type-C kablo” sık aranıyor ama sonuç bulunamıyorsa ürün adlarınızı kontrol edin. Sepete eklenen bir ürün grubu belirli bir ilde yoğun ilgi görüyorsa o bölgeye uygun kampanya hazırlayabilirsiniz.",
    "related": [
      "kampanya-bildirimleri",
      "toplu-urun-yukleme"
    ]
  },
  {
    "slug": "kampanya-bildirimleri",
    "title": "Kampanya bildirimleri ve katalog duyuruları",
    "lead": "Yeni ürünlerinizi duyurun, izin veren müşterilere kampanya bildirimi gönderin ve çalışma saatlerinizi katalogda yönetin.",
    "plan": "Duyuru ve saatler tüm paketlerde · Müşteriye bildirim Profesyonel ve üzeri",
    "sections": [
      {
        "title": "Kampanyayı katalogda görünür kılın",
        "body": "Banner, kampanya kartları, indirimli ve öne çıkan ürünlerle ziyaretçinin ilgili ürünleri bulmasını kolaylaştırın. Kampanya başlığında ne sunduğunuzu, açıklamasında kapsamını açıkça belirtin."
      },
      {
        "title": "İzin veren müşterilere bildirim gönderin",
        "body": "Bildirimleri açan müşterilerinize yeni ürün, kampanya veya stok duyurusu iletin. Bu özellik tarayıcı/cihaz bildirimidir; otomatik WhatsApp veya SMS gönderimi değildir. Bildirimin alınması müşterinin iznine ve cihaz desteğine bağlıdır."
      },
      {
        "title": "Açılış duyurusunu kendiniz yazın",
        "body": "Duyuru penceresinin başlığını ve içeriğini panelden düzenleyin. Teslimat günü değişikliği, kampanya şartları veya önemli bir işletme duyurusunu katalog açılışında gösterin. Güncelliğini yitiren duyuruyu kapatın."
      },
      {
        "title": "Çalışma saatleri ve kapalı mağaza mesajı",
        "body": "Çalışma gün ve saatlerini belirleyin; kapalı olduğunuz zamanları müşterilerinize gösterin. Gerektiğinde mağazayı manuel olarak kapatıp “Mağazamız şu an kapalıdır” mesajıyla ziyaretçiyi bilgilendirin."
      }
    ],
    "example": "Tatil öncesinde duyuru penceresine teslimat takviminizi yazabilir, bildirim izni veren müşterilere sipariş hatırlatması gönderebilir ve kapalı olacağınız saatleri belirleyebilirsiniz.",
    "related": [
      "raporlar",
      "whatsapp-siparis"
    ]
  },
  {
    "slug": "online-odeme",
    "title": "Kataloğunuzdan online ödeme alın",
    "lead": "İyzico/Paytr entegrasyonuyla kataloğunuzdan ödeme alın.",
    "plan": "Kurumsal paket · Sağlayıcı başvurusu ve entegrasyon kapsamı birlikte netleştirilir",
    "sections": [
      {
        "title": "Sipariş ve ödeme ihtiyacınızı birlikte değerlendirelim",
        "body": "Bayilerinizin sipariş oluştururken katalog üzerinden ödeme yapmasını istiyorsanız kullandığınız sağlayıcıyı ve tahsilat düzeninizi bizimle paylaşın. Katalog, sipariş ve ödeme adımlarının işletmenizde nasıl işleyeceğini birlikte belirleyelim."
      },
      {
        "title": "Sağlayıcı hesabı ve işletme koşulları",
        "body": "İyzico veya Paytr üzerinden çalışmak, ilgili sağlayıcının işletme başvurusu ve sözleşme koşullarına tabidir. Mevcut sağlayıcı hesabınız varsa kurulum görüşmesinde belirtin. Sağlayıcının istediği bilgileri kendi güvenli başvuru kanalları üzerinden iletin."
      },
      {
        "title": "Paket bedeli ile tahsilat ücretini ayırın",
        "body": "eKatalox paket ücretini fiyatlandırma sayfasından inceleyin. Ödeme sağlayıcısının işlem komisyonları ve diğer hizmet bedelleri, sağlayıcı sözleşmesine göre ayrıca değerlendirilir. Entegrasyon kapsamını ve varsa ek kurulum hizmetini başlamadan önce netleştirin."
      },
      {
        "title": "İşletmenize uygun kurulum",
        "body": "Kullandığınız sağlayıcıyı, katalog adresinizi ve ödeme ihtiyacınızı paylaşarak bize ulaşın. Paket seçimi, sağlayıcı koşulları ve entegrasyon adımlarını birlikte görüşelim."
      }
    ],
    "example": "Örneğin halihazırda Paytr ile çalışan bir işletme, aynı sağlayıcıyla katalogdan tahsilat ihtiyacını iletebilir. Kurulum kapsamı mevcut hesap ve işletmenin sipariş düzeni üzerinden değerlendirilir.",
    "related": [
      "whatsapp-siparis",
      "kurumsal-site"
    ]
  }
];
