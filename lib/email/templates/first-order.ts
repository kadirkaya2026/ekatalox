// "İlk siparişiniz geldi" — tenant contact_email'e bir kez gönderilir.
import { formatCurrency } from "@/lib/utils";
import {
  button,
  dataRow,
  dataTable,
  escapeHtml,
  heading,
  paragraph,
  renderEmailLayout,
  renderEmailText,
} from "@/lib/email/layout";

export interface FirstOrderEmailParams {
  businessName: string;
  contactName: string | null;
  orderNumber: string;
  orderNo: number | null;
  customerName: string;
  itemCount: number;
  totalAmount: number;
  currency: string;
  ordersUrl: string;
}

export function buildFirstOrderEmail(params: FirstOrderEmailParams) {
  const isCatalog = params.currency === "CATALOG";
  const totalLabel = isCatalog ? "Fiyatsız sipariş listesi" : formatCurrency(params.totalAmount, params.currency as Parameters<typeof formatCurrency>[1]);
  const orderLabel = params.orderNo ? `#${params.orderNo}` : params.orderNumber;
  const greeting = params.contactName ? `Tebrikler ${params.contactName}!` : "Tebrikler!";

  const bodyHtml = [
    heading("İlk siparişiniz geldi"),
    paragraph(
      `${escapeHtml(greeting)} <strong>${escapeHtml(params.businessName)}</strong> mağazanıza ilk sipariş düştü. Sipariş WhatsApp'ınıza da PDF olarak iletildi; panelden "hazırlanıyor" ve "yola çıktı" bildirimlerini tek tuşla gönderebilirsiniz.`,
    ),
    dataTable(
      [
        dataRow("Sipariş", orderLabel),
        dataRow("Müşteri", params.customerName),
        dataRow("Kalem sayısı", params.itemCount),
        dataRow("Tutar", totalLabel),
      ].join(""),
    ),
    button(params.ordersUrl, "Siparişi panelde gör"),
    paragraph(
      "Bundan sonraki siparişler için ayrıca e-posta göndermeyeceğiz; panel ve WhatsApp bildirimleri yeterli olacak.",
    ),
  ].join("");

  const text = renderEmailText([
    "İlk siparişiniz geldi",
    "",
    `${greeting} ${params.businessName} mağazanıza ilk sipariş düştü.`,
    `Sipariş: ${orderLabel}`,
    `Müşteri: ${params.customerName}`,
    `Kalem sayısı: ${params.itemCount}`,
    `Tutar: ${totalLabel}`,
    "",
    `Siparişi panelde gör: ${params.ordersUrl}`,
  ]);

  return {
    subject: `İlk siparişiniz geldi — ${params.businessName}`,
    html: renderEmailLayout({ title: "İlk siparişiniz geldi", bodyHtml }),
    text,
  };
}
