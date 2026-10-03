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
  productIds: z.array(z.string().uuid(), { message: "Lütfen menünüz için çeşit seçin." }).min(1, "Lütfen menünüz için çeşit seçin.").max(20, "Çok fazla çeşit seçildi."),
  people: z.number({ message: "Kişi sayısını yazın." }).int("Kişi sayısı tam sayı olmalı.").min(1, "Kişi sayısını yazın.").max(10000, "Kişi sayısı çok büyük."),
  date: z.string({ message: "Teslim tarihini seçin." }).regex(/^\d{4}-\d{2}-\d{2}$/, "Teslim tarihini seçin."),
  name: z.string({ message: "Adınızı yazın." }).trim().min(2, "Adınızı soyadınızı yazın.").max(120, "Ad çok uzun."),
  phone: z.string({ message: "Telefon numaranızı yazın." }).trim().min(10, "Telefon numaranızı 05xx xxx xx xx biçiminde yazın.").max(20, "Telefon numarası çok uzun."),
  address: z.string({ message: "Teslimat adresini yazın." }).trim().min(5, "Teslimat adresini (mahalle, sokak, bina no) yazın.").max(500, "Adres çok uzun."),
  note: z.string().trim().max(1000, "Not çok uzun (en fazla 1000 karakter).").optional(),
});

const FIELD_BY_KEY: Record<string, string> = { productIds: "items", people: "people", date: "date", name: "name", phone: "phone", address: "address", note: "note" };

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Lütfen eksik bilgileri tamamlayın.", field: FIELD_BY_KEY[String(issue?.path?.[0] ?? "")] ?? null },
      { status: 400 },
    );
  }
  const body = parsed.data;
  const tenant = await getStorefrontTenant(body.subdomain);
  if (!tenant || tenant.status !== "active") return NextResponse.json({ error: "Mağaza bulunamadı." }, { status: 404 });
  const settings = await getTenantStorefrontSettings(tenant.id);
  const builder = resolveRetailConfig(settings.retail_config).menuBuilder;
  if (!builder) return NextResponse.json({ error: "Bu mağazada menü oluşturma kapalı." }, { status: 404 });

  if (new Set(body.productIds).size !== builder.pickCount) {
    return NextResponse.json({ error: `Lütfen ${builder.pickCount} farklı çeşit seçin.`, field: "items" }, { status: 400 });
  }
  if (body.people < builder.minPeople) {
    return NextResponse.json({ error: `Menü siparişleri en az ${builder.minPeople} kişiliktir.`, field: "people" }, { status: 400 });
  }
  const earliest = istanbulDatePlus(builder.leadDays);
  if (body.date < earliest) {
    return NextResponse.json({ error: `Menü siparişleri en erken ${formatDeliveryDate(earliest)} için verilebilir.`, field: "date" }, { status: 400 });
  }
  if (!validateCustomerPhoneInput(body.phone)) {
    return NextResponse.json({ error: "Telefon numaranızı 05xx xxx xx xx biçiminde yazın.", field: "phone" }, { status: 400 });
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
