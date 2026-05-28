-- 0018: Bağımsız nakit ve kart kampanyası kolonları
-- Nakit: threshold + % iskonto
-- Kart: threshold + 0 komisyon (vade farkı sıfırlama)

ALTER TABLE public.tenant_storefront_settings
  ADD COLUMN IF NOT EXISTS cash_discount_threshold  numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_discount_percentage numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_cash_discount_active  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cash_discount_note       text,
  ADD COLUMN IF NOT EXISTS card_campaign_threshold  numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_card_campaign_active  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS card_campaign_note       text;

-- Mevcut tekli kampanya verisini doğru kolona migrate et
UPDATE public.tenant_storefront_settings SET
  cash_discount_threshold  = CASE WHEN discount_payment_method = 'cash' THEN COALESCE(discount_threshold, 0)  ELSE 0     END,
  cash_discount_percentage = CASE WHEN discount_payment_method = 'cash' THEN COALESCE(discount_percentage, 0) ELSE 0     END,
  is_cash_discount_active  = CASE WHEN discount_payment_method = 'cash' THEN COALESCE(is_discount_active, false) ELSE false END,
  cash_discount_note       = CASE WHEN discount_payment_method = 'cash' THEN discount_condition_note ELSE null  END,
  card_campaign_threshold  = CASE WHEN discount_payment_method = 'card' THEN COALESCE(discount_threshold, 0)  ELSE 0     END,
  is_card_campaign_active  = CASE WHEN discount_payment_method = 'card' THEN COALESCE(is_discount_active, false) ELSE false END,
  card_campaign_note       = CASE WHEN discount_payment_method = 'card' THEN discount_condition_note ELSE null  END;

-- Not: eski discount_* kolonlar geriye dönük uyumluluk için korunur, yeni kod yazmaz.
