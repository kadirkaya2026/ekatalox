import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Sipariş mesajındaki linkler telefonda satır satır taşıyordu (sipariş fişi
// linki ~88 karakter). Kısa kod bayinin KENDİ alan adında servis ediliyor:
// https://<bayi-alan-adi>/f/<kod> — müşteri ekatalox.com değil, alışveriş
// yaptığı dükkânın adresini görüyor (kullanıcı isteği, 5 Eyl 2026).
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // karışan harf/rakam yok
const CODE_LENGTH = 7;
const MAX_ATTEMPTS = 5;

function randomCode() {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return out;
}

/**
 * Kısa kod üretip kaydeder ve tam kısa adresi döner.
 * Başarısız olursa null döner — çağıran taraf uzun linke düşmeli, sipariş
 * akışı kısa link yüzünden ASLA kırılmamalı.
 */
export async function createShortLink(params: {
  tenantId: string;
  targetUrl: string;
  origin: string;
  kind?: string;
}): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const code = randomCode();
    const { error } = await supabase.from("short_links").insert({
      code,
      tenant_id: params.tenantId,
      target_url: params.targetUrl,
      kind: params.kind ?? "order_pdf",
    });

    if (!error) return `${params.origin.replace(/\/$/, "")}/f/${code}`;
    // 23505 = unique violation → kod çakıştı, yeniden dene. Diğer hatalarda
    // ısrar etmenin anlamı yok.
    if (error.code !== "23505") return null;
  }

  return null;
}

export async function resolveShortLink(code: string): Promise<string | null> {
  if (!/^[a-z2-9]{4,16}$/.test(code)) return null;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("short_links")
    .select("target_url")
    .eq("code", code)
    .maybeSingle();

  if (error || !data?.target_url) return null;
  return data.target_url;
}
