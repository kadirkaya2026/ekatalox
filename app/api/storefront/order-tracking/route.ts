import { NextResponse } from "next/server";
import { getOrderByTrackingToken } from "@/lib/orders/data";

// Takip sayfasının sessiz yenilemesi: yalnız durum + olaylar. Token uuid
// olduğu için tahmin edilemez; yine de yanıt kişisel veri taşımaz.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!UUID.test(token)) {
    return NextResponse.json({ error: "Geçersiz takip kodu." }, { status: 400 });
  }
  const result = await getOrderByTrackingToken(token);
  if (!result) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }
  const { order, events } = result;
  return NextResponse.json(
    {
      order_number: order.order_number,
      order_no: order.order_no,
      status: order.status,
      status_updated_at: order.status_updated_at,
      cancel_reason: order.cancel_reason,
      events: events.map((ev) => ({ status: ev.to_status, at: ev.created_at })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
