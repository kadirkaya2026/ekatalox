// Meta (Facebook/Instagram) Pixel yardımcıları — yalnız pazarlama sitesi.
// Pixel ID Vercel env'inden gelir (NEXT_PUBLIC_META_PIXEL_ID); boşsa hiçbir
// şey yüklenmez ve trackMetaEvent sessizce hiçbir şey yapmaz.

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";

type Fbq = (command: "track" | "trackCustom", event: string, params?: Record<string, unknown>) => void;

// Standart olaylar: CompleteRegistration (kayıt tamamlandı), Contact
// (WhatsApp/telefon tıklaması), ViewContent (demo açıldı). Reklam optimizasyonu
// CompleteRegistration üzerinden yapılır.
export function trackMetaEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !META_PIXEL_ID) return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (typeof fbq !== "function") return;
  try {
    fbq("track", event, params);
  } catch {
    // reklam engelleyici vb. — izleme hatası sayfayı bozmamalı
  }
}
