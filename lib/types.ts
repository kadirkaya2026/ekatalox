import type { CurrencyCode } from "@/lib/products/constants";

export type TenantStatus = "active" | "suspended";
export type MaxProductLimit = 300 | 500 | 1000;
export type UserRole = "super_admin" | "tenant_admin";
export type PriceTierLevel = 1 | 2 | 3;
export type StorefrontThemeKey = "minimal" | "premium-dark" | "soft-commerce";

export interface Tenant {
  id: string;
  company_name: string;
  subdomain: string;
  status: TenantStatus;
  max_product_limit: MaxProductLimit;
  whatsapp_number: string;
  created_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  category_id: string;
  sku_code: string;
  product_name: string;
  image_url: string | null;
  currency: CurrencyCode;
  price_tier_1: number;
  price_tier_2: number;
  price_tier_3: number;
  is_in_stock: boolean;
  created_at: string;
}

export interface AccessCode {
  id: string;
  tenant_id: string;
  password_code: string;
  price_tier_level: PriceTierLevel;
  created_at: string;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
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

export interface TenantStorefrontSettings {
  id: string;
  tenant_id: string;
  theme_key: StorefrontThemeKey;
  logo_url: string | null;
  storefront_title: string | null;
  storefront_description: string | null;
  hero_heading: string | null;
  hero_cta_label: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantWithRelations extends Tenant {
  access_codes?: AccessCode[];
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
  image_url: string | null;
  is_in_stock: boolean;
  currency: CurrencyCode;
  price: number;
}

export interface CartItem extends StorefrontProduct {
  quantity: number;
}