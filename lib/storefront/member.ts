// Market/tekel vitrin üyeliği (17 Eki 2026, 0180). Kimlik telefon numarasından
// DEĞİL, telefon + şifreyle girişte verilen imzalı HttpOnly çerezden gelir.
// Üyeliksiz müşteri siparişini yalnız takip linkiyle (ve o cihazda kayıtlı
// takip kodlarıyla) görür; numarayı yazarak başkasının siparişine ulaşılamaz.
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getStorefrontTenant } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeCustomerPhone } from "@/lib/storefront/customer-phone";
import { isMarketOrTekelTenant } from "@/lib/storefront/white-label";
import type { Tenant } from "@/lib/types";

const SESSION_DAYS = 180;
export const MEMBER_COOKIE = "ekx_member";

export type StoreMember = {
  id: string;
  tenant_id: string;
  phone: string;
  full_name: string;
  address: string;
  email: string | null;
};

type MemberRow = StoreMember & { password_hash: string };

const MEMBER_COLUMNS = "id, tenant_id, phone, full_name, address, email, password_hash";

/** Üyelik yalnız market/tekel vitrinlerinde (toptancıda kişiye özel bayi şifresi var). */
export function hasStoreMembership(tenant: Pick<Tenant, "business_type" | "is_tekel"> | null | undefined) {
  return isMarketOrTekelTenant(tenant);
}

export function hashMemberPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password.normalize("NFKC"), salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyMemberPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const ref = Buffer.from(hash, "hex");
  const test = scryptSync(password.normalize("NFKC"), salt, 32);
  return ref.length === test.length && timingSafeEqual(ref, test);
}

function signingKey() {
  return createHmac("sha256", "ekx-store-member").update(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "member").digest();
}

// Şifre değişince eski çerezler geçersiz olsun diye çereze hash'in kısa izi girer.
function passwordStamp(passwordHash: string) {
  return createHash("sha256").update(passwordHash).digest("base64url").slice(0, 12);
}

type MemberSession = { m: string; t: string; p: string; exp: number };

function encodeSession(member: Pick<MemberRow, "id" | "tenant_id" | "password_hash">) {
  const payload: MemberSession = {
    m: member.id,
    t: member.tenant_id,
    p: passwordStamp(member.password_hash),
    exp: Date.now() + SESSION_DAYS * 86400_000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", signingKey()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function decodeSession(value: string | undefined | null): MemberSession | null {
  if (!value) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  const expect = createHmac("sha256", signingKey()).update(body).digest("base64url");
  if (expect.length !== sig.length || !timingSafeEqual(Buffer.from(expect), Buffer.from(sig))) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as MemberSession;
    if (!s || typeof s.exp !== "number" || s.exp < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

export function setMemberCookie(response: NextResponse, member: Pick<MemberRow, "id" | "tenant_id" | "password_hash">, secure: boolean) {
  response.cookies.set(MEMBER_COOKIE, encodeSession(member), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export function clearMemberCookie(response: NextResponse, secure: boolean) {
  response.cookies.set(MEMBER_COOKIE, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
}

export function publicMember(row: MemberRow | StoreMember): StoreMember {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    phone: row.phone,
    full_name: row.full_name ?? "",
    address: row.address ?? "",
    email: row.email ?? null,
  };
}

/** Çerezdeki üyeyi doğrular (tenant eşleşmesi + şifre izi). */
export async function readMemberForTenant(supabase: SupabaseClient, tenantId: string): Promise<StoreMember | null> {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(MEMBER_COOKIE)?.value);
  if (!session || session.t !== tenantId) return null;
  const { data } = await supabase
    .from("store_members")
    .select(MEMBER_COLUMNS)
    .eq("id", session.m)
    .eq("tenant_id", tenantId)
    .maybeSingle<MemberRow>();
  if (!data || passwordStamp(data.password_hash) !== session.p) return null;
  return publicMember(data);
}

export type MemberContext = { supabase: SupabaseClient; tenant: Tenant; member: StoreMember };

export async function resolveTenantForMembership(subdomain: string | null | undefined) {
  if (!subdomain) return null;
  const tenant = await getStorefrontTenant(subdomain);
  if (!tenant || tenant.status !== "active" || !hasStoreMembership(tenant)) return null;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  return { tenant, supabase };
}

export async function resolveMember(subdomain: string | null | undefined): Promise<MemberContext | null> {
  const base = await resolveTenantForMembership(subdomain);
  if (!base) return null;
  const member = await readMemberForTenant(base.supabase, base.tenant.id);
  return member ? { ...base, member } : null;
}

export async function findMemberByPhone(supabase: SupabaseClient, tenantId: string, phone: string) {
  const { data } = await supabase
    .from("store_members")
    .select(MEMBER_COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("phone", normalizeCustomerPhone(phone))
    .maybeSingle<MemberRow>();
  return data ?? null;
}

export async function findMemberByEmail(supabase: SupabaseClient, tenantId: string, email: string) {
  const { data } = await supabase
    .from("store_members")
    .select(MEMBER_COLUMNS)
    .eq("tenant_id", tenantId)
    .ilike("email", email.trim().toLowerCase().replace(/[%_\\]/g, "\\$&"))
    .maybeSingle<MemberRow>();
  return data ?? null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Cihazda kayıtlı takip kodları: yalnız geçerli uuid'ler, en fazla 50. */
export function sanitizeTrackingTokens(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((t): t is string => typeof t === "string" && UUID.test(t)))].slice(0, 50);
}

/**
 * Bu cihazdan üyeliksiz verilmiş siparişleri üyeye bağlar. Yetki = takip kodu
 * (siparişi veren cihazda / WhatsApp linkinde). Başka üyeye bağlı sipariş alınmaz.
 */
export async function claimGuestOrders(supabase: SupabaseClient, tenantId: string, memberId: string, tokens: string[]) {
  if (!tokens.length) return;
  await supabase
    .from("orders")
    .update({ member_id: memberId })
    .eq("tenant_id", tenantId)
    .is("member_id", null)
    .in("tracking_token", tokens);
}

export const memberPasswordSchema = z.string().min(6, "Şifre en az 6 karakter olmalı.").max(72);

export const memberProfileSchema = z.object({
  full_name: z.string().trim().min(2, "Adınızı yazın.").max(120),
  address: z.string().trim().max(500).default(""),
  email: z
    .string()
    .trim()
    .max(200)
    .nullish()
    .transform((v) => (v ? v.toLowerCase() : null))
    .refine((v) => v === null || z.email().safeParse(v).success, "Geçerli bir e-posta yazın."),
});

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type StoreMemberAddress = { id: string; title: string; address: string; is_default: boolean };

export const MAX_MEMBER_ADDRESSES = 10;

export async function listMemberAddresses(supabase: SupabaseClient, memberId: string): Promise<StoreMemberAddress[]> {
  const { data } = await supabase
    .from("store_member_addresses")
    .select("id, title, address, is_default")
    .eq("member_id", memberId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  return (data ?? []) as StoreMemberAddress[];
}

/**
 * Kayıtlı adresi olmayan üyenin ilk siparişindeki adres ana adres ("Ev") olur
 * (Getir mantığı, 17 Eki 2026). Adresi zaten varsa dokunulmaz.
 */
export async function saveFirstOrderAddress(supabase: SupabaseClient, member: StoreMember, address: string) {
  const text = address.trim();
  if (!text) return;
  const { count } = await supabase
    .from("store_member_addresses")
    .select("id", { count: "exact", head: true })
    .eq("member_id", member.id);
  if (count) return;
  await supabase
    .from("store_member_addresses")
    .insert({ member_id: member.id, tenant_id: member.tenant_id, title: "Ev", address: text, is_default: true });
  await supabase.from("store_members").update({ address: text }).eq("id", member.id);
}
