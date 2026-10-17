"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, Lock, MessageCircle, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { readOnlinePaymentWhatsAppHref } from "@/lib/storefront/online-payment-handoff";

type PaymentStatus = "awaiting" | "paid" | "failed";

interface OnlinePaymentViewProps {
  subdomain: string;
  token: string;
  storeName: string;
  /** Sağlayıcının sayfasından ?sonuc= ile dönüldü: sonuç yoklanır. */
  returnedFromProvider: boolean;
  order: {
    orderNo: number | null;
    totalAmount: number;
    itemCount: number;
    customerName: string;
    paymentStatus: PaymentStatus;
    cancelled: boolean;
  };
}

// Online ödeme sayfası (0185). Kart bilgisi burada GİRİLMEZ: iyzico / Paynet
// kendi sayfasına yönlendirir, PayTR kendi güvenli çerçevesini (iframe) açar.
export function OnlinePaymentView({ subdomain, token, storeName, returnedFromProvider, order }: OnlinePaymentViewProps) {
  const [status, setStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [email, setEmail] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [checking, setChecking] = useState(returnedFromProvider && order.paymentStatus !== "paid");
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [whatsappHref, setWhatsappHref] = useState<string | null>(null);

  useEffect(() => {
    // Sepette hazırlanan WhatsApp mesajı (bkz. storefront-client); aynı cihazda varsa.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWhatsappHref(readOnlinePaymentWhatsAppHref(token));
  }, [token]);

  const poll = useCallback(async () => {
    const response = await fetch(`/api/storefront/payments/status?token=${token}`, { cache: "no-store" }).catch(
      () => null,
    );
    if (!response?.ok) return null;
    const data = (await response.json()) as {
      paymentStatus: PaymentStatus | null;
      attempt: { status: string; error: string | null } | null;
    };
    if (data.paymentStatus) setStatus(data.paymentStatus);
    if (data.attempt?.status === "failed") setAttemptError(data.attempt.error);
    return data;
  }, [token]);

  // Sağlayıcıdan dönüş ya da PayTR çerçevesi açıkken sonucu yokla.
  useEffect(() => {
    if (status === "paid") return;
    if (!checking && !iframeUrl) return;
    let stopped = false;
    let tries = 0;
    const tick = async () => {
      if (stopped) return;
      tries += 1;
      const data = await poll();
      if (stopped) return;
      const settled = data?.paymentStatus === "paid" || data?.attempt?.status === "failed";
      if (settled || (checking && !iframeUrl && tries >= 20)) {
        setChecking(false);
        return;
      }
      window.setTimeout(tick, 3000);
    };
    void tick();
    return () => {
      stopped = true;
    };
  }, [checking, iframeUrl, poll, status]);

  async function startPayment(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setAttemptError(null);
    setStarting(true);
    try {
      const response = await fetch("/api/storefront/payments/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain, token, email: email.trim() }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        status?: string;
        mode?: "redirect" | "iframe";
        url?: string;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Ödeme başlatılamadı.");
        return;
      }
      if (data.status === "paid") {
        setStatus("paid");
        return;
      }
      if (data.mode === "iframe" && data.url) {
        setIframeUrl(data.url);
        return;
      }
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      setError("Ödeme başlatılamadı.");
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setStarting(false);
    }
  }

  const total = formatCurrency(order.totalAmount, "TRY");
  const orderLabel = order.orderNo ? `Sipariş #${order.orderNo}` : "Siparişiniz";

  if (status === "paid") {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-sm">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <h1 className="mt-3 text-xl font-bold">Ödemeniz alındı</h1>
        <p className="mt-2 text-sm text-slate-600">
          {orderLabel} için {total} ödemeniz {storeName} hesabına geçti. Teşekkür ederiz.
        </p>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
          >
            <MessageCircle className="size-4" /> Siparişi WhatsApp&apos;tan mağazaya bildir
          </a>
        ) : null}
      </section>
    );
  }

  if (order.cancelled) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <XCircle className="mx-auto size-10 text-slate-400" />
        <h1 className="mt-3 text-lg font-bold">Bu sipariş iptal edilmiş</h1>
        <p className="mt-2 text-sm text-slate-600">Ödeme alınamaz. Sorunuz varsa mağazayla iletişime geçin.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{orderLabel}</p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Online ödeme</h1>
            <p className="text-sm text-slate-500">
              {order.itemCount} ürün · {storeName}
            </p>
          </div>
          <p className="text-2xl font-bold tracking-tight">{total}</p>
        </div>
      </div>

      {checking ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <Loader2 className="size-4 animate-spin" /> Ödeme sonucu kontrol ediliyor…
        </div>
      ) : null}

      {attemptError || status === "failed" ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Ödeme tamamlanmadı.</p>
          <p className="mt-1">{attemptError ?? "Kart ödemesi onaylanmadı."} Tekrar deneyebilirsiniz.</p>
        </div>
      ) : null}

      {iframeUrl ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <iframe
            src={iframeUrl}
            title="Güvenli ödeme"
            className="h-[720px] w-full"
            allow="payment"
          />
        </div>
      ) : (
        <form onSubmit={startPayment} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">E-posta (ödeme makbuzu için)</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ornek@eposta.com"
              autoComplete="email"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-slate-500"
            />
          </label>
          {error ? <p className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={starting}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {starting ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
            {total} öde
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <Lock className="size-3.5" /> Kart bilgileriniz ödeme kuruluşunun güvenli sayfasında girilir.
          </p>
        </form>
      )}
    </section>
  );
}
