-- Kampanya eşiğine sayılmayacak kategoriler.
--
-- Kullanım örneği: "1.000 TL'ye 100 TL indirim" kampanyası var ama sigara
-- kategorisindeki ürünler eşiğe sayılmasın. Müşteri 900 TL market + 600 TL
-- sigara alırsa kampanya eşiği TUTMAZ (uygun tutar 900 TL).
--
-- Kapsam: hariç tutulan kategoriler hem EŞİK hesabından hem de yüzde tipli
-- indirimin MATRAHINDAN çıkarılır. Aksi halde eşiğe saymadığımız ürün
-- üzerinden indirim vermiş olurduk.
--
-- Alt kategoriler: burada yalnızca seçilen kategori id'leri tutuluyor;
-- alt kategorilere yayma istemcide kategori ağacı üzerinden yapılıyor
-- (getDescendantCategoryIds). Ağaç değiştiğinde kayıt güncellenmek
-- zorunda kalmasın diye böyle.

alter table public.tenant_campaigns
  add column if not exists excluded_category_ids uuid[] not null default '{}';

comment on column public.tenant_campaigns.excluded_category_ids is
  'Kampanya eşiğine ve indirim matrahına sayılmayacak kategori id''leri. Alt kategoriler istemcide kategori ağacıyla genişletilir.';
