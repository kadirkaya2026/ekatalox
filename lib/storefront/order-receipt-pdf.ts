import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CartItem } from "@/lib/types";
import type { CartPaymentSummary } from "@/lib/storefront/cart";
import { formatDiscountPercentage } from "@/lib/storefront/cart";
import {
  formatReceiptMoney,
  getOrderReceiptTableRows,
} from "@/lib/storefront/order-receipt-display";
import { registerRobotoFonts } from "@/lib/storefront/pdf-fonts";

export interface GenerateOrderReceiptPdfParams {
  tenantName: string;
  logoUrl?: string | null;
  orderNumber: string;
  orderDate: Date;
  items: CartItem[];
  paymentSummary: CartPaymentSummary;
  paymentMethodLabel: string;
  note?: string | null;
}

const PDF_FONT = "Roboto";
const SOFT_BORDER = [229, 231, 235] as [number, number, number];

async function fetchLogoAsDataUrl(logoUrl: string) {
  const response = await fetch(logoUrl);

  if (!response.ok) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "image/png";

  if (!contentType.startsWith("image/")) {
    return null;
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const format = contentType.includes("jpeg") || contentType.includes("jpg") ? "JPEG" : "PNG";

  return {
    dataUrl: `data:${contentType};base64,${base64}`,
    format: format as "JPEG" | "PNG",
  };
}

function formatOrderDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatOrderTime(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function setRobotoFont(doc: jsPDF, style: "normal" | "bold" = "normal") {
  doc.setFont(PDF_FONT, style);
}

export async function generateOrderReceiptPdf(
  params: GenerateOrderReceiptPdfParams,
): Promise<Uint8Array> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  registerRobotoFonts(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  let cursorY = margin;

  if (params.logoUrl) {
    try {
      const logo = await fetchLogoAsDataUrl(params.logoUrl);

      if (logo) {
        doc.addImage(logo.dataUrl, logo.format, margin, cursorY, 28, 14);
      }
    } catch {
      // Logo yüklenemezse metin header ile devam et
    }
  }

  setRobotoFont(doc, "bold");
  doc.setFontSize(17);
  doc.text(params.tenantName, margin, cursorY + (params.logoUrl ? 20 : 8));

  setRobotoFont(doc, "normal");
  doc.setFontSize(10);
  const headerRightX = pageWidth - margin;
  doc.text(`Tarih: ${formatOrderDate(params.orderDate)}`, headerRightX, cursorY + 4, {
    align: "right",
  });
  doc.text(`Saat: ${formatOrderTime(params.orderDate)}`, headerRightX, cursorY + 11, {
    align: "right",
  });
  setRobotoFont(doc, "bold");
  doc.text(`Sipariş No: ${params.orderNumber}`, headerRightX, cursorY + 19, {
    align: "right",
  });

  cursorY += params.logoUrl ? 36 : 24;

  doc.setDrawColor(...SOFT_BORDER);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 10;

  setRobotoFont(doc, "bold");
  doc.setFontSize(14);
  doc.text("Sipariş Fişi", margin, cursorY);
  cursorY += 8;

  autoTable(doc, {
    startY: cursorY,
    head: [["Ürün / Model", "Birim", "Miktar", "Birim Fiyat", "Toplam"]],
    body: getOrderReceiptTableRows(params.items),
    theme: "striped",
    styles: {
      font: PDF_FONT,
      fontStyle: "normal",
      fontSize: 8.5,
      cellPadding: { top: 3, right: 2.5, bottom: 3, left: 2.5 },
      overflow: "linebreak",
      lineColor: SOFT_BORDER,
      lineWidth: 0.15,
      textColor: [15, 23, 42],
      valign: "middle",
    },
    headStyles: {
      font: PDF_FONT,
      fontStyle: "bold",
      fontSize: 9,
      fillColor: [248, 250, 252],
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [252, 252, 253],
    },
    columnStyles: {
      0: { cellWidth: 82, overflow: "linebreak" },
      1: { cellWidth: 18, halign: "center" },
      2: { cellWidth: 16, halign: "right" },
      3: { cellWidth: 31, halign: "right" },
      4: { cellWidth: 31, halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  const tableEndY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ??
    cursorY + 20;
  cursorY = tableEndY + 12;

  const summary = params.paymentSummary;
  const currency = summary.currency;
  const summaryX = pageWidth - margin;
  const summaryLines: Array<{ label: string; value: string; bold?: boolean }> = [
    {
      label: "Ara Toplam",
      value: formatReceiptMoney(summary.subtotal, currency),
    },
  ];

  if (summary.discountAmount > 0) {
    summaryLines.push({
      label: `İskonto (%${formatDiscountPercentage(summary.discountPercentage)})`,
      value: `-${formatReceiptMoney(summary.discountAmount, currency)}`,
    });
  }

  if (summary.surchargeAmount > 0) {
    summaryLines.push({
      label: `Vade Farkı (%${formatDiscountPercentage(summary.surchargePercentage)})`,
      value: `+${formatReceiptMoney(summary.surchargeAmount, currency)}`,
    });
  } else if (summary.zeroCommissionApplied && summary.selectedInstallment) {
    summaryLines.push({
      label: "Vade Farkı",
      value: `0 ${currency} (0 Komisyon Kampanyası)`,
    });
  }

  summaryLines.push({
    label: "Genel Toplam",
    value: formatReceiptMoney(summary.finalTotal, currency),
    bold: true,
  });

  for (const line of summaryLines) {
    if (line.bold) {
      setRobotoFont(doc, "bold");
      doc.setFontSize(11);
    } else {
      setRobotoFont(doc, "normal");
      doc.setFontSize(10);
    }

    doc.text(line.label, summaryX - 52, cursorY, { align: "right" });
    doc.text(line.value, summaryX, cursorY, { align: "right" });
    cursorY += 7.5;
  }

  cursorY += 4;
  setRobotoFont(doc, "normal");
  doc.setFontSize(10);
  doc.text(`Ödeme: ${params.paymentMethodLabel}`, margin, cursorY);
  cursorY += 7;

  const trimmedNote = params.note?.trim();
  if (trimmedNote) {
    doc.text(`Not: ${trimmedNote}`, margin, cursorY, {
      maxWidth: pageWidth - margin * 2,
      lineHeightFactor: 1.35,
    });
  }

  const pdfOutput = doc.output("arraybuffer");
  return new Uint8Array(pdfOutput);
}
