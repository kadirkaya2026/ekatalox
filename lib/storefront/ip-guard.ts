import type { SupabaseClient } from "@supabase/supabase-js";

// Sipariş ucunda IP taşkın freni (bkz. 0090_storefront_ip_guard.sql).
//
// Neden DB tabanlı: Vercel'de her istek farklı instance'a düşebilir; bellek
// içi sayaç instance başına sıfırlanır ve limit fiilen çalışmaz.
//
// Kural: aynı tenant+IP son 10 dakikada 5 denemeyi aşarsa 1 saatlik otomatik
// engel. Mobil IP'ler paylaşımlı olduğu için eşik "gerçek müşterinin asla
// yapmayacağı" seviyede tutuldu — kimse 10 dakikada 6 sipariş vermez.

const WINDOW_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;
const AUTO_BLOCK_MS = 60 * 60_000;

export interface IpGuardResult {
  blocked: boolean;
  permanent: boolean;
  blockedUntil: string | null;
}

const SERBEST: IpGuardResult = { blocked: false, permanent: false, blockedUntil: null };

export async function checkOrderIpGuard(
  supabase: SupabaseClient,
  tenantId: string,
  ip: string | null,
): Promise<IpGuardResult> {
  // IP okunamadıysa koruma atlanır — sipariş akışı hiçbir koşulda IP yüzünden
  // topal kalmamalı.
  if (!ip) return SERBEST;

  try {
    const { data: blok } = await supabase
      .from("storefront_ip_blocks")
      .select("id, blocked_until")
      .eq("tenant_id", tenantId)
      .eq("ip", ip)
      .maybeSingle();

    if (blok) {
      if (blok.blocked_until === null) {
        return { blocked: true, permanent: true, blockedUntil: null };
      }
      if (new Date(blok.blocked_until).getTime() > Date.now()) {
        return { blocked: true, permanent: false, blockedUntil: blok.blocked_until };
      }
      // Süresi dolmuş: kaydı tembelce temizle, isteğe izin ver. Bayi panelinde
      // "dolmuş" satır birikmesin diye burada siliniyor, cron gerekmez.
      await supabase.from("storefront_ip_blocks").delete().eq("id", blok.id);
    }

    // Denemeyi say. Engelliyken saymıyoruz (yukarıda dönüldü): engel süresi
    // boyunca basılan tuşlar, süre dolduğunda taze pencereyle değerlendirilsin.
    await supabase
      .from("storefront_order_ip_events")
      .insert({ tenant_id: tenantId, ip });

    const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
    const { count } = await supabase
      .from("storefront_order_ip_events")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("ip", ip)
      .gte("created_at", windowStart);

    if ((count ?? 0) > MAX_ATTEMPTS) {
      const until = new Date(Date.now() + AUTO_BLOCK_MS).toISOString();
      // unique(tenant_id, ip) — eşzamanlı iki tetikte upsert tek satır bırakır.
      await supabase
        .from("storefront_ip_blocks")
        .upsert(
          { tenant_id: tenantId, ip, reason: "auto", blocked_until: until },
          { onConflict: "tenant_id,ip" },
        );

      // Fırsatçı temizlik: bu IP'nin eski olayları artık işe yaramaz.
      await supabase
        .from("storefront_order_ip_events")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("ip", ip)
        .lt("created_at", windowStart);

      return { blocked: true, permanent: false, blockedUntil: until };
    }

    return SERBEST;
  } catch {
    // Koruma katmanı patlarsa sipariş akışını düşürme.
    return SERBEST;
  }
}

/** 429 gövdesindeki müşteri mesajı — istemci bunu ekranda aynen gösterir. */
export function ipBlockedMessage(result: IpGuardResult): string {
  return result.permanent
    ? "IP adresinizden kötü niyetli kullanım tespit edildiği için sipariş alımı engellenmiştir. Yanlış olduğunu düşünüyorsanız mağaza ile WhatsApp üzerinden iletişime geçebilirsiniz."
    : "IP adresinizden kötü niyetli kullanım tespit edildiği için sipariş alımı 1 saatliğine engellenmiştir. Yanlış olduğunu düşünüyorsanız mağaza ile WhatsApp üzerinden iletişime geçebilirsiniz.";
}
