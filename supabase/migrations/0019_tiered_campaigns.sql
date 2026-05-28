-- 0019_tiered_campaigns.sql
-- Nakit ve kart kampanyaları için tier (basamaklı baraj) desteği

ALTER TABLE public.tenant_storefront_settings
  ADD COLUMN IF NOT EXISTS cash_discount_tiers JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS card_campaign_tiers  JSONB NOT NULL DEFAULT '[]';

-- Mevcut tek-eşikli veriyi tier array'e migrate et
UPDATE public.tenant_storefront_settings SET
  cash_discount_tiers = CASE
    WHEN cash_discount_threshold > 0 AND cash_discount_percentage > 0
    THEN jsonb_build_array(
           jsonb_build_object(
             'threshold',  cash_discount_threshold,
             'percentage', cash_discount_percentage
           )
         )
    ELSE '[]'::jsonb
  END,
  card_campaign_tiers = CASE
    WHEN card_campaign_threshold > 0
    THEN jsonb_build_array(
           jsonb_build_object(
             'threshold',              card_campaign_threshold,
             'maxFreeInstallmentCount', 12
           )
         )
    ELSE '[]'::jsonb
  END;
