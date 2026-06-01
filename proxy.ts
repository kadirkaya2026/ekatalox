import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getStorefrontTenant, getTenantByCustomDomain } from "@/lib/data";
import { appEnv } from "@/lib/env";
import { toPublicStorefrontPath } from "@/lib/storefront/paths";
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

  const tenant = await getTenantByCustomDomain(normalizedHost);
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

  const tenant = await getStorefrontTenant(params.hostResolution.subdomain);

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
