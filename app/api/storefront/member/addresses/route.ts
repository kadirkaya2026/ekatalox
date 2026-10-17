import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeCustomerPhone } from "@/lib/storefront/customer-phone";
import { listMemberAddresses, MAX_MEMBER_ADDRESSES, resolveMember } from "@/lib/storefront/member";

// Üye adresleri (0181): başlıklı (Ev, İşyeri…) adresler, biri ana adres. Ana
// adres store_members.address'e de yazılır (eski okuyucular için).

const NO_STORE = { "Cache-Control": "no-store" };
const NOT_MEMBER = { error: "Oturumunuz kapanmış, tekrar giriş yapın." };

const addressSchema = z.object({
  title: z.string().trim().min(1, "Adres başlığı yazın (ör. Ev, İşyeri).").max(40),
  address: z.string().trim().min(5, "Adresi yazın.").max(500),
  is_default: z.boolean().optional(),
  // Teslim alacak kişi (0183): ikisi de isteğe bağlı; boşsa üyenin kendisi.
  recipient_name: z
    .string()
    .trim()
    .max(120)
    .nullish()
    .transform((v) => v || null),
  recipient_phone: z
    .string()
    .trim()
    .max(40)
    .nullish()
    .transform((v) => (v ? normalizeCustomerPhone(v) : null))
    .refine((v) => v === null || v.length >= 10, "Telefon numarasını eksiksiz yazın."),
});

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Geçersiz istek.";
}

async function respondWithList(ctx: NonNullable<Awaited<ReturnType<typeof resolveMember>>>) {
  const addresses = await listMemberAddresses(ctx.supabase, ctx.member.id);
  const primary = addresses.find((a) => a.is_default) ?? addresses[0];
  await ctx.supabase.from("store_members").update({ address: primary?.address ?? "" }).eq("id", ctx.member.id);
  return NextResponse.json({ addresses }, { headers: NO_STORE });
}

async function makeDefault(ctx: NonNullable<Awaited<ReturnType<typeof resolveMember>>>, id: string) {
  await ctx.supabase.from("store_member_addresses").update({ is_default: false }).eq("member_id", ctx.member.id).neq("id", id);
  await ctx.supabase.from("store_member_addresses").update({ is_default: true }).eq("member_id", ctx.member.id).eq("id", id);
}

export async function GET(request: Request) {
  const ctx = await resolveMember(new URL(request.url).searchParams.get("subdomain"));
  if (!ctx) return NextResponse.json(NOT_MEMBER, { status: 401 });
  return NextResponse.json({ addresses: await listMemberAddresses(ctx.supabase, ctx.member.id) }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const ctx = await resolveMember(typeof body?.subdomain === "string" ? body.subdomain : null);
  if (!ctx) return NextResponse.json(NOT_MEMBER, { status: 401 });
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });

  const existing = await listMemberAddresses(ctx.supabase, ctx.member.id);
  if (existing.length >= MAX_MEMBER_ADDRESSES) {
    return NextResponse.json({ error: `En fazla ${MAX_MEMBER_ADDRESSES} adres kaydedebilirsiniz.` }, { status: 400 });
  }
  const { data, error } = await ctx.supabase
    .from("store_member_addresses")
    .insert({
      member_id: ctx.member.id,
      tenant_id: ctx.tenant.id,
      title: parsed.data.title,
      address: parsed.data.address,
      recipient_name: parsed.data.recipient_name,
      recipient_phone: parsed.data.recipient_phone,
      is_default: existing.length === 0,
    })
    .select("id")
    .single();
  if (error || !data) return NextResponse.json({ error: "Adres kaydedilemedi." }, { status: 500 });
  if (parsed.data.is_default && existing.length) await makeDefault(ctx, data.id);
  const response = await respondWithList(ctx);
  const json = (await response.json()) as { addresses: unknown };
  return NextResponse.json({ ...json, created_id: data.id }, { headers: NO_STORE });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const ctx = await resolveMember(typeof body?.subdomain === "string" ? body.subdomain : null);
  if (!ctx) return NextResponse.json(NOT_MEMBER, { status: 401 });
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "Adres seçilmedi." }, { status: 400 });

  if (body?.make_default === true) {
    await makeDefault(ctx, id);
    return respondWithList(ctx);
  }
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  await ctx.supabase
    .from("store_member_addresses")
    .update({
      title: parsed.data.title,
      address: parsed.data.address,
      recipient_name: parsed.data.recipient_name,
      recipient_phone: parsed.data.recipient_phone,
      updated_at: new Date().toISOString(),
    })
    .eq("member_id", ctx.member.id)
    .eq("id", id);
  if (parsed.data.is_default) await makeDefault(ctx, id);
  return respondWithList(ctx);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const ctx = await resolveMember(url.searchParams.get("subdomain"));
  if (!ctx) return NextResponse.json(NOT_MEMBER, { status: 401 });
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Adres seçilmedi." }, { status: 400 });
  const before = await listMemberAddresses(ctx.supabase, ctx.member.id);
  const removed = before.find((a) => a.id === id);
  await ctx.supabase.from("store_member_addresses").delete().eq("member_id", ctx.member.id).eq("id", id);
  // Ana adres silindiyse kalan ilk adres ana olur.
  if (removed?.is_default) {
    const next = before.find((a) => a.id !== id);
    if (next) await makeDefault(ctx, next.id);
  }
  return respondWithList(ctx);
}
