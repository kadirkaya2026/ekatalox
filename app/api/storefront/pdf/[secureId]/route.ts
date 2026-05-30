import { NextResponse } from "next/server";
import {
  getOrderReceiptBySecureId,
  isValidSecurePdfId,
} from "@/lib/storage/order-receipts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/storefront/pdf/[secureId]">,
) {
  const { secureId } = await ctx.params;

  if (!isValidSecurePdfId(secureId)) {
    return NextResponse.json({ error: "Geçersiz fiş bağlantısı." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  try {
    const record = await getOrderReceiptBySecureId(supabase, secureId);

    if (!record) {
      return NextResponse.json(
        { error: "Fiş bulunamadı veya süresi dolmuş." },
        { status: 404 },
      );
    }

    return NextResponse.redirect(record.pdf_public_url, 302);
  } catch (error) {
    console.error("[storefront/pdf] redirect hatası:", error);
    return NextResponse.json({ error: "Fiş açılamadı." }, { status: 500 });
  }
}
