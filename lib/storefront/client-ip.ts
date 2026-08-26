// İstemci IP'si: Vercel x-forwarded-for'un İLK değerine gerçek istemciyi koyar
// (sonrakiler proxy zinciri). x-real-ip yedek. Bulunamazsa null — çağıran
// taraf IP'siz istekte korumayı sessizce atlar, siparişi asla bloklamaz.
export function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const first = forwardedFor?.split(",")[0]?.trim();
  if (first) return first;
  return request.headers.get("x-real-ip")?.trim() || null;
}
