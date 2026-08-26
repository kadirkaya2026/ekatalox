// İstemci IP'si.
//
// SIRA ÖNEMLİ: ekatalox.com Cloudflare arkasında. Vercel'in gördüğü bağlantı
// Cloudflare'ın kenar sunucusu olduğu için x-forwarded-for'un ilk değeri
// ÇOĞU ZAMAN Cloudflare'ın kendi IP'sidir (172.71.x.x gibi) — gerçek müşteri
// değil. Gerçek istemci IP'sini Cloudflare cf-connecting-ip başlığında taşır;
// önce o okunur. (Bu başlık teoride Cloudflare'ı atlayan doğrudan isteklerde
// sahtelenebilir; buradaki kullanım spam freni olduğu için kabul edilebilir —
// yanlış Cloudflare IP'sini engelleyip masum müşterileri kesmekten iyidir.)
//
// Bulunamazsa null — çağıran taraf IP'siz istekte korumayı sessizce atlar,
// siparişi asla bloklamaz.
export function getClientIp(request: Request): string | null {
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;

  const forwardedFor = request.headers.get("x-forwarded-for");
  const first = forwardedFor?.split(",")[0]?.trim();
  if (first) return first;

  return request.headers.get("x-real-ip")?.trim() || null;
}
