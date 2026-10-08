import type { SupabaseClient } from "@supabase/supabase-js";

// DB'de tutulan deneme sınırı (0165 rate_limit_counters). Bellek içi
// lib/api/rate-limit.ts'in aksine tüm serverless instance'lar aynı sayacı görür.
// DB hatasında sınır UYGULANMAZ (fail-open): fren, müşteriyi kilitlememeli.

export async function isOverSharedLimit(
  supabase: SupabaseClient,
  key: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("rate_limit_peek", {
    p_key: key,
    p_window_seconds: windowSeconds,
  });
  if (error || typeof data !== "number") return false;
  return data >= max;
}

export async function hitSharedLimit(
  supabase: SupabaseClient,
  key: string,
  windowSeconds: number,
): Promise<void> {
  await supabase.rpc("rate_limit_hit", { p_key: key, p_window_seconds: windowSeconds });
}

// Vitrin şifre/magnet girişinde YANLIŞ denemeler sayılır: IP başına 15 dk'da 20,
// mağaza başına saatte 300. 4 haneli kodun 10.000 olasılığı tek IP'den ~5 gün,
// IP'ler değiştirilse bile mağaza sınırıyla ~33 saat sürer; mağaza sınırı ancak
// saatte 300 yanlış denemeyle dolar (normal müşteri trafiği buna yaklaşmaz).
const GATE_IP_MAX = 20;
const GATE_IP_WINDOW = 15 * 60;
const GATE_TENANT_MAX = 300;
const GATE_TENANT_WINDOW = 60 * 60;

function gateKeys(subdomain: string, ip: string | null) {
  return {
    ip: ip ? `gate:ip:${ip}` : null,
    tenant: `gate:t:${subdomain}`,
  };
}

export async function isGateLocked(
  supabase: SupabaseClient,
  subdomain: string,
  ip: string | null,
): Promise<boolean> {
  const keys = gateKeys(subdomain, ip);
  const [ipLocked, tenantLocked] = await Promise.all([
    keys.ip ? isOverSharedLimit(supabase, keys.ip, GATE_IP_MAX, GATE_IP_WINDOW) : false,
    isOverSharedLimit(supabase, keys.tenant, GATE_TENANT_MAX, GATE_TENANT_WINDOW),
  ]);
  return ipLocked || tenantLocked;
}

export async function recordGateFailure(
  supabase: SupabaseClient,
  subdomain: string,
  ip: string | null,
): Promise<void> {
  const keys = gateKeys(subdomain, ip);
  await Promise.all([
    keys.ip ? hitSharedLimit(supabase, keys.ip, GATE_IP_WINDOW) : null,
    hitSharedLimit(supabase, keys.tenant, GATE_TENANT_WINDOW),
  ]);
}
