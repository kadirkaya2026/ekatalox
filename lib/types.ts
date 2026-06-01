import type { MaxProductLimit, TenantPlan } from "@/lib/billing/plans";
import type { CurrencyCode } from "@/lib/products/constants";

export type { MaxProductLimit, TenantPlan };

export type TenantStatus = "active" | "suspended";
export type UserRole = "super_admin" | "tenant_admin";
export type StorefrontThemeKey = "minimal" | "pro-blue" | "neutral";
export type StorefrontLayoutKey = "classic-grid" | "catalog-dense" | "catalog-list";

export interface PriceList {
  id: string;
  tenant_id: string;
  name: string;
  is_catalog_only: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductPrice {
  product_id: string;
  price_list_id: string;
  price: number;
}

export interface Tenant {
  id: string;
  company_name: string;
  subdomain: string;
  status: TenantStatus;
  plan: TenantPlan;
  max_product_limit: MaxProductLimit;
  whatsapp_number: string;
  is_whatsapp_order_direct: boolean;
  custom_domain: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  category_id: string;
  display_order: number;
  sku_code: string;
  product_name: string;
  description?: string | null;
  image_url: string | null;
  currency: CurrencyCode;
  prices?: ProductPrice[];
  is_in_stock: boolean;
  is_discount_active: boolean;
  discount_price: number | null;
  package_quantity: number | null;
  carton_quantity: number | null;
  created_at: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  tenant_id: string;
  product_id: string;
  model_name: string;
  stock_quantity: number;
  package_quantity: number | null;
  carton_quantity: number | null;
  is_available_for_sale: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AccessCode {
  id: string;
  tenant_id: string;
  password_code: string;
  price_list_id: string;
  price_list_name?: string;
  created_at: string;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  parent_id: string | null;
  display_order: number;
  created_at: string;
}

export interface BannerItem {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_href: string | null;
  background_color: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  must_change_password: boolean;
  created_at: string;
}

export interface TenantMembership {
  id: string;
  tenant_id: string;
  user_id: string;
  created_at: string;
}

export type DiscountPaymentMethod = "cash" | "card";

export interface CashDiscountTier {
  threshold: number;
  percentage: number;
}

export interface CardCampaignTier {
  threshold: number;
  maxFreeInstallmentCount: number;
}

export interface InstallmentOption {
  count: number;
  label: string;
  isActive: boolean;
  surchargePercentage: number;
}

export interface TenantStorefrontSettings {
  id: string;
  tenant_id: string;
  theme_key: StorefrontThemeKey;
  layout_key: StorefrontLayoutKey;
  logo_url: string | null;
  storefront_title: string | null;
  storefront_description: string | null;
  hero_heading: string | null;
  hero_cta_label: string | null;
  banner_items: BannerItem[];
  site_tab_title: string | null;
  site_favicon_url: string | null;
  announcement_title: string | null;
  announcement_body: string | null;
  is_active: boolean;
  version: number;
  max_display_count: number;
  discount_threshold: number;
  discount_percentage: number;
  is_discount_active: boolean;
  discount_condition_note: string | null;
  discount_payment_method: DiscountPaymentMethod;
  card_installment_options: InstallmentOption[];
  // Bağımsız nakit kampanyası
  cash_discount_threshold: number;
  cash_discount_percentage: number;
  is_cash_discount_active: boolean;
  cash_discount_note: string | null;
  // Bağımsız kart kampanyası (0 komisyon)
  card_campaign_threshold: number;
  is_card_campaign_active: boolean;
  card_campaign_note: string | null;
  // Tier (basamaklı) kampanya dizileri
  cash_discount_tiers: CashDiscountTier[];
  card_campaign_tiers: CardCampaignTier[];
  price_update_date: string | null;
  is_price_update_date_visible: boolean;
  is_footer_visible: boolean;
  is_footer_logo_visible: boolean;
  is_footer_social_visible: boolean;
  is_footer_location_visible: boolean;
  is_footer_copyright_visible: boolean;
  footer_location: string | null;
  footer_copyright: string | null;
  footer_instagram_url: string | null;
  footer_youtube_url: string | null;
  footer_x_url: string | null;
  footer_facebook_url: string | null;
  footer_whatsapp: string | null;
  is_footer_instagram_visible: boolean;
  is_footer_youtube_visible: boolean;
  is_footer_x_visible: boolean;
  is_footer_facebook_visible: boolean;
  is_footer_whatsapp_visible: boolean;
  footer_website_url: string | null;
  is_footer_website_visible: boolean;
  footer_phone: string | null;
  footer_email: string | null;
  is_footer_contact_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantWithRelations extends Tenant {
  access_codes?: AccessCode[];
  price_lists?: PriceList[];
  product_count?: number;
}

export interface DashboardSummary {
  tenant: Tenant;
  productCount: number;
  activeCodeCount: number;
}

export interface StorefrontProduct {
  id: string;
  category_id: string;
  sku_code: string;
  product_name: string;
  description?: string | null;
  image_url: string | null;
  is_in_stock: boolean;
  currency: CurrencyCode;
  price: number | null;
  original_price?: number | null;
  discount_percentage?: number | null;
  package_quantity: number | null;
  carton_quantity: number | null;
  stock_quantity: number | null;
  has_variants: boolean;
  variants: StorefrontProductVariant[];
}

export interface StorefrontProductVariant {
  id: string;
  product_id: string;
  model_name: string;
  stock_quantity: number;
  package_quantity: number | null;
  carton_quantity: number | null;
  is_available_for_sale: boolean;
  is_purchasable: boolean;
  display_order: number;
}

export type SalesUnit = "adet" | "paket" | "koli";

export interface CartItem extends Omit<StorefrontProduct, "id" | "has_variants" | "variants"> {
  id: string;
  product_id: string;
  variant_id: string | null;
  variant_name: string | null;
  quantity: number;
  sales_unit?: SalesUnit | null;
  unit_quantity?: number | null;
}

export interface StorefrontSection {
  id: string;
  tenant_id: string;
  title: string;
  display_order: number;
  created_at: string;
}

export interface StorefrontSectionProduct {
  id: string;
  section_id: string;
  product_id: string;
  display_order: number;
}

export interface StorefrontSectionWithProducts extends StorefrontSection {
  products: StorefrontProduct[];
}