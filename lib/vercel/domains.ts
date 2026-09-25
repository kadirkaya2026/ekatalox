// Vercel projesine tenant alt alan adı ekleme (8 Eyl 2026).
// Projede joker alan adı yok (DNS Cloudflare'de); her mağazanın adresi
// Vercel'e tek tek eklenmezse Cloudflare 525 verir. Kayıtta ve süper admin
// mağaza açılışında çağrılır. Env yoksa sessizce atlar (yerel/önizleme).
//
// Gerekli env: VERCEL_API_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID.
import { appEnv } from "@/lib/env";

export function isVercelDomainApiConfigured() {
  return Boolean(process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID);
}

export async function registerTenantSubdomain(subdomain: string): Promise<{ ok: boolean; reason?: string }> {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !projectId) return { ok: false, reason: "env yok" };

  const name = `${subdomain}.${appEnv.rootDomain}`;
  const url = `https://api.vercel.com/v10/projects/${projectId}/domains${teamId ? `?teamId=${teamId}` : ""}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
      cache: "no-store",
    });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } };
    // Zaten ekliyse sorun değil.
    if (body.error?.code === "domain_already_in_use" || res.status === 409) return { ok: true };
    console.error("[vercel-domains] eklenemedi:", name, res.status, body.error?.message);
    return { ok: false, reason: body.error?.message ?? `HTTP ${res.status}` };
  } catch (error) {
    console.error("[vercel-domains] istek hatası:", name, error);
    return { ok: false, reason: "istek hatası" };
  }
}

/* ───────────── Kurumsal site alan adları (0134) ───────────── */
// Tenant panelinden bağlanan kök alan adı (ör. lucatech.com.tr) ve www'su
// projeye eklenir; www → kök 301. Uç noktalar (Vercel REST API):
//   POST   /v10/projects/{id}/domains               ekle
//   GET    /v9/projects/{id}/domains/{domain}       proje alan adı (verified, verification)
//   POST   /v9/projects/{id}/domains/{domain}/verify  TXT doğrulamasını tetikle
//   DELETE /v9/projects/{id}/domains/{domain}       kaldır
//   GET    /v6/domains/{domain}/config              DNS yapılandırması (misconfigured, önerilen A/CNAME)

/** Vercel'in standart değerleri; API önerisi alınamazsa gösterilir. */
export const VERCEL_FALLBACK_DNS = {
  apexA: "76.76.21.21",
  wwwCname: "cname.vercel-dns.com",
} as const;

export interface VercelDnsRecord {
  type: "A" | "CNAME" | "TXT";
  /** DNS panelindeki "ad/host" alanı (@, www, _vercel ...) */
  name: string;
  value: string;
}

export interface VercelDomainHostStatus {
  domain: string;
  /** Projede kayıtlı mı */
  added: boolean;
  /** Proje için sahiplik doğrulandı mı (TXT gerekebilir) */
  verified: boolean;
  /** DNS Vercel'i gösteriyor ve sertifika üretilebiliyor mu */
  dnsOk: boolean;
  /** Eksik/yanlış kayıtlar — panelde "şu kaydı ekleyin" diye gösterilir */
  missing: VercelDnsRecord[];
  error?: string;
}

export interface KurumsalDomainStatus {
  configured: boolean;
  connected: boolean;
  apex: VercelDomainHostStatus | null;
  www: VercelDomainHostStatus | null;
  /** Tenant'ın girmesi gereken tüm kayıtlar */
  records: VercelDnsRecord[];
}

type VercelError = { error?: { code?: string; message?: string } };

function vercelUrl(path: string, extra?: Record<string, string>) {
  const teamId = process.env.VERCEL_TEAM_ID;
  const params = new URLSearchParams({ ...(teamId ? { teamId } : {}), ...(extra ?? {}) });
  const query = params.toString();
  return `https://api.vercel.com${path}${query ? `?${query}` : ""}`;
}

async function vercelRequest<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  options?: { body?: unknown; query?: Record<string, string> },
): Promise<{ ok: boolean; status: number; data: (T & VercelError) | null }> {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return { ok: false, status: 0, data: null };
  try {
    const res = await fetch(vercelUrl(path, options?.query), {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: options?.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as (T & VercelError) | null;
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    console.error("[vercel-domains] istek hatası:", method, path, error);
    return { ok: false, status: 0, data: null };
  }
}

type ProjectDomain = {
  name: string;
  verified: boolean;
  verification?: Array<{ type: string; domain: string; value: string; reason: string }>;
};

type DomainConfig = {
  misconfigured: boolean;
  configuredBy: string | null;
  recommendedIPv4?: Array<{ rank: number; value: string[] }>;
  recommendedCNAME?: Array<{ rank: number; value: string }>;
};

function projectPath(suffix = "") {
  return `/v9/projects/${encodeURIComponent(process.env.VERCEL_PROJECT_ID ?? "")}/domains${suffix}`;
}

async function addProjectDomain(name: string, redirect?: string) {
  const projectId = process.env.VERCEL_PROJECT_ID ?? "";
  const result = await vercelRequest<ProjectDomain>("POST", `/v10/projects/${encodeURIComponent(projectId)}/domains`, {
    body: redirect ? { name, redirect, redirectStatusCode: 301 } : { name },
  });
  if (result.ok) return { ok: true as const };
  // Zaten bu projede kayıtlıysa sorun değil (Vercel 400/409 döner).
  const existing = await vercelRequest<ProjectDomain>("GET", projectPath(`/${encodeURIComponent(name)}`));
  if (existing.ok) return { ok: true as const };
  const reason = result.data?.error?.message ?? `HTTP ${result.status}`;
  console.error("[vercel-domains] kurumsal alan adı eklenemedi:", name, reason);
  return { ok: false as const, reason };
}

async function removeProjectDomain(name: string) {
  const result = await vercelRequest("DELETE", projectPath(`/${encodeURIComponent(name)}`));
  if (!result.ok && result.status !== 404) {
    console.error("[vercel-domains] kaldırılamadı:", name, result.data?.error?.message ?? result.status);
  }
}

/** Kök + www'yu projeye ekler (www → kök 301). Env yoksa { configured: false }. */
export async function connectKurumsalDomain(apex: string): Promise<{ configured: boolean; ok: boolean; reason?: string }> {
  if (!isVercelDomainApiConfigured()) {
    console.warn("[vercel-domains] VERCEL_API_TOKEN/VERCEL_PROJECT_ID yok; kurumsal alan adı elle bağlanmalı:", apex);
    return { configured: false, ok: false };
  }
  const apexResult = await addProjectDomain(apex);
  const wwwResult = await addProjectDomain(`www.${apex}`, apex);
  const reason = !apexResult.ok ? apexResult.reason : !wwwResult.ok ? wwwResult.reason : undefined;
  return { configured: true, ok: apexResult.ok && wwwResult.ok, reason };
}

/** Kök + www'yu projeden kaldırır (alan adı değiştirildi/silindi). */
export async function disconnectKurumsalDomain(apex: string) {
  if (!isVercelDomainApiConfigured()) return;
  await removeProjectDomain(`www.${apex}`);
  await removeProjectDomain(apex);
}

async function hostStatus(domain: string, kind: "apex" | "www"): Promise<VercelDomainHostStatus> {
  const path = projectPath(`/${encodeURIComponent(domain)}`);
  let project = await vercelRequest<ProjectDomain>("GET", path);
  if (!project.ok) {
    return {
      domain,
      added: false,
      verified: false,
      dnsOk: false,
      missing: [],
      error: project.status === 404 ? "Alan adı projede kayıtlı değil." : (project.data?.error?.message ?? "Vercel'e ulaşılamadı."),
    };
  }
  // Sahiplik doğrulanmadıysa (TXT eklenmiş olabilir) doğrulamayı tetikle.
  if (!project.data?.verified) {
    const verify = await vercelRequest<ProjectDomain>("POST", `${path}/verify`);
    if (verify.ok && verify.data) project = verify;
  }
  const config = await vercelRequest<DomainConfig>("GET", `/v6/domains/${encodeURIComponent(domain)}/config`, {
    query: { projectIdOrName: process.env.VERCEL_PROJECT_ID ?? "" },
  });

  const verified = Boolean(project.data?.verified);
  const misconfigured = config.ok ? Boolean(config.data?.misconfigured) : true;
  const missing: VercelDnsRecord[] = [];

  if (misconfigured) {
    if (kind === "apex") {
      const ip =
        config.data?.recommendedIPv4?.find((item) => item.rank === 1)?.value?.[0] ?? VERCEL_FALLBACK_DNS.apexA;
      missing.push({ type: "A", name: "@", value: ip });
    } else {
      const cname =
        config.data?.recommendedCNAME?.find((item) => item.rank === 1)?.value?.replace(/\.$/, "") ??
        VERCEL_FALLBACK_DNS.wwwCname;
      missing.push({ type: "CNAME", name: "www", value: cname });
    }
  }
  if (!verified) {
    for (const challenge of project.data?.verification ?? []) {
      if (challenge.type === "TXT") missing.push({ type: "TXT", name: challenge.domain, value: challenge.value });
    }
  }

  return { domain, added: true, verified, dnsOk: !misconfigured, missing };
}

/** Panel "Kontrol et": kök ve www için Vercel doğrulama + DNS durumu. */
export async function getKurumsalDomainStatus(apex: string): Promise<KurumsalDomainStatus> {
  const fallbackRecords: VercelDnsRecord[] = [
    { type: "A", name: "@", value: VERCEL_FALLBACK_DNS.apexA },
    { type: "CNAME", name: "www", value: VERCEL_FALLBACK_DNS.wwwCname },
  ];
  if (!isVercelDomainApiConfigured()) {
    return { configured: false, connected: false, apex: null, www: null, records: fallbackRecords };
  }
  const [apexStatus, wwwStatus] = await Promise.all([hostStatus(apex, "apex"), hostStatus(`www.${apex}`, "www")]);
  const records = [...apexStatus.missing, ...wwwStatus.missing];
  const connected =
    apexStatus.added && apexStatus.verified && apexStatus.dnsOk && wwwStatus.added && wwwStatus.verified && wwwStatus.dnsOk;
  return {
    configured: true,
    connected,
    apex: apexStatus,
    www: wwwStatus,
    records: records.length ? records : connected ? [] : fallbackRecords,
  };
}

/* ───────────── Alan adı arama (registrar) ───────────── */
// "Yeni alan adı seç": müsaitlik + fiyat tek çağrıda.
//   POST /v1/registrar/domains/search  { domains: [...] } → results[{domain, available, years?, price?, premium?}]
//   GET  /v1/registrar/tlds/supported                    → ["com", "net", ...]
// (Eski /v4/domains/status ve /v4/domains/price uçları artık spec'te yok.)
// Satın alma bilerek YOK: ekip Vercel panelinden alır, sonra bağlar.

export type RegistrarSearchRow = {
  domain: string;
  available: boolean;
  years?: number;
  price?: number;
  renewalPrice?: number;
  premium?: boolean;
};

export type RegistrarSearchOutcome =
  | { ok: true; rows: RegistrarSearchRow[] }
  | { ok: false; configured: boolean; message: string };

const SUPPORTED_TLDS_TTL_MS = 60 * 60_000;
let supportedTldsCache: { value: Set<string> | null; expires: number } | null = null;

/** Vercel'in satabildiği uzantılar (1 saat bellekte). Alınamazsa null. */
export async function getRegistrarSupportedTlds(): Promise<Set<string> | null> {
  if (!isVercelDomainApiConfigured()) return null;
  if (supportedTldsCache && supportedTldsCache.expires > Date.now()) return supportedTldsCache.value;
  const result = await vercelRequest<string[]>("GET", "/v1/registrar/tlds/supported");
  const value =
    result.ok && Array.isArray(result.data)
      ? new Set(result.data.map((tld) => String(tld).toLowerCase().replace(/^\./, "")))
      : null;
  supportedTldsCache = { value, expires: Date.now() + (value ? SUPPORTED_TLDS_TTL_MS : 60_000) };
  return value;
}

function friendlyRegistrarError(status: number, code?: string, message?: string): string {
  if (status === 401 || status === 403) return "Alan adı servisine erişim yetkisi yok; eKatalox ekibine bildirin.";
  if (status === 429) return "Alan adı servisi yoğun; biraz sonra tekrar deneyin.";
  if (status === 400) return "Alan adı servisi bu adı kabul etmedi; farklı bir ad deneyin.";
  if (status === 0) return "Alan adı servisine ulaşılamadı; biraz sonra tekrar deneyin.";
  return message ? `Alan adı servisi hata verdi (${code ?? status}).` : "Alan adı servisi yanıt vermedi.";
}

/** Müsaitlik + fiyat. Env yoksa configured:false ile döner (panel "kontrol edilemiyor" gösterir). */
export async function searchRegistrarDomains(domains: string[]): Promise<RegistrarSearchOutcome> {
  if (!isVercelDomainApiConfigured()) {
    return { ok: false, configured: false, message: "Alan adı arama servisi bu ortamda yapılandırılmamış." };
  }
  const result = await vercelRequest<{ results?: RegistrarSearchRow[] }>("POST", "/v1/registrar/domains/search", {
    body: { domains },
  });
  if (!result.ok || !Array.isArray(result.data?.results)) {
    console.error("[vercel-domains] registrar search hatası:", result.status, result.data?.error?.message);
    return {
      ok: false,
      configured: true,
      message: friendlyRegistrarError(result.status, result.data?.error?.code, result.data?.error?.message),
    };
  }
  return { ok: true, rows: result.data.results };
}
