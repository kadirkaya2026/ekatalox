-- 0046'nın devamı: demo.ekatalox.com (Volt Aksesuar Toptan) için ürün
-- açıklamaları, kampanya banner'ları ve logo.
--
-- Tenant: 81995edb-36c4-4492-ab74-d5ab2368a68c (subdomain: demo)

-- 1) Logo (public/demo/volt-aksesuar-logo.png — proxy.ts uzantılı yolları
-- tenant rewrite'ından muaf tutar, bu yüzden dosya yolu tüm alt alan
-- adlarında aynı şekilde çalışır)
update public.tenant_storefront_settings
  set logo_url = '/demo/volt-aksesuar-logo.png'
  where tenant_id = '81995edb-36c4-4492-ab74-d5ab2368a68c';

-- 2) Kampanya banner'ları (yalnızca image_url ve background_color vitrinde
-- render edilir; title/description alanları admin panelinde referans içindir)
update public.tenant_storefront_settings
  set banner_items = '[
    {
      "id": "demo-banner-1",
      "title": "Yeni Sezon Aksesuar Koleksiyonu",
      "description": "Şarj, kulaklık, kılıf ve daha fazlası — güncel modeller stokta.",
      "image_url": "https://images.unsplash.com/photo-1573739022854-abceaeb585dc?auto=format&fit=crop&w=1600&h=534&q=80",
      "cta_label": null,
      "cta_href": null,
      "background_color": null
    },
    {
      "id": "demo-banner-2",
      "title": "Hızlı Şarj Teknolojisinde Yeni Nesil",
      "description": "GaN adaptörler ve kablosuz şarj çözümleriyle vitrininizi güçlendirin.",
      "image_url": "https://images.unsplash.com/photo-1615526675221-e763c4ec84f1?auto=format&fit=crop&w=1600&h=534&q=80",
      "cta_label": null,
      "cta_href": null,
      "background_color": null
    },
    {
      "id": "demo-banner-3",
      "title": "Toplu Alımlarda Ekstra Avantaj",
      "description": "50+ adet siparişlerde koli bazlı fiyat avantajından yararlanın.",
      "image_url": "https://images.unsplash.com/photo-1620566160204-017b23cf046d?auto=format&fit=crop&w=1600&h=534&q=80",
      "cta_label": null,
      "cta_href": null,
      "background_color": null
    }
  ]'::jsonb
  where tenant_id = '81995edb-36c4-4492-ab74-d5ab2368a68c';

-- 3) Ürün açıklamaları
update public.products set description = '<p>USB-C PD teknolojisiyle telefonları ve tabletleri hızlı ve güvenli şekilde şarj eder. Kompakt tasarımı sayesinde reyon ve raf alanından tasarruf sağlar.</p><ul><li>20W USB-C Power Delivery çıkışı</li><li>Aşırı ısınma ve kısa devre koruması</li><li>Küçük kutu boyutu, kolay teşhir</li></ul>' where id = 'c6450376-ac67-4f17-b1d8-9c63463e9589';

update public.products set description = '<p>Aynı anda iki cihazı hızlı şekilde şarj edebilen çift portlu duvar adaptörü. Aile ve ofis kullanımında yüksek talep gören modellerden.</p><ul><li>33W toplam çıkış, USB-A + USB-C</li><li>Akıllı akım paylaşımı</li><li>Evrensel fiş uyumu</li></ul>' where id = 'ea7826c8-4f44-4b23-b698-a27c380b1302';

update public.products set description = '<p>GaN (Galyum Nitrür) teknolojisiyle daha küçük gövdede daha yüksek güç sunar; dizüstü bilgisayardan telefona kadar geniş bir cihaz yelpazesini tek adaptörle şarj eder.</p><ul><li>65W çıkış gücü, dizüstü bilgisayar uyumlu</li><li>GaN teknolojisiyle %40 daha küçük gövde</li><li>Premium segment, yüksek kâr marjı</li></ul>' where id = '59e66beb-d995-4b6d-8b60-e53a24205692';

update public.products set description = '<p>Naylon örgülü dış yüzeyiyle standart kablolara göre çok daha dayanıklıdır. Reyonlarda en çok satan aksesuar kategorilerinden biridir.</p><ul><li>1 metre, naylon örgülü kablo</li><li>Hızlı şarj ve veri aktarımı desteği</li><li>10.000+ bükülme testi</li></ul>' where id = 'cdb5ab2b-d42a-48a1-996e-d6e3ddd66b5e';

update public.products set description = '<p>2 metre uzunluğu sayesinde araç içi ve yatak başı kullanımda ekstra konfor sağlar. Apple cihazlarla tam uyumludur.</p><ul><li>2 metre, örgülü ve dayanıklı yapı</li><li>MFi uyumlu hızlı şarj desteği</li><li>Renk seçenekleriyle sunulabilir</li></ul>' where id = 'ac4ce2f8-699a-474d-b81f-1ec11c41f38b';

update public.products set description = '<p>Halen geniş bir cihaz parkında kullanılan Micro USB girişi için ekonomik ve güvenilir şarj kablosu.</p><ul><li>1.5 metre kablo uzunluğu</li><li>Ekonomik fiyat, yüksek ciro potansiyeli</li><li>Stoklar tükenmeden yeniden sipariş önerilir</li></ul>' where id = '3e78b2a2-176d-45c1-af49-501f9fdc2463';

update public.products set description = '<p>Günlük kullanım için ideal, cep boyutlarında pratik powerbank. Giriş seviyesi müşteriler için en çok tercih edilen kapasite aralığı.</p><ul><li>10.000 mAh lityum polimer batarya</li><li>Çift çıkış portu</li><li>Kompakt ve hafif tasarım</li></ul>' where id = 'e849973d-b9d5-4d3c-a69f-bbec1fb55a79';

update public.products set description = '<p>Yüksek kapasitesi ve hızlı şarj desteğiyle seyahat ve iş seyahatleri için tercih edilen, kampanyalı fiyatıyla vitrinde öne çıkan modeldir.</p><ul><li>20.000 mAh kapasite</li><li>18W hızlı şarj çıkışı</li><li>LED kapasite göstergesi</li></ul>' where id = '46068bf8-6981-4730-90f8-43dba85c6171';

update public.products set description = '<p>Dijital ekranından kalan şarj yüzdesini anlık gösteren, üst segment müşterilere yönelik premium powerbank.</p><ul><li>30.000 mAh yüksek kapasite</li><li>Dijital yüzde göstergeli ekran</li><li>Üç cihazı aynı anda şarj edebilme</li></ul>' where id = '7d45f25d-b3d5-4a4c-9c65-879fe8c44116';

update public.products set description = '<p>Şarj kutusuyla birlikte gelen, kablosuz özgürlük sunan kulak içi kulaklık. İndirimli kampanya fiyatıyla hızlı satan ürünlerden.</p><ul><li>Bluetooth 5.0 kararlı bağlantı</li><li>Şarj kutusuyla birlikte ~24 saat kullanım</li><li>Dokunmatik kontrol</li></ul>' where id = '07ddc3dd-f79b-4a81-a246-f56ad2cc735d';

update public.products set description = '<p>Kulak arkası sabitleme yapısıyla spor ve aktif kullanım için tasarlanmış, terlemeye dayanıklı kulaklık.</p><ul><li>IPX4 terlemeye dayanıklı yapı</li><li>Ergonomik kulak arkası kanca</li><li>Uzun pil ömrü</li></ul>' where id = '21674492-9a19-4741-8af9-28797aecfeb1';

update public.products set description = '<p>Ekonomik segmentte, mikrofonlu kablolu kulaklık arayan müşteriler için klasik ve güvenilir seçenek.</p><ul><li>3.5mm evrensel jak girişi</li><li>Entegre mikrofon ve tuş kumandası</li><li>Yüksek adetli toplu alımlara uygun</li></ul>' where id = 'a381143c-db5e-42c8-b8f1-bc6d3508309a';

update public.products set description = '<p>Farklı telefon modelleri için geniş kalıp seçenekleriyle sunulan, esnek ve darbe emici silikon kılıf.</p><ul><li>Yumuşak dokulu silikon yapı</li><li>Kamera çıkıntısını koruyan kenar</li><li>Çok sayıda model seçeneği</li></ul>' where id = '1cb6d9b6-1c4c-46ae-8ffc-25192bae0784';

update public.products set description = '<p>Telefonun orijinal görünümünü koruyan, sararmaya dirençli şeffaf sert kılıf.</p><ul><li>Sararmaya dayanıklı PC malzeme</li><li>İnce ve hafif yapı</li><li>Ekran ve kamera kenarı yükseltilmiş koruma</li></ul>' where id = 'e217dc51-f8af-476d-9c40-685ed3998e93';

update public.products set description = '<p>Kart bölmeli tasarımıyla cüzdan ihtiyacını da karşılayan, premium görünümlü kılıf modelidir.</p><ul><li>2 kart bölmeli iç tasarım</li><li>Mıknatıslı kapak sistemi</li><li>Stant (durma) özelliği</li></ul>' where id = 'a9d03bfc-cf4c-42dd-b50c-a517bd05045a';

update public.products set description = '<p>Yüksek sertlik değeriyle çizilme ve darbelere karşı ekranı korur; hemen her telefon reyonunun değişmez ürünüdür.</p><ul><li>9H sertlik derecesi</li><li>Oleofobik parmak izi karşıtı kaplama</li><li>Kolay balonsuz uygulama</li></ul>' where id = '370dd8e3-ac24-4b52-bf17-5d227f5b6d53';

update public.products set description = '<p>Yan açıdan bakışları engelleyen gizlilik filtresiyle, özellikle iş kullanıcıları arasında talep gören bir modeldir.</p><ul><li>Yandan bakışı engelleyen gizlilik katmanı</li><li>9H sertlik, darbe direnci</li><li>Katma değerli, yüksek marjlı ürün</li></ul>' where id = '15e4b111-90a0-46a3-bdd4-2fba2aa419ba';

update public.products set description = '<p>Telefonun en hassas noktalarından biri olan kamera camını çizilmeye karşı koruyan, ekonomik tamamlayıcı ürün.</p><ul><li>2 adet lens koruyucu içerir</li><li>Şeffaf ve ince yapı</li><li>Kasa çapraz satış için ideal</li></ul>' where id = '76362516-6af9-4278-b044-51289ab0de66';

update public.products set description = '<p>Kompakt boyutuna rağmen güçlü ses performansı sunan, günlük kullanım için en çok tercih edilen hoparlör modeli.</p><ul><li>Bluetooth 5.0 bağlantı</li><li>Uzun pil ömrü</li><li>Kompakt taşınabilir tasarım</li></ul>' where id = '9038feac-ded6-4180-b390-4163e2f7decc';

update public.products set description = '<p>IPX7 su geçirmezlik derecesiyle havuz, plaj ve banyo kullanımına uygun mini hoparlör.</p><ul><li>IPX7 su geçirmezlik sertifikası</li><li>Karabina askı aparatı</li><li>Kompakt boyut, kolay taşıma</li></ul>' where id = '11db0b65-f2a4-4a5c-91b3-80a15c72ea2a';

update public.products set description = '<p>RGB ışık efektleriyle parti ve etkinliklerde öne çıkan, güçlü bas performansına sahip büyük hoparlör.</p><ul><li>RGB ışık efekti modları</li><li>Güçlü bas ve yüksek ses seviyesi</li><li>Kampanya fiyatıyla mevsimsel satış fırsatı</li></ul>' where id = 'ba705dfe-76d7-4487-99e8-92e9e19b3848';

update public.products set description = '<p>Havalandırma boşluğuna kolayca monte edilen, güçlü mıknatıslı yapısıyla telefonu güvenle sabitleyen araç aksesuarı.</p><ul><li>Güçlü mıknatıs sabitleme sistemi</li><li>360 derece döner başlık</li><li>Kolay havalandırma montajı</li></ul>' where id = '29e70b9e-f61a-4068-8849-00e4c7dbc778';

update public.products set description = '<p>Çakmaklık girişine takılan, aynı anda iki cihazı hızlı şarj edebilen araç şarj cihazı.</p><ul><li>Çift USB çıkış portu</li><li>Hızlı şarj desteği</li><li>Kompakt ve dayanıklı gövde</li></ul>' where id = '34793e43-8d76-49f8-8576-63f9c59b9953';

update public.products set description = '<p>Eski model araçlarda bile Bluetooth ile müzik dinleme ve eller serbest arama imkânı sunan popüler bir aksesuar.</p><ul><li>Bluetooth ile FM üzerinden müzik aktarımı</li><li>Eller serbest arama desteği</li><li>USB şarj çıkışı entegre</li></ul>' where id = 'f78d2ec9-ebcf-4e88-8834-b06daf94e600';
