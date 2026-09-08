-- 1) Tekel bayilerinde alkollü ürünler vitrinde ASLA görünmez (yasal
--    gereklilik — alkol online satılamaz; müşteri mağazadan alır). Bayrak
--    ürün bazında tutulur; vitrin sorguları tenants.is_tekel = true olan
--    mağazalarda is_alcohol = true satırları dışlar (bkz. lib/data.ts
--    shouldHideAlcoholProducts, app/api/storefront/generate-pdf sipariş
--    koruması, lib/products/alcohol.ts anahtar kelime listesi).
alter table public.products
  add column if not exists is_alcohol boolean not null default false;

create index if not exists products_tenant_alcohol_idx
  on public.products (tenant_id)
  where is_alcohol;

-- 2) Esnaf (market tipi) tenant tema seçimi: vitrin / taze / dukkan.
--    Seçim çıkarımla değil kayıtla tutulur (bkz. lib/storefront/esnaf-themes.ts,
--    app/api/tenant/settings/esnaf-theme). NULL = henüz bu ekrandan seçilmedi.
alter table public.tenant_storefront_settings
  add column if not exists esnaf_theme_key text;

alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_esnaf_theme_key_check;

alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_esnaf_theme_key_check
  check (esnaf_theme_key is null or esnaf_theme_key in ('vitrin', 'taze', 'dukkan'));

-- 3) Tek seferlik geri doldurma: is_tekel = true tenantlarda ürün adı ya da
--    (kendi veya üst) kategori adı alkol anahtar kelimesi içeren ürünler
--    işaretlenir. Kelime sınırı (\m ... \M) kullanılır ki "cin" → "cinnamon",
--    "rom" → "romantik" gibi yanlış eşleşmeler olmasın. Liste
--    lib/products/alcohol.ts ile aynı tutulmalı.
update public.products p
set is_alcohol = true
from public.tenants t,
     public.categories c
     left join public.categories parent on parent.id = c.parent_id
where t.id = p.tenant_id
  and t.is_tekel = true
  and c.id = p.category_id
  and p.is_alcohol = false
  and (
    p.product_name ~* '\m(bira|şarap|sarap|rakı|raki|votka|viski|cin|likör|likor|tekila|rom|alkol|alkollü|alkollu|wine|beer|whisky|whiskey|vodka|gin|konyak|cognac|şampanya|sampanya|champagne|tequila|rum|brandy|vermut|vermouth|prosecco)\M'
    or c.name ~* '\m(bira|şarap|sarap|rakı|raki|votka|viski|cin|likör|likor|tekila|rom|alkol|alkollü|alkollu|wine|beer|whisky|whiskey|vodka|gin|konyak|cognac|şampanya|sampanya|champagne|tequila|rum|brandy|vermut|vermouth|prosecco)\M'
    or (parent.name is not null and parent.name ~* '\m(bira|şarap|sarap|rakı|raki|votka|viski|cin|likör|likor|tekila|rom|alkol|alkollü|alkollu|wine|beer|whisky|whiskey|vodka|gin|konyak|cognac|şampanya|sampanya|champagne|tequila|rum|brandy|vermut|vermouth|prosecco)\M')
  );
