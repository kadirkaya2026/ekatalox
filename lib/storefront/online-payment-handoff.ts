// Online ödemeli siparişte sepette hazırlanan WhatsApp mesaj bağlantısı (0185).
// Müşteri ödeme sayfasına gidip döndüğünde "Siparişi WhatsApp'tan bildir"
// düğmesi aynı mesajı açsın diye sekmenin oturum belleğinde tutulur.
const key = (token: string) => `ek-online-wa:${token}`;

export function saveOnlinePaymentWhatsAppHref(token: string, href: string) {
  try {
    window.sessionStorage.setItem(key(token), href);
  } catch {
    // Gizli sekme / engelli depolama: düğme gösterilmez, sipariş yine kayıtlı.
  }
}

export function readOnlinePaymentWhatsAppHref(token: string) {
  try {
    return window.sessionStorage.getItem(key(token));
  } catch {
    return null;
  }
}

/** /siparis/{token} veya /odeme/{token} adresinden token'ı çıkarır. */
export function extractOrderToken(url: string | null | undefined) {
  const match = url?.match(/\/(?:siparis|odeme)\/([0-9a-f-]{36})/i);
  return match?.[1] ?? null;
}

/** Sepetten başlatılan PayTR çerçevesi: ödeme sayfası açılınca doğrudan gösterir. */
export function saveOnlinePaymentFrame(token: string, url: string) {
  try {
    window.sessionStorage.setItem(`ek-online-frame:${token}`, url);
  } catch {
    // depolama yoksa ödeme sayfası formu gösterir, müşteri oradan başlatır
  }
}

export function takeOnlinePaymentFrame(token: string) {
  try {
    const value = window.sessionStorage.getItem(`ek-online-frame:${token}`);
    window.sessionStorage.removeItem(`ek-online-frame:${token}`);
    return value;
  } catch {
    return null;
  }
}
