import { NextResponse } from "next/server";
import { getTenantOrderWithEvents } from "@/lib/orders/data";
import { buildStoredOrderReceiptPdf } from "@/lib/orders/receipt-pdf";
import { resolveStorefrontAccount } from "@/lib/storefront/account";

// Hesabım > Siparişlerim: fişi her istekte siparişin güncel hâlinden üretir
// (panel "Fişi indir" ile aynı). Yalnız siparişi veren kişiye özel şifre görür.
export const maxDuration = 60;

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const account = await resolveStorefrontAccount(new URL(request.url).searchParams.get("subdomain"));
  if (!account) return NextResponse.json({ error: "Giriş gerekli." }, { status: 403 });
  const { id } = await ctx.params;
  const current = await getTenantOrderWithEvents(account.tenant.id, id);
  const order = current?.order as (NonNullable<typeof current>["order"] & { access_code_id?: string | null }) | undefined;
  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });

  const { data: owner } = await account.supabase
    .from("orders")
    .select("access_code_id")
    .eq("tenant_id", account.tenant.id)
    .eq("id", id)
    .maybeSingle();
  if (owner?.access_code_id !== account.profile.accessCodeId) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  const pdfBytes = await buildStoredOrderReceiptPdf(account.tenant, order);
  const fileName = `siparis-${order.order_no ?? order.order_number}.pdf`;
  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
