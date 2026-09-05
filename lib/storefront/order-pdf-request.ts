export const ORDER_PDF_REQUEST_TIMEOUT_MS = 30_000;
export const ORDER_PDF_ERROR_MESSAGE = "PDF hazırlanamadı.";

export class OrderPdfRequestError extends Error {
  readonly requestId: string;
  readonly reason: string;
  readonly statusCode?: number;
  readonly apiError?: string;

  constructor(params: {
    requestId: string;
    reason: string;
    statusCode?: number;
    apiError?: string;
  }) {
    super(ORDER_PDF_ERROR_MESSAGE);
    this.name = "OrderPdfRequestError";
    this.requestId = params.requestId;
    this.reason = params.reason;
    this.statusCode = params.statusCode;
    this.apiError = params.apiError;
  }
}

export function logOrderPdfClientEvent(
  level: "info" | "error",
  event: string,
  details: Record<string, unknown>,
) {
  const payload = {
    scope: "order-pdf-client",
    event,
    at: new Date().toISOString(),
    ...details,
  };

  if (level === "error") {
    console.error("[order-pdf-client]", payload);
    return;
  }

  console.info("[order-pdf-client]", payload);
}

async function parseApiError(response: Response) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error?.trim() || response.statusText || "Bilinmeyen API hatası";
  } catch {
    return response.statusText || "Yanıt okunamadı";
  }
}

export async function requestOrderReceiptPdf(params: {
  requestId: string;
  body: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<{ pdfUrl: string; orderNumber?: string; trackingUrl?: string | null; locationUrl?: string | null }> {
  const timeoutMs = params.timeoutMs ?? ORDER_PDF_REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();

  logOrderPdfClientEvent("info", "request_started", {
    requestId: params.requestId,
    itemCount: Array.isArray(params.body.items) ? params.body.items.length : null,
    paymentMethod: params.body.paymentMethod,
    subdomain: params.body.subdomain,
    timeoutMs,
  });

  try {
    const response = await fetch("/api/storefront/generate-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-order-pdf-request-id": params.requestId,
      },
      body: JSON.stringify(params.body),
      signal: controller.signal,
    });

    const durationMs = Math.round(performance.now() - startedAt);

    if (!response.ok) {
      const apiError = await parseApiError(response);
      logOrderPdfClientEvent("error", "request_failed", {
        requestId: params.requestId,
        durationMs,
        statusCode: response.status,
        apiError,
      });
      throw new OrderPdfRequestError({
        requestId: params.requestId,
        reason: "api_error",
        statusCode: response.status,
        apiError,
      });
    }

    const data = (await response.json()) as {
      pdfUrl?: string;
      orderNumber?: string;
      trackingUrl?: string | null;
      locationUrl?: string | null;
    };
    const pdfUrl = data.pdfUrl?.trim();

    if (!pdfUrl) {
      logOrderPdfClientEvent("error", "request_failed", {
        requestId: params.requestId,
        durationMs,
        reason: "missing_pdf_url",
      });
      throw new OrderPdfRequestError({
        requestId: params.requestId,
        reason: "missing_pdf_url",
        statusCode: response.status,
      });
    }

    logOrderPdfClientEvent("info", "request_succeeded", {
      requestId: params.requestId,
      durationMs,
      orderNumber: data.orderNumber ?? null,
    });

    return {
      pdfUrl,
      orderNumber: data.orderNumber,
      trackingUrl: data.trackingUrl ?? null,
      locationUrl: data.locationUrl ?? null,
    };
  } catch (error) {
    if (error instanceof OrderPdfRequestError) {
      throw error;
    }

    const durationMs = Math.round(performance.now() - startedAt);
    const isTimeout = error instanceof DOMException && error.name === "AbortError";

    logOrderPdfClientEvent("error", "request_failed", {
      requestId: params.requestId,
      durationMs,
      reason: isTimeout ? "timeout" : "network_or_runtime",
      message: error instanceof Error ? error.message : String(error),
    });

    throw new OrderPdfRequestError({
      requestId: params.requestId,
      reason: isTimeout ? "timeout" : "network_or_runtime",
      apiError: error instanceof Error ? error.message : String(error),
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}
