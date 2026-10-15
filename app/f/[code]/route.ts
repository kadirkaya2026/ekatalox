import { NextResponse } from "next/server";
import { resolveShortLinkRecord } from "@/lib/storage/short-links";
import { getRequestHost } from "@/lib/tenancy/request-host";
import { isLinkPreviewBot, loadShareCardTenant, shareCardHtml } from "@/lib/storefront/share-card";

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
  const record = await resolveShortLinkRecord(code);
  const stored = record?.targetUrl ?? null;
  const userAgent = _request.headers.get("user-agent");
  const target = stored ? resolveMapTarget(stored, userAgent) : null;

  if (!target) {
    return new NextResponse("Bağlantı bulunamadı veya süresi dolmuş.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  // WhatsApp vb. önizleme botu: PDF'te önizleme etiketi olmadığı için kart boş
  // çıkıyordu. Bota mağazanın adı/logosuyla etiketli küçük sayfa verilir; insanlar
  // eskisi gibi doğrudan PDF'e gider.
  if (record && !stored!.startsWith("geo:") && isLinkPreviewBot(userAgent)) {
    const tenant = await loadShareCardTenant(record.tenantId);
    if (tenant) {
      const origin = `https://${getRequestHost(_request)}`;
      return new NextResponse(
        shareCardHtml({
          title: `${tenant.name} · Sipariş Fişi`,
          description: "Siparişinizin fişini görüntülemek için dokunun.",
          imageUrl: `${origin}/f/${code}/kart`,
          pageUrl: `${origin}/f/${code}`,
          targetUrl: target,
          siteName: tenant.name,
        }),
        { status: 200, headers: { "content-type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" } },
      );
    }
  }

  return NextResponse.redirect(target, {
    status: 307,
    headers: { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" },
  });
}
