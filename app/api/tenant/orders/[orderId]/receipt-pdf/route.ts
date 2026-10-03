import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { getTenantOrderWithEvents } from "@/lib/orders/data";
import { buildStoredOrderReceiptPdf } from "@/lib/orders/receipt-pdf";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

// Panelden sipariş fişini indir (3 Eki 2026): her istekte siparişin O ANKİ
// kalemleri ve müşteri bilgileriyle (düzenlendiyse güncel hâliyle) sıfırdan
// üretilir ve doğrudan indirilir. Depoya yazılmaz, kayıt tutulmaz; silinecek
// bir şey kalmaz. (Müşteriye WhatsApp'tan giden ilk fiş ayrıca 24 saat sonra
// cleanup-order-receipts cron'uyla silinir.)
export const maxDuration = 60;

export async function GET(_request: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const { orderId } = await ctx.params;
  const current = await getTenantOrderWithEvents(tenant.id, orderId);
  if (!current) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  const order = current.order;

  const pdfBytes = await buildStoredOrderReceiptPdf(tenant, order);
  const fileName = `siparis-${order.order_no ?? order.order_number}.pdf`;
  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
