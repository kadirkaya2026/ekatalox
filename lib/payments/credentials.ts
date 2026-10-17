import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentProvider } from "@/lib/payments/providers";

// Online ödeme anahtarları (0185): her mağazanın kendi sağlayıcı hesabı.
// Veritabanında yalnız AES-256-GCM ile şifreli durur; anahtar
// PAYMENT_CREDENTIALS_KEY (32 bayt, base64) ortam değişkeninde.

export type IyzicoCredentials = { api_key: string; secret_key: string };
export type PaytrCredentials = { merchant_id: string; merchant_key: string; merchant_salt: string };
export type PaynetCredentials = { secret_key: string };

export type ProviderCredentials =
  | { provider: "iyzico"; credentials: IyzicoCredentials }
  | { provider: "paytr"; credentials: PaytrCredentials }
  | { provider: "paynet"; credentials: PaynetCredentials };

function getKey() {
  const raw = process.env.PAYMENT_CREDENTIALS_KEY?.trim();
  if (!raw) throw new Error("PAYMENT_CREDENTIALS_KEY tanımlı değil.");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("PAYMENT_CREDENTIALS_KEY 32 bayt (base64) olmalı.");
  return key;
}

export function isPaymentCredentialStoreReady() {
  try {
    getKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptCredentials(value: Record<string, string>) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64"), tag.toString("base64"), body.toString("base64")].join(":");
}

export function decryptCredentials(value: string): Record<string, string> {
  const [version, iv, tag, body] = value.split(":");
  if (version !== "v1" || !iv || !tag || !body) throw new Error("Şifreli anahtar biçimi tanınmadı.");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const plain = Buffer.concat([decipher.update(Buffer.from(body, "base64")), decipher.final()]);
  return JSON.parse(plain.toString("utf8")) as Record<string, string>;
}

/** Panelde gösterilen ipucu: PayTR'de mağaza no, diğerlerinde anahtarın son 4 hanesi. */
export function buildKeyHint(provider: PaymentProvider, credentials: Record<string, string>) {
  if (provider === "paytr") return credentials.merchant_id || null;
  const visible = credentials.api_key ?? credentials.secret_key;
  return visible ? `…${visible.slice(-4)}` : null;
}

/** Panel için: anahtarsız özet. */
export interface TenantPaymentProviderSummary {
  provider: PaymentProvider;
  is_test: boolean;
  key_hint: string | null;
  verified_at: string | null;
  last_error: string | null;
}

export async function getTenantPaymentProviderSummary(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<TenantPaymentProviderSummary | null> {
  const { data } = await supabase
    .from("tenant_payment_providers")
    .select("provider, is_test, key_hint, verified_at, last_error")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return (data as TenantPaymentProviderSummary | null) ?? null;
}

export type LoadedPaymentProvider = ProviderCredentials & { isTest: boolean; verifiedAt: string | null };

export async function loadTenantPaymentProvider(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<LoadedPaymentProvider | null> {
  const { data } = await supabase
    .from("tenant_payment_providers")
    .select("provider, is_test, credentials_enc, verified_at")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!data) return null;
  const row = data as { provider: PaymentProvider; is_test: boolean; credentials_enc: string; verified_at: string | null };
  return {
    provider: row.provider,
    credentials: decryptCredentials(row.credentials_enc),
    isTest: row.is_test,
    verifiedAt: row.verified_at,
  } as LoadedPaymentProvider;
}
