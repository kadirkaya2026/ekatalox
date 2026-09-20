// Satış ekibine yeni self-servis kayıt bildirimi (CONTACT_RECIPIENT).
import { formatTry, TOPTAN_SECTOR_OPTIONS } from "@/lib/billing/toptan-plans";
import {
  button,
  dataRow,
  dataTable,
  formatDateTr,
  heading,
  linkRow,
  paragraph,
  renderEmailLayout,
  renderEmailText,
  subheading,
} from "@/lib/email/layout";

export interface SignupNotificationParams {
  tenantId: string;
  businessName: string;
  sector: string;
  fullName: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  city: string;
  district: string;
  neighborhood: string;
  address: string;
  taxOffice: string;
  taxNumber: string;
  subdomain: string;
  storeUrl: string;
  planName: string;
  billingPeriod: "monthly" | "yearly";
  listPrice: number;
  finalPrice: number;
  couponCode: string | null;
  trialEndsAt: string | null;
  ipAddress: string | null;
}

export function buildSignupNotificationEmail(params: SignupNotificationParams) {
  const adminUrl = `https://admin.ekatalox.com/tenants/${params.tenantId}`;
  const sectorLabel = TOPTAN_SECTOR_OPTIONS.find((o) => o.value === params.sector)?.label ?? params.sector;
  const periodLabel = params.billingPeriod === "yearly" ? "Yıllık" : "Aylık";
  const fullAddress = [params.neighborhood, params.address, [params.district, params.city].filter(Boolean).join(" / ")]
    .filter(Boolean)
    .join(", ");

  const bodyHtml = [
    heading("Yeni self-servis kayıt"),
    paragraph(
      `<strong>${params.businessName}</strong> (${sectorLabel}) kayıt formunu tamamladı; kataloğu Ücretsiz planla açıldı. Ücretli paket talebi varsa ödeme için aranmalı; ürün yükleme desteği sorulmalı.`,
    ),
    button(adminUrl, "Admin panelinde aç"),
    subheading("İşletme"),
    dataTable(
      [
        dataRow("İşletme adı", params.businessName),
        dataRow("Sektör", sectorLabel),
        dataRow("Yetkili", params.fullName),
        dataRow("Telefon", params.phone),
        dataRow("WhatsApp", params.whatsappNumber),
        dataRow("E-posta", params.email),
        linkRow("Mağaza", params.storeUrl),
        dataRow("Alt alan adı", params.subdomain),
      ].join(""),
    ),
    subheading("Paket ve ücret"),
    dataTable(
      [
        dataRow("Paket", params.planName),
        dataRow("Ödeme dönemi", periodLabel),
        dataRow("Liste fiyatı", formatTry(params.listPrice)),
        dataRow("Kupon", params.couponCode ?? "—"),
        dataRow("Ödenecek", formatTry(params.finalPrice)),
        dataRow("Deneme bitiş", formatDateTr(params.trialEndsAt) || "—"),
      ].join(""),
    ),
    subheading("Fatura adresi"),
    dataTable(
      [
        dataRow("Adres", fullAddress),
        dataRow("Vergi dairesi", params.taxOffice || "—"),
        dataRow("Vergi / TC no", params.taxNumber || "—"),
        dataRow("IP", params.ipAddress ?? "—"),
        dataRow("Tenant ID", params.tenantId),
      ].join(""),
    ),
  ].join("");

  const text = renderEmailText([
    "Yeni self-servis kayıt",
    "",
    `İşletme: ${params.businessName} (${sectorLabel})`,
    `Yetkili: ${params.fullName}`,
    `Telefon: ${params.phone} · WhatsApp: ${params.whatsappNumber}`,
    `E-posta: ${params.email}`,
    `Mağaza: ${params.storeUrl}`,
    "",
    `Paket: ${params.planName} · ${periodLabel}`,
    `Liste: ${formatTry(params.listPrice)} · Kupon: ${params.couponCode ?? "—"} · Ödenecek: ${formatTry(params.finalPrice)}`,
    `Deneme bitiş: ${formatDateTr(params.trialEndsAt) || "—"}`,
    "",
    `Adres: ${fullAddress}`,
    `Vergi dairesi: ${params.taxOffice || "—"} · Vergi no: ${params.taxNumber || "—"}`,
    `IP: ${params.ipAddress ?? "—"}`,
    "",
    `Admin: ${adminUrl}`,
  ]);

  return {
    subject: `[Yeni Kayıt] ${params.businessName} — ${params.planName} (${periodLabel})`,
    html: renderEmailLayout({ title: "Yeni self-servis kayıt", bodyHtml }),
    text,
    replyTo: `"${params.fullName}" <${params.email}>`,
  };
}
