import { unstable_cache } from "next/cache";
import {
  demoAccessCodes,
  demoCategories,
  demoProducts,
  demoTenants,
} from "@/lib/demo-data";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeProductRecord } from "@/lib/products/records";
import { toStorefrontProduct } from "@/lib/storefront/pricing";
import type {
  AccessCode,
  Category,
  DashboardSummary,
  PriceTierLevel,
  Product,
  StorefrontProduct,
  StorefrontSection,
  StorefrontSectionWithProducts,
  Tenant,
  TenantStorefrontSettings,
  TenantWithRelations,
} from "@/lib/types";

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
): TenantStorefrontSettings {
  const now = new Date().toISOString();

  return {
    id: `storefront-default-${tenantId}`,
    tenant_id: tenantId,
    theme_key: "minimal",
    logo_url: null,
    storefront_title: null,
    storefront_description: null,
    hero_heading: null,
    hero_cta_label: null,
    banner_items: [],
    site_tab_title: null,
    site_favicon_url: null,
    created_at: now,
    updated_at: now,
  };
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
      product_count: productCounts[tenant.id] ?? 0,
    }));
  }

  const [{ data: tenantRows }, { data: productRows }, { data: accessCodeRows }] =
    await Promise.all([
      supabase.from("tenants").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("tenant_id"),
      supabase.from("access_codes").select("*"),
    ]);

  const productCounts = groupCountByTenant(
    ((productRows as Array<{ tenant_id: string }> | null) ?? []).map((item) => ({
      tenant_id: item.tenant_id,
    })),
  );

  const accessCodes = (accessCodeRows as AccessCode[] | null) ?? [];

  return ((tenantRows as Tenant[] | null) ?? []).map((tenant) => ({
    ...tenant,
    access_codes: accessCodes.filter((code) => code.tenant_id === tenant.id),
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

  const { data } = await supabase
    .from("products")
    .select("*, variants:product_variants(*)")
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  return ((data as Array<Record<string, unknown>> | null) ?? []).map((product) =>
    normalizeProductRecord(product),
  );
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

  return (data as Category[] | null) ?? [];
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

      return (
        (data as TenantStorefrontSettings | null) ??
        getDefaultTenantStorefrontSettings(resolvedTenantId)
      );
    },
    [tenantId],
    {
      tags: [`storefront_${tenantId}`],
    },
  );

  return readStorefrontSettings(tenantId);
}

export async function getTenantAccessCodes(
  tenantId: string,
): Promise<AccessCode[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return [];
    }

    return demoAccessCodes.filter((item) => item.tenant_id === tenantId);
  }

  const { data } = await supabase
    .from("access_codes")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return (data as AccessCode[] | null) ?? [];
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

export async function validateAccessCode(params: {
  subdomain: string;
  code: string;
}): Promise<{ tenant: Tenant; tierLevel: PriceTierLevel } | null> {
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
      (code) =>
        code.tenant_id === tenant.id && code.password_code === params.code.trim(),
    );

    return matched
      ? { tenant, tierLevel: matched.price_tier_level }
      : null;
  }

  const { data } = await supabaseAdmin
    .from("access_codes")
    .select("price_tier_level")
    .eq("tenant_id", tenant.id)
    .eq("password_code", params.code.trim())
    .maybeSingle();

  const matched = (data as { price_tier_level: PriceTierLevel } | null) ?? null;

  if (!matched) {
    return null;
  }

  return {
    tenant,
    tierLevel: matched.price_tier_level,
  };
}

export async function getStorefrontProducts(params: {
  tenantId: string;
  tierLevel: PriceTierLevel;
}): Promise<StorefrontProduct[]> {
  const supabaseAdmin = createSupabaseAdminClient();
  let products: Product[] = [];

  if (!supabaseAdmin) {
    if (!shouldAllowDemoFallback()) {
      return [];
    }

    products = demoProducts.filter((product) => product.tenant_id === params.tenantId);
  } else {
    const { data } = await supabaseAdmin
      .from("products")
      .select("*, variants:product_variants(*)")
      .eq("tenant_id", params.tenantId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    products = ((data as Array<Record<string, unknown>> | null) ?? []).map((product) =>
      normalizeProductRecord(product),
    );
  }

  return products.map((product) => toStorefrontProduct(product, params.tierLevel));
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

  const { data } = await supabase
    .from("storefront_section_products")
    .select("product_id, display_order, products(*, variants:product_variants(*))")
    .eq("section_id", sectionId)
    .order("display_order", { ascending: true });

  if (!data) {
    return [];
  }

  return data
    .map((row: { products: unknown }) => row.products)
    .filter((p): p is Record<string, unknown> => Boolean(p))
    .map((product) => normalizeProductRecord(product));
}

export async function getStorefrontSections(
  tenantId: string,
  tierLevel: PriceTierLevel,
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

  const { data: sectionProductRows } = await supabase
    .from("storefront_section_products")
    .select("section_id, display_order, products(*, variants:product_variants(*))")
    .in("section_id", sectionIds)
    .order("display_order", { ascending: true });

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
    const storefrontProduct = toStorefrontProduct(product, tierLevel);
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
