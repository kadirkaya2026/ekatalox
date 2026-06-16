import { unstable_cache } from "next/cache";
import { DEFAULT_INSTALLMENT_OPTIONS } from "@/lib/storefront/cart";
import {
  demoAccessCodes,
  demoCategories,
  demoPriceLists,
  demoProducts,
  demoTenants,
} from "@/lib/demo-data";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeProductDescription } from "@/lib/products/description-html";
import { normalizeProductRecord } from "@/lib/products/records";
import { productWithVariantsAndPricesSelect } from "@/lib/products/queries";
import { normalizePriceListRecord, sortPriceLists } from "@/lib/price-lists/records";
import { getPriceListDisplayName } from "@/lib/price-lists/constants";
import { ensureDefaultPriceListsForTenant, fetchTenantPriceLists } from "@/lib/price-lists/data";
import { DEFAULT_HOMEPAGE_BLOCKS, normalizeHomepageBlocks } from "@/lib/storefront/homepage-blocks";
import { toStorefrontProduct } from "@/lib/storefront/pricing";
import { getSmartDefaultAppearance } from "@/lib/storefront/smart-defaults";
import type {
  AccessCode,
  Category,
  DashboardSummary,
  PriceList,
  Product,
  StorefrontProduct,
  StorefrontSection,
  StorefrontSectionWithProducts,
  Tenant,
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
  "id, tenant_id, category_id, display_order, sku_code, product_name, image_url, currency, is_in_stock, is_discount_active, discount_price, package_quantity, carton_quantity, created_at";
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
    is_hero_visible: false,
    brand_primary_color: null,
    brand_accent_color: null,
    font_key: smartDefaults?.font_key ?? "inter",
    product_card_style: "standard",
    header_style_key: "standard",
    footer_style_key: "standard",
    homepage_blocks: DEFAULT_HOMEPAGE_BLOCKS,
    banner_items: [],
    site_tab_title: null,
    site_favicon_url: null,
    announcement_title: null,
    announcement_body: null,
    is_active: false,
    version: 0,
    max_display_count: 1,
    discount_threshold: 0,
    discount_percentage: 0,
    is_discount_active: false,
    discount_condition_note: null,
    created_at: now,
    discount_payment_method: "cash" as const,
    card_installment_options: DEFAULT_INSTALLMENT_OPTIONS,
    cash_discount_threshold: 0,
    cash_discount_percentage: 0,
    is_cash_discount_active: false,
    cash_discount_note: null,
    card_campaign_threshold: 0,
    is_card_campaign_active: false,
    card_campaign_note: null,
    cash_discount_tiers: [],
    card_campaign_tiers: [],
    price_update_date: null,
    is_price_update_date_visible: false,
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
    updated_at: now,
  };
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
  };
}

function normalizeProductRows(rows: Array<Record<string, unknown>> | null | undefined) {
  return (rows ?? []).map((product) => normalizeProductRecord(product));
}

async function fetchTenantProductsWithOptionalVariants(
  supabase: AdminClient,
  tenantId: string,
) {
  const withVariants = await supabase
    .from("products")
    .select(productWithVariantsSelect)
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!withVariants.error) {
    return normalizeProductRows(withVariants.data as Array<Record<string, unknown>> | null);
  }

  const fallback = await supabase
    .from("products")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (fallback.error) {
    return [];
  }

  return normalizeProductRows(fallback.data as Array<Record<string, unknown>> | null);
}

async function fetchStorefrontTenantProductsWithOptionalVariants(
  supabase: AdminClient,
  tenantId: string,
) {
  const withVariants = await supabase
    .from("products")
    .select(storefrontProductWithVariantsSelect)
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!withVariants.error) {
    return normalizeProductRows(withVariants.data as Array<Record<string, unknown>> | null);
  }

  const fallback = await supabase
    .from("products")
    .select(storefrontProductListColumns)
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (fallback.error) {
    return [];
  }

  return normalizeProductRows(fallback.data as Array<Record<string, unknown>> | null);
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
    }));
  }

  const [{ data: tenantRows }, { data: productRows }, { data: accessCodeRows }, { data: priceListRows }] =
    await Promise.all([
      supabase.from("tenants").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("tenant_id"),
      supabase.from("access_codes").select("*, price_list:price_lists(name, is_catalog_only)"),
      supabase.from("price_lists").select("*").order("sort_order", { ascending: true }),
    ]);

  const productCounts = groupCountByTenant(
    ((productRows as Array<{ tenant_id: string }> | null) ?? []).map((item) => ({
      tenant_id: item.tenant_id,
    })),
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

  return ((tenantRows as Tenant[] | null) ?? []).map((tenant) => ({
    ...tenant,
    access_codes: accessCodes.filter((code) => code.tenant_id === tenant.id),
    price_lists: (priceListsByTenant[tenant.id] ?? []).sort(sortPriceLists),
    product_count: productCounts[tenant.id] ?? 0,
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
  }));
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
  const [products, accessCodes] = await Promise.all([
    getTenantProducts(tenant.id),
    getTenantAccessCodes(tenant.id),
  ]);

  return {
    tenant,
    productCount: products.length,
    activeCodeCount: accessCodes.length,
  };
}

export async function getStorefrontTenant(
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
}

export async function getTenantByCustomDomain(
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
}

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

export async function getStorefrontProducts(params: {
  tenantId: string;
  priceListId: string;
  isCatalogOnly: boolean;
}): Promise<StorefrontProduct[]> {
  const supabaseAdmin = createSupabaseAdminClient();
  let products: Product[] = [];

  if (!supabaseAdmin) {
    if (!shouldAllowDemoFallback()) {
      return [];
    }

    products = demoProducts
      .filter((product) => product.tenant_id === params.tenantId)
      .map(({ description: _description, ...product }) => product);
  } else {
    products = await fetchStorefrontTenantProductsWithOptionalVariants(
      supabaseAdmin,
      params.tenantId,
    );
  }

  return products.map((product) =>
    toStorefrontProduct(product, params.priceListId, params.isCatalogOnly),
  );
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
