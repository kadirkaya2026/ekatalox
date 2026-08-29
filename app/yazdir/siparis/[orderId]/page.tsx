// Fiş yazıcısı (58 / 80 mm termal) için sipariş fişi. Panel layout'unun
// DIŞINDA: kenar çubuğu, başlık yok; yalnız fiş + üstte küçük kontrol şeridi.
// Yetki: panel oturumu (requireTenantAdminPage) + siparişin tenant'a aitliği.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";
import { appEnv } from "@/lib/env";
import { getTenantOrderWithEvents } from "@/lib/orders/data";
import { formatOrderNo, formatPaymentMethod } from "@/lib/orders/format";
import { getStatusLabel } from "@/lib/orders/status";
import { formatCurrency } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/products/constants";
import { ReceiptPrintControls } from "@/components/print/receipt-print-controls";

export const metadata: Metadata = { title: "Sipariş fişi", robots: { index: false, follow: false } };

type Props = { params: Promise<{ orderId: string }>; searchParams?: Promise<{ w?: string; preview?: string }> };

function fmt(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
}

export default async function OrderReceiptPrintPage(props: Props) {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const { orderId } = await props.params;
  const search = (await props.searchParams) ?? {};
  const width: 58 | 80 = search.w === "58" ? 58 : 80;

  const result = await getTenantOrderWithEvents(tenant.id, orderId);
  if (!result) notFound();
  const { order } = result;
  const settings = await getTenantStorefrontSettings(tenant.id);
  const storeName = settings.storefront_title?.trim() || tenant.company_name;

  const origin = tenant.custom_domain?.trim()
    ? `https://${tenant.custom_domain.trim()}`
    : `https://${tenant.subdomain}.${appEnv.rootDomain}`;
  const trackingUrl = order.tracking_token ? `${origin}/siparis/${order.tracking_token}` : null;
  const qr = trackingUrl ? await QRCode.toDataURL(trackingUrl, { margin: 0, width: 220, errorCorrectionLevel: "M" }) : null;

  const money = (v: number) => (order.currency === "CATALOG" ? "" : formatCurrency(v, order.currency as CurrencyCode));
  const paperMm = width === 80 ? 72 : 48;
  const fontPx = width === 80 ? 12.5 : 11;
  const payment = formatPaymentMethod(order.payment_method);

  return (
    <div className="receipt" style={{ width: `${paperMm}mm`, fontSize: fontPx }}>
      <style>{`
        @page { size: ${width}mm auto; margin: 3mm 2mm; }
        html, body { background: #fff !important; color: #000 !important; }
        .receipt { margin: 52px auto 24px; font-family: "Courier New", ui-monospace, Menlo, monospace; line-height: 1.35; color: #000; }
        .receipt .c { text-align: center; }
        .receipt .b { font-weight: 700; }
        .receipt .xl { font-size: 1.5em; }
        .receipt .lg { font-size: 1.2em; }
        .receipt hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
        .receipt .row { display: flex; justify-content: space-between; gap: 6px; }
        .receipt .row span:last-child { white-space: nowrap; }
        .receipt .item { margin: 3px 0; }
        .receipt .sub { opacity: .8; font-size: .92em; }
        .receipt img { display: block; margin: 6px auto 2px; width: ${width === 80 ? 30 : 22}mm; height: auto; }
        @media print { .no-print { display: none !important; } .receipt { margin: 0 auto; } }
      `}</style>
      <ReceiptPrintControls width={width} autoPrint={search.preview !== "1"} />

      <div className="c b lg">{storeName}</div>
      {tenant.whatsapp_number ? <div className="c sub">{tenant.whatsapp_number}</div> : null}
      <hr />
      <div className="c b xl">SİPARİŞ {formatOrderNo(order)}</div>
      <div className="row"><span>{fmt(order.created_at)}</span><span>{payment ?? ""}</span></div>
      <div className="row"><span>Durum</span><span>{getStatusLabel(order.status, { isTekel: Boolean(tenant.is_tekel) })}</span></div>
      <hr />
      <div className="b">{order.customer_name}</div>
      {order.customer_phone ? <div>{order.customer_phone}</div> : null}
      {order.customer_address && !tenant.is_tekel ? <div>{order.customer_address}</div> : null}
      {tenant.is_tekel ? <div className="sub">Mağazadan elden teslim</div> : null}
      <hr />
      {order.items.map((item, i) => {
        const line = item.price !== null ? item.price * item.quantity : null;
        return (
          <div className="item" key={i}>
            <div className="row">
              <span>
                {item.quantity} x {item.product_name}
                {item.variant_name ? ` (${item.variant_name})` : ""}
                {item.sales_unit && item.sales_unit !== "adet" ? ` · ${item.sales_unit}` : ""}
              </span>
              <span>{line !== null ? money(line) : ""}</span>
            </div>
            {item.price !== null && item.quantity > 1 ? <div className="sub">  {money(item.price)} / birim</div> : null}
          </div>
        );
      })}
      <hr />
      <div className="row b lg"><span>TOPLAM</span><span>{order.currency === "CATALOG" ? `${order.item_count} kalem` : money(order.total_amount)}</span></div>
      {payment ? <div className="row"><span>Ödeme</span><span>{payment}</span></div> : null}
      {order.note ? (<><hr /><div className="b">Not:</div><div>{order.note}</div></>) : null}
      {qr ? (
        <>
          <hr />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Sipariş takip" />
          <div className="c sub">Sipariş takibi için okutun</div>
        </>
      ) : null}
      <hr />
      <div className="c sub">Teşekkür ederiz · {storeName}</div>
    </div>
  );
}
