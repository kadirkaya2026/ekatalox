import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  PRIMARY_DEALER_ADDRESS_ID,
  listDealerAddresses,
  type DealerAddress,
} from "@/lib/kurumsal/dealer-profile";
import {
  MAX_EXTRA_ADDRESSES,
  accountAddressSchema,
  accountInfoSchema,
  resolveStorefrontAccount,
  type StorefrontAccountContext,
} from "@/lib/storefront/account";

// Vitrin "Hesabım" (8 Eki 2026). Kimlik çerezdeki kişiye özel şifreden gelir
// (lib/storefront/account.ts). Burada yazılan bilgiler panelde Müşteriler
// sayfasındaki AYNI access_codes satırıdır; fişe de bunlar yazılır.

const NOT_ALLOWED = { error: "Hesabım sayfası için size özel şifrenizle giriş yapın." };

function accountPayload(ctx: StorefrontAccountContext) {
  return {
    profile: {
      company: ctx.profile.company,
      name: ctx.profile.name,
      phone: ctx.profile.phone,
    },
    addresses: listDealerAddresses(ctx.profile),
  };
}

export async function GET(request: Request) {
  const subdomain = new URL(request.url).searchParams.get("subdomain");
  const ctx = await resolveStorefrontAccount(subdomain);
  if (!ctx) return NextResponse.json(NOT_ALLOWED, { status: 403 });

  const { data: orders } = await ctx.supabase
    .from("orders")
    .select("id, order_no, order_number, status, created_at, currency, total_amount, item_count, items, tracking_token")
    .eq("tenant_id", ctx.tenant.id)
    .eq("access_code_id", ctx.profile.accessCodeId)
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json({
    ...accountPayload(ctx),
    orders: (orders ?? []).map((order) => {
      const items = (Array.isArray(order.items) ? order.items : []) as Array<{
        product_name?: string | null;
        variant_name?: string | null;
        quantity?: number | null;
        is_gift?: boolean | null;
      }>;
      return {
        id: order.id,
        order_no: order.order_no,
        order_number: order.order_number,
        status: order.status,
        created_at: order.created_at,
        currency: order.currency,
        total_amount: Number(order.total_amount ?? 0),
        item_count: order.item_count ?? items.length,
        tracking_token: order.tracking_token,
        preview: items
          .filter((item) => !item.is_gift)
          .slice(0, 3)
          .map((item) => ({
            name: [item.product_name ?? "Ürün", item.variant_name ? `(${item.variant_name})` : null]
              .filter(Boolean)
              .join(" "),
            quantity: Number(item.quantity ?? 0),
          })),
      };
    }),
  });
}

// Bilgilerim: firma, ad soyad, telefon.
export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const ctx = await resolveStorefrontAccount(typeof body?.subdomain === "string" ? body.subdomain : null);
  if (!ctx) return NextResponse.json(NOT_ALLOWED, { status: 403 });

  const parsed = accountInfoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Bilgiler hatalı." }, { status: 400 });
  }

  const { error } = await ctx.supabase
    .from("access_codes")
    .update({
      customer_company: parsed.data.customer_company ?? null,
      customer_name: parsed.data.customer_name,
      customer_phone: parsed.data.customer_phone,
    })
    .eq("tenant_id", ctx.tenant.id)
    .eq("id", ctx.profile.accessCodeId)
    .eq("is_personal", true);
  if (error) return NextResponse.json({ error: "Bilgiler kaydedilemedi." }, { status: 400 });

  ctx.profile.company = parsed.data.customer_company ?? null;
  ctx.profile.name = parsed.data.customer_name;
  ctx.profile.phone = parsed.data.customer_phone;
  return NextResponse.json(accountPayload(ctx));
}

const addressActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), address: accountAddressSchema, make_default: z.boolean().optional() }),
  z.object({ action: z.literal("update"), id: z.string().min(1), address: accountAddressSchema }),
  z.object({ action: z.literal("delete"), id: z.string().min(1) }),
  z.object({ action: z.literal("default"), id: z.string().min(1) }),
]);

// Adreslerim: ekle / düzenle / sil / varsayılan yap. Varsayılan adres
// customer_address+customer_city sütunlarında durur (panel ve fiş onu okur).
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const ctx = await resolveStorefrontAccount(typeof body?.subdomain === "string" ? body.subdomain : null);
  if (!ctx) return NextResponse.json(NOT_ALLOWED, { status: 403 });

  const parsed = addressActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Adres bilgisi hatalı." }, { status: 400 });
  }

  let primary: { address: string | null; city: string | null } = {
    address: ctx.profile.address?.trim() || null,
    city: ctx.profile.city?.trim() || null,
  };
  let extras: DealerAddress[] = [...(ctx.profile.addresses ?? [])];
  const hasPrimary = Boolean(primary.address || primary.city);
  const input = parsed.data;
  let selectedId: string | null = null;

  if (input.action === "add") {
    const entry = {
      label: input.address.label ?? null,
      address: input.address.address,
      city: input.address.city ?? null,
    };
    if (!hasPrimary) {
      primary = { address: entry.address, city: entry.city };
      selectedId = PRIMARY_DEALER_ADDRESS_ID;
    } else {
      if (extras.length >= MAX_EXTRA_ADDRESSES) {
        return NextResponse.json({ error: `En fazla ${MAX_EXTRA_ADDRESSES + 1} adres kaydedebilirsiniz.` }, { status: 400 });
      }
      const created = { id: randomUUID(), ...entry };
      if (input.make_default) {
        extras = [
          { id: randomUUID(), label: null, address: primary.address || primary.city || "", city: primary.address ? primary.city : null },
          ...extras,
        ].filter((row) => row.address);
        primary = { address: entry.address, city: entry.city };
        selectedId = PRIMARY_DEALER_ADDRESS_ID;
      } else {
        extras = [...extras, created];
        selectedId = created.id;
      }
    }
  } else if (input.action === "update") {
    if (input.id === PRIMARY_DEALER_ADDRESS_ID) {
      primary = { address: input.address.address, city: input.address.city ?? null };
    } else {
      if (!extras.some((row) => row.id === input.id)) {
        return NextResponse.json({ error: "Adres bulunamadı." }, { status: 404 });
      }
      extras = extras.map((row) =>
        row.id === input.id
          ? { ...row, label: input.address.label ?? null, address: input.address.address, city: input.address.city ?? null }
          : row,
      );
    }
    selectedId = input.id;
  } else if (input.action === "delete") {
    if (input.id === PRIMARY_DEALER_ADDRESS_ID) {
      // Varsayılan silinirse sıradaki adres varsayılan olur; tek adres silinemez.
      const [next, ...rest] = extras;
      if (!next) {
        return NextResponse.json({ error: "En az bir adres kayıtlı kalmalı." }, { status: 400 });
      }
      primary = { address: next.address, city: next.city };
      extras = rest;
    } else {
      extras = extras.filter((row) => row.id !== input.id);
    }
  } else {
    const target = extras.find((row) => row.id === input.id);
    if (!target) return NextResponse.json({ error: "Adres bulunamadı." }, { status: 404 });
    // Eski varsayılan silinmez, ek adreslere iner (yalnız il yazılıysa il adres olur).
    const previous =
      primary.address || primary.city
        ? [{ id: randomUUID(), label: null, address: primary.address || primary.city || "", city: primary.address ? primary.city : null }]
        : [];
    extras = [...previous, ...extras.filter((row) => row.id !== input.id)];
    primary = { address: target.address, city: target.city };
    selectedId = PRIMARY_DEALER_ADDRESS_ID;
  }

  const { error } = await ctx.supabase
    .from("access_codes")
    .update({ customer_address: primary.address, customer_city: primary.city, customer_addresses: extras })
    .eq("tenant_id", ctx.tenant.id)
    .eq("id", ctx.profile.accessCodeId)
    .eq("is_personal", true);
  if (error) return NextResponse.json({ error: "Adres kaydedilemedi." }, { status: 400 });

  ctx.profile.address = primary.address;
  ctx.profile.city = primary.city;
  ctx.profile.addresses = extras;
  return NextResponse.json({ ...accountPayload(ctx), selectedId });
}
