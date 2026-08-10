-- Bir kategori vitrinden/navigasyondan tamamen gizlenebilsin ve içindeki
-- ürünler storefront'ta hiçbir listede (Tüm Ürünler dahil) görünmesin —
-- "kategorisiz" ürünleri geçici olarak parkta tutmak için kullanılıyor,
-- tenant admin panelinden ürün yönetimi hâlâ tam görür/düzenler.
-- bkz. app/store/[subdomain]/page.tsx ve section/[sectionId]/page.tsx.
alter table public.categories
  add column if not exists is_hidden_from_storefront boolean not null default false;
