import { NextResponse } from "next/server";
import { z } from "zod";
import { getStorefrontTenant, getTenantStorefrontSettings } from "@/lib/data";
import { buildOrderReceiptOrderNumber } from "@/lib/storage/order-receipts";
import { validateCustomerPhoneInput } from "@/lib/storefront/customer-phone";
import { recordStorefrontOrder } from "@/lib/storefront/orders";
import { formatDeliveryDate, istanbulDatePlus, resolveRetailConfig } from "@/lib/storefront/retail-config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CartItem } from "@/lib/types";

// "Menünü Oluştur" (0155): müşteri N çeşit + kişi sayısı + teslim tarihi seçer;
// fiyatsız bir teklif isteği olarak siparişlere düşer (currency CATALOG), fiyatı
// mağaza verir. Kurallar retail_config.menu_builder'dan; sunucu yeniden doğrular.
const schema = z.object({
  subdomain: z.string().min(1).max(80),
  productIds: z.array(z.string().uuid()).min(1).max(20),
  people: z.number().int().min(1).max(10000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().trim().min(2, "Adınızı yazın.").max(120),
  phone: z.string().trim().min(10).max(20),
  address: z.string().trim().min(5, "Teslimat adresini yazın.").max(500),
  note: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Bilgiler eksik." }, { status: 400 });
  }
  const body = parsed.data;
  const tenant = await getStorefrontTenant(body.subdomain);
  if (!tenant || tenant.status !== "active") return NextResponse.json({ error: "Mağaza bulunamadı." }, { status: 404 });
  const settings = await getTenantStorefrontSettings(tenant.id);
  const builder = resolveRetailConfig(settings.retail_config).menuBuilder;
  if (!builder) return NextResponse.json({ error: "Bu mağazada menü oluşturma kapalı." }, { status: 404 });

  if (new Set(body.productIds).size !== builder.pickCount) {
    return NextResponse.json({ error: `Lütfen ${builder.pickCount} farklı çeşit seçin.` }, { status: 400 });
  }
  if (body.people < builder.minPeople) {
    return NextResponse.json({ error: `Menü siparişleri en az ${builder.minPeople} kişiliktir.` }, { status: 400 });
  }
  const earliest = istanbulDatePlus(builder.leadDays);
  if (body.date < earliest) {
    return NextResponse.json({ error: `Menü siparişleri en erken ${formatDeliveryDate(earliest)} için verilebilir.` }, { status: 400 });
  }
  if (!validateCustomerPhoneInput(body.phone)) {
    return NextResponse.json({ error: "Telefon numarasını 05xx xxx xx xx biçiminde yazın." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  const { data: rows } = await supabase
    .from("products")
    .select("id, sku_code, product_name, category_id")
    .eq("tenant_id", tenant.id)
    .eq("is_over_limit", false)
    .in("id", body.productIds);
  const products = (rows ?? []).filter((row) => !builder.excludeCategoryIds.includes(row.category_id as string));
  if (products.length !== builder.pickCount) {
    return NextResponse.json({ error: "Seçilen ürünlerden bazıları menüye eklenemiyor; sayfayı yenileyip tekrar deneyin." }, { status: 400 });
  }

  const items = products.map(
    (product) =>
      ({
        id: product.id,
        product_id: product.id,
        variant_id: null,
        variant_name: `${body.people} kişilik menü`,
        category_id: product.category_id,
        sku_code: product.sku_code,
        product_name: product.product_name,
        image_url: null,
        image_url_2: null,
        image_url_3: null,
        is_in_stock: true,
        currency: "CATALOG",
        price: 0,
        package_quantity: null,
        carton_quantity: null,
        stock_quantity: null,
        quantity: 1,
        sales_unit: "adet",
        unit_quantity: 1,
      }) as unknown as CartItem,
  );
  const dateLabel = formatDeliveryDate(body.date);
  const note = [`Menü teklif isteği · ${body.people} kişi`, `Teslim tarihi: ${dateLabel}`, body.note?.trim()].filter(Boolean).join(" · ");

  const recorded = await recordStorefrontOrder({
    supabase,
    tenantId: tenant.id,
    customerName: body.name,
    customerPhone: body.phone,
    customerAddress: body.address,
    orderNumber: buildOrderReceiptOrderNumber(tenant.id),
    currency: "CATALOG",
    totalAmount: 0,
    paymentMethod: null,
    items,
    note,
  });
  if (!recorded) return NextResponse.json({ error: "İsteğiniz kaydedilemedi, lütfen tekrar deneyin." }, { status: 500 });

  const tenantName = settings.storefront_title?.trim() || tenant.company_name;
  const message = [
    `Merhaba, ${tenantName} için menü teklifi istiyorum`,
    `👤 ${body.name}`,
    `📞 ${body.phone}`,
    `📍 ${body.address}`,
    `👥 ${body.people} kişi`,
    `📅 Teslim tarihi: ${dateLabel}`,
    "",
    "Seçtiğim çeşitler:",
    ...products.map((product, index) => `${index + 1}. ${product.product_name}`),
    ...(body.note?.trim() ? ["", `Not: ${body.note.trim()}`] : []),
    ...(recorded.orderNo ? ["", `İstek no: #${recorded.orderNo}`] : []),
  ].join("\n");
  const digits = (tenant.whatsapp_number ?? "").replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `9${digits}` : digits.startsWith("90") ? digits : digits ? `90${digits}` : "";
  return NextResponse.json({
    orderNo: recorded.orderNo,
    whatsappUrl: intl ? `https://wa.me/${intl}?text=${encodeURIComponent(message)}` : null,
  });
}
