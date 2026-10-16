-- 4. ve sonraki ürün görselleri (Nailport aktarımı, 16 Eki 2026).
-- image_url/_2/_3 aynen kalır; galeri bunların ardından bu diziyi gösterir.
alter table public.products add column if not exists extra_image_urls text[];
