-- Mağazaya özel teslimat bölgesi (29 Eyl 2026, kalitemarket). Doluysa sepette
-- il/ilçe sabit, mahalle listeden seçilir, kalan adres elle yazılır.
-- Biçim: {"city": "...", "district": "...", "neighborhoods": ["...", ...]}
alter table public.tenant_storefront_settings add column if not exists delivery_area jsonb;
