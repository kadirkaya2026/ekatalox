import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CartItem } from "@/lib/types";
import type { CartPaymentSummary } from "@/lib/storefront/cart";
import { formatDiscountPercentage, buildAppliedCampaignBenefitNotes } from "@/lib/storefront/cart";
import {
  formatReceiptMoney,
  getOrderReceiptTableRows,
} from "@/lib/storefront/order-receipt-display";
import { registerRobotoFonts } from "@/lib/storefront/pdf-fonts";

export interface GenerateOrderReceiptPdfParams {
  tenantName: string;
  customerReferenceName: string;
  orderNumber: string;
  orderDate: Date;
  items: CartItem[];
  paymentSummary: CartPaymentSummary;
  paymentMethodLabel: string;
  note?: string | null;
}

const PDF_FONT = "Roboto";
const SOFT_BORDER = [229, 231, 235] as [number, number, number];
const PRODUCT_COLUMN_WIDTH_MM = 82;
const PRODUCT_CELL_HORIZONTAL_PADDING_MM = 5;

function wrapReceiptProductCellText(doc: jsPDF, rawText: string, fontSize: number) {
  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(fontSize);
  const textWidth = PRODUCT_COLUMN_WIDTH_MM - PRODUCT_CELL_HORIZONTAL_PADDING_MM;

  return rawText.split("\n").flatMap((segment) => doc.splitTextToSize(segment, textWidth));
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

function setPdfFont(doc: jsPDF, style: "normal" | "bold" = "normal") {
  doc.setFont(PDF_FONT, style);
}

export async function generateOrderReceiptPdf(
  params: GenerateOrderReceiptPdfParams,
): Promise<Uint8Array> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  registerRobotoFonts(doc);
  setPdfFont(doc, "normal");

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  let cursorY = margin;

  setPdfFont(doc, "bold");
  doc.setFontSize(17);
  doc.text(params.tenantName, margin, cursorY + 8);

  setPdfFont(doc, "normal");
  doc.setFontSize(10);
  const headerRightX = pageWidth - margin;
  doc.text(`Tarih: ${formatOrderDate(params.orderDate)}`, headerRightX, cursorY + 4, {
    align: "right",
  });
  doc.text(`Saat: ${formatOrderTime(params.orderDate)}`, headerRightX, cursorY + 11, {
    align: "right",
  });
  doc.text(
    `Müşteri / Cari: ${params.customerReferenceName.trim()}`,
    margin,
    cursorY + 17,
  );

  cursorY += 24;

  doc.setDrawColor(...SOFT_BORDER);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 10;

  setPdfFont(doc, "bold");
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
      minCellHeight: 8,
      lineColor: SOFT_BORDER,
      lineWidth: 0.15,
      textColor: [15, 23, 42],
      valign: "top",
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
      0: { cellWidth: PRODUCT_COLUMN_WIDTH_MM, overflow: "linebreak" },
      1: { cellWidth: 18, halign: "center" },
      2: { cellWidth: 16, halign: "right" },
      3: { cellWidth: 31, halign: "right" },
      4: { cellWidth: 31, halign: "right" },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index !== 0) {
        return;
      }

      const rawText =
        typeof data.cell.raw === "string"
          ? data.cell.raw
          : Array.isArray(data.cell.raw)
            ? data.cell.raw.join("\n")
            : String(data.cell.text ?? "");

      data.cell.text = wrapReceiptProductCellText(
        doc,
        rawText,
        data.cell.styles.fontSize ?? 8.5,
      );
    },
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

  if (summary.paymentMethod === "card") {
    summaryLines.push({
      label:
        summary.surchargeAmount > 0
          ? `Vade Farkı (%${formatDiscountPercentage(summary.surchargePercentage)})`
          : "Vade Farkı",
      value:
        summary.surchargeAmount > 0
          ? `+${formatReceiptMoney(summary.surchargeAmount, currency)}`
          : formatReceiptMoney(0, currency),
    });
  }

  summaryLines.push({
    label: "Genel Toplam",
    value: formatReceiptMoney(summary.finalTotal, currency),
    bold: true,
  });

  for (const line of summaryLines) {
    if (line.bold) {
      setPdfFont(doc, "bold");
      doc.setFontSize(11);
    } else {
      setPdfFont(doc, "normal");
      doc.setFontSize(10);
    }

    doc.text(line.label, summaryX - 52, cursorY, { align: "right" });
    doc.text(line.value, summaryX, cursorY, { align: "right" });
    cursorY += 7.5;
  }

  cursorY += 4;
  setPdfFont(doc, "normal");
  doc.setFontSize(10);
  doc.text(`Ödeme: ${params.paymentMethodLabel}`, margin, cursorY);
  cursorY += 7;

  for (const campaignNote of buildAppliedCampaignBenefitNotes(summary)) {
    const campaignNoteLines = doc.splitTextToSize(campaignNote, pageWidth - margin * 2);
    doc.text(campaignNoteLines, margin, cursorY, { lineHeightFactor: 1.35 });
    cursorY += campaignNoteLines.length * 5.5 + 2;
  }

  const trimmedNote = params.note?.trim();
  if (trimmedNote) {
    const noteLines = doc.splitTextToSize(`Not: ${trimmedNote}`, pageWidth - margin * 2);
    doc.text(noteLines, margin, cursorY, { lineHeightFactor: 1.35 });
    cursorY += noteLines.length * 5.5;
  }

  const pageHeight = doc.internal.pageSize.getHeight();
  const footerWarning =
    "Bu Fiş 24 Saat Sonra Sistemden Silinecektir. Kaydetmeyi Unutmayın!";
  const footerY = pageHeight - margin;

  if (cursorY > footerY - 8) {
    doc.addPage();
  }

  doc.setTextColor(220, 38, 38);
  setPdfFont(doc, "normal");
  doc.setFontSize(9);
  doc.text(footerWarning, pageWidth / 2, footerY, { align: "center" });
  doc.setTextColor(15, 23, 42);

  const pdfOutput = doc.output("arraybuffer");
  return new Uint8Array(pdfOutput);
}
