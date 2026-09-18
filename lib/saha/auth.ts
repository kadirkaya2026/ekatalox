// Tekel saha uygulaması: şifreyle kullanıcı girişi ve HttpOnly oturum çerezi.
// Kullanıcı = saha_kullanici satırı (ad, scrypt şifre, rol admin|temsilci).
// Oturum = imzalı çerez (HMAC-SHA256); imza anahtarı SAHA_TOKEN + service key'den türetilir.
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SAHA_TOKEN } from "@/lib/saha/token";

export type SahaRol = "admin" | "temsilci";
export type SahaOturum = { id: string; ad: string; rol: SahaRol; exp: number };

export const OTURUM_COOKIE = "saha_oturum";
const OTURUM_GUN = 30;

function signingKey() {
  return createHmac("sha256", SAHA_TOKEN).update(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "saha").digest();
}

export function hashPassword(sifre: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(sifre.normalize("NFKC"), salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(sifre: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(sifre.normalize("NFKC"), salt, 32);
  const ref = Buffer.from(hash, "hex");
  return ref.length === test.length && timingSafeEqual(ref, test);
}

export function signSession(s: Omit<SahaOturum, "exp">) {
  const payload: SahaOturum = { ...s, exp: Date.now() + OTURUM_GUN * 86400_000 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", signingKey()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readSession(cookieHeader: string | null): SahaOturum | null {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${OTURUM_COOKIE}=([^;]+)`));
  if (!m) return null;
  const [body, sig] = m[1].split(".");
  if (!body || !sig) return null;
  const expect = createHmac("sha256", signingKey()).update(body).digest("base64url");
  if (expect.length !== sig.length || !timingSafeEqual(Buffer.from(expect), Buffer.from(sig))) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as SahaOturum;
    if (!s || typeof s.exp !== "number" || s.exp < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

export function sessionCookie(value: string | null) {
  const base = `${OTURUM_COOKIE}=${value ?? ""}; Path=/; HttpOnly; Secure; SameSite=Lax`;
  return value ? `${base}; Max-Age=${OTURUM_GUN * 86400}` : `${base}; Max-Age=0`;
}

/** Şifreyle kullanıcı bul: şifreler kişiye özel olduğu için ad sorulmaz. */
export async function findUserByPassword(supabase: SupabaseClient, sifre: string) {
  const { data, error } = await supabase.from("saha_kullanici").select("id, ad, sifre, rol").eq("aktif", true);
  if (error || !data) return null;
  for (const u of data) if (verifyPassword(sifre, u.sifre)) return { id: u.id as string, ad: u.ad as string, rol: u.rol as SahaRol };
  return null;
}
