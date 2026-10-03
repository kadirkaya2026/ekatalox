import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { getTenantOrderWithEvents } from "@/lib/orders/data";
import { ORDER_EDIT_EVENT_PREFIX } from "@/lib/orders/status";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { orderEditSchema } from "@/lib/validators/orders";

// Sipariş düzenleme v2 (0154, 3 Eki 2026): toptancı mağazalarda (ya da
// order_edit_enabled açık) fişten satır çıkarma, adet/fiyat değiştirme, yeni ürün
// ekleme ve müşteri bilgisi düzeltme. Yeni ürünün fiyatı siparişin verildiği fiyat
// listesinden (bayi şifresi → liste; yoksa mağazanın varsayılan listesi) gelir.
// Hesap, stok farkı ve olay kaydı veritabanındaki edit_order içinde tek transaction.
export async function PUT(request: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (tenant.business_type === "market" && !tenant.order_edit_enabled) {
    return NextResponse.json({ error: "Bu mağazada sipariş fişi düzenleme kapalı." }, { status: 403 });
  }
  const { orderId } = await ctx.params;
  const parsed = orderEditSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz istek." }, { status: 400 });
  }

  const current = await getTenantOrderWithEvents(tenant.id, orderId);
  if (!current) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  const order = current.order;
  if (order.status === "delivered" || order.status === "cancelled") {
    return NextResponse.json({ error: "Teslim edilmiş veya iptal edilmiş sipariş düzenlenemez." }, { status: 409 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  // Yeni eklenen ürünler: ürün kaydı + siparişin fiyat listesindeki fiyat.
  const newIds = [...new Set(parsed.data.items.map((line) => line.product_id).filter(Boolean))] as string[];
  type ProductRow = {
    id: string;
    sku_code: string | null;
    product_name: string;
    currency: string;
    purchase_price: number | null;
    product_prices: { price_list_id: string; price: number; discount_price: number | null }[] | null;
  };
  const productById = new Map<string, ProductRow>();
  let priceListId: string | null = null;
  if (newIds.length) {
    const { data: rows } = await supabase
      .from("products")
      .select("id, sku_code, product_name, currency, purchase_price, product_prices(price_list_id, price, discount_price)")
      .eq("tenant_id", tenant.id)
      .in("id", newIds);
    for (const row of (rows ?? []) as ProductRow[]) productById.set(row.id, row);

    const { data: orderRow } = await supabase.from("orders").select("access_code_id").eq("id", orderId).maybeSingle();
    if (orderRow?.access_code_id) {
      const { data: code } = await supabase.from("access_codes").select("price_list_id").eq("id", orderRow.access_code_id).maybeSingle();
      priceListId = (code?.price_list_id as string | undefined) ?? null;
    }
    if (!priceListId) priceListId = (tenant as { public_price_list_id?: string | null }).public_price_list_id ?? null;
    if (!priceListId) {
      const { data: firstList } = await supabase
        .from("price_lists")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("is_catalog_only", false)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();
      priceListId = (firstList?.id as string | undefined) ?? null;
    }
  }

  const round2 = (value: number) => Math.round(value * 100) / 100;
  const changes: string[] = [];
  const items: Record<string, unknown>[] = [];
  const keptIndexes = new Set<number>();
  for (const line of parsed.data.items) {
    if (line.index !== undefined) {
      const old = order.items[line.index];
      if (!old) return NextResponse.json({ error: "Sipariş bu arada değişmiş; sayfayı yenileyip tekrar deneyin." }, { status: 409 });
      keptIndexes.add(line.index);
      const price = line.price ?? old.price;
      const ad = old.product_name + (old.variant_name ? ` (${old.variant_name})` : "");
      if (line.quantity !== old.quantity) changes.push(`${ad}: ${old.quantity} → ${line.quantity}`);
      if (price !== old.price) changes.push(`${ad}: fiyat ${old.price} → ${price}`);
      items.push({ ...old, quantity: line.quantity, unit_quantity: old.sales_unit === "adet" || !old.unit_quantity ? line.quantity : old.unit_quantity, price });
      continue;
    }
    const product = productById.get(line.product_id!);
    if (!product) return NextResponse.json({ error: "Eklenen ürün bulunamadı." }, { status: 400 });
    if (order.currency !== "CATALOG" && product.currency !== order.currency) {
      return NextResponse.json({ error: `${product.product_name} farklı para biriminde (${product.currency}); bu siparişe eklenemez.` }, { status: 400 });
    }
    const listPrice = product.product_prices?.find((p) => p.price_list_id === priceListId);
    const basePrice = listPrice ? Number(listPrice.price) : 0;
    const discounted = listPrice?.discount_price != null && Number(listPrice.discount_price) > 0 ? Number(listPrice.discount_price) : null;
    const price = order.currency === "CATALOG" ? 0 : line.price ?? discounted ?? basePrice;
    const unitCost = typeof product.purchase_price === "number" && product.currency === order.currency ? round2(product.purchase_price) : null;
    changes.push(`${product.product_name}: eklendi (${line.quantity})`);
    items.push({
      product_name: product.product_name,
      sku_code: product.sku_code,
      quantity: line.quantity,
      price,
      currency: order.currency,
      product_id: product.id,
      variant_id: null,
      variant_name: null,
      sales_unit: "adet",
      unit_quantity: line.quantity,
      original_price: discounted ? basePrice : null,
      discount_percentage: discounted && basePrice > 0 ? Math.round((1 - discounted / basePrice) * 100) : null,
      unit_cost: unitCost,
      cost_source: unitCost === null ? null : "product",
      is_gift: null,
      gift_campaign_title: null,
    });
  }
  order.items.forEach((old, index) => {
    if (!keptIndexes.has(index)) changes.push(`${old.product_name}${old.variant_name ? ` (${old.variant_name})` : ""}: çıkarıldı`);
  });

  const customer = parsed.data.customer;
  if (customer) {
    const fields: [keyof typeof customer, string, string | null | undefined][] = [
      ["customer_name", "müşteri adı", order.customer_name],
      ["customer_phone", "telefon", order.customer_phone],
      ["customer_address", "adres", order.customer_address],
      ["note", "not", order.note],
    ];
    for (const [key, label, before] of fields) {
      const after = customer[key];
      if (after !== undefined && (after.trim() || null) !== (before ?? null)) changes.push(`${label} güncellendi`);
    }
  }
  if (changes.length === 0) return NextResponse.json({ error: "Değişiklik yok." }, { status: 400 });

  const { data, error } = await supabase.rpc("edit_order", {
    p_tenant_id: tenant.id,
    p_order_id: orderId,
    p_items: items,
    p_customer: customer ?? null,
    p_actor_profile_id: session.profile?.id ?? null,
    p_reason: `${ORDER_EDIT_EVENT_PREFIX} ${changes.join("; ")}`.slice(0, 300),
  });
  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("order_not_found")) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
    if (msg.includes("order_edit_disabled")) return NextResponse.json({ error: "Bu mağazada sipariş fişi düzenleme kapalı." }, { status: 403 });
    if (msg.includes("order_not_editable")) return NextResponse.json({ error: "Teslim edilmiş veya iptal edilmiş sipariş düzenlenemez." }, { status: 409 });
    if (msg.includes("no_items_left") || msg.includes("invalid_quantity")) {
      return NextResponse.json({ error: "Adetler geçersiz; fişte en az bir ürün kalmalı." }, { status: 400 });
    }
    console.error("[orders] edit_order failed:", error);
    return NextResponse.json({ error: "Sipariş güncellenemedi." }, { status: 500 });
  }

  const updated = await getTenantOrderWithEvents(tenant.id, orderId);
  return NextResponse.json({ order: updated?.order ?? data, events: updated?.events ?? [] });
}
