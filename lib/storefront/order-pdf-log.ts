export function logOrderPdfServerEvent(
  level: "info" | "error",
  event: string,
  details: Record<string, unknown>,
) {
  const payload = {
    scope: "generate-pdf",
    event,
    at: new Date().toISOString(),
    ...details,
  };

  if (level === "error") {
    console.error("[generate-pdf]", payload);
    return;
  }

  console.info("[generate-pdf]", payload);
}

export function getOrderPdfRequestId(request: Request) {
  return request.headers.get("x-order-pdf-request-id")?.trim() || null;
}

export function serializeOrderPdfError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { message: String(error) };
}
