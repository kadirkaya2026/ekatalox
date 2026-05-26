import type {
  AccessCode,
  Category,
  Product,
  Profile,
  Tenant,
  TenantMembership,
} from "@/lib/types";

export const demoTenants: Tenant[] = [
  {
    id: "tenant-lucatech",
    company_name: "Lucatech İletişim",
    subdomain: "lucatech",
    status: "active",
    max_product_limit: 300,
    whatsapp_number: "905354172510",
    created_at: new Date("2026-01-01").toISOString(),
  },
  {
    id: "tenant-merkez",
    company_name: "Merkez Toptan",
    subdomain: "merkez",
    status: "suspended",
    max_product_limit: 500,
    whatsapp_number: "905441112233",
    created_at: new Date("2026-01-05").toISOString(),
  },
];

export const demoCategories: Category[] = [
  {
    id: "cat-phone",
    tenant_id: "tenant-lucatech",
    name: "Telefonlar",
    parent_id: null,
    display_order: 1,
    created_at: new Date("2026-01-01").toISOString(),
  },
  {
    id: "cat-apple",
    tenant_id: "tenant-lucatech",
    name: "Apple",
    parent_id: "cat-phone",
    display_order: 2,
    created_at: new Date("2026-01-01T12:00:00").toISOString(),
  },
  {
    id: "cat-kampanya",
    tenant_id: "tenant-lucatech",
    name: "Kampanyalı Ürünler",
    parent_id: null,
    display_order: 3,
    created_at: new Date("2026-01-02").toISOString(),
  },
];

export const demoProducts: Product[] = [
  {
    id: "prd-1",
    tenant_id: "tenant-lucatech",
    category_id: "cat-apple",
    display_order: 1,
    sku_code: "APL-IPH-15-128",
    product_name: "iPhone 15 128GB",
    image_url:
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=80",
    currency: "TRY",
    price_tier_1: 41250,
    price_tier_2: 41890,
    price_tier_3: 42390,
    is_in_stock: true,
    created_at: new Date("2026-01-10").toISOString(),
  },
  {
    id: "prd-2",
    tenant_id: "tenant-lucatech",
    category_id: "cat-phone",
    display_order: 2,
    sku_code: "SMS-S24-256",
    product_name: "Samsung S24 256GB",
    image_url:
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=900&q=80",
    currency: "TRY",
    price_tier_1: 35890,
    price_tier_2: 36490,
    price_tier_3: 36990,
    is_in_stock: true,
    created_at: new Date("2026-01-11").toISOString(),
  },
  {
    id: "prd-3",
    tenant_id: "tenant-lucatech",
    category_id: "cat-kampanya",
    display_order: 3,
    sku_code: "XIA-RED-13",
    product_name: "Redmi Note 13",
    image_url:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
    currency: "TRY",
    price_tier_1: 10350,
    price_tier_2: 10750,
    price_tier_3: 10990,
    is_in_stock: false,
    created_at: new Date("2026-01-12").toISOString(),
  },
];

export const demoAccessCodes: AccessCode[] = [
  {
    id: "acc-1",
    tenant_id: "tenant-lucatech",
    password_code: "1111",
    price_tier_level: 1,
    created_at: new Date("2026-01-10").toISOString(),
  },
  {
    id: "acc-2",
    tenant_id: "tenant-lucatech",
    password_code: "2222",
    price_tier_level: 2,
    created_at: new Date("2026-01-10").toISOString(),
  },
  {
    id: "acc-3",
    tenant_id: "tenant-lucatech",
    password_code: "3333",
    price_tier_level: 3,
    created_at: new Date("2026-01-10").toISOString(),
  },
];

export const demoProfiles: Profile[] = [
  {
    id: "demo-super-admin",
    full_name: "Süper Admin",
    role: "super_admin",
    must_change_password: false,
    created_at: new Date("2026-01-01").toISOString(),
  },
];

export const demoMemberships: TenantMembership[] = [
  {
    id: "membership-1",
    tenant_id: "tenant-lucatech",
    user_id: "demo-tenant-admin",
    created_at: new Date("2026-01-01").toISOString(),
  },
];