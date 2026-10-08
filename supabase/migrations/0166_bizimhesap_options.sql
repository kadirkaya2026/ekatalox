-- BizimHesap aktarım seçenekleri (8 Eki 2026, Lucatech isteği):
--  send_on: 'order' = sipariş gelince (Nailport, eski davranış) /
--           'confirmed' = panelde "Onaylandı"ya geçince.
--  fixed_customer_title: doluysa tüm siparişler BizimHesap'ta bu unvanlı tek
--           cariye (ör. "eKatalox") taslak düşer; personel cariyi BizimHesap'ta seçer.
--  require_product_match: true ise eşleşmeyen ürün varsa gönderilmez
--           (BizimHesap'ta yeni ürün AÇILMAZ); eşleştirme panelden yapılır.
alter table public.tenant_bizimhesap
  add column if not exists send_on text not null default 'order',
  add column if not exists fixed_customer_title text,
  add column if not exists require_product_match boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tenant_bizimhesap_send_on_check') then
    alter table public.tenant_bizimhesap
      add constraint tenant_bizimhesap_send_on_check check (send_on in ('order', 'confirmed'));
  end if;
end $$;

-- Varyant (ör. telefon modeli) BizimHesap'ta ayrı stok kartıysa varyant bazında eşleşme.
alter table public.product_variants
  add column if not exists bizimhesap_product_id text;
