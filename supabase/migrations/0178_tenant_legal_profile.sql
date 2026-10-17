-- Online ödeme hazırlığı (17 Eki 2026): mağazanın yasal satıcı bilgileri ve
-- sözleşme metinleri (mesafeli satış, ön bilgilendirme, iptal/iade, KVKK).
-- Yapı: lib/legal/tenant-legal.ts TenantLegalProfile. Boşsa online ödeme açılamaz.
alter table public.tenant_storefront_settings
  add column if not exists legal_profile jsonb;
