import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  IyzicoCredentials,
  PaynetCredentials,
  PaytrCredentials,
  ProviderCredentials,
} from "@/lib/payments/credentials";

// Online ödeme sağlayıcıları (0185, A modeli: mağazanın kendi hesabı).
// Kart bilgisi hiçbir zaman eKatalox'a gelmez: iyzico ve Paynet kendi ödeme
// sayfasına yönlendirilir, PayTR kendi iframe'ini gösterir. Sonuç her zaman
// sunucudan sağlayıcıya sorularak / imzası doğrulanarak işlenir.
//
// Kaynaklar (17 Eki 2026): iyzipay-node + docs.iyzico.com (IYZWSv2, CF),
// dev.paytr.com (iFrame API, Bildirim URL, durum-sorgu), doc.paynet.com.tr
// (mailorder / PayLink). Paynet sabit IP ister → PAYNET_PROXY_URL.

export type LoadedProvider = ProviderCredentials & { isTest: boolean };

export type VerifyResult = { ok: true } | { ok: false; error: string };

export interface StartPaymentParams {
  reference: string;
  amount: number;
  orderLabel: string;
  buyer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    ip: string;
    /** T.C. kimlik no (ödeme sayfasında zorunlu, doğrulanmış). */
    identityNumber: string;
  };
  installmentsEnabled: boolean;
  /** Sağlayıcının tarayıcıyı / bildirimini göndereceği adresler. */
  urls: { iyzicoCallback: string; paynetConfirm: string; returnOk: string; returnFail: string };
}

export type StartPaymentResult =
  | { ok: true; mode: "redirect" | "iframe"; url: string; providerToken: string | null }
  | { ok: false; error: string };

const TIMEOUT_MS = 20_000;

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function describeFetchError(error: unknown) {
  if (error instanceof Error && error.name === "TimeoutError") return "Sağlayıcı zamanında yanıt vermedi.";
  return "Sağlayıcıya bağlanılamadı.";
}

// ─── iyzico ────────────────────────────────────────────────────────────────

function iyzicoBase(isTest: boolean) {
  return isTest ? "https://sandbox-api.iyzipay.com" : "https://api.iyzipay.com";
}

/** iyzipay-node formatPrice: "100" → "100.0", "0.30" → "0.3". */
function iyzicoPrice(value: number) {
  const text = String(Number(value.toFixed(2)));
  return text.includes(".") ? text : `${text}.0`;
}

async function iyzicoRequest(
  creds: IyzicoCredentials,
  isTest: boolean,
  path: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const bodyText = JSON.stringify(body);
  const rnd = `${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
  const signature = createHmac("sha256", creds.secret_key).update(rnd + path + bodyText).digest("hex");
  const auth = Buffer.from(`apiKey:${creds.api_key}&randomKey:${rnd}&signature:${signature}`).toString("base64");
  const response = await fetch(`${iyzicoBase(isTest)}${path}`, {
    method: "POST",
    headers: {
      Authorization: `IYZWSv2 ${auth}`,
      "x-iyzi-rnd": rnd,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: bodyText,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}

function iyzicoError(result: Record<string, unknown>) {
  const message = typeof result.errorMessage === "string" ? result.errorMessage : "iyzico isteği reddetti.";
  return result.errorCode ? `${message} (kod ${String(result.errorCode)})` : message;
}

function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { name: parts[0] || "Müşteri", surname: parts[0] || "Müşteri" };
  return { name: parts.slice(0, -1).join(" "), surname: parts[parts.length - 1] };
}

/** iyzico gsmNumber: +90 ile. */
function iyzicoPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+9${digits}`;
  return digits.length === 10 ? `+90${digits}` : `+${digits}`;
}

async function startIyzico(
  creds: IyzicoCredentials,
  isTest: boolean,
  params: StartPaymentParams,
): Promise<StartPaymentResult> {
  const price = iyzicoPrice(params.amount);
  const { name, surname } = splitName(params.buyer.name);
  const address = params.buyer.address.trim() || "Adres belirtilmedi";
  const city = params.buyer.city.trim() || "İstanbul";
  const result = await iyzicoRequest(creds, isTest, "/payment/iyzipos/checkoutform/initialize/auth/ecom", {
    locale: "tr",
    conversationId: params.reference,
    price,
    paidPrice: price,
    currency: "TRY",
    basketId: params.reference,
    paymentGroup: "PRODUCT",
    callbackUrl: params.urls.iyzicoCallback,
    enabledInstallments: params.installmentsEnabled ? [1, 2, 3, 6, 9, 12] : [1],
    buyer: {
      id: params.reference,
      name,
      surname,
      identityNumber: params.buyer.identityNumber,
      email: params.buyer.email,
      gsmNumber: iyzicoPhone(params.buyer.phone),
      registrationAddress: address,
      city,
      country: "Turkey",
      ip: params.buyer.ip,
    },
    shippingAddress: { contactName: params.buyer.name || "Müşteri", city, country: "Turkey", address },
    billingAddress: { contactName: params.buyer.name || "Müşteri", city, country: "Turkey", address },
    basketItems: [
      { id: params.reference, name: params.orderLabel, category1: "Sipariş", itemType: "PHYSICAL", price },
    ],
  });
  if (result.status !== "success" || typeof result.paymentPageUrl !== "string") {
    return { ok: false, error: iyzicoError(result) };
  }
  return { ok: true, mode: "redirect", url: result.paymentPageUrl, providerToken: String(result.token ?? "") };
}

export type IyzicoRetrieveResult =
  | { status: "paid"; reference: string; amount: number }
  | { status: "failed"; reference: string | null; error: string }
  | { status: "pending" };

/** iyzico'nun callback'e gönderdiği token ile ödemenin gerçek sonucunu sorar. */
export async function retrieveIyzicoPayment(
  creds: IyzicoCredentials,
  isTest: boolean,
  token: string,
): Promise<IyzicoRetrieveResult> {
  const result = await iyzicoRequest(creds, isTest, "/payment/iyzipos/checkoutform/auth/ecom/detail", {
    locale: "tr",
    token,
  });
  const reference = typeof result.basketId === "string" ? result.basketId : null;
  if (result.status !== "success") {
    return { status: "failed", reference, error: iyzicoError(result) };
  }
  // Yanıt imzası: paymentStatus, paymentId, currency, basketId, conversationId, paidPrice, price, token.
  if (typeof result.signature === "string") {
    const parts = [
      result.paymentStatus,
      result.paymentId,
      result.currency,
      result.basketId,
      result.conversationId,
      result.paidPrice,
      result.price,
      result.token,
    ].map((value) => (value === undefined || value === null ? "" : String(value)));
    const expected = createHmac("sha256", creds.secret_key).update(parts.join(":")).digest("hex");
    if (!safeEqual(expected, result.signature)) {
      return { status: "failed", reference, error: "iyzico yanıt imzası doğrulanamadı." };
    }
  }
  if (result.paymentStatus !== "SUCCESS") {
    return { status: "failed", reference, error: iyzicoError(result) };
  }
  // Dolandırıcılık incelemesindeki ödeme (fraudStatus 0) henüz kesin değil.
  if (Number(result.fraudStatus) === 0) return { status: "pending" };
  if (Number(result.fraudStatus) === -1) {
    return { status: "failed", reference, error: "Ödeme iyzico güvenlik kontrolünden geçmedi." };
  }
  return { status: "paid", reference: reference ?? "", amount: Number(result.paidPrice ?? 0) };
}

async function verifyIyzico(creds: IyzicoCredentials, isTest: boolean): Promise<VerifyResult> {
  const result = await iyzicoRequest(creds, isTest, "/payment/iyzipos/installment", {
    locale: "tr",
    conversationId: "ekatalox-anahtar-testi",
    binNumber: "554960",
    price: "100.0",
  });
  return result.status === "success" ? { ok: true } : { ok: false, error: iyzicoError(result) };
}

// ─── PayTR ─────────────────────────────────────────────────────────────────

function paytrHmac(creds: PaytrCredentials, text: string) {
  return createHmac("sha256", creds.merchant_key).update(text).digest("base64");
}

async function paytrPost(url: string, fields: Record<string, string>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}

async function startPaytr(
  creds: PaytrCredentials,
  isTest: boolean,
  params: StartPaymentParams,
): Promise<StartPaymentResult> {
  const fields: Record<string, string> = {
    merchant_id: creds.merchant_id,
    user_ip: params.buyer.ip.slice(0, 39),
    merchant_oid: params.reference,
    email: params.buyer.email.slice(0, 100),
    payment_amount: String(Math.round(params.amount * 100)),
    user_basket: Buffer.from(JSON.stringify([[params.orderLabel, params.amount.toFixed(2), 1]])).toString("base64"),
    no_installment: params.installmentsEnabled ? "0" : "1",
    max_installment: "0",
    currency: "TL",
    test_mode: isTest ? "1" : "0",
  };
  const hashText =
    fields.merchant_id +
    fields.user_ip +
    fields.merchant_oid +
    fields.email +
    fields.payment_amount +
    fields.user_basket +
    fields.no_installment +
    fields.max_installment +
    fields.currency +
    fields.test_mode;
  const result = await paytrPost("https://www.paytr.com/odeme/api/get-token", {
    ...fields,
    paytr_token: paytrHmac(creds, hashText + creds.merchant_salt),
    user_name: (params.buyer.name || "Müşteri").slice(0, 60),
    user_address: (params.buyer.address || "Adres belirtilmedi").slice(0, 400),
    user_phone: (params.buyer.phone || "0").slice(0, 20),
    merchant_ok_url: params.urls.returnOk,
    merchant_fail_url: params.urls.returnFail,
    timeout_limit: "30",
    debug_on: "1",
    lang: "tr",
  });
  if (result.status !== "success" || typeof result.token !== "string") {
    return {
      ok: false,
      error: typeof result.reason === "string" ? `PayTR: ${result.reason}` : "PayTR isteği reddetti.",
    };
  }
  return {
    ok: true,
    mode: "iframe",
    url: `https://www.paytr.com/odeme/guvenli/${result.token}`,
    providerToken: result.token,
  };
}

/** PayTR Bildirim URL'ine gelen POST'un imzasını doğrular. */
export function verifyPaytrNotification(creds: PaytrCredentials, fields: Record<string, string>) {
  const expected = paytrHmac(
    creds,
    `${fields.merchant_oid ?? ""}${creds.merchant_salt}${fields.status ?? ""}${fields.total_amount ?? ""}`,
  );
  return safeEqual(expected, fields.hash ?? "");
}

async function verifyPaytr(creds: PaytrCredentials): Promise<VerifyResult> {
  // Olmayan bir siparişi sorgula: anahtarlar doğruysa "başarılı ödeme
  // bulunamadı" (004) döner, yanlışsa başka bir hata.
  const oid = `EKTEST${Date.now()}`;
  const result = await paytrPost("https://www.paytr.com/odeme/durum-sorgu", {
    merchant_id: creds.merchant_id,
    merchant_oid: oid,
    paytr_token: paytrHmac(creds, creds.merchant_id + oid + creds.merchant_salt),
  });
  if (result.status === "success" || String(result.err_no ?? "") === "004") return { ok: true };
  return {
    ok: false,
    error: typeof result.err_msg === "string" ? `PayTR: ${result.err_msg}` : "PayTR anahtarları doğrulanamadı.",
  };
}

// ─── Paynet ────────────────────────────────────────────────────────────────

function paynetBase(isTest: boolean) {
  return isTest ? "https://pts-api.paynet.com.tr" : "https://api.paynet.com.tr";
}

/**
 * Paynet yalnız izinli (sabit) IP'den gelen isteği kabul eder; Vercel'in sabit
 * çıkış IP'si yok. PAYNET_PROXY_URL tanımlıysa istek sabit IP'li vekil
 * sunucudan geçer: POST {proxy}/forward {url, headers, body} + x-proxy-secret.
 */
async function paynetRequest(
  creds: PaynetCredentials,
  isTest: boolean,
  path: string,
  body: Record<string, unknown>,
): Promise<{ status: number; data: Record<string, unknown> }> {
  const url = `${paynetBase(isTest)}${path}`;
  const headers = {
    Authorization: `Basic ${creds.secret_key}`,
    "Content-Type": "application/json; charset=UTF-8",
    Accept: "application/json",
  };
  const proxy = process.env.PAYNET_PROXY_URL?.trim();
  const response = proxy
    ? await fetch(`${proxy.replace(/\/$/, "")}/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-proxy-secret": process.env.PAYNET_PROXY_SECRET ?? "" },
        body: JSON.stringify({ url, headers, body }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      })
    : await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
  return { status: response.status, data: (await response.json().catch(() => ({}))) as Record<string, unknown> };
}

function paynetError(result: { status: number; data: Record<string, unknown> }) {
  if (result.status === 401 || Number(result.data.code) === 7) {
    return "Paynet anahtarı kabul etmedi. Anahtarı ve Paynet panelinde eKatalox IP adresinin izinli olduğunu kontrol edin.";
  }
  const message = typeof result.data.message === "string" ? result.data.message : "Paynet isteği reddetti.";
  return `Paynet: ${message}`;
}

async function startPaynet(
  creds: PaynetCredentials,
  isTest: boolean,
  params: StartPaymentParams,
): Promise<StartPaymentResult> {
  const result = await paynetRequest(creds, isTest, "/v1/mailorder/create", {
    name_surname: params.buyer.name || "Müşteri",
    amount: Number(params.amount.toFixed(2)),
    reference_no: params.reference,
    email: params.buyer.email,
    phone: params.buyer.phone,
    send_mail: false,
    send_sms: false,
    send_confirmation_mail: false,
    multi_payment: false,
    expire_date: 24,
    note: params.orderLabel,
    succeed_url: params.urls.returnOk,
    error_url: params.urls.returnFail,
    confirmation_url: params.urls.paynetConfirm,
    // Tek çekimde installments GÖNDERİLMEZ (ikisi birlikte 500 verir).
    ...(params.installmentsEnabled ? {} : { no_instalment: true }),
  });
  const url = typeof result.data.url === "string" ? result.data.url : null;
  if (Number(result.data.code) !== 0 || !url) return { ok: false, error: paynetError(result) };
  return { ok: true, mode: "redirect", url, providerToken: result.data.id ? String(result.data.id) : null };
}

export type PaynetRetrieveResult =
  | { status: "paid"; amount: number }
  | { status: "failed"; error: string }
  | { status: "pending" };

/** Paynet bildirimi imzasız gelir; sonuç her zaman işlem detayından sorulur. */
export async function retrievePaynetPayment(
  creds: PaynetCredentials,
  isTest: boolean,
  reference: string,
): Promise<PaynetRetrieveResult> {
  const result = await paynetRequest(creds, isTest, "/v1/transaction/detail", { reference_no: reference });
  const rows = (Array.isArray(result.data.Data) ? result.data.Data : []) as Array<Record<string, unknown>>;
  const paid = rows.find((row) => row.is_succeed === true && row.reversed !== true);
  if (paid) return { status: "paid", amount: Number(paid.amount ?? 0) };
  if (rows.length && rows.every((row) => row.is_succeed === false)) {
    return { status: "failed", error: "Kart ödemesi banka tarafından onaylanmadı." };
  }
  return { status: "pending" };
}

async function verifyPaynet(creds: PaynetCredentials, isTest: boolean): Promise<VerifyResult> {
  const result = await paynetRequest(creds, isTest, "/v1/ratio/Get", { amount: "10000" });
  return Number(result.data.code) === 0 && result.status < 400
    ? { ok: true }
    : { ok: false, error: paynetError(result) };
}

// ─── Ortak giriş noktaları ─────────────────────────────────────────────────

export async function verifyProviderCredentials(loaded: LoadedProvider): Promise<VerifyResult> {
  try {
    if (loaded.provider === "iyzico") return await verifyIyzico(loaded.credentials, loaded.isTest);
    if (loaded.provider === "paytr") return await verifyPaytr(loaded.credentials);
    return await verifyPaynet(loaded.credentials, loaded.isTest);
  } catch (error) {
    return { ok: false, error: describeFetchError(error) };
  }
}

export async function startProviderPayment(
  loaded: LoadedProvider,
  params: StartPaymentParams,
): Promise<StartPaymentResult> {
  try {
    if (loaded.provider === "iyzico") return await startIyzico(loaded.credentials, loaded.isTest, params);
    if (loaded.provider === "paytr") return await startPaytr(loaded.credentials, loaded.isTest, params);
    return await startPaynet(loaded.credentials, loaded.isTest, params);
  } catch (error) {
    return { ok: false, error: describeFetchError(error) };
  }
}
