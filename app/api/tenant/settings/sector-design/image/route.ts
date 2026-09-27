import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { STOREFRONT_BANNERS_BUCKET } from "@/lib/storage/banners";
import { hasSectorDesign } from "@/lib/storefront/sector-design/config";
export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true }); if (guard) return guard;
  const { tenant } = await getSessionContext();
  if (!hasSectorDesign(tenant!.sector)) return NextResponse.json({ error: "Bu sektöre ait tema yükleme yetkiniz yok." }, { status: 403 });
  const form = await request.formData().catch(() => null); const file = form?.get("image");
  if (!(file instanceof File) || file.size < 12 || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "En fazla 5 MB görsel yükleyin." }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const png = bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!png && !jpg && !webp) return NextResponse.json({ error: "PNG, JPEG veya WebP görsel yükleyin." }, { status: 400 });
  const db = createSupabaseAdminClient(); if (!db) return NextResponse.json({ error: "Dosya depolama bağlantısı kurulamadı." }, { status: 503 });
  const path = `${tenant!.id}/sector-design/${crypto.randomUUID()}.${png ? "png" : jpg ? "jpg" : "webp"}`;
  const { error } = await db.storage.from(STOREFRONT_BANNERS_BUCKET).upload(path, bytes, { contentType: png ? "image/png" : jpg ? "image/jpeg" : "image/webp", upsert: false });
  if (error) return NextResponse.json({ error: "Görsel yüklenemedi. Tekrar deneyin." }, { status: 500 });
  return NextResponse.json({ url: db.storage.from(STOREFRONT_BANNERS_BUCKET).getPublicUrl(path).data.publicUrl });
}
