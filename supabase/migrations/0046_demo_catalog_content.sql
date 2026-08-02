-- İçerik seed migrasyonu: demo.ekatalox.com vitrinini gerçek bir toptan
-- elektronik aksesuar kataloğu gibi doldurur (0004_seed_demo_data.sql'deki
-- gibi tek seferlik içerik migrasyonu; şema değişikliği içermez).
--
-- Tenant: 81995edb-36c4-4492-ab74-d5ab2368a68c (subdomain: demo)

-- 1) Tenant / vitrin kimliği
update public.tenants
  set company_name = 'Volt Aksesuar Toptan'
  where id = '81995edb-36c4-4492-ab74-d5ab2368a68c';

-- 2) Kategoriler: mevcut ikisini yeniden adlandır, altı yeni kategori ekle
update public.categories
  set name = 'Şarj Aletleri', display_order = 1
  where id = 'e960b453-2471-4a2b-b16a-99774e3dd850';

update public.categories
  set name = 'Şarj Kabloları', display_order = 2
  where id = '1cd9bbce-b789-48bd-aa55-1ad386797dc1';

insert into public.categories (id, tenant_id, name, parent_id, display_order)
values
  ('78353f9a-6312-4531-9b06-6290fffc2f0b', '81995edb-36c4-4492-ab74-d5ab2368a68c', 'Powerbank', null, 3),
  ('0950fe54-eb60-415d-b296-31a1b57e975d', '81995edb-36c4-4492-ab74-d5ab2368a68c', 'Kulaklık', null, 4),
  ('a59d5576-57ba-4e4d-9c03-9a65e01e2fa3', '81995edb-36c4-4492-ab74-d5ab2368a68c', 'Telefon Kılıfı', null, 5),
  ('45f0b7c8-601f-47ff-b420-ddac4b0fab43', '81995edb-36c4-4492-ab74-d5ab2368a68c', 'Ekran Koruyucu', null, 6),
  ('f3d0f44b-0b2b-4f0c-a9a7-c7b890629853', '81995edb-36c4-4492-ab74-d5ab2368a68c', 'Bluetooth Hoparlör', null, 7),
  ('500f3a19-2ea6-42ba-a7a9-1cea84737275', '81995edb-36c4-4492-ab74-d5ab2368a68c', 'Araç Aksesuarları', null, 8);

-- 3) Eski test ürünlerini (LC-101..104) ve fiyatlarını temizle
delete from public.product_prices
  where product_id in (
    select id from public.products where tenant_id = '81995edb-36c4-4492-ab74-d5ab2368a68c'
  );

delete from public.products where tenant_id = '81995edb-36c4-4492-ab74-d5ab2368a68c';

-- 4) Artık ürünsüz kalan "Genel" kategorisini kaldır
delete from public.categories
  where id = 'ce35256b-c4d2-47ae-a333-36d6a2a1b744';

-- 5) Yeni ürün kataloğu (24 ürün, 8 kategori, TRY, gerçekçi toptan birim/koli adetleri)
insert into public.products
  (id, tenant_id, category_id, display_order, sku_code, product_name, image_url, currency,
   is_in_stock, is_discount_active, discount_price, is_recommended, package_quantity, carton_quantity)
values
  -- Şarj Aletleri
  ('c6450376-ac67-4f17-b1d8-9c63463e9589', '81995edb-36c4-4492-ab74-d5ab2368a68c', 'e960b453-2471-4a2b-b16a-99774e3dd850', 1,
   'VLT-CH20', '20W USB-C Hızlı Şarj Adaptörü', 'https://images.unsplash.com/photo-1731616103600-3fe7ccdc5a59?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, false, 20, 200),
  ('ea7826c8-4f44-4b23-b698-a27c380b1302', '81995edb-36c4-4492-ab74-d5ab2368a68c', 'e960b453-2471-4a2b-b16a-99774e3dd850', 2,
   'VLT-CH33', '33W Çift Portlu Duvar Şarjı', 'https://images.unsplash.com/photo-1557767382-97b28f5488e7?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, false, 20, 200),
  ('59e66beb-d995-4b6d-8b60-e53a24205692', '81995edb-36c4-4492-ab74-d5ab2368a68c', 'e960b453-2471-4a2b-b16a-99774e3dd850', 3,
   'VLT-CH65', '65W GaN Hızlı Şarj Adaptörü', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, true, 20, 200),

  -- Şarj Kabloları
  ('cdb5ab2b-d42a-48a1-996e-d6e3ddd66b5e', '81995edb-36c4-4492-ab74-d5ab2368a68c', '1cd9bbce-b789-48bd-aa55-1ad386797dc1', 4,
   'VLT-CB100', 'Type-C Örgülü Hızlı Şarj Kablosu 1m', 'https://images.unsplash.com/photo-1572721546624-05bf65ad7679?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, false, 50, 500),
  ('ac4ce2f8-699a-474d-b81f-1ec11c41f38b', '81995edb-36c4-4492-ab74-d5ab2368a68c', '1cd9bbce-b789-48bd-aa55-1ad386797dc1', 5,
   'VLT-CB200', 'Lightning Örgülü Şarj Kablosu 2m', 'https://images.unsplash.com/photo-1492107376256-4026437926cd?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, false, 50, 500),
  ('3e78b2a2-176d-45c1-af49-501f9fdc2463', '81995edb-36c4-4492-ab74-d5ab2368a68c', '1cd9bbce-b789-48bd-aa55-1ad386797dc1', 6,
   'VLT-CB300', 'Micro USB Hızlı Şarj Kablosu 1.5m', 'https://images.unsplash.com/photo-1573868388390-2739872961e6?auto=format&fit=crop&w=900&q=80',
   'TRY', false, false, null, false, 50, 500),

  -- Powerbank
  ('e849973d-b9d5-4d3c-a69f-bbec1fb55a79', '81995edb-36c4-4492-ab74-d5ab2368a68c', '78353f9a-6312-4531-9b06-6290fffc2f0b', 7,
   'VLT-PB10', '10.000 mAh Taşınabilir Powerbank', 'https://images.unsplash.com/photo-1585995603413-eb35b5f4a50b?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, false, 10, 100),
  ('46068bf8-6981-4730-90f8-43dba85c6171', '81995edb-36c4-4492-ab74-d5ab2368a68c', '78353f9a-6312-4531-9b06-6290fffc2f0b', 8,
   'VLT-PB20', '20.000 mAh Hızlı Şarj Powerbank', 'https://images.unsplash.com/photo-1566554738544-d962991c3fee?auto=format&fit=crop&w=900&q=80',
   'TRY', true, true, 399, true, 10, 100),
  ('7d45f25d-b3d5-4a4c-9c65-879fe8c44116', '81995edb-36c4-4492-ab74-d5ab2368a68c', '78353f9a-6312-4531-9b06-6290fffc2f0b', 9,
   'VLT-PB30', '30.000 mAh Dijital Ekranlı Powerbank', 'https://images.unsplash.com/photo-1644571669401-9ab344866592?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, false, 5, 50),

  -- Kulaklık
  ('07ddc3dd-f79b-4a81-a246-f56ad2cc735d', '81995edb-36c4-4492-ab74-d5ab2368a68c', '0950fe54-eb60-415d-b296-31a1b57e975d', 10,
   'VLT-EB100', 'Kablosuz Bluetooth Kulak İçi Kulaklık', 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=900&q=80',
   'TRY', true, true, 319, true, 10, 100),
  ('21674492-9a19-4741-8af9-28797aecfeb1', '81995edb-36c4-4492-ab74-d5ab2368a68c', '0950fe54-eb60-415d-b296-31a1b57e975d', 11,
   'VLT-EB200', 'Spor Bluetooth Kulaklık', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, false, 10, 100),
  ('a381143c-db5e-42c8-b8f1-bc6d3508309a', '81995edb-36c4-4492-ab74-d5ab2368a68c', '0950fe54-eb60-415d-b296-31a1b57e975d', 12,
   'VLT-HP300', 'Kablolu Mikrofonlu Kulaklık', 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, false, 20, 200),

  -- Telefon Kılıfı
  ('1cb6d9b6-1c4c-46ae-8ffc-25192bae0784', '81995edb-36c4-4492-ab74-d5ab2368a68c', 'a59d5576-57ba-4e4d-9c03-9a65e01e2fa3', 13,
   'VLT-CS100', 'Silikon Telefon Kılıfı (Evrensel)', 'https://images.unsplash.com/photo-1535157412991-2ef801c1748b?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, false, 50, 500),
  ('e217dc51-f8af-476d-9c40-685ed3998e93', '81995edb-36c4-4492-ab74-d5ab2368a68c', 'a59d5576-57ba-4e4d-9c03-9a65e01e2fa3', 14,
   'VLT-CS200', 'Şeffaf Sert Telefon Kılıfı', 'https://images.unsplash.com/photo-1623393945964-8f5d573f9358?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, false, 50, 500),
  ('a9d03bfc-cf4c-42dd-b50c-a517bd05045a', '81995edb-36c4-4492-ab74-d5ab2368a68c', 'a59d5576-57ba-4e4d-9c03-9a65e01e2fa3', 15,
   'VLT-CS300', 'Deri Görünümlü Cüzdanlı Kılıf', 'https://images.unsplash.com/photo-1593055454503-531d165c2ed8?auto=format&fit=crop&w=900&q=80',
   'TRY', false, false, null, false, 30, 300),

  -- Ekran Koruyucu
  ('370dd8e3-ac24-4b52-bf17-5d227f5b6d53', '81995edb-36c4-4492-ab74-d5ab2368a68c', '45f0b7c8-601f-47ff-b420-ddac4b0fab43', 16,
   'VLT-SP100', '9H Temperli Cam Ekran Koruyucu', 'https://images.unsplash.com/photo-1714058948949-4414c2007759?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, true, 50, 500),
  ('15e4b111-90a0-46a3-bdd4-2fba2aa419ba', '81995edb-36c4-4492-ab74-d5ab2368a68c', '45f0b7c8-601f-47ff-b420-ddac4b0fab43', 17,
   'VLT-SP200', 'Privacy Gizlilik Cam Koruyucu', 'https://images.unsplash.com/photo-1636589150123-6d57c10527ce?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, false, 50, 500),
  ('76362516-6af9-4278-b044-51289ab0de66', '81995edb-36c4-4492-ab74-d5ab2368a68c', '45f0b7c8-601f-47ff-b420-ddac4b0fab43', 18,
   'VLT-SP300', 'Kamera Lens Koruyucu (2li Set)', 'https://images.unsplash.com/photo-1567428486597-8c5328fd3816?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, false, 50, 500),

  -- Bluetooth Hoparlör
  ('9038feac-ded6-4180-b390-4163e2f7decc', '81995edb-36c4-4492-ab74-d5ab2368a68c', 'f3d0f44b-0b2b-4f0c-a9a7-c7b890629853', 19,
   'VLT-SPK100', 'Taşınabilir Bluetooth Hoparlör', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, true, 10, 100),
  ('11db0b65-f2a4-4a5c-91b3-80a15c72ea2a', '81995edb-36c4-4492-ab74-d5ab2368a68c', 'f3d0f44b-0b2b-4f0c-a9a7-c7b890629853', 20,
   'VLT-SPK200', 'Su Geçirmez Mini Hoparlör', 'https://images.unsplash.com/photo-1589256469067-ea99122bbdc4?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, false, 10, 100),
  ('ba705dfe-76d7-4487-99e8-92e9e19b3848', '81995edb-36c4-4492-ab74-d5ab2368a68c', 'f3d0f44b-0b2b-4f0c-a9a7-c7b890629853', 21,
   'VLT-SPK300', 'RGB Işıklı Parti Hoparlörü', 'https://images.unsplash.com/photo-1529359744902-86b2ab9edaea?auto=format&fit=crop&w=900&q=80',
   'TRY', true, true, 649, false, 5, 50),

  -- Araç Aksesuarları
  ('29e70b9e-f61a-4068-8849-00e4c7dbc778', '81995edb-36c4-4492-ab74-d5ab2368a68c', '500f3a19-2ea6-42ba-a7a9-1cea84737275', 22,
   'VLT-CAR100', 'Manyetik Araç Telefon Tutucu', 'https://images.unsplash.com/photo-1698314440055-5aa837af0a7f?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, true, 20, 200),
  ('34793e43-8d76-49f8-8576-63f9c59b9953', '81995edb-36c4-4492-ab74-d5ab2368a68c', '500f3a19-2ea6-42ba-a7a9-1cea84737275', 23,
   'VLT-CAR200', 'Araç İçi Çift USB Şarj Cihazı', 'https://images.unsplash.com/photo-1698314440014-3badb1e9c938?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, false, 20, 200),
  ('f78d2ec9-ebcf-4e88-8834-b06daf94e600', '81995edb-36c4-4492-ab74-d5ab2368a68c', '500f3a19-2ea6-42ba-a7a9-1cea84737275', 24,
   'VLT-CAR300', 'Bluetooth FM Transmitter', 'https://images.unsplash.com/photo-1619463061549-e14e1de6c14f?auto=format&fit=crop&w=900&q=80',
   'TRY', true, false, null, false, 20, 200);

-- 6) Fiyat listeleri: 1.Liste / 2.Liste / 3.Liste (perakende / bayi / toptan)
insert into public.product_prices (product_id, price_list_id, price)
values
  ('c6450376-ac67-4f17-b1d8-9c63463e9589','63329762-44ea-434b-8160-d3b0712b52cd',189), ('c6450376-ac67-4f17-b1d8-9c63463e9589','b4cd082b-02bc-446a-8b45-6ae1380ef42f',169), ('c6450376-ac67-4f17-b1d8-9c63463e9589','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',149),
  ('ea7826c8-4f44-4b23-b698-a27c380b1302','63329762-44ea-434b-8160-d3b0712b52cd',259), ('ea7826c8-4f44-4b23-b698-a27c380b1302','b4cd082b-02bc-446a-8b45-6ae1380ef42f',229), ('ea7826c8-4f44-4b23-b698-a27c380b1302','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',199),
  ('59e66beb-d995-4b6d-8b60-e53a24205692','63329762-44ea-434b-8160-d3b0712b52cd',449), ('59e66beb-d995-4b6d-8b60-e53a24205692','b4cd082b-02bc-446a-8b45-6ae1380ef42f',399), ('59e66beb-d995-4b6d-8b60-e53a24205692','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',349),
  ('cdb5ab2b-d42a-48a1-996e-d6e3ddd66b5e','63329762-44ea-434b-8160-d3b0712b52cd',79),  ('cdb5ab2b-d42a-48a1-996e-d6e3ddd66b5e','b4cd082b-02bc-446a-8b45-6ae1380ef42f',69),  ('cdb5ab2b-d42a-48a1-996e-d6e3ddd66b5e','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',59),
  ('ac4ce2f8-699a-474d-b81f-1ec11c41f38b','63329762-44ea-434b-8160-d3b0712b52cd',99),  ('ac4ce2f8-699a-474d-b81f-1ec11c41f38b','b4cd082b-02bc-446a-8b45-6ae1380ef42f',89),  ('ac4ce2f8-699a-474d-b81f-1ec11c41f38b','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',79),
  ('3e78b2a2-176d-45c1-af49-501f9fdc2463','63329762-44ea-434b-8160-d3b0712b52cd',69),  ('3e78b2a2-176d-45c1-af49-501f9fdc2463','b4cd082b-02bc-446a-8b45-6ae1380ef42f',59),  ('3e78b2a2-176d-45c1-af49-501f9fdc2463','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',49),
  ('e849973d-b9d5-4d3c-a69f-bbec1fb55a79','63329762-44ea-434b-8160-d3b0712b52cd',349), ('e849973d-b9d5-4d3c-a69f-bbec1fb55a79','b4cd082b-02bc-446a-8b45-6ae1380ef42f',309), ('e849973d-b9d5-4d3c-a69f-bbec1fb55a79','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',269),
  ('46068bf8-6981-4730-90f8-43dba85c6171','63329762-44ea-434b-8160-d3b0712b52cd',549), ('46068bf8-6981-4730-90f8-43dba85c6171','b4cd082b-02bc-446a-8b45-6ae1380ef42f',489), ('46068bf8-6981-4730-90f8-43dba85c6171','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',429),
  ('7d45f25d-b3d5-4a4c-9c65-879fe8c44116','63329762-44ea-434b-8160-d3b0712b52cd',799), ('7d45f25d-b3d5-4a4c-9c65-879fe8c44116','b4cd082b-02bc-446a-8b45-6ae1380ef42f',719), ('7d45f25d-b3d5-4a4c-9c65-879fe8c44116','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',639),
  ('07ddc3dd-f79b-4a81-a246-f56ad2cc735d','63329762-44ea-434b-8160-d3b0712b52cd',449), ('07ddc3dd-f79b-4a81-a246-f56ad2cc735d','b4cd082b-02bc-446a-8b45-6ae1380ef42f',399), ('07ddc3dd-f79b-4a81-a246-f56ad2cc735d','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',349),
  ('21674492-9a19-4741-8af9-28797aecfeb1','63329762-44ea-434b-8160-d3b0712b52cd',349), ('21674492-9a19-4741-8af9-28797aecfeb1','b4cd082b-02bc-446a-8b45-6ae1380ef42f',309), ('21674492-9a19-4741-8af9-28797aecfeb1','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',269),
  ('a381143c-db5e-42c8-b8f1-bc6d3508309a','63329762-44ea-434b-8160-d3b0712b52cd',129), ('a381143c-db5e-42c8-b8f1-bc6d3508309a','b4cd082b-02bc-446a-8b45-6ae1380ef42f',109), ('a381143c-db5e-42c8-b8f1-bc6d3508309a','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',89),
  ('1cb6d9b6-1c4c-46ae-8ffc-25192bae0784','63329762-44ea-434b-8160-d3b0712b52cd',59),  ('1cb6d9b6-1c4c-46ae-8ffc-25192bae0784','b4cd082b-02bc-446a-8b45-6ae1380ef42f',49),  ('1cb6d9b6-1c4c-46ae-8ffc-25192bae0784','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',39),
  ('e217dc51-f8af-476d-9c40-685ed3998e93','63329762-44ea-434b-8160-d3b0712b52cd',69),  ('e217dc51-f8af-476d-9c40-685ed3998e93','b4cd082b-02bc-446a-8b45-6ae1380ef42f',59),  ('e217dc51-f8af-476d-9c40-685ed3998e93','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',49),
  ('a9d03bfc-cf4c-42dd-b50c-a517bd05045a','63329762-44ea-434b-8160-d3b0712b52cd',149), ('a9d03bfc-cf4c-42dd-b50c-a517bd05045a','b4cd082b-02bc-446a-8b45-6ae1380ef42f',129), ('a9d03bfc-cf4c-42dd-b50c-a517bd05045a','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',109),
  ('370dd8e3-ac24-4b52-bf17-5d227f5b6d53','63329762-44ea-434b-8160-d3b0712b52cd',49),  ('370dd8e3-ac24-4b52-bf17-5d227f5b6d53','b4cd082b-02bc-446a-8b45-6ae1380ef42f',39),  ('370dd8e3-ac24-4b52-bf17-5d227f5b6d53','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',29),
  ('15e4b111-90a0-46a3-bdd4-2fba2aa419ba','63329762-44ea-434b-8160-d3b0712b52cd',69),  ('15e4b111-90a0-46a3-bdd4-2fba2aa419ba','b4cd082b-02bc-446a-8b45-6ae1380ef42f',59),  ('15e4b111-90a0-46a3-bdd4-2fba2aa419ba','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',49),
  ('76362516-6af9-4278-b044-51289ab0de66','63329762-44ea-434b-8160-d3b0712b52cd',39),  ('76362516-6af9-4278-b044-51289ab0de66','b4cd082b-02bc-446a-8b45-6ae1380ef42f',32),  ('76362516-6af9-4278-b044-51289ab0de66','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',25),
  ('9038feac-ded6-4180-b390-4163e2f7decc','63329762-44ea-434b-8160-d3b0712b52cd',399), ('9038feac-ded6-4180-b390-4163e2f7decc','b4cd082b-02bc-446a-8b45-6ae1380ef42f',349), ('9038feac-ded6-4180-b390-4163e2f7decc','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',299),
  ('11db0b65-f2a4-4a5c-91b3-80a15c72ea2a','63329762-44ea-434b-8160-d3b0712b52cd',299), ('11db0b65-f2a4-4a5c-91b3-80a15c72ea2a','b4cd082b-02bc-446a-8b45-6ae1380ef42f',259), ('11db0b65-f2a4-4a5c-91b3-80a15c72ea2a','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',219),
  ('ba705dfe-76d7-4487-99e8-92e9e19b3848','63329762-44ea-434b-8160-d3b0712b52cd',899), ('ba705dfe-76d7-4487-99e8-92e9e19b3848','b4cd082b-02bc-446a-8b45-6ae1380ef42f',799), ('ba705dfe-76d7-4487-99e8-92e9e19b3848','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',699),
  ('29e70b9e-f61a-4068-8849-00e4c7dbc778','63329762-44ea-434b-8160-d3b0712b52cd',149), ('29e70b9e-f61a-4068-8849-00e4c7dbc778','b4cd082b-02bc-446a-8b45-6ae1380ef42f',129), ('29e70b9e-f61a-4068-8849-00e4c7dbc778','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',109),
  ('34793e43-8d76-49f8-8576-63f9c59b9953','63329762-44ea-434b-8160-d3b0712b52cd',129), ('34793e43-8d76-49f8-8576-63f9c59b9953','b4cd082b-02bc-446a-8b45-6ae1380ef42f',109), ('34793e43-8d76-49f8-8576-63f9c59b9953','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',89),
  ('f78d2ec9-ebcf-4e88-8834-b06daf94e600','63329762-44ea-434b-8160-d3b0712b52cd',249), ('f78d2ec9-ebcf-4e88-8834-b06daf94e600','b4cd082b-02bc-446a-8b45-6ae1380ef42f',219), ('f78d2ec9-ebcf-4e88-8834-b06daf94e600','12c169ee-ef0a-4f0d-9b58-c7deb70195bc',189);

-- 7) "Fiyatsız Katalog" için sürtünmesiz giriş şifresi (lucatech'teki '0000'
-- kodunun eşdeğeri: fiyat görmeden ürünlere göz atma)
insert into public.access_codes (tenant_id, password_code, price_list_id)
values ('81995edb-36c4-4492-ab74-d5ab2368a68c', '0000', '300d4877-55e0-4cce-8b65-38c75b03b2d6')
on conflict do nothing;

-- 8) Vitrin görünümü: kurumsal mavi tema, sidebar kategori düzeni, görsel
-- odaklı ürün kartı, dolu footer
update public.tenant_storefront_settings
  set theme_key = 'pro-blue',
      layout_key = 'sidebar-pro',
      brand_primary_color = '#2563eb',
      brand_accent_color = '#3b82f6',
      product_card_style = 'image-forward',
      header_style_key = 'standard',
      footer_style_key = 'columns',
      storefront_title = 'Volt Aksesuar Toptan',
      storefront_description = 'Telefon ve elektronik aksesuarlarında toptan tedarik: şarj, kulaklık, kılıf, powerbank ve daha fazlası tek katalogda.',
      hero_heading = 'Telefon Aksesuarlarında Toptan Güç',
      hero_cta_label = 'Kataloğu İncele',
      is_hero_visible = true,
      is_footer_visible = true,
      is_footer_logo_visible = true,
      is_footer_contact_visible = true,
      footer_phone = '0535 417 25 10',
      is_footer_whatsapp_visible = true,
      footer_whatsapp = '905354172510'
  where tenant_id = '81995edb-36c4-4492-ab74-d5ab2368a68c';
