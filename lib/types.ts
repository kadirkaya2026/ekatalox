import type { MaxProductLimit, TenantPlan } from "@/lib/billing/plans";
import type { CurrencyCode } from "@/lib/products/constants";
import type { StorefrontLocale } from "@/lib/storefront/i18n/dictionary";

export type { MaxProductLimit, TenantPlan };

export type TenantStatus = "active" | "suspended";
export type UserRole = "super_admin" | "tenant_admin";
export type StorefrontThemeKey =
  | "minimal"
  | "pro-blue"
  | "neutral"
  | "industrial"
  | "premium"
  | "catalog-first"
  | "market"
  | "vitrin-pro";
export type StorefrontLayoutKey =
  | "classic-grid"
  | "catalog-dense"
  | "catalog-list"
  | "sidebar-pro";
export type StorefrontFontKey =
  | "inter"
  | "dm-sans"
  | "plus-jakarta"
  | "source-sans"
  | "playfair";
export type StorefrontProductCardStyle = "standard" | "compact" | "image-forward";
export type ProductImageBackgroundKey = "theme" | "white" | "transparent";
export type StorefrontHeaderStyleKey = "standard" | "centered" | "minimal" | "split";
export type StorefrontFooterStyleKey = "standard" | "minimal" | "columns";
export type StorefrontHeroStyleKey = "text" | "image-split" | "full-bleed";
export type HomepageBlockId =
  | "hero"
  | "heroCluster"
  | "promoTiles"
  | "categoryTiles"
  | "banner"
  | "campaigns"
  | "showcase"
  | "banner2"
  | "catalog";

export interface HomepageBlock {
  id: HomepageBlockId;
  visible: boolean;
  order: number;
}

export type StorefrontCategoryNavStyle = "top-chips" | "sidebar";

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

export interface ProductVariantPrice {
  variant_id: string;
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
  trial_ends_at: string | null;
  plan_started_at: string | null;
  plan_expires_at: string | null;
  visitor_limit_addon: number;
  visitor_quota_exceeded: boolean;
  product_limit_addon: number;
  is_demo: boolean;
  business_type: TenantBusinessType;
  is_password_protected: boolean;
  public_price_list_id: string | null;
  created_at: string;
}

export type TenantBusinessType = "general" | "market";

export interface MarketCatalogProduct {
  id: string;
  source: string;
  sku_code: string;
  product_name: string;
  brand: string | null;
  category_name: string;
  image_url: string;
  reference_price: number | null;
  description: string | null;
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
  image_url_2: string | null;
  image_url_3: string | null;
  currency: CurrencyCode;
  prices?: ProductPrice[];
  is_in_stock: boolean;
  is_discount_active: boolean;
  is_recommended: boolean;
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
  prices?: ProductVariantPrice[];
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
  banner_item: BannerItem | null;
  tile_image_url: string | null;
  created_at: string;
}

export interface MarketCatalogProduct {
  id: string;
  source: string;
  sku_code: string;
  product_name: string;
  brand: string | null;
  category_name: string;
  image_url: string;
  reference_price: number | null;
  description: string | null;
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
  is_visible_on_mobile?: boolean;
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

export interface AdminLoginLogEntry {
  user_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  tenant_name: string | null;
  tenant_subdomain: string | null;
  last_sign_in_at: string | null;
  created_at: string;
}

export type RecommendationMode = "auto" | "manual";

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
  hero_image_url: string | null;
  hero_style_key: StorefrontHeroStyleKey;
  is_hero_visible: boolean;
  brand_primary_color: string | null;
  brand_accent_color: string | null;
  font_key: StorefrontFontKey;
  product_card_style: StorefrontProductCardStyle;
  product_image_background: ProductImageBackgroundKey;
  header_style_key: StorefrontHeaderStyleKey;
  footer_style_key: StorefrontFooterStyleKey;
  homepage_blocks: HomepageBlock[];
  banner_items: BannerItem[];
  hero_cluster_items: BannerItem[];
  is_hero_cluster_visible_on_mobile: boolean;
  site_tab_title: string | null;
  site_favicon_url: string | null;
  announcement_title: string | null;
  announcement_body: string | null;
  is_active: boolean;
  version: number;
  max_display_count: number;
  card_installment_options: InstallmentOption[];
  // Bağımsız nakit kampanyası
  is_cash_discount_active: boolean;
  cash_discount_note: string | null;
  // Bağımsız kart kampanyası (0 komisyon)
  is_card_campaign_active: boolean;
  card_campaign_note: string | null;
  // Tier (basamaklı) kampanya dizileri
  cash_discount_tiers: CashDiscountTier[];
  card_campaign_tiers: CardCampaignTier[];
  price_update_date: string | null;
  is_price_update_date_visible: boolean;
  is_theme_toggle_visible: boolean;
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
  recommendation_mode: RecommendationMode;
  default_locale: StorefrontLocale;
  created_at: string;
  updated_at: string;
}

export interface TenantWithRelations extends Tenant {
  access_codes?: AccessCode[];
  price_lists?: PriceList[];
  product_count?: number;
  monthly_visitor_count?: number;
  has_tenant_admin?: boolean;
}

export interface DashboardSummary {
  tenant: Tenant;
  productCount: number;
}

export interface StorefrontProduct {
  id: string;
  category_id: string;
  sku_code: string;
  product_name: string;
  description?: string | null;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  is_in_stock: boolean;
  is_recommended: boolean;
  currency: CurrencyCode;
  price: number | null;
  price_max?: number | null;
  price_from?: boolean;
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
  price: number | null;
  original_price?: number | null;
  discount_percentage?: number | null;
}

export type SalesUnit = "adet" | "paket" | "koli";

export interface CartItem
  extends Omit<StorefrontProduct, "id" | "has_variants" | "variants" | "is_recommended"> {
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