import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getTenantByCustomDomain } from "@/lib/data";
import { appEnv } from "@/lib/env";
import {
  getInternalPathFromResolution,
  resolveHost,
  type HostResolution,
} from "@/lib/tenancy/resolve-host";

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
