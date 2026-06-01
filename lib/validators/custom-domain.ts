import { z } from "zod";
import { appEnv } from "@/lib/env";
import { isReservedSubdomain } from "@/lib/tenancy/reserved-subdomains";

const HOSTNAME_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function stripPort(value: string) {
  return value.replace(/:\d+$/, "").toLowerCase();
}

export function normalizeCustomDomain(value: string) {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    return null;
  }

  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  const withoutPath = withoutProtocol.split("/")[0] ?? "";
  const withoutWww = withoutPath.startsWith("www.") ? withoutPath.slice(4) : withoutPath;

  return stripPort(withoutWww);
}

function isManagedPlatformHost(host: string) {
  const normalizedHost = stripPort(host);
  const rootDomain = stripPort(appEnv.rootDomain);
  const adminDomain = stripPort(appEnv.adminDomain);
  const appDomain = stripPort(appEnv.appDomain);
  const marketingDomain = stripPort(appEnv.marketingDomain);

  if (
    normalizedHost === rootDomain ||
    normalizedHost === adminDomain ||
    normalizedHost === appDomain ||
    normalizedHost === marketingDomain ||
    normalizedHost === "localhost"
  ) {
    return true;
  }

  if (normalizedHost.endsWith(`.${rootDomain}`)) {
    return true;
  }

  if (normalizedHost.endsWith(".localhost")) {
    return true;
  }

  return false;
}

export function validateCustomDomainValue(value: string | null | undefined) {
  const normalized = normalizeCustomDomain(value ?? "");

  if (!normalized) {
    return { ok: true as const, value: null };
  }

  if (!HOSTNAME_PATTERN.test(normalized)) {
    return {
      ok: false as const,
      error: "Geçerli bir alan adı girin. Örn: katalog.firmaniz.com",
    };
  }

  if (isManagedPlatformHost(normalized)) {
    return {
      ok: false as const,
      error: "Platform alan adları özel alan adı olarak kullanılamaz.",
    };
  }

  const firstLabel = normalized.split(".")[0] ?? "";
  if (isReservedSubdomain(firstLabel)) {
    return {
      ok: false as const,
      error: "Bu alan adı sistem tarafından rezerve edilmiştir.",
    };
  }

  return { ok: true as const, value: normalized };
}

export const customDomainUpdateSchema = z.object({
  custom_domain: z
    .union([z.string(), z.null()])
    .transform((value) => (typeof value === "string" ? normalizeCustomDomain(value) : null))
    .superRefine((value, ctx) => {
      if (value === null) {
        return;
      }

      const result = validateCustomDomainValue(value);
      if (!result.ok) {
        ctx.addIssue({
          code: "custom",
          message: result.error,
        });
      }
    }),
});
