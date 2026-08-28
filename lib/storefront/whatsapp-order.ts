export interface WhatsAppOrderHandoff {
  href: string;
  message: string;
  pdfIncluded: boolean;
  trackingUrl?: string | null;
}

export function buildWhatsAppOrderHref(params: {
  phone: string;
  message: string;
  directToRegisteredNumber: boolean;
}): string {
  const text = encodeURIComponent(params.message);

  if (params.directToRegisteredNumber) {
    const digits = params.phone.replace(/\D/g, "");
    return `https://wa.me/${digits}?text=${text}`;
  }

  return `https://wa.me/?text=${text}`;
}

export function buildWhatsAppOrderHandoff(params: {
  phone: string;
  message: string;
  directToRegisteredNumber: boolean;
  pdfIncluded: boolean;
  trackingUrl?: string | null;
}): WhatsAppOrderHandoff {
  return {
    href: buildWhatsAppOrderHref({
      phone: params.phone,
      message: params.message,
      directToRegisteredNumber: params.directToRegisteredNumber,
    }),
    message: params.message,
    pdfIncluded: params.pdfIncluded,
    trackingUrl: params.trackingUrl ?? null,
  };
}
