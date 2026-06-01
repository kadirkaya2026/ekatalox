import { appEnv } from "@/lib/env";
import type { Tenant } from "@/lib/types";

function stripPort(value: string) {
  return value.replace(/:\d+$/, "").toLowerCase();
}

export function getRequestHostFromHeaders(
  headers: Headers | { get(name: string): string | null },
) {
  return stripPort(
    headers.get("x-forwarded-host") ?? headers.get("host") ?? appEnv.rootDomain,
  );
}

export function getRequestHost(request: Request) {
  return getRequestHostFromHeaders(request.headers);
}

export function getPublicOrigin(request: Request) {
  const host = getRequestHost(request);
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedProto) {
    return `${forwardedProto}://${host}`;
  }

  try {
    return new URL(request.url).origin;
  } catch {
    return `https://${host}`;
  }
}

export function isTenantCustomDomainHost(host: string, tenant: Pick<Tenant, "custom_domain">) {
  const normalizedHost = stripPort(host);
  const customDomain = tenant.custom_domain?.trim().toLowerCase();

  if (!customDomain) {
    return false;
  }

  return normalizedHost === customDomain;
}
