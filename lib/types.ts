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
  | "vitrin-pro"
  | "noir";
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
  // Liste başına indirimli fiyat. null = bu listede indirim yok.
  // Eskiden tek bir products.discount_price tüm listelere uygulanıyordu.
  discount_price?: number | null;
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
  // Alkol/sigara bayii (tekel) — yasal olarak dağıtım/teslimat yapamaz.
  // true ise storefront adres toplamaz, sepet/checkout metinleri "sipariş
  // listesi hazırlama" diline döner (kullanıcı isteği, 20 Ağu 2026).
  is_tekel: boolean;
  is_password_protected: boolean;
  // Magnetle şifresiz giriş: magnet QR'ı okutan şifre görmeden girer, düz
  // linkle gelen şifre kapısına düşer (bkz. 0104, proxy.ts, magnet-enter).
  magnet_login_enabled: boolean;
  // Magnetle girenlerin göreceği fiyat listesi; NULL = şifresiz ziyaretçi
  // listesiyle aynı (public_price_list_id → ilk fiyatlı liste).
  magnet_price_list_id: string | null;
  public_price_list_id: string | null;
  age_verification_required: boolean;
  created_at: string;
}

export type TenantBusinessType = "general" | "market";

export interface StorefrontCustomer {
  id: string;
  tenant_id: string;
  phone: string;
  full_name: string;
  address: string;
  first_order_at: string;
  last_order_at: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "new"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface StorefrontOrderItemSnapshot {
  product_name: string;
  sku_code?: string | null;
  quantity: number;
  price: number | null;
  currency: string;
  // 0091 ile: sipariş anında ürün kimliği + maliyet donduruluyor. Maliyet
  // sonradan değişse de geçmiş siparişin kârı değişmez.
  product_id?: string | null;
  variant_id?: string | null;
  variant_name?: string | null;
  sales_unit?: SalesUnit | null;
  unit_quantity?: number | null;
  original_price?: number | null;
  discount_percentage?: number | null;
  unit_cost?: number | null;
  cost_source?: "product" | "backfill" | null;
  is_gift?: boolean | null;
  gift_campaign_title?: string | null;
}

export interface StorefrontOrder {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  order_number: string;
  // 0093: bayi başına sıralı 6 haneli numara (100001…). Müşteriye/bayiye gösterilen bu.
  order_no: number | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  currency: string;
  total_amount: number;
  payment_method: "cash" | "card" | null;
  item_count: number;
  items: StorefrontOrderItemSnapshot[];
  note: string | null;
  created_at: string;
  // 0091: durum akışı + maliyet özeti + müşteri takip token'ı
  status: OrderStatus;
  status_updated_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  coupon_id?: string | null;
  coupon_discount?: number;
  cost_total: number | null;
  cost_missing_count: number;
  tracking_token: string;
  // Veresiye (0107): işaretlenme + tahsil zamanı. Açık veresiye = marked
  // dolu, paid boş. Bayi panelinden yönetilir.
  credit_marked_at?: string | null;
  credit_paid_at?: string | null;
  magnet_code_id?: string | null;
  // Bayi paneli için veri katmanında doldurulur (lib/orders/data.ts):
  // siparişin geldiği magnetin kodu, magnetin tanımlı müşterisi ve siparişi
  // verenin magnet sahibinden FARKLI kişi olup olmadığı (teyit uyarısı).
  magnet_code?: string | null;
  magnet_owner_name?: string | null;
  magnet_mismatch?: boolean;
}

export interface OrderStatusEvent {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  reason: string | null;
  actor: "dealer" | "customer" | "system";
  created_at: string;
}

export interface StorefrontCustomerWithStats extends StorefrontCustomer {
  orders_count: number;
  /** Teslim edilen siparişlerin toplamı (cari ciro), para birimine göre. */
  totals_by_currency: Record<string, number>;
  delivered_count: number;
  cancelled_count: number;
  /** Henüz teslim edilmemiş (yeni…yola çıktı) siparişlerin toplamı. */
  pending_by_currency: Record<string, number>;
  last_order_status: OrderStatus | null;
  /** Bu müşteriye tanımlı magnet kodu (varsa). */
  magnet_code: string | null;
  is_blocked: boolean;
  blocked_id: string | null;
  /** Bildirim izni vermiş en az bir cihazı var (push_subscriptions). */
  has_push: boolean;
  /** Aktif (kullanılmamış, süresi geçmemiş) kupon özeti. */
  active_coupon: { id: string; title: string; expires_at: string | null } | null;
}

// Müşteriye özel kupon (vitrine giden güvenli alt küme; 0097)
export interface StorefrontCoupon {
  id: string;
  kind: "percent" | "amount";
  value: number;
  min_order_amount: number | null;
  currency: string;
  title: string;
  message: string | null;
  expires_at: string | null;
  /** Kapsam: null = tüm ürünler; doluysa alt kategorilerle GENİŞLETİLMİŞ id listesi */
  category_ids: string[] | null;
  /** Seçilen üst kategorilerin adları (metin için) */
  category_names: string[];
}

export interface MarketCatalogProduct {
  id: string;
  source: string;
  sku_code: string;
  product_name: string;
  brand: string | null;
  category_name: string;
  image_url: string | null;
  reference_price: number | null;
  description: string | null;
  created_at: string;
}

export type ProductSuggestionStatus = "pending" | "approved" | "rejected";

export interface ProductSuggestion {
  id: string;
  tenant_id: string;
  barcode: string;
  product_name: string;
  price: number | null;
  status: ProductSuggestionStatus;
  category_name: string | null;
  // Süper admin onaydan önce yükleyebiliyor (bkz. product-suggestions-panel.tsx)
  // — market_catalog_products.image_url'e onaylanınca kopyalanır.
  image_url: string | null;
  market_catalog_product_id: string | null;
  product_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  // Zil açılıp liste sonuna kadar kaydırıldığında dolar — menüdeki kırmızı
  // sayaç bunu sayar. Bildirim listede kalmaya devam eder.
  seen_at: string | null;
  // Bildirime tıklandığında veya "Tümünü temizle" ile dolar — listeden kalkar.
  dismissed_at: string | null;
  created_at: string;
}

export interface ProductSuggestionWithTenant extends ProductSuggestion {
  tenant_company_name: string;
  tenant_subdomain: string;
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
  // Alış fiyatı (maliyet), ürün para birimiyle. Müşteriye gösterilmez;
  // yalnız kârlılık raporu için.
  purchase_price?: number | null;
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
  is_discount_category: boolean;
  is_hidden_from_storefront: boolean;
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

// Bayinin kendi tanımladığı kampanyalar (bkz. 0081_tenant_campaigns.sql).
// Ayarlardaki CashDiscountTier/CardCampaignTier'dan bağımsız: onlar ödeme
// yöntemine bağlı basamaklar, bunlar bayinin vitrinde gösterdiği kartlar.
export type CampaignRuleType = "none" | "cart_threshold" | "buy_x_get_y";
export type CampaignDiscountKind = "amount" | "percentage";
export type CampaignPaymentMethod = "any" | "cash" | "card";

export interface TenantCampaign {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  badge_label: string | null;
  /** null = hemen başlar */
  starts_at: string | null;
  /** null = süresiz */
  ends_at: string | null;
  is_active: boolean;
  link_category_id: string | null;
  display_order: number;
  /** "none" ise sadece duyuru kartı — sepete dokunmaz. */
  rule_type: CampaignRuleType;
  min_cart_amount: number | null;
  discount_kind: CampaignDiscountKind | null;
  discount_value: number | null;
  payment_method: CampaignPaymentMethod;
  /**
   * Kampanya eşiğine ve indirim matrahına SAYILMAYACAK kategoriler.
   * Alt kategoriler burada tutulmaz; vitrinde kategori ağacıyla
   * genişletilir (bkz. getCampaignEligibleSubtotal).
   */
  excluded_category_ids: string[];
  /** "buy_x_get_y" kuralı — yalnız market/tekel'de sunulur (0110). */
  gift_trigger_product_id?: string | null;
  gift_trigger_quantity?: number | null;
  gift_product_ids?: string[] | null;
  gift_quantity_per_product?: number;
  /** true ise müşteri eşiğin katını alınca hediye sayısı da katlanır. */
  gift_scales_with_multiples?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InstallmentOption {
  count: number;
  label: string;
  isActive: boolean;
  surchargePercentage: number;
}

export type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface BusinessDayHours {
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export type BusinessHours = Record<WeekdayKey, BusinessDayHours>;

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
  // Yoğunluk modu: tek tuşla açılan geçici uyarı. Duyurudan bağımsız
  // tutuluyor ki açıp kapatmak kalıcı duyuru metnini bozmasın.
  is_busy_mode: boolean;
  busy_mode_note: string | null;
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
  is_logout_button_visible: boolean;
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
  is_always_open: boolean;
  business_hours: BusinessHours;
  is_min_cart_amount_active: boolean;
  min_cart_amount: number;
  // Getirme (teslimat) ücreti — yalnız business_type = "market" tenantlarda
  // uygulanır (bkz. 0108, lib/storefront/cart.ts). free_threshold > 0 ise o
  // tutar ve üzeri siparişlerde ücret 0; 0 = baraj yok, her siparişe ücret.
  // amount 0 verilebilir (fiilen her sipariş ücretsiz).
  is_delivery_fee_active: boolean;
  delivery_fee_amount: number;
  delivery_fee_free_threshold: number;
  is_best_sellers_visible: boolean;
  best_sellers_title: string;
  best_sellers_product_count: number;
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
  /** "N al Y hediye" kampanyasından otomatik eklenen bedelsiz satır (price 0). */
  is_gift?: boolean;
  gift_campaign_id?: string | null;
  gift_campaign_title?: string | null;
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