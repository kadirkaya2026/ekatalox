import { appEnv } from "@/lib/env";
import { isReservedSubdomain } from "@/lib/tenancy/reserved-subdomains";

export type HostKind = "marketing" | "admin" | "app" | "storefront" | "unknown";

export interface HostResolution {
  host: string;
  kind: HostKind;
  subdomain: string | null;
}

function stripPort(value: string) {
  return value.replace(/:\d+$/, "").toLowerCase();
}

function localhostSubdomain(host: string) {
  if (!host.endsWith(".localhost")) {
    return null;
  }

  const parts = host.split(".");
  return parts.length > 1 ? parts[0] : null;
}

export function resolveHost(hostHeader: string | null): HostResolution {
  const host = stripPort(hostHeader ?? appEnv.marketingDomain);
  const rootDomain = stripPort(appEnv.rootDomain);
  const adminDomain = stripPort(appEnv.adminDomain);
  const appDomain = stripPort(appEnv.appDomain);
  const marketingDomain = stripPort(appEnv.marketingDomain);

  if (host === adminDomain || host === "admin.localhost") {
    return { host, kind: "admin", subdomain: null };
  }

  if (host === appDomain || host === "app.localhost") {
    return { host, kind: "app", subdomain: null };
  }

  if (host === marketingDomain || host === rootDomain || host === "localhost") {
    return { host, kind: "marketing", subdomain: null };
  }

  const localSubdomain = localhostSubdomain(host);
  if (localSubdomain === "www") {
    return { host, kind: "marketing", subdomain: null };
  }

  if (localSubdomain && !["admin", "app"].includes(localSubdomain)) {
    if (isReservedSubdomain(localSubdomain)) {
      return { host, kind: "unknown", subdomain: null };
    }

    return { host, kind: "storefront", subdomain: localSubdomain };
  }

  const suffix = `.${rootDomain}`;
  if (host.endsWith(suffix)) {
    const subdomain = host.slice(0, -suffix.length);

    if (subdomain === "www") {
      return { host, kind: "marketing", subdomain: null };
    }

    if (subdomain && !["admin", "app"].includes(subdomain)) {
      if (isReservedSubdomain(subdomain)) {
        return { host, kind: "unknown", subdomain: null };
      }

      return { host, kind: "storefront", subdomain };
    }
  }

  return { host, kind: "unknown", subdomain: null };
}

export function getInternalPathFromResolution(
  resolution: HostResolution,
  pathname: string,
) {
  if (pathname === "/login") {
    return pathname;
  }

  if (resolution.kind === "admin") {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return pathname;
    }

    return pathname === "/" ? "/admin" : `/admin${pathname}`;
  }

  if (resolution.kind === "app") {
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
      return pathname;
    }

    return pathname === "/" ? "/dashboard" : `/dashboard${pathname}`;
  }

  if (resolution.kind === "storefront" && resolution.subdomain) {
    const internalBase = `/store/${resolution.subdomain}`;

    if (pathname === internalBase || pathname.startsWith(`${internalBase}/`)) {
      return pathname;
    }

    return pathname === "/" ? internalBase : `${internalBase}${pathname}`;
  }

  return pathname;
}

export function getInternalPathFromHost(hostHeader: string | null, pathname: string) {
  const resolution = resolveHost(hostHeader);
  return getInternalPathFromResolution(resolution, pathname);
}