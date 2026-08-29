import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CartItem } from "@/lib/types";
import type { CartPaymentSummary } from "@/lib/storefront/cart";
import { formatDiscountPercentage, buildAppliedCampaignBenefitNotes } from "@/lib/storefront/cart";
import {
  formatReceiptMoney,
  getOrderReceiptTableHead,
  getOrderReceiptTableRows,
} from "@/lib/storefront/order-receipt-display";
import { registerRobotoFonts } from "@/lib/storefront/pdf-fonts";

export interface GenerateOrderReceiptPdfParams {
  tenantName: string;
  customerReferenceName: string;
  // Tekel/market bayilerinde sipariş kapıda teslim ediliyor; telefon ve adres
  // fişte yazmazsa kurye elindeki kağıtla kime nereye gideceğini bilmiyordu.
  // Toptan bayilerde bu alanlar boş gelebilir, o yüzden opsiyonel.
  customerPhone?: string | null;
  customerAddress?: string | null;
  orderNumber: string;
  // Fişte görünen kısa numara (#100042). Uzun orderNumber yalnız dosya adı.
  orderNo?: number | null;
  orderDate: Date;
  items: CartItem[];
  paymentSummary: CartPaymentSummary | null;
  paymentMethodLabel: string | null;
  note?: string | null;
  catalogMode?: boolean;
}

const PDF_FONT = "Roboto";
const SOFT_BORDER = [229, 231, 235] as [number, number, number];
const PRODUCT_COLUMN_WIDTH_MM = 82;
const PRODUCT_CELL_HORIZONTAL_PADDING_MM = 5;
const PDF_FONT_SIZE = {
  tenantTitle: 19,
  headerMeta: 12,
  sectionTitle: 16,
  tableBody: 10.5,
  tableHead: 11,
  summary: 12,
  summaryBold: 13,
  body: 12,
  footer: 11,
} as const;
const PDF_SPACING = {
  headerBlock: 26,
  summaryLine: 8.5,
  wrappedLine: 6.5,
  tableMinCellHeight: 9.5,
  tableCellPaddingVertical: 3.5,
} as const;
const RECEIPT_TIMEZONE = "Europe/Istanbul";

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
    timeZone: RECEIPT_TIMEZONE,
  }).format(date);
}

function formatOrderTime(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: RECEIPT_TIMEZONE,
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
  doc.setFontSize(PDF_FONT_SIZE.tenantTitle);
  doc.text(params.tenantName, margin, cursorY + 8);

  setPdfFont(doc, "normal");
  doc.setFontSize(PDF_FONT_SIZE.headerMeta);
  const headerRightX = pageWidth - margin;
  doc.text(`Tarih: ${formatOrderDate(params.orderDate)}`, headerRightX, cursorY + 4, {
    align: "right",
  });
  doc.text(`Saat: ${formatOrderTime(params.orderDate)}`, headerRightX, cursorY + 11, {
    align: "right",
  });
  if (typeof params.orderNo === "number") {
    setPdfFont(doc, "bold");
    doc.text(`Sipariş No: #${params.orderNo}`, headerRightX, cursorY + 18, { align: "right" });
    setPdfFont(doc, "normal");
  }
  doc.text(
    `Müşteri / Cari: ${params.customerReferenceName.trim()}`,
    margin,
    cursorY + 17,
  );

  cursorY += PDF_SPACING.headerBlock;

  // Telefon ve adres, varsa müşteri satırının hemen altına. Adres uzun
  // olabildiği için sayfa genişliğine sarılıyor; sarılmazsa jsPDF metni
  // kenardan taşırıp kırpıyor.
  const contactLines: string[] = [];
  const customerPhone = params.customerPhone?.trim();
  if (customerPhone) contactLines.push(`Telefon: ${customerPhone}`);
  const customerAddress = params.customerAddress?.trim();
  if (customerAddress) {
    const wrapped = doc.splitTextToSize(
      `Adres: ${customerAddress}`,
      pageWidth - margin * 2,
    ) as string[];
    contactLines.push(...wrapped);
  }

  if (contactLines.length > 0) {
    doc.setFontSize(PDF_FONT_SIZE.headerMeta);
    for (const line of contactLines) {
      doc.text(line, margin, cursorY);
      cursorY += 5;
    }
    cursorY += 3;
  }

  doc.setDrawColor(...SOFT_BORDER);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 10;

  setPdfFont(doc, "bold");
  doc.setFontSize(PDF_FONT_SIZE.sectionTitle);
  doc.text("Sipariş Fişi", margin, cursorY);
  cursorY += 8;

  const catalogMode = params.catalogMode ?? false;

  autoTable(doc, {
    startY: cursorY,
    head: [getOrderReceiptTableHead(catalogMode)],
    body: getOrderReceiptTableRows(params.items, catalogMode),
    theme: "striped",
    styles: {
      font: PDF_FONT,
      fontStyle: "normal",
      fontSize: PDF_FONT_SIZE.tableBody,
      cellPadding: {
        top: PDF_SPACING.tableCellPaddingVertical,
        right: 2.5,
        bottom: PDF_SPACING.tableCellPaddingVertical,
        left: 2.5,
      },
      overflow: "linebreak",
      minCellHeight: PDF_SPACING.tableMinCellHeight,
      lineColor: SOFT_BORDER,
      lineWidth: 0.15,
      textColor: [15, 23, 42],
      valign: "top",
    },
    headStyles: {
      font: PDF_FONT,
      fontStyle: "bold",
      fontSize: PDF_FONT_SIZE.tableHead,
      fillColor: [248, 250, 252],
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [252, 252, 253],
    },
    columnStyles: catalogMode
      ? {
          0: { cellWidth: PRODUCT_COLUMN_WIDTH_MM + 40, overflow: "linebreak" },
          1: { cellWidth: 24, halign: "center" },
          2: { cellWidth: 24, halign: "right" },
        }
      : {
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
        data.cell.styles.fontSize ?? PDF_FONT_SIZE.tableBody,
      );
    },
  });

  const tableEndY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ??
    cursorY + 20;
  cursorY = tableEndY + 12;

  if (!catalogMode && params.paymentSummary) {
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

    if (summary.campaignDiscountAmount > 0 && summary.appliedCampaign) {
      summaryLines.push({
        label: `Kampanya (${summary.appliedCampaign.title})`,
        value: `-${formatReceiptMoney(summary.campaignDiscountAmount, currency)}`,
      });
    }

    if (summary.couponDiscountAmount > 0) {
      summaryLines.push({
        label: "Size özel kupon",
        value: `-${formatReceiptMoney(summary.couponDiscountAmount, currency)}`,
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
        doc.setFontSize(PDF_FONT_SIZE.summaryBold);
      } else {
        setPdfFont(doc, "normal");
        doc.setFontSize(PDF_FONT_SIZE.summary);
      }

      doc.text(line.label, summaryX - 52, cursorY, { align: "right" });
      doc.text(line.value, summaryX, cursorY, { align: "right" });
      cursorY += PDF_SPACING.summaryLine;
    }

    if (params.paymentMethodLabel) {
      cursorY += 4;
      setPdfFont(doc, "normal");
      doc.setFontSize(PDF_FONT_SIZE.body);
      doc.text(`Ödeme: ${params.paymentMethodLabel}`, margin, cursorY);
      cursorY += 7;

      for (const campaignNote of buildAppliedCampaignBenefitNotes(summary)) {
        const campaignNoteLines = doc.splitTextToSize(campaignNote, pageWidth - margin * 2);
        doc.text(campaignNoteLines, margin, cursorY, { lineHeightFactor: 1.35 });
        cursorY += campaignNoteLines.length * PDF_SPACING.wrappedLine + 2;
      }
    }
  } else if (catalogMode) {
    setPdfFont(doc, "normal");
    doc.setFontSize(PDF_FONT_SIZE.body);
    if (params.paymentMethodLabel) {
      doc.text(`Ödeme: ${params.paymentMethodLabel}`, margin, cursorY);
      cursorY += 7;
    }
    doc.text("Fiyatsız katalog siparişi", margin, cursorY);
    cursorY += 7;
  }

  const trimmedNote = params.note?.trim();
  if (trimmedNote) {
    const noteLines = doc.splitTextToSize(`Not: ${trimmedNote}`, pageWidth - margin * 2);
    doc.text(noteLines, margin, cursorY, { lineHeightFactor: 1.35 });
    cursorY += noteLines.length * PDF_SPACING.wrappedLine;
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
  doc.setFontSize(PDF_FONT_SIZE.footer);
  doc.text(footerWarning, pageWidth / 2, footerY, { align: "center" });
  doc.setTextColor(15, 23, 42);

  const pdfOutput = doc.output("arraybuffer");
  return new Uint8Array(pdfOutput);
}
