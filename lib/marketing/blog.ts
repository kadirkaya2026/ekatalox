export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  updatedAt?: string;
  status: "published" | "draft";
  sections: { id: string; title: string; paragraphs: string[]; bullets?: string[] }[];
  relatedSlugs: string[];
  featureLinks: { href: string; label: string }[];
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
          "Bayi, perakende ve özel müşteri gruplarına farklı fiyatlarla çalışıyorsanız her grup için ayrı PDF hazırlamak takip yükünü artırabilir. Şifreli fiyat listeleri kullanan bir katalogda, müşterinin giriş yaptığı listeye ait fiyatlar gösterilir. Ürün bilgileri ise aynı katalog üzerinden yönetilir.",
          "eKatalox’ta fiyat listelerini ve giriş şifrelerini panelden yönetebilirsiniz. Kataloğu tamamen şifreli kullanabilir veya şifresiz ziyaretçilere ürünleri fiyatsız gösterebilirsiniz. Herkese açık kurumsal ürün sayfaları bayi fiyatlarını yayınlamaz. Açık açıklamalara veya görsellere ayrıca fiyat yazarsanız bunların da ziyaretçiler tarafından görülebileceğini göz önünde bulundurun.",
        ],
      },
      {
        id: "katalogdan-siparise",
        title: "Katalogdan WhatsApp siparişine geçiş",
        paragraphs: [
          "Sipariş özelliği olan bir katalogda müşteri ürünlerini seçip sepet hazırlayabilir. Adet veya koli bilgileri, seçilen ürünler ve tutarlar aynı siparişte toplanır. Böylece işletmenin farklı mesajlardan ürün kodlarını ve miktarları bir araya getirmesi kolaylaşır.",
          "eKatalox’ta oluşan siparişler Siparişlerim sayfasında takip edilir. Müşteri PDF sipariş fişi bağlantısıyla WhatsApp’a geçer ve mesajı göndererek paylaşır. İşletme isterse kayıtlı WhatsApp numarasını alıcı olarak kullanır; isterse müşterinin göndereceği kişiyi seçmesine izin verir. PDF sipariş fişi, ürünlerin tamamını tanıtan bir PDF katalogdan farklıdır.",
        ],
      },
      {
        id: "baslangic-kontrol-listesi",
        title: "İlk kataloğunuzu hazırlarken neleri kontrol etmelisiniz?",
        paragraphs: [
          "Önce ürün verilerinizi düzenleyin. Tutarlı ürün kodları, anlaşılır isimler ve doğru fotoğraflar hem müşterinin ürün bulmasını hem de sizin güncelleme yapmanızı kolaylaştırır. Mevcut Excel listeniz varsa aktarım şablonuyla eşleştirin; önce küçük bir ürün grubuyla sonuçları kontrol edin.",
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
        "Örneğin yalnız ürünlerini tanıtmak isteyen bir üreticiyle, her gün farklı bayi fiyatlarıyla sipariş alan bir toptancının ihtiyacı aynı olmayabilir. eKatalox’ta şifreli fiyat listeleri ve WhatsApp sipariş akışıyla başlayabilirsiniz. Müşteriniz kataloğu tarayıcıdan açar; uygulama indirmesi gerekmez."
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
        "Ürünleri panelden ekleyin veya Excel/CSV şablonuyla aktarın.",
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
        "Sipariş oluştuğunda Siparişlerim sayfasını kontrol edin. WhatsApp’a geçince mesajı müşterinin gönderdiğini unutmayın: bağlantının açılması, mesajın gönderildiği anlamına gelmez. Test tamamlandığında katalog bağlantısını ve ilgili şifreyi bayilerinizle paylaşabilirsiniz."
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
    }
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
        "Şifreli online katalogda fiyat listeleri giriş erişimiyle ayrılır. eKatalox’ta şifresiz ziyaretçilere fiyatsız ürün gösterimi de kullanılabilir. Bununla birlikte liste şifresini bilen kişi o listeye erişebilir; şifre paylaşımını işletmenizin politikasına göre yönetmelisiniz."
      ]
    },
    {
      "id": "internet-ve-siparis",
      "title": "İnternet erişimi ve sipariş toplama",
      "paragraphs": [
        "İndirilmiş bir PDF internet olmadan okunabilir. Online kataloğun güncel içeriğine ulaşmak ise internet bağlantısı gerektirir. Saha ziyareti veya bağlantının zayıf olduğu ortamlarda bu farkı hesaba katın.",
        "PDF’den sipariş alan bir işletmede müşteri ürün kodlarını mesajla iletebilir. Siparişli online katalogda ise müşteri ürünleri seçip sepet hazırlayabilir. eKatalox’ta PDF sipariş fişi bağlantısı WhatsApp üzerinden müşteri tarafından paylaşılır ve sipariş panelde takip edilir. Bu fiş, tüm ürünlerin yer aldığı PDF katalog değildir."
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
    }
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
    }
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
        "WhatsApp üzerinden toptan sipariş toplarken en sık yaşanan zorluklardan biri, ürün ve miktar bilgisinin farklı mesajlara dağılmasıdır. Bir müşteri ürün kodunu, diğeri fotoğrafı, başka biri de sesli mesajı kullanabilir. Hazırlık sırasında hangi ürünün kaç adet istendiğini yeniden sormanız gerekebilir.",
        "Müşteriye ortak bir ürün listesi ve sipariş biçimi sunmak bu karışıklığı azaltır. Siparişli katalogda ürün kodu, birim ve miktar sepetten gelir. Formdaki müşteri alanları da işletmenizin ihtiyaç duyduğu bilgileri toplar."
      ]
    },
    {
      "id": "urun-secimi",
      "title": "1. Müşteri kendi fiyatıyla ürün seçer",
      "paragraphs": [
        "Bayinize katalog bağlantısını ve ilgili fiyat listesine ait giriş bilgisini gönderin. Müşteri tarayıcıdan kataloğa girer, ürünleri kategori veya aramayla bulur ve sepete ekler. Uygulama indirmesi gerekmez.",
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
    }
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
        "Bayiye özel fiyat listesi hazırlarken önce fiyat farkının nedenini belirleyin. Perakende, düzenli bayi veya özel anlaşmalı müşteri gibi gruplar aynı ürün için farklı fiyatla çalışabilir. Her müşteri için yeni liste açmak yerine ortak kurallarla çalışan grupları belirlemek yönetimi kolaylaştırır.",
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
        "Kampanya veya indirim varsa müşteri ekranındaki sonuç beklediğiniz gibi mi?",
        "Eski erişimi değiştirdiyseniz ilgili müşterilere güncel bilgiyi ilettiniz mi?"
      ]
    },
    {
      "id": "paket-secimi",
      "title": "Liste sayısını ihtiyaca göre seçin",
      "paragraphs": [
        "eKatalox’ta ücretsiz plan 2, Başlangıç 3, Profesyonel 15 fiyat listesi sunar; Kurumsal pakette fiyat listesi sınırı yoktur. Paket seçmeden önce kaç ayrı fiyat düzenine gerçekten ihtiyacınız olduğunu çıkarın ve güncel koşulları fiyatlandırma sayfasından inceleyin.",
        "Liste sayısının artması tek başına daha iyi bayi yönetimi sağlamaz. Net grup adları, düzenli fiyat kontrolü ve doğru erişim paylaşımı günlük işi kolaylaştırır. Başlangıç ve üzeri paketlerde il–fiyat listesi giriş raporlarıyla katalog kullanımını da inceleyebilirsiniz."
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
    }
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
        "Excel’den ürün kataloğu oluştururken ilk iş, elinizdeki dosyanın sütunlarını aktarım şablonuyla eşleştirmektir. eKatalox panelindeki şablonu indirin ve güncel alanları inceleyin. Farklı bir sistemden aldığınız Excel dosyasının doğrudan aynı düzende olduğunu varsaymayın.",
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
    }
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
        "WhatsApp siparişi kayıtlı numaranıza yönlendirebilir veya müşterinin alıcıyı seçmesine izin verebilirsiniz. İkinci seçenek, müşterinin siparişi kendi toptancısına iletmek istediği akışlarda kullanılabilir. Mesajı müşterinin WhatsApp üzerinden gönderdiğini açıkça anlatın.",
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
    }
  ]
},
];

export function getBlogPosts(): BlogPost[] {
  return posts.filter((post) => post.status === "published").sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
export function getBlogPost(slug: string) {
  return getBlogPosts().find((post) => post.slug === slug);
}
export function getRelatedPosts(post: BlogPost) {
  const others = getBlogPosts().filter((item) => item.slug !== post.slug);
  return [...others.filter((item) => post.relatedSlugs.includes(item.slug)), ...others.filter((item) => !post.relatedSlugs.includes(item.slug))].slice(0, 3);
}
export function readingMinutes(post: BlogPost) {
  const text = post.sections.map((section) => [section.title, ...section.paragraphs, ...(section.bullets ?? [])].join(" ")).join(" ");
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
}
export function blogDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
