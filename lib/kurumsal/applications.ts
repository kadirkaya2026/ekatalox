import { z } from "zod";

// Bayi başvuruları (dealer_applications, bkz. 0133). Kurumsal sayfadaki
// formdan gelir; bayi panelde "Bayi Başvuruları"nda durumunu günceller.

export const DEALER_APPLICATION_STATUSES = ["new", "contacted", "approved", "rejected"] as const;
export type DealerApplicationStatus = (typeof DEALER_APPLICATION_STATUSES)[number];

export const DEALER_APPLICATION_STATUS_LABELS: Record<DealerApplicationStatus, string> = {
  new: "Yeni",
  contacted: "Arandı",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

export interface DealerApplication {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  city: string | null;
  note: string | null;
  status: DealerApplicationStatus;
  created_at: string;
}

function optionalText(max: number) {
  return z.preprocess(
    (value) => (typeof value === "string" && !value.trim() ? undefined : value),
    z.string().trim().max(max).optional(),
  );
}

export const dealerApplicationInputSchema = z.object({
  subdomain: z.string().trim().min(1).max(63),
  company_name: z
    .string()
    .trim()
    .min(2, "Firma adını yazın.")
    .max(120, "Firma adı en fazla 120 karakter olabilir."),
  contact_name: z
    .string()
    .trim()
    .min(2, "Yetkili adını yazın.")
    .max(80, "Yetkili adı en fazla 80 karakter olabilir."),
  phone: z
    .string()
    .trim()
    .max(20, "Telefon numarası geçersiz.")
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 13;
    }, "Telefon numarasını 05XX XXX XX XX biçiminde yazın."),
  city: optionalText(40),
  note: optionalText(1000),
  // Bot tuzağı: doluysa sahte başarı döner, kayıt yapılmaz.
  website: z.string().max(500).optional(),
});

export const dealerApplicationStatusSchema = z.object({
  status: z.enum(DEALER_APPLICATION_STATUSES, "Geçersiz durum."),
});

/** Panelde tel:/WhatsApp bağlantısı için TR numarasını 90XXXXXXXXXX biçimine çevirir. */
export function normalizeTrPhoneDigits(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0090")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = `9${digits}`;
  if (digits.length === 10 && digits.startsWith("5")) digits = `90${digits}`;
  return digits;
}
