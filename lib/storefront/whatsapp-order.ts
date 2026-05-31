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
