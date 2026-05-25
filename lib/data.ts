import {
  demoAccessCodes,
  demoProducts,
  demoTenants,
} from "@/lib/demo-data";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { toStorefrontProduct } from "@/lib/storefront/pricing";
import type {
  AccessCode,
  DashboardSummary,
  PriceTierLevel,
  Product,
  StorefrontProduct,
  Tenant,
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
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return (data as Product[] | null) ?? [];
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
      .select("*")
      .eq("tenant_id", params.tenantId)
      .order("created_at", { ascending: false });

    products = (data as Product[] | null) ?? [];
  }

  return products.map((product) => toStorefrontProduct(product, params.tierLevel));
}
