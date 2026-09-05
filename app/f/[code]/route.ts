import { NextResponse } from "next/server";
import { resolveShortLink } from "@/lib/storage/short-links";

// Kısa link çözücü: /f/<kod> → hedefe 307. Bayinin kendi alan adında
// çalışır (bkz. lib/storage/short-links.ts).
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const target = await resolveShortLink(code);

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
