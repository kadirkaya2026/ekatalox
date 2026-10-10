export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  updatedAt?: string;
  status: "published" | "draft";
  sections: {
    id: string;
    title: string;
    paragraphs: string[];
    bullets?: string[];
    /** Bölüm sonunda gösterilen gerçek ekran görüntüleri (public/ altından). */
    images?: { src: string; alt: string; caption?: string; width: number; height: number }[];
    /** İndirilebilir dosya kutusu (ör. Excel şablonu). */
    download?: { href: string; label: string; note?: string };
  }[];
  relatedSlugs: string[];
  featureLinks: { href: string; label: string }[];
}

/** Bugünün tarihi (Europe/Istanbul, YYYY-MM-DD): ileri tarihli yazılar o gün gelince kendiliğinden yayına girer. */
function istanbulToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

// Editorial dates are explicit: builds must not make an old article look new.
const posts: BlogPost[] = [
  {
    slug: "dijital-katalog-nedir",
    title: "Dijital katalog nedir? Toptancılar için kullanım rehberi",
    description: "PDF katalog, online ürün kataloğu ve siparişli katalog arasındaki farkları öğrenin. Bayi fiyatları, ürün güncelleme ve WhatsApp sipariş akışını inceleyin.",
    category: "Dijital katalog",
    publishedAt: "2026-09-27",
    status: "published",
    sections: [
      {
        id: "dijital-katalog-nedir",
        title: "Dijital katalog nedir?",
        paragraphs: [
          "Dijital katalog, bir işletmenin ürünlerini elektronik ortamda sunduğu ürün listesidir. Ürün adı, kodu, görseli, açıklaması ve kullanım amacına göre fiyat bilgisi içerebilir. Bir PDF dosyası da dijital katalogdur; tarayıcıdan açılan, arama ve sipariş özellikleri olan bir site de bu kapsamda değerlendirilebilir.",
          "Toptancı için seçim yalnızca ürünlerin güzel görünmesiyle ilgili değildir. Fiyatların ne sıklıkta değiştiği, kaç bayi grubuyla çalışıldığı ve siparişin nasıl toplandığı da önemlidir. İhtiyacınız, düzenli aralıklarla paylaşılan bir ürün sunumu veya her gün kullanılan bir bayi sipariş ekranı olabilir.",
        ],
      },
      {
        id: "pdf-ve-online-katalog",
        title: "PDF katalog ile online katalog arasındaki fark",
        paragraphs: [
          "PDF katalog sabit bir dosyadır. Bir koleksiyonu sunmak, e-postayla göndermek veya indirildikten sonra çevrimdışı incelemek için kullanılabilir. Ürün ya da fiyat değiştiğinde dosyanın güncellenmesi ve yeni sürümün müşterilere ulaştırılması gerekir. Eski dosyayı saklayan bir müşteri eski bilgileri görmeye devam edebilir.",
          "Online katalog bir bağlantı üzerinden açılır. Ürün bilgilerini merkezden güncellediğinizde müşteriniz kataloğu yeniden açarak güncel içeriğe ulaşır. Kategori ve arama gibi araçlar, özellikle çok sayıda ürünün bulunduğu listelerde ürün bulmayı kolaylaştırır. Ancak online kullanım için internet bağlantısı gerekir.",
        ],
        bullets: [
          "Koleksiyon sunumu ve çevrimdışı paylaşım öncelikliyse PDF kullanımı işinize uyabilir.",
          "Sık fiyat değişikliği, geniş ürün listesi ve bayi grupları varsa online katalog kullanımını değerlendirin.",
          "Ürün seçiminin siparişe dönüşmesini istiyorsanız katalogda sepet ve sipariş akışının nasıl çalıştığını inceleyin.",
        ],
      },
      {
        id: "bayi-fiyatlari",
        title: "Bayi fiyatlarını nasıl sunabilirsiniz?",
        paragraphs: [
          "Bayi, perakende ve özel müşteri gruplarına farklı fiyatlarla çalışıyorsanız her grup için ayrı PDF hazırlamak takip yükünü artırabilir. Şifreli [fiyat listeleri](/ozellikler/bayi-fiyat-listeleri) kullanan bir katalogda, müşterinin giriş yaptığı listeye ait fiyatlar gösterilir. Ürün bilgileri ise aynı katalog üzerinden yönetilir.",
          "eKatalox’ta fiyat listelerini ve giriş şifrelerini panelden yönetebilirsiniz. Kataloğu tamamen şifreli kullanabilir veya şifresiz ziyaretçilere ürünleri fiyatsız gösterebilirsiniz. Herkese açık kurumsal ürün sayfaları bayi fiyatlarını yayınlamaz. Açık açıklamalara veya görsellere ayrıca fiyat yazarsanız bunların da ziyaretçiler tarafından görülebileceğini göz önünde bulundurun.",
        ],
      },
      {
        id: "katalogdan-siparise",
        title: "Katalogdan WhatsApp siparişine geçiş",
        paragraphs: [
          "Sipariş özelliği olan bir katalogda müşteri ürünlerini seçip sepet hazırlayabilir. Adet veya koli bilgileri, seçilen ürünler ve tutarlar aynı siparişte toplanır. Böylece işletmenin farklı mesajlardan ürün kodlarını ve miktarları bir araya getirmesi kolaylaşır.",
          "eKatalox’ta oluşan siparişler Siparişlerim sayfasında takip edilir. Müşteri PDF sipariş fişi bağlantısıyla [WhatsApp’a](/ozellikler/whatsapp-siparis) geçer ve mesajı göndererek paylaşır. İşletme isterse kayıtlı WhatsApp numarasını alıcı olarak kullanır; isterse müşterinin göndereceği kişiyi seçmesine izin verir. PDF sipariş fişi, ürünlerin tamamını tanıtan bir PDF katalogdan farklıdır.",
        ],
      },
      {
        id: "baslangic-kontrol-listesi",
        title: "İlk kataloğunuzu hazırlarken neleri kontrol etmelisiniz?",
        paragraphs: [
          "Önce ürün verilerinizi düzenleyin. Tutarlı ürün kodları, anlaşılır isimler ve doğru fotoğraflar hem müşterinin ürün bulmasını hem de sizin güncelleme yapmanızı kolaylaştırır. Mevcut [Excel](/ozellikler/toplu-urun-yukleme) listeniz varsa aktarım şablonuyla eşleştirin; önce küçük bir ürün grubuyla sonuçları kontrol edin.",
        ],
        bullets: [
          "Ürün kodu, ad, kategori, birim ve koli içi adet bilgilerini hazırlayın.",
          "Ürün görsellerini doğru model kodlarıyla eşleştirin.",
          "Hangi müşteri grubunun hangi fiyat listesini kullanacağını belirleyin.",
          "Sipariş için gereken telefon, adres ve diğer alanların zorunluluğunu seçin.",
          "Kataloğu telefonda açıp arama, ürün seçimi ve sipariş paylaşımını deneyin.",
        ],
      },
      {
        id: "dogru-cozumu-secme",
        title: "İşletmenize uygun çözümü seçin",
        paragraphs: [
          "Karar verirken yalnız tasarımı değil günlük işinizi düşünün: fiyatları kim güncelliyor, müşteri ürünü nasıl buluyor ve sipariş size nasıl ulaşıyor? Yeni katalog bu adımları sadeleştiriyorsa işletmeniz için anlamlı bir araç hâline gelir. PDF sunumu ile online sipariş kataloğunu farklı ihtiyaçlar için birlikte de kullanabilirsiniz.",
          "eKatalox’ta ürün aktarımı, şifreli bayi fiyat listeleri ve WhatsApp sipariş akışını inceleyerek başlayabilirsiniz. Paketlerin güncel ürün ve fiyat listesi limitleri fiyatlandırma sayfasında yer alır. Kendi ürünlerinizi yüklemeden önce demo kataloğu telefonda denemek, bayinizin yaşayacağı akışı görmenizi sağlar.",
        ],
      },
    ],
    relatedSlugs: ["ucretsiz-dijital-katalog-olusturma", "pdf-katalog-mu-online-katalog-mu", "whatsapp-toptan-siparis"],
    featureLinks: [
      { href: "/ozellikler/bayi-fiyat-listeleri", label: "Şifreli bayi fiyat listeleri" },
      { href: "/ozellikler/whatsapp-siparis", label: "WhatsApp sipariş akışı" },
      { href: "/ozellikler/toplu-urun-yukleme", label: "Excel’den ürün ve görsel yükleme" },
      { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
    ],
  },
{
  "slug": "ucretsiz-dijital-katalog-olusturma",
  "title": "Ücretsiz dijital katalog nasıl oluşturulur?",
  "description": "Ürün hazırlığından bayi fiyatlarına ve ilk siparişe: ücretsiz online kataloğunuzu adım adım kurun, paket sınırlarını ve kontrol adımlarını öğrenin.",
  "category": "Kurulum",
  "publishedAt": "2026-09-27",
  "status": "published",
  "sections": [
    {
      "id": "once-ihtiyac",
      "title": "Önce kataloğun ne yapacağını belirleyin",
      "paragraphs": [
        "Ücretsiz dijital katalog oluşturmak için ilk adım ürün fotoğraflarını yerleştirmek değildir. Kimin kataloğa gireceğini, fiyatların herkese açık olup olmayacağını ve müşterinin siparişi nasıl ileteceğini belirleyin. Bu kararlar, ürün listesini nasıl hazırlayacağınızı da etkiler.",
        "Örneğin yalnız ürünlerini tanıtmak isteyen bir üreticiyle, her gün farklı bayi fiyatlarıyla sipariş alan bir toptancının ihtiyacı aynı olmayabilir. eKatalox’ta şifreli [fiyat listeleri](/ozellikler/bayi-fiyat-listeleri) ve WhatsApp sipariş akışıyla başlayabilirsiniz. Müşteriniz kataloğu tarayıcıdan açar; uygulama indirmesi gerekmez."
      ]
    },
    {
      "id": "ucretsiz-plan",
      "title": "Ücretsiz planın sınırlarını bilin",
      "paragraphs": [
        "eKatalox’un ücretsiz planında 250 ürün, 2 fiyat listesi ve aylık 1.000 ziyaretçi sınırı bulunur. Süre sınırı ve kart bilgisi zorunluluğu yoktur; katalogda eKatalox tanıtımları görünür. Güncel kapsamı kayıt olmadan önce fiyatlandırma sayfasından kontrol edin.",
        "Ücretsiz plan, ücretli paketlerin 14 günlük denemesinden farklıdır. İhtiyacınız temel bir katalog kurup sipariş akışını denemekse ücretsiz planla başlayabilirsiniz. Daha fazla ürün, liste veya raporlama gerekiyorsa paket karşılaştırmasını inceleyin."
      ]
    },
    {
      "id": "urunleri-hazirlama",
      "title": "Ürünlerinizi küçük bir grupla hazırlayın",
      "paragraphs": [
        "Önce 5–10 üründen oluşan bir deneme listesi hazırlayın. Ürün kodlarını tutarlı yazın, fotoğrafları doğru modellerle eşleştirin ve fiyatların hangi birime ait olduğunu belirtin. İlk denemede doğru sonuç almak, yüzlerce ürün yükledikten sonra düzeltme yapmaktan daha kolaydır."
      ],
      "bullets": [
        "Firma adı ve logonuzu hazırlayın.",
        "Ürün adı, kodu, kategori, birim ve koli içi adet bilgilerini kontrol edin.",
        "Ürünleri panelden ekleyin veya [Excel](/ozellikler/toplu-urun-yukleme)/CSV şablonuyla aktarın.",
        "Toplu fotoğraf yükleyecekseniz model/SKU eşleşmelerini hazırlayın."
      ]
    },
    {
      "id": "fiyat-ve-siparis",
      "title": "Fiyat listelerini ve sipariş bilgilerini ayarlayın",
      "paragraphs": [
        "Ücretsiz plandaki iki listeyi işletmenizin müşteri gruplarına göre kullanın. Örneğin bayi ve özel müşteri için ayrı listeler tanımlayıp giriş şifrelerini ilgili listeye bağlayabilirsiniz. Her müşteriye, kullanmasını istediğiniz listenin erişimini paylaşın.",
        "Sipariş formunda hangi bilgilerin zorunlu olacağını seçin. Teslimat yapıyorsanız telefon ve adres gerekebilir; mağazadan teslimde aynı alanlara ihtiyaç duymayabilirsiniz. Minimum sepet tutarı kullanacaksanız tek para birimli sepetle deneyin; karışık para birimli sepetlerde bu tutar kontrolü uygulanmaz."
      ]
    },
    {
      "id": "paylasmadan-once",
      "title": "Bağlantıyı dağıtmadan önce deneyin",
      "paragraphs": [
        "Kataloğu telefonda müşteri gibi açın. Doğru fiyat listesini gördüğünüzü, aramada ürün kodunu bulabildiğinizi ve adet/koli seçiminin beklediğiniz gibi çalıştığını kontrol edin. Test siparişini gerçek müşteri siparişiyle karışmayacak biçimde adlandırın.",
        "Sipariş oluştuğunda Siparişlerim sayfasını kontrol edin. [WhatsApp’a](/ozellikler/whatsapp-siparis) geçince mesajı müşterinin gönderdiğini unutmayın: bağlantının açılması, mesajın gönderildiği anlamına gelmez. Test tamamlandığında katalog bağlantısını ve ilgili şifreyi bayilerinizle paylaşabilirsiniz."
      ]
    }
  ],
  "relatedSlugs": [
    "excelden-urun-katalogu",
    "bayiye-ozel-fiyat-listesi",
    "whatsapp-toptan-siparis"
  ],
  "featureLinks": [
    {
      "href": "/ozellikler/toplu-urun-yukleme",
      "label": "Toplu ürün yükleme özellikleri"
    },
    {
      "href": "/fiyatlandirma",
      "label": "Ücretsiz plan ve paket sınırları"
    },
    { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
  ]
},
{
  "slug": "pdf-katalog-mu-online-katalog-mu",
  "title": "PDF katalog mu online katalog mu?",
  "description": "PDF ve online kataloğu güncelleme, fiyat gizliliği, internet ihtiyacı ve sipariş toplama açısından karşılaştırın. İşletmenize uygun kullanım biçimini seçin.",
  "category": "Katalog seçimi",
  "publishedAt": "2026-09-27",
  "status": "published",
  "sections": [
    {
      "id": "kullanim-amaci",
      "title": "Seçimi kullanım amacına göre yapın",
      "paragraphs": [
        "PDF katalog, ürünleri sabit bir dosyada sunar. Online katalog ise bir bağlantı üzerinden açılır ve bilgileri merkezden güncellemeye imkân verir. Hangisinin daha uygun olduğu; ürünlerinizin değişim sıklığına, müşterilerinizin çalışma biçimine ve sipariş ihtiyacına bağlıdır.",
        "Sezonda bir değişen koleksiyon sunumuyla günlük fiyat güncellemesi yapılan toptan satış listesini aynı ölçütlerle değerlendirmeyin. İkisini birlikte kullanmanız da mümkündür: PDF ürün sunumunu, online katalog ise güncel fiyat ve sipariş akışını taşıyabilir."
      ]
    },
    {
      "id": "guncelleme",
      "title": "Fiyat ve ürün güncellemesi",
      "paragraphs": [
        "PDF’de yeni fiyatı yazdıktan sonra dosyayı yeniden üretip dağıtmanız gerekir. Daha önce indirilen kopyalar kendiliğinden değişmez. Dosyada sürüm veya tarih belirtmek, müşterinin hangi listeyi kullandığını anlamayı kolaylaştırır.",
        "Online katalogda fiyatı panelden güncellediğinizde müşteri kataloğu yeniden açarak güncel içeriğe ulaşır. Örneğin haftada birkaç kez fiyat değiştiriyorsanız, aynı bağlantıyı kullanmak her seferinde yeni dosya göndermekten daha az takip gerektirebilir."
      ]
    },
    {
      "id": "fiyat-gizliligi",
      "title": "Bayi grupları ve fiyat gizliliği",
      "paragraphs": [
        "Farklı müşteri grupları için ayrı PDF’ler hazırlayabilirsiniz; ancak bu dosyaların doğru kişilere gönderilmesi ve eski sürümlerin takip edilmesi gerekir. Müşterinin indirdiği dosyayı daha sonra geri almak veya tüm kopyalarını güncellemek mümkün olmayabilir.",
        "Şifreli online katalogda [fiyat listeleri](/ozellikler/bayi-fiyat-listeleri) giriş erişimiyle ayrılır. eKatalox’ta şifresiz ziyaretçilere fiyatsız ürün gösterimi de kullanılabilir. Bununla birlikte liste şifresini bilen kişi o listeye erişebilir; şifre paylaşımını işletmenizin politikasına göre yönetmelisiniz."
      ]
    },
    {
      "id": "internet-ve-siparis",
      "title": "İnternet erişimi ve sipariş toplama",
      "paragraphs": [
        "İndirilmiş bir PDF internet olmadan okunabilir. Online kataloğun güncel içeriğine ulaşmak ise internet bağlantısı gerektirir. Saha ziyareti veya bağlantının zayıf olduğu ortamlarda bu farkı hesaba katın.",
        "PDF’den sipariş alan bir işletmede müşteri ürün kodlarını mesajla iletebilir. Siparişli online katalogda ise müşteri ürünleri seçip sepet hazırlayabilir. eKatalox’ta PDF sipariş fişi bağlantısı [WhatsApp](/ozellikler/whatsapp-siparis) üzerinden müşteri tarafından paylaşılır ve sipariş panelde takip edilir. Bu fiş, tüm ürünlerin yer aldığı PDF katalog değildir."
      ]
    },
    {
      "id": "karar-listesi",
      "title": "Hangi durumda hangisini kullanmalısınız?",
      "paragraphs": [
        "Örneğin yılda iki koleksiyon çıkaran bir firma tanıtım için PDF’yi tercih edebilir. Aynı firma bayilerinin güncel fiyat görmesi ve sipariş vermesi için online kataloğu da kullanabilir. Böylece iki araç farklı işleri üstlenir."
      ],
      "bullets": [
        "Sabit tasarımlı sunum ve çevrimdışı inceleme: PDF’yi değerlendirin.",
        "Sık fiyat güncelleme ve aramayla ürün bulma: online kataloğu değerlendirin.",
        "Farklı bayi listeleri ve sepetten sipariş: bu işlevleri destekleyen online katalog seçin.",
        "Maliyet karşılaştırmasında paket bedeli kadar liste hazırlama ve güncelleme süresini de dikkate alın.",
        "Karar öncesinde kendi ürün grubunuzla telefonda küçük bir deneme yapın."
      ]
    }
  ],
  "relatedSlugs": [
    "ucretsiz-pdf-katalog-hazirlama",
    "dijital-katalog-nedir",
    "ucretsiz-dijital-katalog-olusturma"
  ],
  "featureLinks": [
    {
      "href": "/ozellikler/bayi-fiyat-listeleri",
      "label": "Fiyat listelerini ayrı sunma"
    },
    {
      "href": "/ozellikler/whatsapp-siparis",
      "label": "Katalogdan sipariş toplama"
    },
    { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
  ]
},
{
  "slug": "ucretsiz-pdf-katalog-hazirlama",
  "title": "Ücretsiz PDF katalog hazırlama rehberi",
  "description": "Ürün tablosu, görseller, sayfa düzeni ve dışa aktarma adımlarıyla ücretsiz PDF katalog hazırlayın. Paylaşmadan önce kontrol etmeniz gerekenleri öğrenin.",
  "category": "PDF katalog",
  "publishedAt": "2026-09-27",
  "status": "published",
  "sections": [
    {
      "id": "icerik-hazirligi",
      "title": "PDF katalog oluşturmadan önce veriyi düzenleyin",
      "paragraphs": [
        "Ücretsiz PDF katalog hazırlamak için PDF olarak dışa aktarabilen bir belge veya sunum düzenleyicisi kullanabilirsiniz. Kullandığınız aracın ücretsiz kapsamını ve görsellerin kullanım haklarını kontrol edin. Başlangıçta karmaşık bir tasarımdan çok, doğru ve tutarlı ürün bilgilerine odaklanın.",
        "Bir çalışma tablosunda ürün kodu, ad, kısa açıklama, kategori, birim ve varsa fiyat sütunlarını oluşturun. Fotoğrafları ürün koduyla adlandırın. Örneğin “KBL-101” kodlu ürünün görseli aynı kodla saklanırsa fotoğraf seçerken yanlış model kullanma ihtimali azalır."
      ]
    },
    {
      "id": "sayfa-duzeni",
      "title": "Tekrarlanabilir bir ürün kartı tasarlayın",
      "paragraphs": [
        "Kapakta firma adı, katalog konusu ve iletişim bilgilerine yer verin. Ardından kategori başlıkları kullanın; her ürün kartında aynı bilgi sırasını koruyun. Ürün adı, kodu ve satış birimi küçük ekranda okunacak kadar belirgin olsun.",
        "İlk sayfayı hazırladıktan sonra çoğaltın. Fotoğrafları aynı alana yerleştirin ama oranlarını bozarak esnetmeyin. Uzun açıklamaları kısaltın; ürünün ne olduğunu anlamak için gerekli ölçü, malzeme veya uyumluluk bilgilerini koruyun. Telefon ekranında okunamayacak kadar çok ürünü tek sayfaya sıkıştırmayın."
      ]
    },
    {
      "id": "fiyat-ve-surum",
      "title": "Fiyat, birim ve sürümü açık yazın",
      "paragraphs": [
        "Fiyat gösteriyorsanız hangi para biriminde ve hangi satış birimi için olduğunu belirtin. “Koli” yazmak tek başına yeterli olmayabilir; koli içi adedi de ekleyin. Ürün bilgisiyle fiyat bilgisini karıştırmayacak bir düzen kullanın.",
        "Dosya adında anlaşılır bir tarih veya sürüm kullanabilirsiniz: “firma-katalog-2026-09.pdf” gibi. İç sayfada güncelleme tarihini belirtmek, müşterinin elindeki dosyayı karşılaştırmasını kolaylaştırır. Bayi ve perakende fiyatları ayrıysa dosyaları ve dağıtım listelerini de ayrı tutun."
      ]
    },
    {
      "id": "pdf-disari-aktar",
      "title": "PDF olarak dışa aktarın ve kontrol edin",
      "paragraphs": [
        "Düzenleyicinin PDF dışa aktarma seçeneğini kullanın. Dosyayı yalnız bilgisayarda değil telefonda da açın. Fotoğraflar net mi, yazılar okunuyor mu ve sayfalar doğru sırada mı kontrol edin. Dosya çok büyükse görselleri metin okunurluğunu bozmadan uygun boyuta indirin."
      ],
      "bullets": [
        "Ürün kodu ile fotoğraf aynı ürüne mi ait?",
        "Adet, paket ve koli bilgileri anlaşılır mı?",
        "İletişim bilgileri ve varsa bağlantılar doğru mu?",
        "Dosya adı ve içerikteki sürüm tarihi tutarlı mı?",
        "Katalogda istemeden başka müşteri grubunun fiyatı yer alıyor mu?"
      ]
    },
    {
      "id": "guncelleme-plani",
      "title": "Dağıtımdan sonra güncellemeyi planlayın",
      "paragraphs": [
        "PDF paylaşıldığında müşteriler dosyanın bir kopyasını saklayabilir. Fiyat değişikliğinde yeni dosyayı göndermek, eski kopyanın silindiği anlamına gelmez. Bu yüzden güncelleme sıklığınızı ve müşterilere hangi dosyanın geçerli olduğunu nasıl bildireceğinizi belirleyin.",
        "Sık fiyat değiştiriyor veya müşterinin katalogdan ürün seçerek sipariş oluşturmasını istiyorsanız online katalog seçeneğini değerlendirebilirsiniz. eKatalox ürünleri online katalogda sunar ve sipariş için PDF fişi oluşturur. Bu rehberde anlatılan PDF ürün kataloğu tasarımını ayrı bir belge düzenleyicisinde yaparsınız; PDF sipariş fişiyle karıştırmayın."
      ]
    }
  ],
  "relatedSlugs": [
    "pdf-katalog-mu-online-katalog-mu",
    "ucretsiz-dijital-katalog-olusturma",
    "excelden-urun-katalogu"
  ],
  "featureLinks": [
    {
      "href": "/ozellikler/toplu-urun-yukleme",
      "label": "Ürün listenizi online kataloğa aktarın"
    },
    {
      "href": "/nasil-calisir",
      "label": "Online katalog akışını inceleyin"
    },
    { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
  ]
},
{
  "slug": "whatsapp-toptan-siparis",
  "title": "WhatsApp’tan toptan sipariş nasıl toplanır?",
  "description": "Ürün seçimi, sepet, PDF fişi ve WhatsApp paylaşımını adım adım inceleyin. Siparişleri panelde takip edin ve mesajlardan ürün toplama yükünü azaltın.",
  "category": "Sipariş yönetimi",
  "publishedAt": "2026-09-27",
  "status": "published",
  "sections": [
    {
      "id": "duzenli-siparis",
      "title": "Önce sipariş bilgisini standartlaştırın",
      "paragraphs": [
        "[WhatsApp](/ozellikler/whatsapp-siparis) üzerinden toptan sipariş toplarken en sık yaşanan zorluklardan biri, ürün ve miktar bilgisinin farklı mesajlara dağılmasıdır. Bir müşteri ürün kodunu, diğeri fotoğrafı, başka biri de sesli mesajı kullanabilir. Hazırlık sırasında hangi ürünün kaç adet istendiğini yeniden sormanız gerekebilir.",
        "Müşteriye ortak bir ürün listesi ve sipariş biçimi sunmak bu karışıklığı azaltır. Siparişli katalogda ürün kodu, birim ve miktar sepetten gelir. Formdaki müşteri alanları da işletmenizin ihtiyaç duyduğu bilgileri toplar."
      ]
    },
    {
      "id": "urun-secimi",
      "title": "1. Müşteri kendi fiyatıyla ürün seçer",
      "paragraphs": [
        "Bayinize katalog bağlantısını ve ilgili [fiyat listesi](/ozellikler/bayi-fiyat-listeleri)ne ait giriş bilgisini gönderin. Müşteri tarayıcıdan kataloğa girer, ürünleri kategori veya aramayla bulur ve sepete ekler. Uygulama indirmesi gerekmez.",
        "Koliyle satılan üründe koli içi adedi net gösterin. Örneğin bir koli 12 adet içeriyorsa müşteri 2 koli seçtiğinde 24 adet istediğini anlamalıdır. Ürün adı ve kodu doğru olduğunda hazırlayan kişi de sipariş fişindeki kalemi daha kolay eşleştirir."
      ]
    },
    {
      "id": "sepet-ve-form",
      "title": "2. Sepet ve gerekli bilgiler tamamlanır",
      "paragraphs": [
        "Sipariş formunda ad, telefon, adres ve not alanlarından hangilerinin gerekli olduğunu belirleyin. Teslimat için gereken bilgiyi zorunlu tutun; gerekmeyen alanları kaldırın. Minimum sepet tutarı kullanıyorsanız müşterinin karşılaşacağı kuralı önceden açıklayın.",
        "Müşteri sepetini tamamladığında ürün, miktar ve tutar bilgilerini tekrar kontrol etmelidir. Adres veya not yanlışsa sipariş hazırlığı sırasında ek yazışma gerekir. Basit bir form, eksik bilgiyle sipariş almakla aynı şey değildir; amaç doğru bilgiyi az adımda toplamaktır."
      ]
    },
    {
      "id": "whatsapp-paylasimi",
      "title": "3. PDF sipariş fişi bağlantısı paylaşılır",
      "paragraphs": [
        "eKatalox’ta oluşan siparişin PDF fişi bağlantısıyla WhatsApp’a geçilir. Mesajı müşteri göndererek paylaşır. WhatsApp ekranının açılması veya mesaj metninin hazırlanması, mesajın karşı tarafa ulaştığı anlamına gelmez.",
        "Sabit alıcı kullanırsanız paylaşım işletmenizin kayıtlı numarasına yönlenir. Bu seçeneği kapattığınızda müşteri göndereceği kişiyi seçebilir; örneğin kendi toptancısına iletebilir. İşletmenizde hangi akışın geçerli olduğunu bayiye anlatın."
      ]
    },
    {
      "id": "panelde-takip",
      "title": "4. Siparişi panelden takip edin",
      "paragraphs": [
        "Siparişleri Siparişlerim sayfasından inceleyin. Bildirimleri açtıysanız yeni siparişten haberdar olabilirsiniz. Sipariş kaydı ile WhatsApp mesajını birlikte değerlendirin; bir fişin oluşmasını tahsilatın yapıldığı veya siparişin sevk edildiği anlamında yorumlamayın."
      ],
      "bullets": [
        "Ürün kodu, adet ve koli bilgisini fişte kontrol edin.",
        "Teslimat bilgilerini ve müşteri notunu inceleyin.",
        "Aynı müşteri yeniden sipariş oluşturduysa mükerrer hazırlığı önlemek için kayıtları karşılaştırın.",
        "Hazırlık ve teslimat düzeninizi müşteriye açıkça bildirin.",
        "Bayiye ilk kullanımda küçük bir örnek siparişle akışı gösterin."
      ]
    }
  ],
  "relatedSlugs": [
    "toptan-siparis-kurallari",
    "bayiye-ozel-fiyat-listesi",
    "ucretsiz-dijital-katalog-olusturma"
  ],
  "featureLinks": [
    {
      "href": "/ozellikler/whatsapp-siparis",
      "label": "WhatsApp sipariş özellikleri"
    },
    {
      "href": "/ozellikler/online-odeme",
      "label": "Katalogdan online ödeme"
    },
    { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
  ]
},
{
  "slug": "bayiye-ozel-fiyat-listesi",
  "title": "Bayilere farklı fiyat listeleri nasıl sunulur?",
  "description": "Bayi, perakende ve özel müşteri fiyatlarını tek katalogda yönetin. Liste planlama, şifre dağıtımı ve fiyat kontrolünü örneklerle öğrenin.",
  "category": "Bayi yönetimi",
  "publishedAt": "2026-09-27",
  "status": "published",
  "sections": [
    {
      "id": "gruplari-belirleyin",
      "title": "Müşteri gruplarını tanımlayın",
      "paragraphs": [
        "[Bayiye özel fiyat listesi](/ozellikler/bayi-fiyat-listeleri) hazırlarken önce fiyat farkının nedenini belirleyin. Perakende, düzenli bayi veya özel anlaşmalı müşteri gibi gruplar aynı ürün için farklı fiyatla çalışabilir. Her müşteri için yeni liste açmak yerine ortak kurallarla çalışan grupları belirlemek yönetimi kolaylaştırır.",
        "Örneğin üç grubunuz varsa listeleri “Bayi”, “Perakende” ve “Özel” diye adlandırabilirsiniz. Liste adlarının anlaşılır olması, daha sonra fiyat güncellerken yanlış grupta işlem yapma ihtimalini azaltır. Bu adlandırma bir örnektir; kendi ticari düzeninize göre uyarlayın."
      ]
    },
    {
      "id": "tek-urun-farkli-fiyat",
      "title": "Ürünü tek kez, fiyatı listeye göre yönetin",
      "paragraphs": [
        "Aynı ürün için ayrı kataloglar tutmak ürün adının, fotoğrafının ve kodunun kopyalanmasına yol açar. Çoklu fiyat listesinde ürün bilgisini ortak tutup fiyatı ilgili listeye göre sunabilirsiniz. Müşterinin gördüğü fiyat, giriş yaptığı listeye bağlıdır.",
        "Örnek olarak A-100 kodlu ürünün bayi fiyatı 100 TL, perakende fiyatı 120 TL olabilir. Bunlar yalnız anlatım amaçlı rakamlardır. Önemli olan, her iki listede de aynı ürün kodunun ve aynı satış biriminin kullanılmasıdır; adet fiyatını koli fiyatıyla karşılaştırmayın."
      ]
    },
    {
      "id": "erisim-paylasimi",
      "title": "Şifreleri doğru gruba dağıtın",
      "paragraphs": [
        "eKatalox’ta giriş şifrelerini ilgili fiyat listesine bağlayabilirsiniz. Müşterinize katalog bağlantısıyla birlikte kullanacağı şifreyi iletin. Bir listeye erişim sağlayan şifreyi bilen kişi o listeyi açabilir; erişim dağıtımını buna göre yönetin.",
        "Şifresiz ziyaretçiye ürünleri fiyatsız gösterme veya kataloğu tamamen şifreli kullanma seçeneğini değerlendirin. Açık kurumsal ürün sayfaları bayi fiyatlarını yayınlamaz. Fiyatı ayrıca ürün açıklamasına veya fotoğrafın üzerine yazmak ise açık içerikte görünmesine neden olabilir."
      ]
    },
    {
      "id": "liste-kontrolu",
      "title": "Güncellemeden sonra müşteri gibi kontrol edin",
      "paragraphs": [
        "Fiyat değişikliği yaptığınızda yalnız paneldeki rakama bakmayın. İlgili listeye ait erişimle kataloğu açın, birkaç ürünü ve sepet toplamını kontrol edin. Birden fazla listeyi güncellediyseniz her listeyi ayrı örnekle deneyin."
      ],
      "bullets": [
        "Doğru şifre doğru fiyat listesine mi bağlı?",
        "Fiyatın para birimi ve satış birimi doğru mu?",
        "Aynı ürünün kodu tüm listelerde tutarlı mı?",
        "[Kampanya](/ozellikler/kampanya-bildirimleri) veya indirim varsa müşteri ekranındaki sonuç beklediğiniz gibi mi?",
        "Eski erişimi değiştirdiyseniz ilgili müşterilere güncel bilgiyi ilettiniz mi?"
      ]
    },
    {
      "id": "paket-secimi",
      "title": "Liste sayısını ihtiyaca göre seçin",
      "paragraphs": [
        "eKatalox’ta ücretsiz plan 2, Başlangıç 3, Profesyonel 15 fiyat listesi sunar; Kurumsal pakette fiyat listesi sınırı yoktur. Paket seçmeden önce kaç ayrı fiyat düzenine gerçekten ihtiyacınız olduğunu çıkarın ve güncel koşulları fiyatlandırma sayfasından inceleyin.",
        "Liste sayısının artması tek başına daha iyi bayi yönetimi sağlamaz. Net grup adları, düzenli fiyat kontrolü ve doğru erişim paylaşımı günlük işi kolaylaştırır. Başlangıç ve üzeri paketlerde il–fiyat listesi giriş [raporlarıyla](/ozellikler/raporlar) katalog kullanımını da inceleyebilirsiniz."
      ]
    }
  ],
  "relatedSlugs": [
    "whatsapp-toptan-siparis",
    "toptan-siparis-kurallari",
    "pdf-katalog-mu-online-katalog-mu"
  ],
  "featureLinks": [
    {
      "href": "/ozellikler/bayi-fiyat-listeleri",
      "label": "Şifreli fiyat listeleri"
    },
    {
      "href": "/ozellikler/raporlar",
      "label": "İl ve liste giriş raporları"
    },
    { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
  ]
},
{
  "slug": "excelden-urun-katalogu",
  "title": "Excel’den ürün kataloğu oluşturma ve toplu görsel yükleme",
  "description": "Excel/CSV ürün listenizi hazırlayın, model kodlarını düzenleyin ve görselleri eşleştirin. Toplu aktarımda sık karşılaşılan hataları örneklerle kontrol edin.",
  "category": "Ürün aktarımı",
  "publishedAt": "2026-09-27",
  "status": "published",
  "sections": [
    {
      "id": "sablon",
      "title": "Panelin şablonuyla başlayın",
      "paragraphs": [
        "[Excel’den](/ozellikler/toplu-urun-yukleme) ürün kataloğu oluştururken ilk iş, elinizdeki dosyanın sütunlarını aktarım şablonuyla eşleştirmektir. eKatalox panelindeki şablonu indirin ve güncel alanları inceleyin. Farklı bir sistemden aldığınız Excel dosyasının doğrudan aynı düzende olduğunu varsaymayın.",
        "Ürün kodu, ad, kategori, fiyat, birim ve koli içi adet gibi bilgileri ayrı sütunlarda tutun. Bir hücreye “Kablo / 12’li koli / 100 TL” yazmak yerine bilgileri ilgili alanlara ayırın. Dosya XLSX veya CSV olarak aktarılabilir; sütun adları için paneldeki güncel şablonu esas alın."
      ]
    },
    {
      "id": "urun-kodu",
      "title": "Ürün kodunu sabit tutun",
      "paragraphs": [
        "Ürün kodu, görselleri ve güncellemeleri doğru ürüne bağlamak için önemlidir. Kodlarda baştaki sıfırlar anlamlıysa Excel’in bunları sayıya çevirip silmediğini kontrol edin. “00125” ile “125” sizin sisteminizde farklı kodlar olabilir.",
        "Aynı kodu birbirinden farklı iki üründe kullanmayın. Bir ürünün adı değişse bile kodunu gereksiz yere değiştirmemek sonraki işlemleri kolaylaştırır. Dosyayı başka ekip arkadaşınız hazırlıyorsa kod biçimi üzerinde önceden anlaşın."
      ]
    },
    {
      "id": "ornek-hatalar",
      "title": "Aktarmadan önce yaygın hataları düzeltin",
      "paragraphs": [
        "Örneğin fiyat sütununda “499 TL” gibi metin yerine şablonun beklediği sayı biçimini kullanın. Ondalık ve binlik ayırıcıları kontrol edin. Koli içi adet sütununda da “12 adet” ifadesi yerine şablonun beklediği alan biçimini kullanın.",
        "Başlık satırının dosyada doğru yerde olduğundan emin olun. Birleştirilmiş hücreler, araya eklenen açıklama satırları ve tekrar eden başlıklar tabloyu belirsizleştirebilir. Aktarım önizlemesindeki eşleşmeleri okuyun; hatalı satırları kaydetmeden önce düzeltin."
      ],
      "bullets": [
        "Ürün kodu boş veya tekrarlı mı?",
        "Fiyat ve para birimi doğru alanlarda mı?",
        "Kategori adları tutarlı mı?",
        "Satış birimi ile koli içi adet birbirini açıklıyor mu?",
        "Seçtiğiniz pakette yeterli ürün kapasitesi var mı?"
      ]
    },
    {
      "id": "toplu-gorsel",
      "title": "Görselleri model/SKU koduyla eşleştirin",
      "paragraphs": [
        "Ürün fotoğraflarını model veya SKU kodlarıyla eşleştirerek toplu yükleyebilirsiniz. Toplu görsel aracı ZIP dosyalarını da işler. Görselleri hazırlarken dosya adlarını anlaşılır ve ürün kodlarıyla tutarlı tutun; eşleşme sonucunu kontrol edin.",
        "Örneğin ABC-100 ürününe ait fotoğrafı aynı kodla hazırlamak eşleştirmeyi kolaylaştırır. Dosya adı benzer diye doğru ürün olduğunu varsaymayın; renk, model ve paket farkını da görselden kontrol edin. Düşük çözünürlüklü veya yanlış ürün fotoğrafı, toplu yüklemede de aynı şekilde kataloğa taşınabilir."
      ]
    },
    {
      "id": "kucuk-deneme",
      "title": "Önce küçük bir dosyayla deneyin",
      "paragraphs": [
        "İlk aktarımda farklı kategori ve birimlerden birkaç ürün seçin. İşlem sonrasında kataloğu açıp ürün adı, fiyatı, fotoğrafı ve kategorisini kontrol edin. Böylece aynı biçim hatasını tüm listenize yaymadan fark edebilirsiniz.",
        "Örnek liste doğruysa kalan ürünleri aktarın. Toplu fiyat güncellemesi yaparken kaynak dosyanın bir kopyasını saklamak ve sonrasında birkaç listeyi müşteri gibi kontrol etmek faydalıdır. Excel aktarımı ürün verisini taşır; sepet ve sipariş kurallarını ayrıca ayarlamanız gerekir."
      ]
    }
  ],
  "relatedSlugs": [
    "ucretsiz-dijital-katalog-olusturma",
    "bayiye-ozel-fiyat-listesi",
    "toptan-siparis-kurallari"
  ],
  "featureLinks": [
    {
      "href": "/ozellikler/toplu-urun-yukleme",
      "label": "Toplu ürün ve görsel araçları"
    },
    {
      "href": "/ozellikler/bayi-fiyat-listeleri",
      "label": "Bayi fiyatlarını düzenleyin"
    },
    { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
  ]
},
{
  "slug": "toptan-siparis-kurallari",
  "title": "Adet, koli ve minimum sepet kuralları nasıl belirlenir?",
  "description": "Minimum sepet tutarı ile ürün adedi arasındaki farkı öğrenin. Koli bilgilerini, zorunlu müşteri alanlarını ve WhatsApp alıcısını işletmenize göre düzenleyin.",
  "category": "Sipariş yönetimi",
  "publishedAt": "2026-09-27",
  "status": "published",
  "sections": [
    {
      "id": "kurallari-ayirin",
      "title": "Minimum tutar ile minimum adedi ayırın",
      "paragraphs": [
        "Minimum sepet tutarı, siparişin toplam parasal değerine ilişkin bir kuraldır. Minimum ürün adedi ise belirli bir üründen kaç tane alınması gerektiğiyle ilgilidir. Bir ürünü koliyle satmak da farklı bir konudur: koli, belirli sayıda ürünü içeren satış birimidir.",
        "Bu kavramları aynı anlama gelecek şekilde kullanmayın. Örneğin “minimum sepet 2.000 TL” demek, her üründen en az 12 adet alınacağı anlamına gelmez. Müşteriye hangi kuralın geçerli olduğunu açıkça anlatın. Buradaki rakamlar örnektir; işletmenizin sevkiyat ve sipariş hazırlama düzenine göre karar verin."
      ]
    },
    {
      "id": "koli-bilgisi",
      "title": "Adet, paket ve koli bilgisini netleştirin",
      "paragraphs": [
        "Koliyle satılan bir üründe koli içi adet müşterinin anlayacağı şekilde belirtilmelidir. Bir koli 12 adet içeriyorsa iki koli 24 adettir. Fiyatın adet başına mı koli başına mı gösterildiği de açık olmalıdır.",
        "Katalogda varyant kullanıyorsanız renk, beden veya model seçiminin doğru ürüne bağlandığını kontrol edin. Müşterinin sipariş fişindeki kod, ürün ve miktarı okuyarak ne istediğini anlayabilmesi gerekir. Kurulum sırasında birkaç farklı birimle örnek sepet oluşturun."
      ]
    },
    {
      "id": "minimum-sepet",
      "title": "Minimum sepet tutarını işinize göre belirleyin",
      "paragraphs": [
        "Sipariş hazırlama ve teslimat düzeninizi düşünerek minimum sepet tutarınızı seçin. Çok yüksek bir eşik müşteriyi zorlayabilir; çok düşük bir eşik de küçük siparişleri yönetmenizi güçleştirebilir. Tek bir evrensel doğru tutar yoktur.",
        "eKatalox’ta minimum sepet tutarı ayarlanabilir. Mevcut tutar kontrolü tek para birimli sepetlerde uygulanır; birden fazla para birimi içeren sepetlerde uygulanmaz. TL ve dövizli ürünleri birlikte satıyorsanız müşterinin karşılaşacağı akışı ayrıca kontrol edin. Bu ayarı ürün başına minimum adet kuralıyla karıştırmayın."
      ]
    },
    {
      "id": "zorunlu-bilgiler",
      "title": "Yalnız gerekli müşteri bilgilerini zorunlu tutun",
      "paragraphs": [
        "Sipariş formunda ad, telefon, adres ve not alanlarının görünürlük ve zorunluluğunu seçebilirsiniz. Adresin her siparişte gerekli olup olmadığı, teslimat biçiminize bağlıdır. Müşterinin gereksiz alanları doldurmasını istemeden, hazırlık için gereken bilgileri toplayın.",
        "Örneğin teslimat yapan bir işletme telefon ve adresi zorunlu tutabilir. Mağazadan teslim alan bayiler için adres alanına ihtiyaç olmayabilir. Bu örnekleri kendi çalışma düzeninize uyarlayın; form alanlarını değiştirdikten sonra boş bırakıldığında hangi uyarıların gösterildiğini deneyin."
      ]
    },
    {
      "id": "iletisim-ve-saatler",
      "title": "Alıcıyı, çalışma saatlerini ve duyuruyu birlikte düşünün",
      "paragraphs": [
        "[WhatsApp siparişi](/ozellikler/whatsapp-siparis) kayıtlı numaranıza yönlendirebilir veya müşterinin alıcıyı seçmesine izin verebilirsiniz. İkinci seçenek, müşterinin siparişi kendi toptancısına iletmek istediği akışlarda kullanılabilir. Mesajı müşterinin WhatsApp üzerinden gönderdiğini açıkça anlatın.",
        "Çalışma gün ve saatlerinizi belirleyin; kapalı olduğunuzda mağaza kapalı mesajını kullanın. Teslimat günü değişikliği gibi bilgileri açılış duyurusunda belirtin. Birbirini tamamlayan kısa açıklamalar, müşterinin sipariş vermeden önce ne beklemesi gerektiğini anlamasına yardımcı olur."
      ]
    },
    {
      "id": "son-kontrol",
      "title": "Yaygın senaryolarla son kontrolü yapın",
      "paragraphs": [
        "Kuralları ayarladıktan sonra yalnız sorunsuz bir siparişle test etmeyin. Eksik bilgi, düşük tutar ve farklı ürün birimleri gibi durumları da inceleyin. Sonucu Siparişlerim sayfasındaki kayıt ve PDF fişiyle karşılaştırın."
      ],
      "bullets": [
        "Minimum tutarın altında ve üstünde tek para birimli sepet deneyin.",
        "Zorunlu alanı boş bırakıp uyarıyı kontrol edin.",
        "Bir koli ürünün adet ve tutarını fişte karşılaştırın.",
        "Sabit numara ve alıcı seçimi ayarlarının WhatsApp’ta doğru açıldığını doğrulayın.",
        "Kapalı saatler ve açılış duyurusunun müşteri ekranında anlaşılır olduğunu kontrol edin."
      ]
    }
  ],
  "relatedSlugs": [
    "whatsapp-toptan-siparis",
    "bayiye-ozel-fiyat-listesi",
    "excelden-urun-katalogu"
  ],
  "featureLinks": [
    {
      "href": "/ozellikler/whatsapp-siparis",
      "label": "Sipariş kurallarını inceleyin"
    },
    {
      "href": "/ozellikler/kampanya-bildirimleri",
      "label": "Duyuru ve çalışma saatleri"
    },
    { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
  ]
},
  // ---------------------------------------------------------------------
  // 5 Eki 2026 yazı dizisi: ileri tarihli; her yazı publishedAt günü kendiliğinden yayına girer.
  // Müşteri hikâyelerinde ciro, fiyat, sipariş sayısı/tutarı YOK (müşteri izni bu koşulla).
  // ---------------------------------------------------------------------
  {
    slug: "lucatech-bayi-katalogu-nasil-acildi",
    title: "Lucatech bayi kataloğunu nasıl açtı? 109 ürün tek dakikada",
    description: "Lucatech ürünlerini Excel'den tek seferde yükleyip şifreli bayi kataloğunu aynı gün açtı. Kurulumun adımları ve kendi işletmenize uyarlama yolu.",
    category: "Müşteri hikâyesi",
    publishedAt: "2026-10-06",
    status: "published",
    sections: [
      {
        id: "lucatech-kimdir",
        title: "Lucatech kimdir, ne arıyordu?",
        paragraphs: [
          "Lucatech; şarj aleti, kablo, kulaklık, powerbank, hoparlör ve telefon tutucu gibi telefon aksesuarları satan bir marka. Ürünlerini Türkiye'nin farklı şehirlerindeki bayilere toptan satıyor. Ürün sayısı arttıkça [fiyat listesi](/ozellikler/bayi-fiyat-listeleri)ni güncel tutmak ve siparişleri tek bir düzende toplamak zorlaştı.",
          "Lucatech'in istediği basitti: bayi telefondan kataloğu açsın, kendi fiyatını görsün, sepetini doldursun ve siparişi [WhatsApp'tan](/ozellikler/whatsapp-siparis) göndersin. Fiyatlar ise bayi olmayan birinin göremeyeceği şekilde kapalı kalsın.",
        ],
      },
      {
        id: "ilk-gun",
        title: "İlk gün: mağaza sabah açıldı, ürünler akşam tek seferde geldi",
        paragraphs: [
          "Lucatech mağazasını 26 Mayıs 2026'da açtı. Aynı akşam ürün listesini eKatalox'un [Excel](/ozellikler/toplu-urun-yukleme) şablonuna aktardı ve Toplu Ürün Ekleme sayfasından yükledi. Sistem kayıtlarına göre 109 ürünün tamamı aynı dakika içinde kataloğa eklendi.",
          "Şablonda her ürün için kategori, model kodu, ürün adı, para birimi, liste fiyatları, stok durumu ve paket/koli adedi bulunuyor. Görseller ister model koduyla adlandırılıp toplu, ister ürün sayfasından tek tek eklenebiliyor.",
        ],
        bullets: [
          "Ürün listesi Excel şablonuna aktarıldı.",
          "Toplu Ürün Ekleme sayfasından tek dosyayla yüklendi.",
          "Görseller model koduyla adlandırılarak ya da ürün ürün eklendi.",
          "Fiyat listeleri ve bayi şifreleri tanımlandı, katalog bayilere açıldı.",
        ],
      },
      {
        id: "fiyat-listeleri",
        title: "Her bayi grubu kendi fiyatını görüyor",
        paragraphs: [
          "Ürünler tek bir katalogda duruyor; bayi kendisine verilen şifreyle girdiğinde kendi fiyatlarını görüyor. Böylece her bayi grubu için ayrı PDF hazırlamak gerekmiyor.",
          "Fiyat değiştiğinde panelde ürünün fiyatı güncelleniyor; bayi kataloğu bir sonraki açışında yeni fiyatı görüyor. Eski bir dosyanın elden ele dolaşması ve eski fiyattan sipariş gelmesi riski ortadan kalkıyor.",
        ],
      },
      {
        id: "katalog-buyudu",
        title: "Katalog markayla birlikte büyüdü",
        paragraphs: [
          "İlk yüklemeden sonra yeni ürünler zamanla eklendi. Bayinin ilk gördüğü giriş ekranı Lucatech'in kendi görselleri ve renkleriyle hazırlandı; katalog bayiye başka bir sitenin değil, markanın kendisinin parçası gibi görünüyor.",
        ],
        images: [
          { src: "/site/blog/lucatech-giris.webp", alt: "Lucatech bayi portalının şifreli giriş ekranı", caption: "Lucatech'in bayi giriş ekranı: fiyatlar ancak bayiye verilen şifreyle görünür.", width: 1280, height: 800 },
        ],
      },
      {
        id: "google-ve-yeni-bayi",
        title: "Fiyatlar kapalı, marka Google'da açık",
        paragraphs: [
          "Şifreli katalog Google'a kapalıdır; bu, fiyatların aramalarda görünmemesi için bilerek böyle yapılır. Lucatech'in Google'daki yüzü ise [kurumsal sitesi](/ozellikler/kurumsal-site): ürün grupları, marka bilgisi ve iletişim burada fiyatsız olarak yer alıyor.",
          "Bayilik başvuruları da bu siteden geliyor ve panelde tek yerde toplanıyor.",
        ],
        images: [
          { src: "/site/blog/lucatech-kurumsal.webp", alt: "Lucatech kurumsal sitesinin ana sayfası", caption: "Kurumsal site Google'a açık, fiyat içermez; bayilik başvurusu buradan alınır.", width: 1280, height: 680 },
        ],
      },
      {
        id: "kendi-isletmeniz-icin",
        title: "Kendi işletmenizde nasıl uygularsınız?",
        paragraphs: [
          "Lucatech'in izlediği yol her toptancı için aynı: ürün listesini şablona aktarmak, görselleri model koduyla adlandırmak, fiyat listelerini ve şifreleri tanımlamak. Ücretsiz pakette 250 ürün ve 2 fiyat listesiyle başlanabilir; kendi alan adı, kurumsal site ve bayi başvuru formu Kurumsal pakettedir.",
        ],
        bullets: [
          "Ürün listenizi hazırlarken her ürüne tek bir model kodu verin.",
          "Görsel dosyalarını model koduyla adlandırın (ör. LC-125.jpg, ikinci görsel LC-125 (2).jpg).",
          "Bayi gruplarınızı belirleyip her biri için bir fiyat listesi açın.",
          "Kataloğu önce bir bayiyle deneyin, sonra hepsine duyurun.",
        ],
      },
    ],
    relatedSlugs: ["excelden-urun-katalogu", "bayiye-ozel-fiyat-listesi", "whatsapp-toptan-siparis"],
    featureLinks: [
      { href: "/ozellikler/toplu-urun-yukleme", label: "Toplu ürün yüklemeyi inceleyin" },
      { href: "/ozellikler/bayi-fiyat-listeleri", label: "Bayi fiyat listeleri" },
      { href: "/ozellikler/kurumsal-site", label: "Kurumsal site ve kendi alan adı" },
      { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
    ],
  },
  {
    slug: "genax-paket-koli-siparis",
    title: "Genax bayilerinden paket ve koli siparişini nasıl alıyor?",
    description: "Genax bayilerine paket ve koli halinde satıyor. Kataloğun nasıl kurulduğunu ve bayinin birim seçerek siparişi nasıl verdiğini anlatıyoruz.",
    category: "Müşteri hikâyesi",
    publishedAt: "2026-10-08",
    status: "published",
    sections: [
      {
        id: "genax-kimdir",
        title: "Genax kimdir?",
        paragraphs: [
          "Genax, şarj aleti ve kablo ağırlıklı [telefon aksesuarları](/sektorler/elektronik-aksesuar) satan bir toptancı. Ürünleri bayilere çoğunlukla paket ya da koli halinde satılıyor. Bir bayinin \"3 koli kablo\" demesiyle \"3 adet kablo\" demesi arasındaki fark, toptanda yanlış sevkiyatın en sık sebeplerinden biri.",
        ],
      },
      {
        id: "katalog-kurulumu",
        title: "Katalog bir öğlen arasında kuruldu",
        paragraphs: [
          "Genax ürünlerini [Excel](/ozellikler/toplu-urun-yukleme) şablonuyla tek seferde yükledi; ürünlerin tamamı aynı dakika içinde kataloğa eklendi.",
          "Şablondaki Paket Adedi ve Koli Adedi sütunları burada belirleyici oldu. Örneğin bir pakette 20, bir kolide 200 adet olan bir ürün için bu bilgiler bir kez giriliyor; bayi sipariş verirken birimi seçiyor, adedi sistem hesaplıyor.",
        ],
      },
      {
        id: "bayi-siparisi",
        title: "Bayi siparişi nasıl veriyor?",
        paragraphs: [
          "Bayi kendisine verilen şifreyle kataloğa giriyor ve ürünü seçiyor. Sepete eklerken adet, paket veya koli birimlerinden birini seçip miktarı yazıyor. Sepette toplam adet ve tutar görünüyor.",
          "Siparişi tamamladığında PDF sipariş fişinin bağlantısı [WhatsApp](/ozellikler/whatsapp-siparis) mesajına ekleniyor ve bayi mesajı Genax'a gönderiyor. Fişte ürün kodları, birimler ve miktarlar açıkça yazdığı için siparişi hazırlayan kişi mesajlardan ürün toplamak zorunda kalmıyor.",
        ],
        bullets: [
          "Şifreyle giriş: bayi yalnız kendi [fiyat listesi](/ozellikler/bayi-fiyat-listeleri)ni görür.",
          "Birim seçimi: adet, paket veya koli.",
          "Sepet: toplam adet ve tutar tek ekranda.",
          "WhatsApp: PDF sipariş fişi bağlantısıyla gönderim.",
        ],
        images: [
          { src: "/site/order-flow/receipt-anonymized.png", alt: "Örnek PDF sipariş fişi", caption: "Örnek PDF sipariş fişi (temsili verilerle).", width: 1536, height: 1024 },
        ],
      },
      {
        id: "fiyat-listeleri",
        title: "Herkes kendi fiyatını görüyor",
        paragraphs: [
          "Bayi şifresiyle girdiğinde yalnız kendi fiyatlarını görür. Fiyatsız bir şifreyle giren kişi ise ürünleri görür ama fiyat görmez; bu, henüz bayi olmayan birine ürün yelpazesini göstermek için kullanılabilir.",
        ],
      },
      {
        id: "dersler",
        title: "Paket ve koli ile satan toptancılar için öneriler",
        paragraphs: [
          "Birim karışıklığı çoğu zaman ürün bilgisinden değil, siparişin yazılış biçiminden doğar. Paket ve koli adetlerini katalogda tanımlamak, bayinin ne istediğini sayı olarak netleştirir.",
        ],
        bullets: [
          "Her ürün için paket ve koli adedini şablona girin; bilmediğinizi boş bırakın.",
          "Ürün adında birim yazmayın; birimi bayi sepette seçsin.",
          "Fiyatı adet başına girin; paket ve koli tutarını sistem hesaplar.",
          "İlk siparişi bir bayiyle birlikte verip fişi kontrol edin.",
        ],
      },
    ],
    relatedSlugs: ["toptan-siparis-kurallari", "whatsapp-toptan-siparis", "lucatech-bayi-katalogu-nasil-acildi"],
    featureLinks: [
      { href: "/ozellikler/whatsapp-siparis", label: "WhatsApp sipariş akışı" },
      { href: "/ozellikler/toplu-urun-yukleme", label: "Excel ile toplu ürün yükleme" },
      { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
    ],
  },
  {
    slug: "toptan-fiyatlari-rakiplerden-koruma",
    title: "Toptan fiyatlarınızı rakiplerden nasıl korursunuz?",
    description: "PDF fiyat listesi bir kez gönderilince kimde olduğunu bilemezsiniz. Fiyatları şifreli katalogda tutmanın ve erişimi geri almanın yolları.",
    category: "Bayi yönetimi",
    publishedAt: "2026-10-10",
    status: "published",
    sections: [
      {
        id: "sorun",
        title: "Fiyat listesi neden elden ele dolaşır?",
        paragraphs: [
          "PDF ya da Excel [fiyat listesi](/ozellikler/bayi-fiyat-listeleri) bir bayiye gönderildiği anda kopyalanabilir hale gelir. Bayi dosyayı bir çalışanına, o da bir başkasına iletebilir. Bir süre sonra listenin rakip bir firmada olup olmadığını bilmenin yolu kalmaz.",
          "Üstelik eski dosyalar silinmez. Fiyat güncellediğinizde, eski listeyi saklayan bayi ya da ona ulaşan rakip hâlâ eski fiyatları görür.",
        ],
      },
      {
        id: "sifreli-katalog",
        title: "Dosya göndermek yerine şifreli katalog",
        paragraphs: [
          "Şifreli katalogda fiyatlar bir dosyada değil, bir bağlantının arkasında durur. Bağlantıyı açan herkes giriş ekranını görür; fiyatları ancak doğru şifreyi giren görür. Şifreli mağaza sayfaları arama motorlarına da kapalıdır, yani fiyatlar Google'da çıkmaz.",
          "Fiyatı güncellediğinizde herkes aynı anda yeni fiyatı görür. Ortada eski bir dosya kalmaz.",
        ],
        images: [
          { src: "/site/toptan-giris-v2.png", alt: "Şifreli toptan kataloğun giriş ekranı", caption: "Şifreli katalog: fiyatlar ancak bayiye verilen şifreyle açılır (demo mağaza).", width: 1206, height: 2622 },
        ],
      },
      {
        id: "kisiye-ozel-sifre",
        title: "Herkese aynı şifre mi, bayiye özel şifre mi?",
        paragraphs: [
          "En basit kurulumda her fiyat listesinin bir şifresi olur ve o gruptaki bütün bayiler aynı şifreyi kullanır. Kurulumu kolaydır, ama şifre bir kişiden sızarsa o grubun bütün bayilerine yeni şifre vermeniz gerekir.",
          "Kurumsal pakette bayi başvurusunu onaylarken bayiye özel bir şifre tanımlayabilirsiniz. Bu şifre bayinin bağlı olduğu fiyat listesini açar ve yalnız ona aittir. Bir bayiyle çalışmayı bıraktığınızda yalnız onun şifresini silersiniz; diğer bayiler etkilenmez.",
        ],
      },
      {
        id: "fiyatsiz-katalog",
        title: "Bayi adayına ürünleri fiyatsız gösterin",
        paragraphs: [
          "Henüz bayiniz olmayan bir işletmeye ürün yelpazenizi göstermek istediğinizde fiyat listesini göndermek zorunda değilsiniz. Fiyatsız katalog listesine bağlı bir şifre verirseniz kişi ürünleri, görselleri ve kodları görür ama fiyat görmez. Anlaşma olduktan sonra ona fiyatlı bir şifre verirsiniz.",
        ],
      },
      {
        id: "sinirlar",
        title: "Hiçbir yöntem her şeyi engellemez",
        paragraphs: [
          "Dürüst olmak gerekirse, fiyatı görme yetkisi olan biri ekran görüntüsü alıp paylaşabilir. Şifreli katalog bunu engelleyemez; ama dosyanın kendiliğinden yayılmasını, eski fiyatların dolaşmasını ve Google'da görünmesini önler. Ayrıca kimin hangi şifreyle eriştiğini bilmenizi sağlar.",
        ],
        bullets: [
          "Fiyatları dosya olarak göndermeyin, bağlantı paylaşın.",
          "Fiyat listelerini bayi gruplarına göre ayırın.",
          "Mümkünse bayiye özel şifre kullanın.",
          "Çalışmayı bıraktığınız bayinin şifresini silin.",
          "Bayi adaylarına fiyatsız katalog şifresi verin.",
        ],
      },
    ],
    relatedSlugs: ["bayiye-ozel-fiyat-listesi", "pdf-katalog-mu-online-katalog-mu", "yeni-bayi-basvurusu-alma"],
    featureLinks: [
      { href: "/ozellikler/bayi-fiyat-listeleri", label: "Şifreli bayi fiyat listeleri" },
      { href: "/fiyatlandirma", label: "Paketlerde fiyat listesi sayıları" },
      { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
    ],
  },
  {
    slug: "telefonla-urun-fotografi-cekme",
    title: "Ürün fotoğrafı nasıl çekilir? Telefonla katalog rehberi",
    description: "Stüdyo kurmadan telefon ve gün ışığıyla katalog için temiz ürün fotoğrafı çekin: arka plan, ışık, açı ve dosya adlandırma adımları.",
    category: "Katalog hazırlığı",
    publishedAt: "2026-10-13",
    status: "published",
    sections: [
      {
        id: "neden-onemli",
        title: "Bayi neden fotoğrafa bakar?",
        paragraphs: [
          "Toptan katalogda bayi çoğu zaman ürün adını okumadan önce görsele bakar. Rengi, kutusu ve ucu açıkça görünmeyen bir ürün yanlış siparişe ya da telefonla \"bu hangisi?\" sorusuna dönüşür. İyi bir fotoğraf için stüdyo şart değil; düzenli bir arka plan, doğru ışık ve tutarlı bir açı yeterli.",
        ],
      },
      {
        id: "isik-ve-zemin",
        title: "Işık ve arka plan",
        paragraphs: [
          "En kolay ışık, pencereden gelen gün ışığıdır. Ürünü pencereye yakın ama doğrudan güneş almayan bir yere koyun. Tavan lambası ve flaş sert gölge yapar; ikisini de kapatın.",
          "Arka plan için beyaz bir karton ya da A3 kâğıt yeterli. Kâğıdı duvara yaslayıp masaya doğru kıvrılacak şekilde koyarsanız arka planda köşe çizgisi görünmez. Gölge fazlaysa ürünün karşı tarafına ikinci bir beyaz karton koyarak ışığı yansıtın.",
        ],
        bullets: [
          "Gün ışığı, doğrudan güneş değil.",
          "Flaş ve tavan lambası kapalı.",
          "Kıvrılmış beyaz karton arka plan.",
          "Gölge tarafına yansıtıcı olarak ikinci bir beyaz karton.",
        ],
      },
      {
        id: "aci-ve-cekim",
        title: "Açı, mesafe ve odak",
        paragraphs: [
          "Telefonun geniş açısı yakından çekilen ürünü olduğundan büyük ve eğri gösterir. Bunun yerine bir adım geri çekilip 2x yakınlaştırmayla çekin. Odaklamak için ekranda ürüne dokunun ve parlaklığı gerekirse biraz düşürün.",
          "Bütün ürünleri aynı açıdan çekin: önden ya da hafif yukarıdan. Katalogda kartlar yan yana durduğu için açıların tutarlı olması kataloğu daha düzenli gösterir.",
        ],
        images: [
          { src: "/site/sektor/hirdavat-katalog.webp", alt: "Beyaz zeminde çekilmiş ürünlerin katalog görünümü", caption: "Aynı zeminde, aynı açıdan çekilen ürünler katalogda düzenli görünür (demo mağaza).", width: 1206, height: 2622 },
        ],
      },
      {
        id: "kac-fotograf",
        title: "Bir ürün için kaç fotoğraf?",
        paragraphs: [
          "eKatalox'ta her ürüne üç görsel eklenebilir. Pratik bir düzen şöyle olabilir: ilk görsel ürünün kendisi, ikincisi kutusu ya da ambalajı, üçüncüsü önemli bir ayrıntı (giriş ucu, etiket, renk seçenekleri). Bayi için kutu görseli özellikle önemlidir; rafta göreceği şey odur.",
        ],
      },
      {
        id: "dosya-adlari",
        title: "Dosya adlarını model koduyla verin",
        paragraphs: [
          "Yüzlerce ürünün görselini tek tek eşleştirmek uzun sürer. Dosyayı ürünün model koduyla adlandırırsanız toplu görsel yükleme her dosyayı kendi ürününe otomatik eşleştirir. İkinci ve üçüncü görseller için kodun sonuna (2) ya da _2 eklemeniz yeterli.",
          "Yüklenen görseller en fazla 1200 piksele küçültülüp sıkıştırılır; telefonun çektiği büyük dosyaları önceden küçültmeniz gerekmez.",
        ],
        bullets: [
          "LC-125.jpg → ürünün ana görseli",
          "LC-125 (2).jpg ya da LC-125_2.jpg → ikinci görsel",
          "LC-125 (3).jpg ya da LC-125_3.jpg → üçüncü görsel",
        ],
      },
      {
        id: "seri-cekim",
        title: "Çok ürün varsa: seri çekim düzeni",
        paragraphs: [
          "Yüzlerce ürünü tek tek kurup çekmek günler sürer. Bir masayı yalnız çekim için ayırın, zemini ve telefonun yerini sabitleyin. Telefonu bir kitap yığınına ya da ucuz bir tripoda yaslarsanız her ürün aynı mesafeden ve aynı açıdan çekilir; ürünü koyup çekip kaldırmak yeterli olur.",
          "Çekimden önce ürünleri katalogdaki sıraya göre dizin. Her ürünün önüne bir an model kodunu yazdığınız kâğıdı koyup bir kare çekerseniz, sonradan hangi fotoğrafın hangi ürüne ait olduğunu karıştırmazsınız. Dosyaları adlandırırken bu karelere bakıp silebilirsiniz.",
          "Aynı ürünün renk seçenekleri varsa hepsini aynı oturumda, aynı ışıkta çekin. Farklı günlerde çekilen renkler katalogda yan yana geldiğinde ton farkı hemen göze batar.",
        ],
      },
      {
        id: "sik-hatalar",
        title: "Sık yapılan fotoğraf hataları",
        paragraphs: [
          "Katalogdaki fotoğraf sorunlarının çoğu ekipmandan değil, birkaç alışkanlıktan doğar. Aşağıdakiler en sık karşılaşılanlar.",
        ],
        bullets: [
          "Ürünü ambalajın içinde, poşet parlamasıyla çekmek: Mümkünse ürünü poşetten çıkarın ya da parlamayı açıyı değiştirerek giderin.",
          "Ekrandan zoom yapıp düşük çözünürlüklü kare almak: Telefonun hazır 2x ya da 3x lensini kullanın, parmakla büyütmeyin.",
          "Filtre ve güzelleştirme modu: Renkleri değiştirir; bayi gerçeğinden farklı ürün görür.",
          "Kabloyu ya da şeridi gelişigüzel bırakmak: Kabloyu düzgün bir halka yapın, etiketi öne çevirin.",
          "Fotoğrafı kırpmadan yüklemek: Ürün karenin büyük bölümünü kaplamalı; kenarlarda boş masa kalmasın.",
        ],
      },
      {
        id: "kontrol",
        title: "Yüklemeden önce son kontrol",
        bullets: [
          "Ürünün rengi gerçeğiyle aynı mı? Beyaz dengesi sarıya kaymasın.",
          "Kutu yazıları okunuyor mu?",
          "Arka planda başka ürün, kablo ya da el görünüyor mu?",
          "Bütün görseller aynı açıdan ve benzer boyutta mı?",
        ],
        paragraphs: [
          "Birkaç ürünü çekip katalogda telefondan açarak bakın. Telefonda iyi görünen bir kart, bayinin göreceği kartla aynıdır.",
        ],
      },
    ],
    relatedSlugs: ["excelden-urun-katalogu", "ucretsiz-dijital-katalog-olusturma", "toptan-fiyat-listesi-excel-sablonu"],
    featureLinks: [
      { href: "/ozellikler/toplu-urun-yukleme", label: "Toplu görsel yükleme" },
      { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
    ],
  },
  {
    slug: "yeni-bayi-basvurusu-alma",
    title: "Yeni bayi başvurusu nasıl alınır ve onaylanır?",
    description: "Bayilik taleplerini telefon ve WhatsApp arasında kaybetmeyin. Başvuru formu, değerlendirme, fiyat listesine bağlama ve şifre verme adımları.",
    category: "Bayi yönetimi",
    publishedAt: "2026-10-15",
    status: "published",
    sections: [
      {
        id: "neden-form",
        title: "Bayilik talepleri neden kaybolur?",
        paragraphs: [
          "Bayilik talepleri farklı yerlerden gelir: telefon, [WhatsApp](/ozellikler/whatsapp-siparis), fuar kartvizitleri, sitedeki iletişim formu. Hangisine dönüldüğü, kime hangi fiyatın verildiği çoğu zaman bir deftere ya da bir kişinin hafızasına kalır. Talep sayısı arttıkça bazıları cevapsız kalır.",
          "Tek bir başvuru formu bu dağınıklığı toplar. Her başvuru aynı bilgilerle gelir ve aynı ekranda bekler.",
        ],
      },
      {
        id: "hangi-bilgiler",
        title: "Başvuruda hangi bilgileri isteyin?",
        paragraphs: [
          "Formu uzatmak başvuru sayısını düşürür. Değerlendirme için gerçekten gerekenleri isteyin; vergi bilgisi gibi ayrıntıları onaydan sonra da alabilirsiniz.",
        ],
        bullets: [
          "Firma adı ve yetkili kişi",
          "Telefon (WhatsApp'tan ulaşacaksanız)",
          "Şehir ve ilçe",
          "Kısa bir not: hangi ürün gruplarıyla ilgilendiği",
        ],
      },
      {
        id: "ekataloxta-akis",
        title: "eKatalox'ta başvuru akışı",
        paragraphs: [
          "Kurumsal pakette [kurumsal sitenizde](/ozellikler/kurumsal-site) bir Bayimiz Olun formu bulunur. Gelen başvurular panelde Bayi Başvuruları sayfasında toplanır. Başvuruyu açtığınızda bayinin bilgilerini görürsünüz.",
          "Onaylarken bayiyi bir [fiyat listesi](/ozellikler/bayi-fiyat-listeleri)ne bağlar ve ona özel bir giriş şifresi belirlersiniz. Onaydan sonra çıkan Şifreyi WhatsApp'tan gönder düğmesi, şifreyi ve katalog bağlantısını içeren mesajı bayinin numarasına hazırlar; siz yalnız gönderirsiniz. Onaylanan bayi Müşteriler sayfasında listelenir.",
        ],
        bullets: [
          "Kurumsal sitedeki form → Bayi Başvuruları sayfası",
          "Başvuruyu incele → fiyat listesi seç → bayiye özel şifre belirle",
          "Şifreyi WhatsApp'tan gönder",
          "Bayi Müşteriler sayfasında",
        ],
      },
      {
        id: "degerlendirme",
        title: "Onaylamadan önce nelere bakın?",
        paragraphs: [
          "Her başvuruyu onaylamak zorunda değilsiniz. Bölgenizde aynı caddede iki bayiniz olmasını istemeyebilir ya da yeni bir bayiye önce daha yüksek fiyatlı bir listeyle başlamayı tercih edebilirsiniz.",
        ],
        bullets: [
          "Bayinin bölgesi mevcut bayilerinizle çakışıyor mu?",
          "Hangi fiyat listesiyle başlamalı?",
          "Ödeme ve teslim koşullarınızı biliyor mu?",
          "İlk siparişi birlikte vermek ister misiniz?",
        ],
      },
      {
        id: "ozel-sifre",
        title: "Neden bayiye özel şifre?",
        paragraphs: [
          "Bir gruptaki bütün bayilerin aynı şifreyi kullanması kolaydır ama şifre sızdığında herkesin şifresini değiştirmeniz gerekir. Bayiye özel şifrede ilişkiyi bitirdiğiniz bayinin yalnız kendi şifresini silersiniz. Ayrıca siparişin hangi bayiden geldiği daha net olur.",
        ],
        images: [
          { src: "/site/sektor/telefon-aksesuar-giris.webp", alt: "Şifreli bayi kataloğunun giriş ekranı", caption: "Onaylanan bayi, kendisine verilen şifreyle kataloğa girer (demo mağaza).", width: 1206, height: 2622 },
        ],
      },
    ],
    relatedSlugs: ["toptan-fiyatlari-rakiplerden-koruma", "bayiye-ozel-fiyat-listesi", "toptanci-google-da-nasil-bulunur"],
    featureLinks: [
      { href: "/ozellikler/kurumsal-site", label: "Kurumsal site ve Bayimiz Olun formu" },
      { href: "/fiyatlandirma", label: "Kurumsal paketi inceleyin" },
      { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
    ],
  },
  {
    slug: "toptan-fiyat-listesi-excel-sablonu",
    title: "Fiyat listesi Excel şablonu: ücretsiz toptan liste",
    description: "Bayi ve özel müşteri fiyatları için hazır sütunlu toptan fiyat listesi Excel şablonunu indirin; doldurma kuralları ve sık yapılan hatalar.",
    category: "Şablon",
    publishedAt: "2026-10-17",
    status: "published",
    sections: [
      {
        id: "sablonu-indirin",
        title: "Şablonu indirin",
        paragraphs: [
          "Şablonda kategori, model numarası, ürün adı, para birimi, üç ayrı liste fiyatı, stok durumu ve paket/koli adedi sütunları hazır. Gri renkli örnek satırları silip kendi ürünlerinizi yazmanız yeterli. Para birimi ve stok durumu hücrelerinde seçim listesi var; yanlış yazımın önüne geçer.",
        ],
        download: {
          href: "/indir/toptan-fiyat-listesi-sablonu.xlsx",
          label: "Toptan fiyat listesi şablonunu indir (.xlsx)",
          note: "Ücretsizdir, kayıt gerektirmez. Excel, Google E-Tablolar ve LibreOffice ile açılır.",
        },
      },
      {
        id: "sutunlar",
        title: "Sütunlar ne anlama geliyor?",
        bullets: [
          "Kategori Adı: Ürünün listelendiği grup (ör. Şarj Kabloları).",
          "Model No: Her ürüne özel kod. Aynı kod iki satırda olmamalı.",
          "Ürün Adı: Bayinin ürünü tanıyacağı açık ad.",
          "Para Birimi: TL, USD veya EUR.",
          "1., 2. ve 3. Liste Fiyatı: Farklı müşteri grupları için adet başına fiyat. Kullanmadığınızı boş bırakın.",
          "Stok Durumu: Var veya Yok.",
          "Paket Adedi ve Koli Adedi: Bir paket ve bir kolide kaç adet olduğu.",
        ],
        paragraphs: [
          "Liste fiyatlarını bayi, perakende ve özel müşteri gibi gruplara göre kullanabilirsiniz. Hangi listenin kime ait olduğunu bir kenara not edin; sütun adları listeyi değil sırayı gösterir.",
        ],
      },
      {
        id: "sik-hatalar",
        title: "Sık yapılan hatalar",
        paragraphs: [
          "[Fiyat listesi](/ozellikler/bayi-fiyat-listeleri)ndeki hataların çoğu ürün bilgisinden değil, hücrelerin dolduruluş biçiminden kaynaklanır. Aşağıdaki maddeleri dosyayı paylaşmadan ya da yüklemeden önce bir kez kontrol edin.",
        ],
        bullets: [
          "Fiyat hücresine \"150 TL\" yazmak: Hücreye yalnız sayı yazın, para birimi kendi sütununda.",
          "Aynı ürünü iki satıra yazmak: Renk ve model farkı varsa kodları ayırın.",
          "Model numarasını sonradan değiştirmek: Kod, ürünün kimliğidir; değişirse eski kayıtla eşleşmez.",
          "Sütun adlarını çevirmek ya da kısaltmak.",
          "Birleştirilmiş hücre kullanmak: Her satır tek bir ürün olmalı.",
        ],
      },
      {
        id: "ipuclari",
        title: "Şablonu doldururken işinizi kolaylaştıracak ipuçları",
        paragraphs: [
          "Fiyatları başka bir dosyadan formülle hesaplıyorsanız şablona formül değil değer yapıştırın. [Excel'de](/ozellikler/toplu-urun-yukleme) Özel Yapıştır > Değerler seçeneği bunu yapar. Formül başka bir dosyaya bağlıysa dosya açıldığı yerde fiyatlar boş ya da hatalı görünebilir.",
          "KDV dahil mi hariç mi fiyat verdiğinize bir kez karar verin ve bütün listelerde aynı kuralı kullanın. Bayiye ilk gönderimde bunu açıkça yazın; aynı listede iki kuralın karışması en çok tartışma çıkaran hatalardan biridir.",
          "Döviz bazlı çalışıyorsanız ürünü kendi para biriminde bırakın: USD fiyatlı bir ürünü TL'ye çevirip yazmak, kur her değiştiğinde bütün listeyi yeniden hesaplamanız anlamına gelir.",
        ],
        bullets: [
          "Ondalık için virgül kullanın (149,90); binlik ayırıcı eklemeyin.",
          "Model numarasında baştaki sıfırlar önemliyse hücre biçimini Metin yapın.",
          "Fiyatı olmayan ürünü silmek yerine o listenin hücresini boş bırakın.",
          "Dosyayı her güncellemede tarihle kaydedin: fiyat-listesi-2026-10.xlsx gibi.",
        ],
      },
      {
        id: "liste-ayirma",
        title: "Fiyat listelerini nasıl ayırmalı?",
        paragraphs: [
          "Toptancıların çoğu müşterilerini alım hacmine ya da çalışma biçimine göre gruplar: düzenli alım yapan bayiler, ara sıra alan perakendeciler, özel anlaşmalı büyük müşteriler gibi. Her grup için bir liste sütunu kullanmak, aynı ürün için birkaç ayrı dosya tutmaktan çok daha kolaydır.",
          "Grup sayısını gereğinden fazla artırmayın. Her yeni liste, her fiyat değişikliğinde güncellenecek bir sütun daha demektir. Çoğu işletme için iki ya da üç liste yeterlidir; tek tek müşteriye özel fiyat gerekiyorsa bunu ayrı bir anlaşma olarak ele almak daha yönetilebilir olur.",
        ],
      },
      {
        id: "dosyadan-kataloga",
        title: "Dosyayı göndermek yerine kataloğa dönüştürün",
        paragraphs: [
          "Excel dosyasını bayilere göndermek hızlıdır ama dosya kopyalanır, eski sürümler dolaşır ve fiyatlar herkesin elinde kalır. Bu şablonun sütunları eKatalox'un toplu yükleme şablonuyla aynıdır. Dosyayı Ürünler > Toplu Ürün Ekleme sayfasından olduğu gibi yüklerseniz ürünleriniz şifreli bir online kataloğa dönüşür; her bayi kendi listesinin fiyatını görür ve siparişini [WhatsApp'tan](/ozellikler/whatsapp-siparis) gönderir.",
          "Daha sonra fiyat güncellerken aynı dosyayı yeniden yükleyebilirsiniz: aynı model numaralı ürünler güncellenir, yeni kodlar yeni ürün olarak eklenir.",
        ],
        images: [
          { src: "/site/sektor/gida-katalog.webp", alt: "Excel'den yüklenmiş ürünlerin online katalog görünümü", caption: "Excel'den yüklenen ürünler kategorileri ve fiyatlarıyla online katalogda (demo mağaza).", width: 1206, height: 2622 },
        ],
      },
    ],
    relatedSlugs: ["excelden-urun-katalogu", "bayiye-ozel-fiyat-listesi", "telefonla-urun-fotografi-cekme"],
    featureLinks: [
      { href: "/ozellikler/toplu-urun-yukleme", label: "Excel ile toplu ürün yükleme" },
      { href: "/basvuru", label: "Ücretsiz katalog açın" },
      { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
    ],
  },
  {
    slug: "toptanci-google-da-nasil-bulunur",
    title: "Toptancı Google'da nasıl bulunur? Fiyatları gizli tutarak",
    description: "Bayi fiyatlarınız görünmeden firmanızın Google'da bulunmasını sağlayın: kurumsal site, Google İşletme Profili ve Search Console adımları.",
    category: "Görünürlük",
    publishedAt: "2026-10-20",
    status: "published",
    sections: [
      {
        id: "ikilem",
        title: "Görünmek isteyip fiyatı göstermek istememek",
        paragraphs: [
          "Toptancı iki şey ister: yeni bayiler kendisini Google'da bulsun, ama [fiyat listesi](/ozellikler/bayi-fiyat-listeleri) herkesin önüne düşmesin. Bu ikisi çelişmez. Çözüm, fiyatlı kataloğu ve firmayı tanıtan sayfaları birbirinden ayırmaktır.",
        ],
      },
      {
        id: "iki-katman",
        title: "İki katman: şifreli katalog ve açık kurumsal site",
        paragraphs: [
          "Şifreli bayi kataloğu arama motorlarına kapalıdır; fiyatlar bu yüzden aramalarda çıkmaz. Firmanızın Google'daki yüzü ise fiyat içermeyen bir [kurumsal site](/ozellikler/kurumsal-site) olmalıdır: ürün grupları, ürün adları ve kodları, firma bilgisi, iletişim ve bayilik başvurusu.",
          "Bayi adayı ürün kodunu ya da ürün grubunu arayıp kurumsal sitenize gelir, başvurur. Onaylandıktan sonra fiyatları şifreli katalogda görür.",
        ],
        images: [
          { src: "/site/blog/lucatech-kurumsal.webp", alt: "Fiyat içermeyen kurumsal site örneği", caption: "Örnek: Lucatech'in kurumsal sitesi aramalarda görünür, fiyat içermez.", width: 1280, height: 680 },
        ],
      },
      {
        id: "kurumsal-sitede-ne-olmali",
        title: "Kurumsal sitede ne olmalı?",
        bullets: [
          "Firmanızı ve ne sattığınızı anlatan kısa, gerçek bir metin.",
          "Ürün grupları ve ürün sayfaları: ad, kod, görsel, açıklama (fiyatsız).",
          "Adres, telefon ve çalışma saatleri.",
          "Bayilik başvuru formu.",
          "Kendi alan adınız: firmaniz.com ya da katalog.firmaniz.com.",
        ],
        paragraphs: [
          "eKatalox'un Kurumsal paketinde bu site kataloğunuzdaki ürünlerden otomatik oluşur; ürün eklediğinizde kurumsal sitedeki ürün sayfası da eklenir. Ürün sayfaları arama motorlarının ürünü anlaması için yapılandırılmış veriyle yayınlanır, fiyat bilgisi eklenmez.",
        ],
      },
      {
        id: "urun-sayfasi-metni",
        title: "Ürün sayfası metni nasıl yazılır?",
        paragraphs: [
          "Bayi adayları çoğu zaman marka adıyla değil, ürünün kendisiyle arar: \"USB-C hızlı şarj kablosu toptan\", \"20W adaptör toptancı\" gibi. Ürün sayfanızın bu aramalarda çıkması için ürün adında ürün tipini, temel özelliğini ve model kodunu birlikte kullanın.",
          "Açıklamayı kısa tutun ama gerçek bilgi verin: uzunluk, güç, uyumlu cihazlar, kutu içeriği, paket ve koli adedi. Üretici sitesinden kopyalanmış uzun metinler yerine bayinin soracağı soruları yanıtlayan iki üç cümle daha işe yarar.",
        ],
        bullets: [
          "Ürün adı: tip + özellik + model kodu (ör. \"USB-C to Lightning 20W Kablo 1 m AB-120\").",
          "Açıklama: ölçü, güç, uyumluluk, kutu içeriği.",
          "Görsel açıklaması (alt metin): görselde ne olduğunu düz cümleyle anlatın.",
          "Aynı açıklamayı onlarca ürüne kopyalamayın; her ürünü ayıran bilgiyi yazın.",
        ],
      },
      {
        id: "isletme-profili",
        title: "Google İşletme Profili'ni unutmayın",
        paragraphs: [
          "\"Yakınımdaki [telefon aksesuarı](/sektorler/elektronik-aksesuar) toptancısı\" gibi aramalarda harita sonuçları öne çıkar. Ücretsiz bir Google İşletme Profili açıp adresinizi, çalışma saatlerinizi, fotoğraflarınızı ve web sitenizi ekleyin. Kategori olarak \"toptancı\" ile başlayan en uygun seçeneği seçin.",
        ],
      },
      {
        id: "olcum",
        title: "Neyin işe yaradığını ölçün",
        paragraphs: [
          "Google Search Console'a sitenizi ekleyin. Hangi aramalarda göründüğünüzü, kaç kez tıklandığınızı ve sayfalarınızın dizine girip girmediğini buradan görürsünüz. Yapay zekâ destekli arama sonuçlarındaki görünürlük de aynı yerden izlenir.",
        ],
        bullets: [
          "Kurumsal sitenizi Search Console'a ekleyin.",
          "İlk ay sayfaların dizine girdiğini kontrol edin.",
          "Gösterimi olup tıklaması az olan aramalar için ürün sayfalarınızı zenginleştirin.",
        ],
      },
      {
        id: "sabir",
        title: "Sonuç ne zaman gelir?",
        paragraphs: [
          "Yeni bir sitenin aramalarda görünmesi zaman alır. Sayfaların dizine girmesi birkaç günden birkaç haftaya kadar sürebilir; rekabetin olduğu aramalarda üst sıralara çıkmak ise genellikle aylar ister. Bu süreyi kısaltmanın kesin bir yolu yoktur, ama yavaşlatan şeyleri önlemek mümkündür.",
          "Bu sürede en çok işe yarayan, sitenin başka yerlerden bağlantı almasıdır: Google İşletme Profili'ndeki web sitesi alanı, sosyal medya hesaplarınızın biyografisi, e-posta imzanız, fatura ve kartvizitinizdeki adres. Bayilerinize gönderdiğiniz mesajlarda da kurumsal site bağlantısını kullanın.",
        ],
      },
      {
        id: "yapmayin",
        title: "Yapmamanız gerekenler",
        paragraphs: [
          "Görünür olmak için yapılan bazı şeyler ya fiyatları ortaya çıkarır ya da arama motorlarının gözünde sitenin değerini düşürür.",
        ],
        bullets: [
          "Fiyat listesini PDF olarak siteye koymak: PDF'ler de aramalarda çıkar.",
          "Her şehir için aynı metinle ayrı sayfa açmak: arama motorları bunu değersiz içerik sayar.",
          "Görsellerin üzerine fiyat yazmak: görseller herkese açıktır.",
        ],
      },
    ],
    relatedSlugs: ["toptan-fiyatlari-rakiplerden-koruma", "yeni-bayi-basvurusu-alma", "lucatech-bayi-katalogu-nasil-acildi"],
    featureLinks: [
      { href: "/ozellikler/kurumsal-site", label: "Kurumsal site ve kendi alan adı" },
      { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
    ],
  },
  {
    slug: "bayilere-kampanya-duyurma",
    title: "Bayilere kampanya ve yeni ürün nasıl duyurulur?",
    description: "Toplu WhatsApp mesajı, katalog içi banner ve kampanya kartı, anlık bildirim: hangisi ne zaman işe yarar? Bayileri bıktırmadan duyuru yapmanın yolları.",
    category: "Bayi iletişimi",
    publishedAt: "2026-10-22",
    status: "published",
    sections: [
      {
        id: "sorun",
        title: "Duyuru yapmak kolay, okutmak zor",
        paragraphs: [
          "Yeni bir ürün geldiğinde ya da bir kampanya başladığında ilk akla gelen, bütün bayilere [WhatsApp'tan](/ozellikler/whatsapp-siparis) mesaj atmaktır. İlk birkaç mesaj okunur; sonra bayi her mesajı açmaz, bazıları sizi sessize alır. Duyuru sayısı arttıkça etkisi azalır.",
          "Daha iyi yol, duyuruyu bayinin zaten baktığı yere koymak ve yalnız gerçekten önemli olanı mesaj ya da bildirimle göndermektir.",
        ],
      },
      {
        id: "katalog-ici",
        title: "Katalogun içinde duyurun",
        paragraphs: [
          "Bayi sipariş vermek için kataloğu açtığında ilk gördüğü yer ana sayfanın üstüdür. Yeni ürünü ya da [kampanyayı](/ozellikler/kampanya-bildirimleri) buraya bir banner olarak koyun. Kampanya kartları ve indirimli ürünler bölümü, bayinin sepetini doldururken kampanyayı görmesini sağlar. Ürün listesinde Yeni Eklenenler sıralaması da son gelen ürünleri öne çıkarır.",
          "Bu yöntemler bütün paketlerde vardır ve bayiyi rahatsız etmez; bayi duyuruyu sipariş verirken görür.",
        ],
        bullets: [
          "Ana sayfa banner'ı: yeni ürün ya da kampanya görseli.",
          "Kampanya kartı: koşulu ve süresi yazılı kısa duyuru.",
          "İndirimli ürünler: indirimin ürün kartında görünmesi.",
          "Öne çıkan bölümler: belirli ürünleri bir başlık altında toplamak.",
        ],
        images: [
          { src: "/site/sektor/telefon-aksesuar-katalog.webp", alt: "Bayinin telefondan açtığı toptan katalog", caption: "Bayinin her siparişten önce açtığı katalog, duyuru için en doğal yerdir (demo mağaza).", width: 1206, height: 2622 },
        ],
      },
      {
        id: "bildirim",
        title: "Önemli duyurular için anlık bildirim",
        paragraphs: [
          "Profesyonel ve Kurumsal paketlerde bayilere anlık bildirim gönderebilirsiniz. Bayi kataloğunuzu telefonunun ana ekranına ekleyip bildirimlere izin verdiğinde, gönderdiğiniz bildirim kilit ekranına düşer. Bildirime dokunan bayi doğrudan ilgili ürüne ya da kategoriye gider.",
          "iPhone'da bildirimler için kataloğun Safari'den Ana Ekrana Ekle ile eklenmiş olması gerekir; Android'de tarayıcıdan izin vermek yeterlidir. Bayilere bunu ilk seferde bir kez anlatmanız, sonraki bütün duyuruları kolaylaştırır.",
        ],
      },
      {
        id: "ne-zaman-hangisi",
        title: "Hangi duyuru hangi kanaldan?",
        bullets: [
          "Yeni ürün: katalog banner'ı ve Yeni Eklenenler; ürün önemliyse bildirim.",
          "Süreli kampanya: kampanya kartı; başlangıçta bir bildirim.",
          "Stoka yeniden giren çok aranan ürün: bildirim.",
          "Fiyat güncellemesi: katalog zaten günceldir; ayrıca mesaj atmanız gerekmez.",
          "Çalışma saati ya da tatil: katalogdaki duyuru alanı.",
        ],
        paragraphs: [
          "Genel kural: haftada bir ya da iki bildirimi geçmeyin. Bayi her bildirimin işine yaradığını görürse açmaya devam eder.",
        ],
      },
      {
        id: "whatsapp-ne-zaman",
        title: "WhatsApp mesajı hâlâ işe yarar mı?",
        paragraphs: [
          "Yarar, ama kişiye özel olduğunda. Bir bayinin sık aldığı ürün stoka girdiğinde ona özel kısa bir mesaj, bütün listeye atılan genel duyurudan çok daha fazla okunur. Genel duyuruları katalog ve bildirime, kişisel konuları WhatsApp'a bırakın.",
        ],
      },
    ],
    relatedSlugs: ["whatsapp-toptan-siparis", "toptan-stok-takibi", "genax-paket-koli-siparis"],
    featureLinks: [
      { href: "/ozellikler/kampanya-bildirimleri", label: "Kampanya ve bildirimler" },
      { href: "/fiyatlandirma", label: "Bildirim hangi pakette?" },
      { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
    ],
  },
  {
    slug: "toptan-stok-takibi",
    title: "Toptan stok takibi: biten ürüne sipariş gelmesini önleyin",
    description: "Stokta olmayan ürüne gelen sipariş bayiyle tatsız bir telefondur. Katalogda stok durumunu göstermenin ve stoğu güncel tutmanın yolları.",
    category: "Sipariş yönetimi",
    publishedAt: "2026-10-24",
    status: "published",
    sections: [
      {
        id: "sorun",
        title: "\"O ürün bitti\" telefonu",
        paragraphs: [
          "Bayi siparişi verir, siz hazırlarken ürünün bittiğini fark edersiniz. Bayiyi arayıp sipariş değiştirmek hem zaman alır hem de bayide güven kaybı yaratır. Sorun çoğu zaman stoğun bilinmemesi değil, katalogda görünmemesidir.",
        ],
      },
      {
        id: "iki-yontem",
        title: "İki seviye: var/yok ya da adet",
        paragraphs: [
          "En basit yöntem her ürün için yalnız stokta olup olmadığını işaretlemektir. Stokta olmayan ürün katalogda \"Yakında\" olarak görünür ve sepete eklenemez. Bu yöntem stok adedini bilmeyen ya da her gün saymak istemeyen toptancılar için yeterlidir.",
          "Adet bazlı takipte ise ürünün stok adedini girersiniz. Bayi katalogda \"Stok: 120 adet\" gibi kalan miktarı görür, sepete kalan adetten fazlasını ekleyemez. Stok sıfıra indiğinde ürüne sipariş verilemez.",
        ],
        bullets: [
          "Var/yok: Stokta olmayan ürün \"Yakında\" görünür, sepete eklenemez.",
          "Adet bazlı: Kalan adet görünür, sepet kalan adetle sınırlanır.",
          "İkisi bir arada kullanılabilir: önemli ürünlerde adet, diğerlerinde var/yok.",
        ],
        images: [
          { src: "/site/sektor/elektrik-sepet.webp", alt: "Bayinin sepet ekranı", caption: "Bayinin sepeti: stok güncel değilse sorun burada başlar (demo mağaza).", width: 1206, height: 2622 },
        ],
      },
      {
        id: "stok-ne-zaman-duser",
        title: "Stok ne zaman düşer?",
        paragraphs: [
          "Toptancı mağazalarında stok, siparişi onayladığınızda düşer. Bayi siparişi verdiği anda değil, siz onayladığınızda düşmesi; iptal ettiğiniz ya da hiç hazırlamayacağınız siparişlerin stoğu boşuna kilitlemesini önler. Onaylı bir siparişte adet değiştirirseniz stok farkı da buna göre düzeltilir.",
        ],
      },
      {
        id: "gizle-mi-goster-mi",
        title: "Stokta olmayan ürünü gizlemeli mi?",
        paragraphs: [
          "İki yaklaşımın da avantajı var. Stokta olmayan ürünü göstermek, bayiye ürünün yelpazenizde olduğunu ve yakında geleceğini söyler. Gizlemek ise katalogu sadeleştirir. Ayarlar'dan stokta olmayan ürünleri vitrinde gizlemeyi açıp kapatabilirsiniz; ürünler panelde kalmaya devam eder.",
        ],
      },
      {
        id: "guncel-tutmak",
        title: "Stoğu güncel tutmanın pratik yolları",
        bullets: [
          "Mal girişinde ilgili ürünleri hemen \"stokta\" yapın.",
          "Toplu değişikliklerde [Excel](/ozellikler/toplu-urun-yukleme) dosyasındaki Stok Durumu sütununu (Var/Yok) güncelleyip aynı dosyayı yeniden yükleyin.",
          "Haftada bir, en çok satan ürünlerin stok adedini sayıp girin.",
          "Stoka yeniden giren aranan ürünü bayilere duyurun.",
        ],
        paragraphs: [
          "Stok bilgisinin her zaman kusursuz olması gerekmez; bayinin \"bu ürün var mı?\" diye sormasına gerek bırakmayacak kadar güncel olması yeterlidir.",
        ],
      },
    ],
    relatedSlugs: ["toptan-siparis-kurallari", "bayi-siparisi-duzenleme", "bayilere-kampanya-duyurma"],
    featureLinks: [
      { href: "/ozellikler/whatsapp-siparis", label: "Sipariş akışını inceleyin" },
      { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
    ],
  },
  {
    slug: "bayi-siparisi-duzenleme",
    title: "Bayi siparişi sonradan nasıl düzenlenir?",
    description: "Bayi siparişten sonra \"şunu da ekle\" der ya da bir ürün biter. Siparişi baştan almadan düzenlemenin ve güncel fişi göndermenin adımları.",
    category: "Sipariş yönetimi",
    publishedAt: "2026-10-27",
    status: "published",
    sections: [
      {
        id: "sorun",
        title: "Sipariş verildikten sonra değişir",
        paragraphs: [
          "Toptanda sipariş nadiren ilk haliyle kalır. Bayi telefonla iki ürün daha ister, bir ürün depoda bitmiştir ya da bayi adet değiştirir. Siparişi baştan aldırmak bayiyi yorar; mesajlardan elle düzeltmek ise hataya açıktır.",
        ],
      },
      {
        id: "onayla-iptal",
        title: "Önce onaylayın ya da iptal edin",
        paragraphs: [
          "eKatalox'ta toptancı mağazalarında gelen her sipariş Siparişler sayfasında bekler. Siparişi kontrol ettikten sonra Onayla ya da İptal ile karar verirsiniz. Onaylanan sipariş [raporlarda](/ozellikler/raporlar) satış olarak sayılır ve stok takibi açık ürünlerde stok düşer.",
        ],
      },
      {
        id: "duzenle",
        title: "Siparişi düzenleyin",
        paragraphs: [
          "Siparişin Düzenle ekranında ürün ekleyebilir, ürün çıkarabilir, adetleri ve fiyatları değiştirebilir, bayinin bilgilerini düzeltebilirsiniz. Düzenleme sipariş onaylandıktan sonra da yapılabilir.",
          "Siparişe eklediğiniz yeni ürünün fiyatı, siparişin verildiği [fiyat listesi](/ozellikler/bayi-fiyat-listeleri)nden gelir. Bayi 2. liste fiyatlarıyla sipariş verdiyse eklenen ürün de 2. liste fiyatıyla girer; listeyi elle kontrol etmeniz gerekmez.",
        ],
        bullets: [
          "Ürün ekle: fiyat siparişin fiyat listesinden.",
          "Ürün çıkar ya da adet değiştir.",
          "Gerekirse birim fiyatı değiştir.",
          "Bayi adı, telefonu ya da adresini düzelt.",
        ],
      },
      {
        id: "guncel-fis",
        title: "Güncel fişi bayiye gönderin",
        paragraphs: [
          "Düzenlemeden sonra Güncel fişi [WhatsApp'tan](/ozellikler/whatsapp-siparis) gönder düğmesi, siparişin son halini içeren fiş bağlantısını bayiye gönderilecek mesaja ekler. Fiş her açılışta siparişin o anki haliyle yeniden oluşturulur; bayinin elindeki bağlantı hep güncel kalır.",
          "Böylece bayi \"ne değişti?\" diye sormadan son tutarı ve ürünleri görür, siz de aynı belge üzerinden hazırlık yaparsınız.",
        ],
        images: [
          { src: "/site/order-flow/whatsapp-anonymized.png", alt: "Sipariş fişi bağlantısı içeren WhatsApp mesajı örneği", caption: "Fiş bağlantısı WhatsApp mesajıyla iletilir (temsili veriler).", width: 1536, height: 1024 },
        ],
      },
      {
        id: "iyi-uygulamalar",
        title: "Düzenlemeyi düzenli tutmak için",
        bullets: [
          "Bayinin telefonla istediği değişikliği hemen siparişe işleyin; sonraya bırakmayın.",
          "Biten ürünü siparişten çıkardığınızda bayiye kısa bir not düşün.",
          "Fiyatı elle değiştirdiyseniz nedenini bayiye söyleyin.",
          "Hazırlık için hep güncel fişi kullanın, eski mesajı değil.",
        ],
        paragraphs: [],
      },
    ],
    relatedSlugs: ["whatsapp-toptan-siparis", "toptan-stok-takibi", "genax-paket-koli-siparis"],
    featureLinks: [
      { href: "/ozellikler/whatsapp-siparis", label: "Sipariş ve PDF fişi" },
      { href: "/ozellikler/raporlar", label: "Satış raporları" },
      { href: "/egitim", label: "Adım adım video anlatımlar (Eğitim Merkezi)" },
    ],
  },
];

export function getBlogPosts(): BlogPost[] {
  const today = istanbulToday();
  // Yerelde (next dev) ileri tarihli yazılar da görünür ki yayından önce kontrol edilebilsin.
  const showScheduled = process.env.NODE_ENV === "development";
  return posts
    .filter((post) => post.status === "published" && (showScheduled || post.publishedAt <= today))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
export function getBlogPost(slug: string) {
  return getBlogPosts().find((post) => post.slug === slug);
}
export function getRelatedPosts(post: BlogPost) {
  const others = getBlogPosts().filter((item) => item.slug !== post.slug);
  return [...others.filter((item) => post.relatedSlugs.includes(item.slug)), ...others.filter((item) => !post.relatedSlugs.includes(item.slug))].slice(0, 3);
}
export function readingMinutes(post: BlogPost) {
  const text = post.sections.map((section) => [section.title, ...section.paragraphs, ...(section.bullets ?? [])].join(" ")).join(" ").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
}
export function blogDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
