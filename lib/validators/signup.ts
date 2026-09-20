// Self-servis kayıt formu şeması (app/api/signup). Türkçe mesajlar doğrudan
// formda gösterilir; `path[0]` alan adı olarak istemciye döner.
import { z } from "zod";
import { TOPTAN_PLANS, TOPTAN_SECTOR_VALUES } from "@/lib/billing/toptan-plans";
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
    .refine((value) => (TOPTAN_SECTOR_VALUES as string[]).includes(value), "Geçerli bir sektör seçin."),
  fullName: trimmed(2, 80, "Ad soyad en az 2 karakter olmalı."),
  phone: trMobileSchema("Telefon"),
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.email("Geçerli bir e-posta adresi girin."),
  ),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı.").max(128, "Şifre çok uzun."),
  // Toptancı kaydı (20 Eyl 2026): sürtünmeyi azaltmak için yalnız il zorunlu;
  // ilçe/adres/vergi bilgileri fatura aşamasında da eklenebilir.
  city: trimmed(2, 60, "İl girin."),
  district: optionalTrimmed(60),
  neighborhood: optionalTrimmed(80),
  address: optionalTrimmed(300),
  taxOffice: optionalTrimmed(80),
  taxNumber: optionalTrimmed(20),
  whatsappNumber: trMobileSchema("WhatsApp numarası"),
  subdomain: signupSubdomainSchema,
  // Seçilen paket yalnız "talep"tir: hesap her zaman Ücretsiz açılır, ücretli
  // paket satış ekibine bildirilir (bkz. lib/signup/create-tenant.ts).
  plan: z.enum(TOPTAN_PLANS.map((plan) => plan.slug) as ["free", "starter", "professional", "corporate"], {
    error: "Geçerli bir paket seçin.",
  }),
  termsAccepted: z.literal(true, {
    error: "Devam etmek için Kullanım Şartları'nı kabul etmelisiniz.",
  }),
});

export type SignupInput = z.infer<typeof signupSchema>;
