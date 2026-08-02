import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getStorefrontTenant, getTenantByCustomDomain } from "@/lib/data";
import { appEnv } from "@/lib/env";
import { toPublicStorefrontPath } from "@/lib/storefront/paths";
import { getStorefrontTierCookieName } from "@/lib/storefront/tier-cookie";
import type { Tenant } from "@/lib/types";
import {
  getInternalPathFromResolution,
  resolveHost,
  type HostResolution,
} from "@/lib/tenancy/resolve-host";
import { isTenantCustomDomainHost } from "@/lib/tenancy/request-host";

/**
 * Resolve the effective hostname for a request.
 *
 * Vercel and other CDN/proxy layers sometimes forward the original domain in
 * `x-forwarded-host` while the `host` header contains an internal service
 * address. We prefer `x-forwarded-host` so that tenant routing is always
 * based on the public-facing domain.
 */
function effectiveHost(request: NextRequest): string | null {
  return (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host")
  );
}

function stripPort(value: string) {
  return value.replace(/:\d+$/, "").toLowerCase();
}

// Proxy her istekte (CDN cache'inden ÖNCE) çalıştığı için tenant sorgularını
// instance başına kısa süreli bellekte tutuyoruz; ısınmış bir instance'ta
// istek başına Supabase sorgusu sıfıra iner. TTL kısa tutuldu ki
// custom_domain / status değişiklikleri en geç bir dakikada yansısın.
const TENANT_LOOKUP_TTL_MS = 60_000;
const TENANT_LOOKUP_MAX_ENTRIES = 500;
const tenantLookupCache = new Map<
  string,
  { value: Tenant | null; expires: number }
>();

async function cachedTenantLookup(
  key: string,
  load: () => Promise<Tenant | null>,
): Promise<Tenant | null> {
  const hit = tenantLookupCache.get(key);
  if (hit && hit.expires > Date.now()) {
    return hit.value;
  }

  const value = await load();

  if (tenantLookupCache.size >= TENANT_LOOKUP_MAX_ENTRIES) {
    tenantLookupCache.clear();
  }
  tenantLookupCache.set(key, {
    value,
    expires: Date.now() + TENANT_LOOKUP_TTL_MS,
  });

  return value;
}

async function resolveRequestHost(hostHeader: string | null): Promise<HostResolution> {
  const hostResolution = resolveHost(hostHeader);
  const normalizedHost = stripPort(hostHeader ?? "");

  if (hostResolution.kind !== "unknown") {
    return hostResolution;
  }

  const isManagedProductionHost = normalizedHost.endsWith(`.${appEnv.rootDomain}`);
  const isManagedLocalHost = normalizedHost.endsWith(".localhost");

  if (isManagedProductionHost || isManagedLocalHost) {
    return hostResolution;
  }

  const tenant = await cachedTenantLookup(`custom-domain:${normalizedHost}`, () =>
    getTenantByCustomDomain(normalizedHost),
  );
  if (!tenant) {
    return hostResolution;
  }

  return {
    host: normalizedHost,
    kind: "storefront",
    subdomain: tenant.subdomain,
  };
}

function buildStorefrontRedirectUrl(params: {
  host: string;
  pathname: string;
  search: string;
  protocol?: string | null;
}) {
  const redirectUrl = new URL(params.pathname || "/", `${params.protocol ?? "https"}://${params.host}`);
  redirectUrl.search = params.search;
  return redirectUrl;
}

async function maybeRedirectStorefrontRequest(params: {
  request: NextRequest;
  hostResolution: HostResolution;
  normalizedHost: string;
  pathname: string;
}) {
  if (params.hostResolution.kind !== "storefront" || !params.hostResolution.subdomain) {
    return null;
  }

  const subdomain = params.hostResolution.subdomain;
  const tenant = await cachedTenantLookup(`subdomain:${subdomain}`, () =>
    getStorefrontTenant(subdomain),
  );

  if (!tenant?.custom_domain) {
    return null;
  }

  const publicPath = toPublicStorefrontPath(
    params.pathname,
    params.hostResolution.subdomain,
  );
  const isManagedSubdomainHost =
    params.normalizedHost.endsWith(`.${appEnv.rootDomain}`) ||
    params.normalizedHost.endsWith(".localhost");
  const isCustomDomainHost = isTenantCustomDomainHost(params.normalizedHost, tenant);
  const forwardedProto = params.request.headers.get("x-forwarded-proto");

  if (isManagedSubdomainHost) {
    return NextResponse.redirect(
      buildStorefrontRedirectUrl({
        host: tenant.custom_domain,
        pathname: publicPath,
        search: params.request.nextUrl.search,
        protocol: forwardedProto,
      }),
      301,
    );
  }

  if (isCustomDomainHost && publicPath !== params.pathname) {
    return NextResponse.redirect(
      buildStorefrontRedirectUrl({
        host: params.normalizedHost,
        pathname: publicPath,
        search: params.request.nextUrl.search,
        protocol: forwardedProto,
      }),
      301,
    );
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const host = effectiveHost(request);
  const hostResolution = await resolveRequestHost(host);
  const normalizedHost = stripPort(host ?? "");
  const isManagedProductionHost = normalizedHost.endsWith(`.${appEnv.rootDomain}`);
  const isManagedLocalHost = normalizedHost.endsWith(".localhost");

  if (hostResolution.kind === "unknown" && (isManagedProductionHost || isManagedLocalHost)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (hostResolution.kind === "unknown") {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (hostResolution.kind === "marketing") {
    return NextResponse.next();
  }

  const redirectResponse = await maybeRedirectStorefrontRequest({
    request,
    hostResolution,
    normalizedHost,
    pathname,
  });

  if (redirectResponse) {
    return redirectResponse;
  }

  // Oturum çerezi olmayan ziyaretçi her koşulda şifre ekranını görecek;
  // onu ISR ile CDN'de tutulan /gate sayfasına yönlendir ki istek
  // serverless fonksiyona hiç inmesin (cold start'ı devre dışı bırakır).
  // Çerezi olup da süresi/değeri geçersiz olanları dinamik sayfa yakalar.
  if (hostResolution.kind === "storefront" && hostResolution.subdomain) {
    // Aylık ziyaretçi kotası dolan tenant'lar, oturum çerezinden bağımsız
    // olarak yoğunluk sayfasına yönlendirilir. Bayrak zaten cachedTenantLookup
    // ile 60sn önbelleklenen tenant satırından okunur, ekstra sorgu eklemez.
    const tenant = await cachedTenantLookup(`subdomain:${hostResolution.subdomain}`, () =>
      getStorefrontTenant(hostResolution.subdomain as string),
    );

    if (tenant?.visitor_quota_exceeded) {
      const quotaUrl = request.nextUrl.clone();
      quotaUrl.pathname = `/store/${hostResolution.subdomain}/yogunluk`;
      quotaUrl.search = "";

      const quotaResponse = NextResponse.rewrite(quotaUrl);
      quotaResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
      return quotaResponse;
    }

    const hasTierCookie = request.cookies.has(
      getStorefrontTierCookieName(hostResolution.subdomain),
    );

    if (!hasTierCookie) {
      const gateUrl = request.nextUrl.clone();
      gateUrl.pathname = `/store/${hostResolution.subdomain}/gate`;
      gateUrl.search = "";

      const gateResponse = NextResponse.rewrite(gateUrl);
      gateResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
      return gateResponse;
    }
  }

  const rewrittenPath = getInternalPathFromResolution(hostResolution, pathname);
  const url = request.nextUrl.clone();
  url.pathname = rewrittenPath;

  const response = NextResponse.rewrite(url);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: "/:path*",
};
