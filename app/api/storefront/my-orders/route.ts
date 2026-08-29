import { NextResponse } from "next/server";
import { z } from "zod";
import { getStorefrontTenant } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeCustomerPhone } from "@/lib/storefront/customer-phone";
import type { OrderStatus, StorefrontOrderItemSnapshot } from "@/lib/types";

// Müşteri, sipariş verirken yazdığı telefon numarasıyla siparişlerini listeler.
// Yetki = numara bilgisi. Bu yüzden yanıt bilerek dar: sipariş no, tarih,
// durum, tutar, ürün adları ve takip token'ı. Ad, adres, not DÖNMEZ.
const schema = z.object({
  subdomain: z.string().trim().min(1).max(63),
  phone: z.string().trim().min(1).max(40),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

  const phone = normalizeCustomerPhone(parsed.data.phone);
  if (phone.length < 10) return NextResponse.json({ error: "invalid_phone" }, { status: 400 });

  const tenant = await getStorefrontTenant(parsed.data.subdomain);
  if (!tenant || tenant.status !== "active") return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  // Sipariş kaydı customer_phone'u normalize (yalnız rakam) saklar; bkz. orders.ts.
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_no, order_number, created_at, status, currency, total_amount, item_count, items, tracking_token")
    .eq("tenant_id", tenant.id)
    .eq("customer_phone", phone)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return NextResponse.json({ error: "Siparişler okunamadı." }, { status: 500 });

  const orders = (data ?? []).map((o) => {
    const items = (Array.isArray(o.items) ? o.items : []) as StorefrontOrderItemSnapshot[];
    return {
      id: o.id as string,
      order_no: (o.order_no as number | null) ?? null,
      order_number: o.order_number as string,
      created_at: o.created_at as string,
      status: o.status as OrderStatus,
      currency: o.currency as string,
      total_amount: Number(o.total_amount ?? 0),
      item_count: Number(o.item_count ?? items.length),
      preview: items.slice(0, 3).map((i) => i.product_name),
      tracking_token: (o.tracking_token as string | null) ?? null,
    };
  });

  return NextResponse.json({ orders }, { headers: { "Cache-Control": "no-store" } });
}
