-- Varyant özellikleri (16 Eki 2026): vitrin filtresinde "Beden", "Renk" gibi
-- başlıklar. Örn. {"Renk":"Siyah","Beden":"M"}. Boş ({}) ise vitrin varyant
-- adından tahmin eder (lib/products/variant-attributes.ts).
alter table public.product_variants
  add column if not exists attributes jsonb not null default '{}'::jsonb;
