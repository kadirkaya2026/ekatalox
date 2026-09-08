// Özel şifre sıfırlama: Supabase Auth e-postaları yerine kendi SMTP'miz.
// Ham token yalnızca e-postadaki bağlantıda; DB'de sha256 hash'i durur.
import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PASSWORD_RESET_TTL_MINUTES } from "@/lib/email/templates/password-reset";

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function findAuthUserByEmail(supabase: SupabaseClient, email: string) {
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) return null;
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === target);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

export async function issueResetToken(supabase: SupabaseClient, userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60_000).toISOString();
  const { error } = await supabase
    .from("password_reset_tokens")
    .insert({ user_id: userId, token_hash: hashResetToken(token), expires_at: expiresAt });
  if (error) return null;
  return token;
}

export async function consumeResetToken(supabase: SupabaseClient, token: string) {
  const { data } = await supabase
    .from("password_reset_tokens")
    .select("id, user_id, expires_at, used_at")
    .eq("token_hash", hashResetToken(token))
    .maybeSingle();
  if (!data || data.used_at || new Date(data.expires_at).getTime() < Date.now()) return null;
  await supabase.from("password_reset_tokens").update({ used_at: new Date().toISOString() }).eq("id", data.id);
  return data.user_id as string;
}
