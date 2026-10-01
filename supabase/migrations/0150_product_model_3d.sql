-- Ürün sayfası galerisinde 3D kare (1 Eki 2026): .glb model adresi.
-- Boşsa galeri eskisi gibi yalnız görselleri gösterir.
alter table public.products add column if not exists model_3d_url text;
