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
