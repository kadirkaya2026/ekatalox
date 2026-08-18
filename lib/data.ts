import { cache } from "react";
import { unstable_cache } from "next/cache";
import { isTrialExpired } from "@/lib/billing/trial";
import { DEFAULT_INSTALLMENT_OPTIONS } from "@/lib/storefront/cart";
import {
  demoAccessCodes,
  demoCategories,
  demoMemberships,
  demoPriceLists,
  demoProducts,
  demoProfiles,
  demoTenants,
} from "@/lib/demo-data";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentMonthVisitorCountsByTenant, getDateRange } from "@/lib/analytics/queries";
import { normalizeProductDescription } from "@/lib/products/description-html";
import { normalizeProductRecord } from "@/lib/products/records";
import { productWithVariantsAndPricesSelect } from "@/lib/products/queries";
import { getPricedLists, normalizePriceListRecord, sortPriceLists } from "@/lib/price-lists/records";
import { getPriceListDisplayName } from "@/lib/price-lists/constants";
import { ensureDefaultPriceListsForTenant, fetchTenantPriceLists } from "@/lib/price-lists/data";
import { DEFAULT_HOMEPAGE_BLOCKS, normalizeHomepageBlocks } from "@/lib/storefront/homepage-blocks";
import { toStorefrontProduct } from "@/lib/storefront/pricing";
import { getSmartDefaultAppearance } from "@/lib/storefront/smart-defaults";
import { buildProductNameSearchClause, expandSearchTerms } from "@/lib/search/turkish-search-aliases";
import { DEFAULT_BUSINESS_HOURS, WEEKDAY_ORDER } from "@/lib/storefront/business-hours";
import type {
  AccessCode,
  AdminLoginLogEntry,
  BusinessHours,
  Category,
  DashboardSummary,
  MarketCatalogProduct,
  PriceList,
  Product,
  Profile,
  StorefrontProduct,
  StorefrontSection,
  StorefrontSectionWithProducts,
  Tenant,
  TenantMembership,
  TenantStorefrontSettings,
  TenantWithRelations,
} from "@/lib/types";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

const productWithVariantsSelect = productWithVariantsAndPricesSelect;
const sectionProductsWithVariantsSelect =
  "product_id, display_order, products(*, variants:product_variants(*, prices:product_variant_prices(price_list_id, price)), product_prices(price_list_id, price))";
const sectionProductsFallbackSelect =
  "product_id, display_order, products(*, product_prices(price_list_id, price))";

const storefrontProductListColumns =
  "id, tenant_id, category_id, display_order, sku_code, product_name, image_url, image_url_2, image_url_3, currency, is_in_stock, is_discount_active, is_recommended, discount_price, package_quantity, carton_quantity, created_at";
const storefrontProductWithVariantsSelect =
  `${storefrontProductListColumns}, variants:product_variants(*, prices:product_variant_prices(price_list_id, price)), product_prices(price_list_id, price)`;
const storefrontSectionProductsWithVariantsSelect =
  `section_id, product_id, display_order, products(${storefrontProductWithVariantsSelect})`;
const storefrontSectionProductsFallbackSelect =
  `section_id, product_id, display_order, products(${storefrontProductListColumns})`;

function groupCountByTenant(
  items: Array<{ tenant_id: string }>,
): Record<string, number> {
  return items.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.tenant_id] = (accumulator[item.tenant_id] ?? 0) + 1;
    return accumulator;
  }, {});
}

// Supabase/PostgREST, filtresiz select sorgularında satırları sessizce
// varsayılan üst sınıra (genelde 1000) kadar döndürür. Tüm tenant'ların
// ürünlerini tek sorguda çekip client-side saymak, toplam ürün sayısı bu
// sınırı aştığında yanlış (eksik) sayılara yol açar. Bunun yerine her
// tenant için ayrı "exact count" sorgusu kullanılır; head:true sayesinde
// satır verisi indirilmez, sadece sayı döner.
async function getProductCountsByTenant(
  supabase: AdminClient,
  tenantIds: string[],
): Promise<Record<string, number>> {
  const entries = await Promise.all(
    tenantIds.map(async (tenantId) => {
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      return [tenantId, count ?? 0] as const;
    }),
  );

  return Object.fromEntries(entries);
}

export function getDefaultTenantStorefrontSettings(
  tenantId: string,
  seed?: string,
): TenantStorefrontSettings {
  const now = new Date().toISOString();
  const smartDefaults = seed ? getSmartDefaultAppearance(seed) : null;

  return {
    id: `storefront-default-${tenantId}`,
    tenant_id: tenantId,
    theme_key: smartDefaults?.theme_key ?? "minimal",
    layout_key: smartDefaults?.layout_key ?? "classic-grid",
    logo_url: null,
    storefront_title: null,
    storefront_description: null,
    hero_heading: null,
    hero_cta_label: null,
    hero_image_url: null,
    hero_style_key: "text",
    is_hero_visible: false,
    brand_primary_color: null,
    brand_accent_color: null,
    font_key: smartDefaults?.font_key ?? "inter",
    product_card_style: "standard",
    product_image_background: "theme",
    header_style_key: "standard",
    footer_style_key: "standard",
    homepage_blocks: DEFAULT_HOMEPAGE_BLOCKS,
    banner_items: [],
    hero_cluster_items: [],
    is_hero_cluster_visible_on_mobile: true,
    site_tab_title: null,
    site_favicon_url: null,
    announcement_title: null,
    announcement_body: null,
    is_active: false,
    version: 0,
    max_display_count: 1,
    created_at: now,
    card_installment_options: DEFAULT_INSTALLMENT_OPTIONS,
    is_cash_discount_active: false,
    cash_discount_note: null,
    is_card_campaign_active: false,
    card_campaign_note: null,
    cash_discount_tiers: [],
    card_campaign_tiers: [],
    price_update_date: null,
    is_price_update_date_visible: false,
    is_theme_toggle_visible: true,
    is_logout_button_visible: true,
    is_footer_visible: false,
    is_footer_logo_visible: true,
    is_footer_social_visible: false,
    is_footer_location_visible: false,
    is_footer_copyright_visible: false,
    footer_location: null,
    footer_copyright: null,
    footer_instagram_url: null,
    footer_youtube_url: null,
    footer_x_url: null,
    footer_facebook_url: null,
    footer_whatsapp: null,
    is_footer_instagram_visible: false,
    is_footer_youtube_visible: false,
    is_footer_x_visible: false,
    is_footer_facebook_visible: false,
    is_footer_whatsapp_visible: false,
    footer_website_url: null,
    is_footer_website_visible: false,
    footer_phone: null,
    footer_email: null,
    is_footer_contact_visible: false,
    recommendation_mode: "auto",
    default_locale: "tr",
    is_always_open: true,
    business_hours: DEFAULT_BUSINESS_HOURS,
    is_min_cart_amount_active: false,
    min_cart_amount: 0,
    is_best_sellers_visible: false,
    best_sellers_title: "En Çok Satanlar",
    best_sellers_product_count: 8,
    updated_at: now,
  };
}

function normalizeBusinessHours(
  value: Partial<BusinessHours> | null | undefined,
): BusinessHours {
  const merged = { ...DEFAULT_BUSINESS_HOURS, ...(value ?? {}) };

  return WEEKDAY_ORDER.reduce((acc, day) => {
    acc[day] = { ...DEFAULT_BUSINESS_HOURS[day], ...(merged[day] ?? {}) };
    return acc;
  }, {} as BusinessHours);
}

function normalizeStorefrontSettings(
  tenantId: string,
  data: Partial<TenantStorefrontSettings> | null,
): TenantStorefrontSettings {
  const merged = {
    ...getDefaultTenantStorefrontSettings(tenantId),
    ...(data ?? {}),
  };

  return {
    ...merged,
    homepage_blocks: normalizeHomepageBlocks(merged.homepage_blocks),
    business_hours: normalizeBusinessHours(merged.business_hours),
  };
}

function normalizeProductRows(rows: Array<Record<string, unknown>> | null | undefined) {
  return (rows ?? []).map((product) => normalizeProductRecord(product));
}

// PostgREST caps rows per request at db.max_rows (Supabase default 1000), so a
// tenant with more products than that would otherwise get silently truncated
// results. Page through with .range() until a page comes back short.
const PRODUCT_FETCH_PAGE_SIZE = 1000;

async function fetchAllTenantProductRows(
  supabase: AdminClient,
  select: string,
  tenantId: string,
) {
  const rows: Array<Record<string, unknown>> = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select(select)
      .eq("tenant_id", tenantId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, from + PRODUCT_FETCH_PAGE_SIZE - 1);

    if (error) {
      return { data: null, error };
    }

    const page = (data as unknown as Array<Record<string, unknown>> | null) ?? [];
    rows.push(...page);

    if (page.length < PRODUCT_FETCH_PAGE_SIZE) {
      break;
    }

    from += PRODUCT_FETCH_PAGE_SIZE;
  }

  return { data: rows, error: null };
}

async function fetchTenantProductsWithOptionalVariants(
  supabase: AdminClient,
  tenantId: string,
) {
  const withVariants = await fetchAllTenantProductRows(supabase, productWithVariantsSelect, tenantId);

  if (!withVariants.error) {
    return normalizeProductRows(withVariants.data);
  }

  const fallback = await fetchAllTenantProductRows(supabase, "*", tenantId);

  if (fallback.error) {
    return [];
  }

  return normalizeProductRows(fallback.data);
}

async function fetchStorefrontSectionRowsWithOptionalVariants(
  supabase: AdminClient,
  sectionIds: string[],
) {
  const withVariants = await supabase
    .from("storefront_section_products")
    .select(storefrontSectionProductsWithVariantsSelect)
    .in("section_id", sectionIds)
    .order("display_order", { ascending: true });

  if (!withVariants.error && withVariants.data) {
    return withVariants.data;
  }

  const fallback = await supabase
    .from("storefront_section_products")
    .select(storefrontSectionProductsFallbackSelect)
    .in("section_id", sectionIds)
    .order("display_order", { ascending: true });

  if (fallback.error || !fallback.data) {
    return [];
  }

  return fallback.data;
}

async function fetchSectionProductsWithOptionalVariants(
  supabase: AdminClient,
  sectionId: string,
) {
  const withVariants = await supabase
    .from("storefront_section_products")
    .select(sectionProductsWithVariantsSelect)
    .eq("section_id", sectionId)
    .order("display_order", { ascending: true });

  if (!withVariants.error && withVariants.data) {
    return withVariants.data;
  }

  const fallback = await supabase
    .from("storefront_section_products")
    .select(sectionProductsFallbackSelect)
    .eq("section_id", sectionId)
    .order("display_order", { ascending: true });

  if (fallback.error || !fallback.data) {
    return [];
  }

  return fallback.data;
}

async function fetchSectionRowsWithOptionalVariants(
  supabase: AdminClient,
  sectionIds: string[],
) {
  const withVariants = await supabase
    .from("storefront_section_products")
    .select(sectionProductsWithVariantsSelect.replace("product_id, ", "section_id, "))
    .in("section_id", sectionIds)
    .order("display_order", { ascending: true });

  if (!withVariants.error && withVariants.data) {
    return withVariants.data;
  }

  const fallback = await supabase
    .from("storefront_section_products")
    .select("section_id, display_order, products(*)")
    .in("section_id", sectionIds)
    .order("display_order", { ascending: true });

  if (fallback.error || !fallback.data) {
    return [];
  }

  return fallback.data;
}

export async function getAdminLoginLogs(): Promise<AdminLoginLogEntry[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return [];
    }

    return demoProfiles.map((profile) => {
      const membership = demoMemberships.find((m) => m.user_id === profile.id);
      const tenant = demoTenants.find((t) => t.id === membership?.tenant_id);

      return {
        user_id: profile.id,
        email: `${profile.id}@demo.ekatalox.com`,
        full_name: profile.full_name,
        role: profile.role,
        tenant_name: tenant?.company_name ?? null,
        tenant_subdomain: tenant?.subdomain ?? null,
        last_sign_in_at: new Date().toISOString(),
        created_at: profile.created_at,
      } satisfies AdminLoginLogEntry;
    });
  }

  // Supabase Auth her kullanıcı için last_sign_in_at tutar; ayrıca tabloya
  // ihtiyaç olmadan giriş bilgisinin kaynağı budur.
  const [usersResult, profilesResult, membershipsResult, tenantsResult] =
    await Promise.all([
      supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabase.from("profiles").select("*"),
      supabase.from("tenant_memberships").select("*"),
      supabase.from("tenants").select("id, company_name, subdomain"),
    ]);

  const users = usersResult.data?.users ?? [];
  const profiles = (profilesResult.data as Profile[] | null) ?? [];
  const memberships =
    (membershipsResult.data as TenantMembership[] | null) ?? [];
  const tenants =
    (tenantsResult.data as Array<
      Pick<Tenant, "id" | "company_name" | "subdomain">
    > | null) ?? [];

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const membershipByUserId = new Map(memberships.map((m) => [m.user_id, m]));
  const tenantById = new Map(tenants.map((t) => [t.id, t]));

  const entries = users.map((user) => {
    const profile = profileById.get(user.id);
    const membership = membershipByUserId.get(user.id);
    const tenant = membership ? tenantById.get(membership.tenant_id) : null;

    return {
      user_id: user.id,
      email: user.email ?? "-",
      full_name: profile?.full_name ?? null,
      role: profile?.role ?? "tenant_admin",
      tenant_name: tenant?.company_name ?? null,
      tenant_subdomain: tenant?.subdomain ?? null,
      last_sign_in_at: user.last_sign_in_at ?? null,
      created_at: user.created_at,
    } satisfies AdminLoginLogEntry;
  });

  // En son giriş yapan en üstte; hiç giriş yapmamışlar sona
  return entries.sort((a, b) => {
    if (!a.last_sign_in_at) return 1;
    if (!b.last_sign_in_at) return -1;
    return (
      new Date(b.last_sign_in_at).getTime() -
      new Date(a.last_sign_in_at).getTime()
    );
  });
}

export async function getTenantsOverview(): Promise<TenantWithRelations[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return [];
    }

    const productCounts = groupCountByTenant(
      demoProducts.map((item) => ({ tenant_id: item.tenant_id })),
    );

    return demoTenants.map((tenant) => ({
      ...tenant,
      access_codes: demoAccessCodes.filter((code) => code.tenant_id === tenant.id),
      price_lists: demoPriceLists.filter((list) => list.tenant_id === tenant.id),
      product_count: productCounts[tenant.id] ?? 0,
      monthly_visitor_count: 0,
      has_tenant_admin: true,
    }));
  }

  const [
    { data: tenantRows },
    { data: accessCodeRows },
    { data: priceListRows },
    monthlyVisitorCounts,
    { data: membershipRows },
  ] = await Promise.all([
    supabase.from("tenants").select("*").order("created_at", { ascending: false }),
    supabase.from("access_codes").select("*, price_list:price_lists(name, is_catalog_only)"),
    supabase.from("price_lists").select("*").order("sort_order", { ascending: true }),
    getCurrentMonthVisitorCountsByTenant(),
    supabase.from("tenant_memberships").select("tenant_id, user_id"),
  ]);

  const memberships = (membershipRows as Array<{ tenant_id: string; user_id: string }> | null) ?? [];
  const { data: adminProfileRows } = memberships.length
    ? await supabase
        .from("profiles")
        .select("id")
        .eq("role", "tenant_admin")
        .in(
          "id",
          memberships.map((membership) => membership.user_id),
        )
    : { data: [] as Array<{ id: string }> };

  const adminUserIds = new Set(
    ((adminProfileRows as Array<{ id: string }> | null) ?? []).map((row) => row.id),
  );
  const tenantIdsWithAdmin = new Set(
    memberships
      .filter((membership) => adminUserIds.has(membership.user_id))
      .map((membership) => membership.tenant_id),
  );

  const tenants = (tenantRows as Tenant[] | null) ?? [];
  const productCounts = await getProductCountsByTenant(
    supabase,
    tenants.map((tenant) => tenant.id),
  );

  const accessCodes = ((accessCodeRows as Array<Record<string, unknown>> | null) ?? []).map(
    (row) => {
      const priceList = row.price_list as {
        name?: string;
        is_catalog_only?: boolean;
      } | null;

      return {
        id: String(row.id ?? ""),
        tenant_id: String(row.tenant_id ?? ""),
        password_code: String(row.password_code ?? ""),
        price_list_id: String(row.price_list_id ?? ""),
        price_list_name: priceList?.name
          ? getPriceListDisplayName({
              name: priceList.name,
              is_catalog_only: Boolean(priceList.is_catalog_only),
            })
          : undefined,
        created_at: String(row.created_at ?? ""),
      } satisfies AccessCode;
    },
  );

  const priceListsByTenant = ((priceListRows as PriceList[] | null) ?? []).reduce<
    Record<string, PriceList[]>
  >((accumulator, list) => {
    accumulator[list.tenant_id] = [...(accumulator[list.tenant_id] ?? []), list];
    return accumulator;
  }, {});

  return tenants.map((tenant) => ({
    ...tenant,
    access_codes: accessCodes.filter((code) => code.tenant_id === tenant.id),
    price_lists: (priceListsByTenant[tenant.id] ?? []).sort(sortPriceLists),
    product_count: productCounts[tenant.id] ?? 0,
    monthly_visitor_count: monthlyVisitorCounts[tenant.id] ?? 0,
    has_tenant_admin: tenantIdsWithAdmin.has(tenant.id),
  }));
}

export async function getTenantProducts(tenantId: string): Promise<Product[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return [];
    }

    return demoProducts.filter((product) => product.tenant_id === tenantId);
  }

  return fetchTenantProductsWithOptionalVariants(supabase, tenantId);
}

export async function getTenantProductCount(tenantId: string): Promise<number> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return 0;
    }

    return demoProducts.filter((product) => product.tenant_id === tenantId).length;
  }

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  return count ?? 0;
}

// Master Katalog sayfası sadece "bu sku zaten aktarılmış mı" rozetini
// göstermek için tenant'ın sku_code'larına ihtiyaç duyuyordu ama tüm ürün
// satırlarını (varyant/fiyat dahil) çekiyordu — burada da sadece sku_code
// yeterli.
export async function getTenantProductSkuCodes(tenantId: string): Promise<string[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return [];
    }

    return demoProducts.filter((product) => product.tenant_id === tenantId).map((p) => p.sku_code);
  }

  const skuCodes: string[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("products")
      .select("sku_code")
      .eq("tenant_id", tenantId)
      .range(from, from + pageSize - 1);

    if (error || !data) break;
    skuCodes.push(...data.map((row) => row.sku_code as string));
    if (data.length < pageSize) break;
  }

  return skuCodes;
}

export const TENANT_PRODUCTS_PAGE_SIZE = 100;

// The "Ürünler" admin page used to load a tenant's entire product table on
// every visit (lib/data.ts's old getTenantProducts call there) — fine for a
// few hundred rows, but tenants that imported the full market catalog sit at
// 10-20k+ products, and shipping/holding all of them client-side is what was
// making the page unusably slow. This mirrors getMarketCatalogProductsPage's
// server-side search+pagination instead.
export async function getTenantProductsPage(params: {
  tenantId: string;
  page: number;
  search?: string;
  categoryIds?: string[];
  matchCategoryIds?: string[];
}): Promise<{ products: Product[]; total: number }> {
  const supabase = createSupabaseAdminClient();

  const page = Math.max(1, params.page);
  const from = (page - 1) * TENANT_PRODUCTS_PAGE_SIZE;
  const to = from + TENANT_PRODUCTS_PAGE_SIZE - 1;
  const term = params.search?.trim().replace(/[,%]/g, " ").trim();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return { products: [], total: 0 };
    }

    const categoryIdSet = params.categoryIds?.length ? new Set(params.categoryIds) : null;
    const normalizedTerm = term?.toLowerCase();
    const filtered = demoProducts.filter((product) => {
      if (product.tenant_id !== params.tenantId) return false;
      if (categoryIdSet && !categoryIdSet.has(product.category_id)) return false;
      if (!normalizedTerm) return true;
      return (
        product.product_name.toLowerCase().includes(normalizedTerm) ||
        product.sku_code.toLowerCase().includes(normalizedTerm)
      );
    });

    return { products: filtered.slice(from, to + 1), total: filtered.length };
  }

  const orFilter = term
    ? (() => {
        const escapedTerm = term.replace(/[()]/g, "");
        const nameConditions = buildProductNameSearchClause(escapedTerm);
        const categoryMatch = params.matchCategoryIds?.length
          ? `,category_id.in.(${params.matchCategoryIds.join(",")})`
          : "";
        return `${nameConditions},sku_code.ilike.%${escapedTerm}%${categoryMatch}`;
      })()
    : null;

  let primaryQuery = supabase
    .from("products")
    .select(productWithVariantsSelect, { count: "exact" })
    .eq("tenant_id", params.tenantId);
  if (params.categoryIds?.length) primaryQuery = primaryQuery.in("category_id", params.categoryIds);
  if (orFilter) primaryQuery = primaryQuery.or(orFilter);
  primaryQuery = primaryQuery
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data, error, count } = await primaryQuery;

  if (!error) {
    return { products: normalizeProductRows(data), total: count ?? 0 };
  }

  let fallbackQuery = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("tenant_id", params.tenantId);
  if (params.categoryIds?.length) fallbackQuery = fallbackQuery.in("category_id", params.categoryIds);
  if (orFilter) fallbackQuery = fallbackQuery.or(orFilter);
  fallbackQuery = fallbackQuery
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
    .range(from, to);

  const fallback = await fallbackQuery;

  return { products: normalizeProductRows(fallback.data), total: fallback.count ?? 0 };
}

// "Tümünü seç" için: geçerli arama/kategori filtresine uyan HER ürünün id'sini
// (sayfalama olmadan) döner. getTenantProductsPage'deki filtre mantığıyla
// birebir aynı olmalı, yoksa kullanıcı ekranda gördüğünden farklı bir küme
// seçmiş olur. PostgREST'in tek sorguda döndürebildiği satır sayısı
// sınırlı olduğu için 1000'lik sayfalarla çekiyoruz.
export async function getTenantProductIdsForFilter(params: {
  tenantId: string;
  search?: string;
  categoryIds?: string[];
  matchCategoryIds?: string[];
}): Promise<string[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  const term = params.search?.trim().replace(/[,%]/g, " ").trim();
  const orFilter = term
    ? (() => {
        const escapedTerm = term.replace(/[()]/g, "");
        const nameConditions = buildProductNameSearchClause(escapedTerm);
        const categoryMatch = params.matchCategoryIds?.length
          ? `,category_id.in.(${params.matchCategoryIds.join(",")})`
          : "";
        return `${nameConditions},sku_code.ilike.%${escapedTerm}%${categoryMatch}`;
      })()
    : null;

  const ids: string[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from("products")
      .select("id")
      .eq("tenant_id", params.tenantId);
    if (params.categoryIds?.length) query = query.in("category_id", params.categoryIds);
    if (orFilter) query = query.or(orFilter);
    query = query.range(from, from + pageSize - 1);

    const { data, error } = await query;
    if (error || !data) break;
    ids.push(...data.map((row) => row.id as string));
    if (data.length < pageSize) break;
  }

  return ids;
}

export async function getTenantCategories(tenantId: string): Promise<Category[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return [];
    }

    return demoCategories.filter((category) => category.tenant_id === tenantId);
  }

  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  return ((data as Category[] | null) ?? []).map((category) => ({
    ...category,
    banner_item: category.banner_item ?? null,
    tile_image_url: category.tile_image_url ?? null,
  }));
}

export const MARKET_CATALOG_PAGE_SIZE = 50;

// Katalog binlerce satıra çıktığından tek seferde tamamını çekip render
// etmek (eski davranış) tarayıcıyı kilitliyordu — sunucu tarafında hem
// sayfalanıyor hem de arama terimi TÜM tabloda (sadece o an ekrandaki
// sayfada değil) aranıyor.
export async function getMarketCatalogProductsPage(params: {
  page: number;
  search?: string;
}): Promise<{ products: MarketCatalogProduct[]; total: number }> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return { products: [], total: 0 };
  }

  const page = Math.max(1, params.page);
  const from = (page - 1) * MARKET_CATALOG_PAGE_SIZE;
  const to = from + MARKET_CATALOG_PAGE_SIZE - 1;
  const term = params.search?.trim().replace(/[,%]/g, " ").trim();

  let query = supabase
    .from("market_catalog_products")
    .select("*", { count: "exact" })
    .order("category_name", { ascending: true })
    .order("product_name", { ascending: true })
    .range(from, to);

  if (term) {
    const nameConditions = buildProductNameSearchClause(term);
    const brandConditions = buildProductNameSearchClause(term, "brand");
    query = query.or(
      `${nameConditions},${brandConditions},category_name.ilike.%${term}%,sku_code.ilike.%${term}%`,
    );
  }

  const { data, count } = await query;

  return {
    products: (data as MarketCatalogProduct[] | null) ?? [],
    total: count ?? 0,
  };
}

export async function getTenantStorefrontSettings(
  tenantId: string,
): Promise<TenantStorefrontSettings> {
  const readStorefrontSettings = unstable_cache(
    async (resolvedTenantId: string) => {
      const supabase = createSupabaseAdminClient();

      if (!supabase) {
        return getDefaultTenantStorefrontSettings(resolvedTenantId);
      }

      const { data } = await supabase
        .from("tenant_storefront_settings")
        .select("*")
        .eq("tenant_id", resolvedTenantId)
        .maybeSingle();

      if (!data) {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("subdomain")
          .eq("id", resolvedTenantId)
          .maybeSingle();

        return getDefaultTenantStorefrontSettings(
          resolvedTenantId,
          tenant?.subdomain,
        );
      }

      return normalizeStorefrontSettings(
        resolvedTenantId,
        data as Partial<TenantStorefrontSettings> | null,
      );
    },
    [tenantId],
    {
      tags: [`storefront_${tenantId}`],
    },
  );

  return readStorefrontSettings(tenantId);
}

export async function getTenantPriceLists(tenantId: string): Promise<PriceList[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return [];
    }

    return demoPriceLists
      .filter((list) => list.tenant_id === tenantId)
      .sort(sortPriceLists);
  }

  const lists = await ensureDefaultPriceListsForTenant(supabase, tenantId);
  return lists.sort(sortPriceLists);
}

/**
 * Şifresiz vitrin modunda (tenant.is_password_protected === false) ziyaretçiye
 * hangi fiyat listesinin uygulanacağını belirler. Tenant admin "Şifre
 * kullanma"yı kapatırken bir fiyat listesi seçer (tenants.public_price_list_id);
 * o seçim geçerliyse kullanılır. Seçim yoksa/artık geçerli değilse ilk FİYATLI
 * (katalog-only olmayan) listeye düşülür — sort_order'a göre ilk sıradaki her
 * zaman katalog-only ("Katalog") listesi olduğu için, eskiden buraya düşülünce
 * ürünler fiyatsız görünüyordu.
 */
export async function resolveDefaultPriceListForTenant(
  tenantId: string,
  publicPriceListId?: string | null,
): Promise<{ priceListId: string; isCatalogOnly: boolean } | null> {
  const priceLists = await getTenantPriceLists(tenantId);

  const chosen = publicPriceListId
    ? priceLists.find((list) => list.id === publicPriceListId && !list.is_catalog_only)
    : undefined;

  const fallback = getPricedLists(priceLists)[0];
  const target = chosen ?? fallback;

  if (!target) {
    return null;
  }

  return { priceListId: target.id, isCatalogOnly: target.is_catalog_only };
}

export async function getTenantAccessCodes(
  tenantId: string,
): Promise<AccessCode[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return [];
    }

    return demoAccessCodes
      .filter((item) => item.tenant_id === tenantId)
      .map((code) => ({
        ...code,
        price_list_name: (() => {
          const list = demoPriceLists.find((item) => item.id === code.price_list_id);
          return list ? getPriceListDisplayName(list) : undefined;
        })(),
      }));
  }

  const { data } = await supabase
    .from("access_codes")
    .select("*, price_list:price_lists(name, is_catalog_only)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return ((data as Array<Record<string, unknown>> | null) ?? []).map((row) => {
    const priceList = row.price_list as {
      name?: string;
      is_catalog_only?: boolean;
    } | null;

    return {
      id: String(row.id ?? ""),
      tenant_id: String(row.tenant_id ?? ""),
      password_code: String(row.password_code ?? ""),
      price_list_id: String(row.price_list_id ?? ""),
      price_list_name: priceList?.name
        ? getPriceListDisplayName({
            name: priceList.name,
            is_catalog_only: Boolean(priceList.is_catalog_only),
          })
        : undefined,
      created_at: String(row.created_at ?? ""),
    } satisfies AccessCode;
  });
}

export async function getTenantDashboardSummary(
  tenant: Tenant,
): Promise<DashboardSummary> {
  // Genel Bakış sadece bir sayı gösteriyor — tüm ürün tablosunu (varyantlarla
  // birlikte) çekip .length almak, tam da Ürünler sayfasını yavaşlatan aynı
  // hataydı, ve bu sayfa girişten sonra ilk açılan sayfa olduğu için etkisi
  // daha da büyüktü.
  const productCount = await getTenantProductCount(tenant.id);

  return {
    tenant,
    productCount,
  };
}

export const getStorefrontTenant = cache(async function getStorefrontTenant(
  subdomain: string,
): Promise<Tenant | null> {
  const supabaseAdmin = createSupabaseAdminClient();

  if (!supabaseAdmin) {
    if (!shouldAllowDemoFallback()) {
      return null;
    }

    return demoTenants.find((tenant) => tenant.subdomain === subdomain) ?? null;
  }

  const { data } = await supabaseAdmin
    .from("tenants")
    .select("*")
    .eq("subdomain", subdomain)
    .maybeSingle();

  return (data as Tenant | null) ?? null;
});

/**
 * ISR/statik sayfalar için tenant okuması. Admin Supabase client'ı her
 * fetch'i `no-store` yaptığından statik render'da doğrudan kullanılamaz
 * (app-static-to-dynamic-error); unstable_cache sarmalı bunu güvenli kılar.
 * Ayar kaydedilince revalidateStorefrontCache tag'i tazeler.
 */
export async function getStorefrontTenantCached(
  subdomain: string,
): Promise<Tenant | null> {
  const readTenant = unstable_cache(
    async (resolvedSubdomain: string) => getStorefrontTenant(resolvedSubdomain),
    [subdomain],
    {
      revalidate: 300,
      tags: [`tenant_subdomain_${subdomain}`],
    },
  );

  return readTenant(subdomain);
}

export const getTenantByCustomDomain = cache(async function getTenantByCustomDomain(
  domain: string,
): Promise<Tenant | null> {
  const normalizedDomain = domain.trim().toLowerCase().replace(/:\d+$/, "");

  if (!normalizedDomain) {
    return null;
  }

  const supabaseAdmin = createSupabaseAdminClient();

  if (!supabaseAdmin) {
    if (!shouldAllowDemoFallback()) {
      return null;
    }

    return (
      demoTenants.find(
        (tenant) => tenant.custom_domain?.toLowerCase() === normalizedDomain,
      ) ?? null
    );
  }

  const { data } = await supabaseAdmin
    .from("tenants")
    .select("*")
    .ilike("custom_domain", normalizedDomain)
    .maybeSingle();

  return (data as Tenant | null) ?? null;
});

export async function validateAccessCode(params: {
  subdomain: string;
  code: string;
}): Promise<{
  tenant: Tenant;
  accessCodeId: string;
  priceListId: string;
  isCatalogOnly: boolean;
  priceListName: string;
} | null> {
  const tenant = await getStorefrontTenant(params.subdomain);

  if (!tenant || tenant.status !== "active") {
    return null;
  }

  // Deneme süresi dolan tenant'ın vitrini kapalıdır; erişim kodları da
  // yeni oturum açamaz.
  if (isTrialExpired(tenant)) {
    return null;
  }

  const supabaseAdmin = createSupabaseAdminClient();

  if (!supabaseAdmin) {
    if (!shouldAllowDemoFallback()) {
      return null;
    }

    const matched = demoAccessCodes.find(
      (accessCode) =>
        accessCode.tenant_id === tenant.id &&
        accessCode.password_code === params.code.trim(),
    );

    if (!matched) {
      return null;
    }

    const priceList =
      demoPriceLists.find((list) => list.id === matched.price_list_id) ?? null;

    if (!priceList) {
      return null;
    }

    return {
      tenant,
      accessCodeId: matched.id,
      priceListId: priceList.id,
      isCatalogOnly: priceList.is_catalog_only,
      priceListName: getPriceListDisplayName(priceList),
    };
  }

  const { data } = await supabaseAdmin
    .from("access_codes")
    .select("id, price_list_id, price_list:price_lists(id, name, is_catalog_only)")
    .eq("tenant_id", tenant.id)
    .eq("password_code", params.code.trim())
    .maybeSingle();

  const matched = data as {
    id: string;
    price_list_id: string;
    price_list: { id: string; name: string; is_catalog_only: boolean } | null;
  } | null;

  if (!matched?.price_list) {
    return null;
  }

  return {
    tenant,
    accessCodeId: matched.id,
    priceListId: matched.price_list.id,
    isCatalogOnly: matched.price_list.is_catalog_only,
    priceListName: getPriceListDisplayName(matched.price_list),
  };
}

// Tenants that imported the full market catalog sit at 20k+ products —
export const STOREFRONT_PRODUCTS_PAGE_SIZE = 60;

interface StorefrontProductRowFilter {
  tenantId: string;
  page: number;
  search?: string;
  categoryIds?: string[];
  matchCategoryIds?: string[];
  excludeCategoryIds?: string[];
  discountOnly?: boolean;
}

function applyStorefrontProductFilters<
  Q extends { in: Function; not: Function; or: Function; eq: Function },
>(query: Q, filter: StorefrontProductRowFilter, orFilter: string | null): Q {
  let q = query;
  if (filter.discountOnly) {
    q = q.eq("is_discount_active", true);
  } else if (filter.categoryIds?.length) {
    q = q.in("category_id", filter.categoryIds);
  }
  if (filter.excludeCategoryIds?.length) {
    q = q.not("category_id", "in", `(${filter.excludeCategoryIds.join(",")})`);
  }
  if (orFilter) {
    q = q.or(orFilter);
  }
  return q;
}

// Sunucu taraflı sayfalanmış+aranmış+filtrelenmiş satır çekimi — asıl
// getCachedStorefrontProductRows (tüm katalog) fonksiyonunun 16MB'lık
// sayfayı üreten kaynağıydı. Satırlar (fiyattan bağımsız kısım) burada
// önbelleklenir; fiyat, ziyaretçinin fiyat listesine göre çağıran tarafta
// hesaplanır — böylece aynı sayfa/filtre önbelleği tüm fiyat listeleri
// arasında paylaşılabilir.
async function getCachedStorefrontProductRowsPage(
  filter: StorefrontProductRowFilter,
): Promise<{ products: Product[]; total: number }> {
  const page = Math.max(1, filter.page);

  if (!createSupabaseAdminClient()) {
    if (!shouldAllowDemoFallback()) {
      return { products: [], total: 0 };
    }

    const from = (page - 1) * STOREFRONT_PRODUCTS_PAGE_SIZE;
    const categoryIdSet = filter.categoryIds?.length ? new Set(filter.categoryIds) : null;
    const excludeSet = filter.excludeCategoryIds?.length ? new Set(filter.excludeCategoryIds) : null;
    const searchTerms = filter.search
      ? expandSearchTerms(filter.search).map((t) => t.toLocaleLowerCase("tr-TR"))
      : [];
    const filtered = demoProducts.filter((product) => {
      if (product.tenant_id !== filter.tenantId) return false;
      if (excludeSet?.has(product.category_id)) return false;
      if (filter.discountOnly) return product.is_discount_active;
      if (categoryIdSet && !categoryIdSet.has(product.category_id)) return false;
      if (!searchTerms.length) return true;
      const name = product.product_name.toLocaleLowerCase("tr-TR");
      return searchTerms.some((t) => name.includes(t));
    });

    return {
      products: filtered.slice(from, from + STOREFRONT_PRODUCTS_PAGE_SIZE),
      total: filtered.length,
    };
  }

  const readPage = unstable_cache(
    async (
      resolvedTenantId: string,
      resolvedPage: number,
      search: string,
      categoryIds: string[],
      matchCategoryIds: string[],
      excludeCategoryIds: string[],
      discountOnly: boolean,
    ) => {
      const admin = createSupabaseAdminClient();
      if (!admin) return { products: [] as Product[], total: 0 };

      const from = (resolvedPage - 1) * STOREFRONT_PRODUCTS_PAGE_SIZE;
      const to = from + STOREFRONT_PRODUCTS_PAGE_SIZE - 1;
      const term = search.trim().replace(/[,%]/g, " ").trim();
      const resolvedFilter: StorefrontProductRowFilter = {
        tenantId: resolvedTenantId,
        page: resolvedPage,
        categoryIds,
        excludeCategoryIds,
        discountOnly,
      };

      const orFilter = term
        ? (() => {
            const escapedTerm = term.replace(/[()]/g, "");
            const nameConditions = buildProductNameSearchClause(escapedTerm);
            const categoryMatch = matchCategoryIds.length
              ? `,category_id.in.(${matchCategoryIds.join(",")})`
              : "";
            return `${nameConditions},sku_code.ilike.%${escapedTerm}%${categoryMatch}`;
          })()
        : null;

      let primaryQuery = applyStorefrontProductFilters(
        admin
          .from("products")
          .select(productWithVariantsSelect, { count: "exact" })
          .eq("tenant_id", resolvedTenantId),
        resolvedFilter,
        orFilter,
      );
      primaryQuery = primaryQuery
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false })
        .range(from, to);

      const { data, error, count } = await primaryQuery;
      if (!error) {
        return { products: normalizeProductRows(data), total: count ?? 0 };
      }

      let fallbackQuery = applyStorefrontProductFilters(
        admin.from("products").select("*", { count: "exact" }).eq("tenant_id", resolvedTenantId),
        resolvedFilter,
        orFilter,
      );
      fallbackQuery = fallbackQuery
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false })
        .range(from, to);

      const fallback = await fallbackQuery;
      return { products: normalizeProductRows(fallback.data), total: fallback.count ?? 0 };
    },
    [filter.tenantId],
    { tags: [`storefront_${filter.tenantId}`], revalidate: 60 },
  );

  return readPage(
    filter.tenantId,
    page,
    filter.search ?? "",
    filter.categoryIds ?? [],
    filter.matchCategoryIds ?? [],
    filter.excludeCategoryIds ?? [],
    filter.discountOnly ?? false,
  );
}

export async function getStorefrontProductsPage(params: {
  tenantId: string;
  priceListId: string;
  isCatalogOnly: boolean;
  page: number;
  search?: string;
  categoryIds?: string[];
  matchCategoryIds?: string[];
  excludeCategoryIds?: string[];
  discountOnly?: boolean;
}): Promise<{ products: StorefrontProduct[]; total: number }> {
  const { products, total } = await getCachedStorefrontProductRowsPage(params);

  return {
    products: products.map((product) =>
      toStorefrontProduct(product, params.priceListId, params.isCatalogOnly),
    ),
    total,
  };
}

// Sepet çekmecesindeki "Bunlar da ilginizi çekebilir" önerileri artık tüm
// katalog yerine küçük, sabit boyutlu bir havuzdan besleniyor: elle
// önerilen (is_recommended) ürünler + kategoriler arası çeşitlilik için
// rastgele bir örneklem. Gerçek sıralama/çapraz-satış mantığı hâlâ
// istemci tarafında (sepet içeriğine göre) çalışıyor, sadece aday havuzu
// artık 20k+ değil birkaç yüz ürün.
export async function getStorefrontRecommendationPool(params: {
  tenantId: string;
  priceListId: string;
  isCatalogOnly: boolean;
  excludeCategoryIds?: string[];
}): Promise<StorefrontProduct[]> {
  const supabaseAdmin = createSupabaseAdminClient();

  if (!supabaseAdmin) {
    if (!shouldAllowDemoFallback()) return [];
    return demoProducts
      .filter((product) => product.tenant_id === params.tenantId)
      .slice(0, 300)
      .map((product) => toStorefrontProduct(product, params.priceListId, params.isCatalogOnly));
  }

  const readPool = unstable_cache(
    async (tenantId: string, excludeCategoryIds: string[]) => {
      const admin = createSupabaseAdminClient();
      if (!admin) return [] as Product[];

      let recommendedQuery = admin
        .from("products")
        .select(productWithVariantsSelect)
        .eq("tenant_id", tenantId)
        .eq("is_recommended", true)
        .eq("is_in_stock", true)
        .limit(200);
      if (excludeCategoryIds.length) {
        recommendedQuery = recommendedQuery.not("category_id", "in", `(${excludeCategoryIds.join(",")})`);
      }
      const { data: recommendedRows } = await recommendedQuery;
      const recommended = normalizeProductRows(recommendedRows);

      // Elle işaretlenmiş öneri havuzu küçükse (ya da tenant hiç kullanmıyorsa)
      // rastgele bir örneklemle tamamla, böylece çapraz satış önerisi tek bir
      // kategoriye sıkışıp kalmaz.
      if (recommended.length >= 200) {
        return recommended;
      }

      let sampleQuery = admin
        .from("products")
        .select(productWithVariantsSelect)
        .eq("tenant_id", tenantId)
        .eq("is_in_stock", true)
        .order("display_order", { ascending: true })
        .limit(300);
      if (excludeCategoryIds.length) {
        sampleQuery = sampleQuery.not("category_id", "in", `(${excludeCategoryIds.join(",")})`);
      }
      const { data: sampleRows } = await sampleQuery;
      const sample = normalizeProductRows(sampleRows);

      const seen = new Set(recommended.map((p) => p.id));
      return [...recommended, ...sample.filter((p) => !seen.has(p.id))];
    },
    [params.tenantId],
    { tags: [`storefront_${params.tenantId}`], revalidate: 60 },
  );

  const rows = await readPool(params.tenantId, params.excludeCategoryIds ?? []);
  return rows.map((product) => toStorefrontProduct(product, params.priceListId, params.isCatalogOnly));
}

// Anasayfadaki "indirimli ürünler" karo şeridi için — tüm katalogdan
// indirimdeki birkaç ürünü bulmak amacıyla artık 20k+ ürünü taramak yerine
// doğrudan is_discount_active=true üzerinden küçük bir sorgu çalışıyor.
export async function getStorefrontPromoProducts(params: {
  tenantId: string;
  priceListId: string;
  isCatalogOnly: boolean;
  excludeCategoryIds?: string[];
  limit?: number;
}): Promise<StorefrontProduct[]> {
  const supabaseAdmin = createSupabaseAdminClient();
  const limit = params.limit ?? 12;

  if (!supabaseAdmin) {
    if (!shouldAllowDemoFallback()) return [];
    return demoProducts
      .filter((product) => product.tenant_id === params.tenantId && product.is_discount_active)
      .slice(0, limit)
      .map((product) => toStorefrontProduct(product, params.priceListId, params.isCatalogOnly));
  }

  const readPromo = unstable_cache(
    async (tenantId: string, excludeCategoryIds: string[], resolvedLimit: number) => {
      const admin = createSupabaseAdminClient();
      if (!admin) return [] as Product[];

      let query = admin
        .from("products")
        .select(productWithVariantsSelect)
        .eq("tenant_id", tenantId)
        .eq("is_discount_active", true)
        .eq("is_in_stock", true)
        .order("display_order", { ascending: true })
        .limit(resolvedLimit);
      if (excludeCategoryIds.length) {
        query = query.not("category_id", "in", `(${excludeCategoryIds.join(",")})`);
      }

      const { data } = await query;
      return normalizeProductRows(data);
    },
    [params.tenantId],
    { tags: [`storefront_${params.tenantId}`], revalidate: 60 },
  );

  const rows = await readPromo(params.tenantId, params.excludeCategoryIds ?? [], limit);
  return rows.map((product) => toStorefrontProduct(product, params.priceListId, params.isCatalogOnly));
}

// "Öne Çıkan Bölümler"in aksine burada ürün listesi admin tarafından
// seçilmiyor — son 30 gündeki gerçek storefront_analytics_product_daily.
// cart_add_count toplamına göre otomatik hesaplanıyor (bkz. showcase-manager
// ile karıştırılmasın, o elle seçilen storefront_sections'ı yönetir).
const BEST_SELLER_CANDIDATE_LIMIT = 100;

export async function getStorefrontBestSellerProducts(params: {
  tenantId: string;
  priceListId: string;
  isCatalogOnly: boolean;
  excludeCategoryIds?: string[];
  limit?: number;
}): Promise<StorefrontProduct[]> {
  const supabaseAdmin = createSupabaseAdminClient();
  const limit = params.limit ?? 8;

  if (!supabaseAdmin) {
    return [];
  }

  const readBestSellers = unstable_cache(
    async (tenantId: string, excludeCategoryIds: string[], resolvedLimit: number) => {
      const admin = createSupabaseAdminClient();
      if (!admin) return [] as Product[];

      const { startDate, endDate } = getDateRange("monthly");

      const { data: statRows } = await admin
        .from("storefront_analytics_product_daily")
        .select("product_id, cart_add_count")
        .eq("tenant_id", tenantId)
        .gte("stat_date", startDate)
        .lte("stat_date", endDate);

      if (!statRows?.length) return [] as Product[];

      const cartAddByProductId = new Map<string, number>();
      for (const row of statRows as Array<{ product_id: string; cart_add_count: number | null }>) {
        const current = cartAddByProductId.get(row.product_id) ?? 0;
        cartAddByProductId.set(row.product_id, current + (row.cart_add_count ?? 0));
      }

      const rankedProductIds = [...cartAddByProductId.entries()]
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, BEST_SELLER_CANDIDATE_LIMIT)
        .map(([productId]) => productId);

      if (!rankedProductIds.length) return [] as Product[];

      let query = admin
        .from("products")
        .select(productWithVariantsSelect)
        .eq("tenant_id", tenantId)
        .eq("is_in_stock", true)
        .in("id", rankedProductIds);
      if (excludeCategoryIds.length) {
        query = query.not("category_id", "in", `(${excludeCategoryIds.join(",")})`);
      }

      const { data } = await query;
      const products = normalizeProductRows(data);
      const productById = new Map(products.map((product) => [product.id, product]));

      // Sıralamayı cart_add_count'a göre koru — .in() sorgusu sıra garantisi vermez.
      return rankedProductIds
        .map((id) => productById.get(id))
        .filter((product): product is Product => Boolean(product))
        .slice(0, resolvedLimit);
    },
    [params.tenantId],
    { tags: [`storefront_${params.tenantId}`], revalidate: 300 },
  );

  const rows = await readBestSellers(params.tenantId, params.excludeCategoryIds ?? [], limit);
  return rows.map((product) => toStorefrontProduct(product, params.priceListId, params.isCatalogOnly));
}

export async function getStorefrontProductDescription(
  tenantId: string,
  productId: string,
): Promise<{ found: false } | { found: true; description: string | null }> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return { found: false };
    }

    const demoProduct = demoProducts.find(
      (product) => product.tenant_id === tenantId && product.id === productId,
    );

    if (!demoProduct) {
      return { found: false };
    }

    if (!demoProduct.description) {
      return { found: true, description: null };
    }

    return {
      found: true,
      description: normalizeProductDescription(demoProduct.description),
    };
  }

  const { data, error } = await supabase
    .from("products")
    .select("description")
    .eq("tenant_id", tenantId)
    .eq("id", productId)
    .maybeSingle();

  if (error || !data) {
    return { found: false };
  }

  const description =
    typeof data.description === "string" ? data.description : null;

  if (!description) {
    return { found: true, description: null };
  }

  return {
    found: true,
    description: normalizeProductDescription(description),
  };
}

export async function getTenantStorefrontSections(
  tenantId: string,
): Promise<StorefrontSection[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("storefront_sections")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (data as StorefrontSection[] | null) ?? [];
}

export async function getTenantSectionProducts(sectionId: string): Promise<Product[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const data = await fetchSectionProductsWithOptionalVariants(supabase, sectionId);

  if (!data.length) {
    return [];
  }

  return data
    .map((row: { products: unknown }) => row.products)
    .filter((p): p is Record<string, unknown> => Boolean(p))
    .map((product) => normalizeProductRecord(product));
}

export async function getStorefrontSections(
  tenantId: string,
  priceListId: string,
  isCatalogOnly: boolean,
): Promise<StorefrontSectionWithProducts[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data: sections } = await supabase
    .from("storefront_sections")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!sections || sections.length === 0) {
    return [];
  }

  const sectionIds = (sections as StorefrontSection[]).map((s) => s.id);

  const sectionProductRows = await fetchStorefrontSectionRowsWithOptionalVariants(
    supabase,
    sectionIds,
  );

  const productsBySectionId = new Map<string, StorefrontProduct[]>();

  for (const row of (sectionProductRows ?? []) as Array<{
    section_id: string;
    display_order: number;
    products: unknown;
  }>) {
    if (!row.products) {
      continue;
    }
    const product = normalizeProductRecord(row.products as Record<string, unknown>);
    const storefrontProduct = toStorefrontProduct(
      product,
      priceListId,
      isCatalogOnly,
    );
    const existing = productsBySectionId.get(row.section_id) ?? [];
    existing.push(storefrontProduct);
    productsBySectionId.set(row.section_id, existing);
  }

  return (sections as StorefrontSection[]).map((section) => ({
    ...section,
    products: productsBySectionId.get(section.id) ?? [],
  }));
}

export async function createStorefrontSection(
  tenantId: string,
  title: string,
): Promise<StorefrontSection | null> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data: existing } = await supabase
    .from("storefront_sections")
    .select("id")
    .eq("tenant_id", tenantId);

  if ((existing?.length ?? 0) >= 3) {
    return null;
  }

  const { data: last } = await supabase
    .from("storefront_sections")
    .select("display_order")
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("storefront_sections")
    .insert({
      tenant_id: tenantId,
      title: title.trim(),
      display_order: (last?.display_order ?? 0) + 1,
    })
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  return data as StorefrontSection;
}

export async function deleteStorefrontSection(sectionId: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from("storefront_sections")
    .delete()
    .eq("id", sectionId);

  return !error;
}

export async function addProductToSection(
  sectionId: string,
  productId: string,
): Promise<boolean> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return false;
  }

  const { data: last } = await supabase
    .from("storefront_section_products")
    .select("display_order")
    .eq("section_id", sectionId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("storefront_section_products")
    .upsert({
      section_id: sectionId,
      product_id: productId,
      display_order: (last?.display_order ?? 0) + 1,
    });

  return !error;
}

export async function removeProductFromSection(
  sectionId: string,
  productId: string,
): Promise<boolean> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from("storefront_section_products")
    .delete()
    .eq("section_id", sectionId)
    .eq("product_id", productId);

  return !error;
}

export interface ThemeDistributionRow {
  signature: string;
  theme_key: string;
  layout_key: string;
  brand_primary_color: string | null;
  font_key: string;
  count: number;
}

export async function getThemeDistributionOverview(): Promise<ThemeDistributionRow[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("tenant_storefront_settings")
    .select("theme_key, layout_key, brand_primary_color, font_key");

  if (error || !data) {
    return [];
  }

  const grouped = new Map<string, ThemeDistributionRow>();

  for (const row of data) {
    const signature = [
      row.theme_key,
      row.layout_key,
      row.brand_primary_color ?? "none",
      row.font_key ?? "inter",
    ].join("|");

    const existing = grouped.get(signature);
    if (existing) {
      existing.count += 1;
      continue;
    }

    grouped.set(signature, {
      signature,
      theme_key: row.theme_key,
      layout_key: row.layout_key,
      brand_primary_color: row.brand_primary_color,
      font_key: row.font_key ?? "inter",
      count: 1,
    });
  }

  return [...grouped.values()].sort((left, right) => right.count - left.count);
}
