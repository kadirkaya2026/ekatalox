import type { PaymentMethodToggles, TenantStorefrontSettings } from "@/lib/types";

// Ödeme yöntemleri (0145, 28 Eyl 2026). Ayarlar → Ödeme ve Kampanyalar →
// "Ödeme" sekmesinden açılıp kapanır; kayıt yoksa eski davranış (nakit + kart).
export const DEFAULT_PAYMENT_METHODS: PaymentMethodToggles = {
  cash: true,
  transfer: false,
  card: true,
  online: false,
};

/** Sepette seçilebilen yöntemler, gösterim sırasıyla. Online, sanal POS
 *  entegrasyonu tamamlanana kadar vitrinde gösterilmez. */
export type CheckoutPaymentMethod = "cash" | "transfer" | "card";

export function resolvePaymentMethods(
  settings: Pick<TenantStorefrontSettings, "payment_methods"> | null | undefined,
): PaymentMethodToggles {
  const raw = settings?.payment_methods;
  if (!raw || typeof raw !== "object") return DEFAULT_PAYMENT_METHODS;
  return {
    cash: raw.cash !== false,
    transfer: raw.transfer === true,
    card: raw.card !== false,
    online: raw.online === true,
  };
}

export function getCheckoutPaymentMethods(
  settings: Pick<TenantStorefrontSettings, "payment_methods"> | null | undefined,
): CheckoutPaymentMethod[] {
  const toggles = resolvePaymentMethods(settings);
  return (["cash", "transfer", "card"] as const).filter((key) => toggles[key]);
}

/** "TR12 0006 1005 ..." biçiminde; boşluksuz büyük harfle saklanır. */
export function normalizeIban(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, "").toUpperCase();
}

export function formatIban(value: string | null | undefined) {
  return normalizeIban(value).replace(/(.{4})/g, "$1 ").trim();
}

/** TR IBAN: TR + 24 hane. Diğer ülkeler için yalnız uzunluk kontrolü. */
export function isValidIban(value: string | null | undefined) {
  const iban = normalizeIban(value);
  if (iban.startsWith("TR")) return /^TR\d{24}$/.test(iban);
  return /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban);
}

export function getBankTransferInfo(
  settings: Pick<TenantStorefrontSettings, "bank_iban" | "bank_account_holder" | "bank_name"> | null | undefined,
) {
  const iban = normalizeIban(settings?.bank_iban);
  if (!iban) return null;
  return {
    iban: formatIban(iban),
    holder: settings?.bank_account_holder?.trim() || null,
    bankName: settings?.bank_name?.trim() || null,
  };
}
