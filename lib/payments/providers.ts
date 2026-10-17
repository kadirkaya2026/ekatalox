// Online ödeme sağlayıcıları (0185) — tarayıcıda da kullanılabilen sabitler.
// Sunucu tarafı: lib/payments/credentials.ts (şifreli anahtar) ve
// lib/payments/{iyzico,paytr,paynet}.ts (ödeme başlatma / doğrulama).

export type PaymentProvider = "iyzico" | "paytr" | "paynet";

export const PAYMENT_PROVIDERS: PaymentProvider[] = ["iyzico", "paytr", "paynet"];

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  iyzico: "iyzico",
  paytr: "PayTR",
  paynet: "Paynet",
};

/** Panel formundaki anahtar alanları, sağlayıcıya göre. */
export const PROVIDER_CREDENTIAL_FIELDS: Record<PaymentProvider, Array<{ key: string; label: string }>> = {
  iyzico: [
    { key: "api_key", label: "API anahtarı" },
    { key: "secret_key", label: "Gizli anahtar (secret key)" },
  ],
  paytr: [
    { key: "merchant_id", label: "Mağaza no (merchant_id)" },
    { key: "merchant_key", label: "Mağaza parola (merchant_key)" },
    { key: "merchant_salt", label: "Mağaza gizli anahtar (merchant_salt)" },
  ],
  paynet: [{ key: "secret_key", label: "Gizli anahtar (secret key)" }],
};

/** Anahtarların sağlayıcı panelinde nerede bulunduğu (panel ipucu). */
export const PROVIDER_KEY_HELP: Record<PaymentProvider, string> = {
  iyzico: "iyzico işyeri panelinde Ayarlar → Firma Ayarları → API Anahtarları.",
  paytr: "PayTR Mağaza Paneli → Destek & Kurulum → Entegrasyon Bilgileri.",
  paynet: "Paynet panelinde API anahtarları bölümü (sck_ ile başlayan gizli anahtar).",
};
