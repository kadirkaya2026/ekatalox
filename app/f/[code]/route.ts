import { NextResponse } from "next/server";
import { resolveShortLink } from "@/lib/storage/short-links";

// Kısa link çözücü: /f/<kod> → hedefe 307. Bayinin kendi alan adında
// çalışır (bkz. lib/storage/short-links.ts).
export const dynamic = "force-dynamic";

// Konum linkleri veritabanında "geo:<lat>,<lng>" olarak saklanıyor. Hangi
// harita uygulamasında açılacağını burada cihaza bakarak seçiyoruz:
// iPhone/iPad'de Apple Haritalar (evrensel bağlantı ile uygulama açılır),
// diğerlerinde Google Haritalar. Böylece bayi linke bastığında tarayıcıda
// bir harita sayfası değil, telefonundaki harita uygulaması açılıyor.
// geo: dışındaki hedefler (sipariş fişi PDF'i) olduğu gibi geçer.
function resolveMapTarget(stored: string, userAgent: string | null): string {
  if (!stored.startsWith("geo:")) return stored;

  const [lat, lng] = stored.slice(4).split(",");
  if (!lat || !lng) return stored;

  const isApple = /iPhone|iPad|iPod|Macintosh/i.test(userAgent ?? "");

  // Apple'da ll pin'in yerini, q ise pin'in etiketini belirler.
  return isApple
    ? `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent("Sipariş konumu")}`
    : `https://maps.google.com/?q=${lat},${lng}`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const stored = await resolveShortLink(code);
  const target = stored ? resolveMapTarget(stored, _request.headers.get("user-agent")) : null;

  if (!target) {
    return new NextResponse("Bağlantı bulunamadı veya süresi dolmuş.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.redirect(target, {
    status: 307,
    headers: { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" },
  });
}
