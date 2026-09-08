// Self-servis kayıt formu şeması (app/api/signup). Türkçe mesajlar doğrudan
// formda gösterilir; `path[0]` alan adı olarak istemciye döner.
import { z } from "zod";
import { ESNAF_SECTOR_VALUES } from "@/lib/storefront/esnaf-themes";
import {
  isReservedSubdomain,
  isValidSubdomainFormat,
  RESERVED_SUBDOMAIN_MESSAGE,
  slugifySubdomain,
  SUBDOMAIN_MAX_LENGTH,
  SUBDOMAIN_MIN_LENGTH,
} from "@/lib/tenancy/reserved-subdomains";

/** "+90 532 111 22 33", "90532…", "532…" → "05321112233"; uymazsa null. */
export function normalizeTrMobile(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  let candidate = digits;
  if (/^00905\d{9}$/.test(digits)) candidate = `0${digits.slice(4)}`;
  else if (/^905\d{9}$/.test(digits)) candidate = `0${digits.slice(2)}`;
  else if (/^5\d{9}$/.test(digits)) candidate = `0${digits}`;
  return /^05\d{9}$/.test(candidate) ? candidate : null;
}

const trMobileSchema = (label: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? (normalizeTrMobile(value) ?? value.trim()) : value),
    z.string().regex(/^05\d{9}$/, `${label} 05xx xxx xx xx biçiminde olmalı.`),
  );

const trimmed = (min: number, max: number, message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().min(min, message).max(max, `En fazla ${max} karakter.`),
  );

const optionalTrimmed = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value === null ? "" : value),
    z.string().max(max, `En fazla ${max} karakter.`).optional().default(""),
  );

export const signupSubdomainSchema = z.preprocess(
  (value) => (typeof value === "string" ? slugifySubdomain(value) : value),
  z
    .string()
    .min(SUBDOMAIN_MIN_LENGTH, `Mağaza adresi en az ${SUBDOMAIN_MIN_LENGTH} karakter olmalı.`)
    .max(SUBDOMAIN_MAX_LENGTH, `Mağaza adresi en fazla ${SUBDOMAIN_MAX_LENGTH} karakter olabilir.`)
    .refine(isValidSubdomainFormat, "Mağaza adresi yalnız küçük harf, rakam ve tire içerebilir.")
    .refine((value) => !isReservedSubdomain(value), RESERVED_SUBDOMAIN_MESSAGE),
);

export const signupSchema = z.object({
  businessName: trimmed(2, 80, "İşletme adı en az 2 karakter olmalı."),
  sector: z
    .string()
    .refine((value) => ESNAF_SECTOR_VALUES.includes(value), "Geçerli bir sektör seçin."),
  fullName: trimmed(2, 80, "Ad soyad en az 2 karakter olmalı."),
  phone: trMobileSchema("Telefon"),
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.email("Geçerli bir e-posta adresi girin."),
  ),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı.").max(128, "Şifre çok uzun."),
  city: trimmed(2, 60, "İl girin."),
  district: trimmed(2, 60, "İlçe girin."),
  neighborhood: trimmed(2, 80, "Mahalle girin."),
  address: trimmed(5, 300, "Adres en az 5 karakter olmalı."),
  taxOffice: optionalTrimmed(80),
  taxNumber: optionalTrimmed(20),
  whatsappNumber: trMobileSchema("WhatsApp numarası"),
  subdomain: signupSubdomainSchema,
  plan: z.enum(["esnaf", "esnaf_plus"], { error: "Geçerli bir paket seçin." }),
  billingPeriod: z.enum(["monthly", "yearly"], { error: "Geçerli bir ödeme dönemi seçin." }),
  couponCode: optionalTrimmed(40),
  termsAccepted: z.literal(true, {
    error: "Devam etmek için Kullanım Şartları'nı kabul etmelisiniz.",
  }),
});

export type SignupInput = z.infer<typeof signupSchema>;
