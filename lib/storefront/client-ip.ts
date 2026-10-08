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

// Güvenlik açısından kritik frenler (vitrin şifre denemesi) için: cf-connecting-ip
// YALNIZ istek gerçekten Cloudflare kenarından geldiyse kabul edilir. Vercel
// x-forwarded-for'u kendisi yazar (istemcinin gönderdiğini ezer), ilk değer
// Vercel'e bağlanan eş = Cloudflare kenarı ya da (vercel.app'e doğrudan istekte)
// gerçek istemcidir. Doğrudan istekte sahte cf-connecting-ip böylece işe yaramaz.
const CLOUDFLARE_V4 = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22",
  "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20",
  "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
  "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
];
const CLOUDFLARE_V6 = [
  "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32",
  "2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32",
];

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const part of parts) {
    const v = Number(part);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

function ipv6ToBigInt(ip: string): bigint | null {
  if (!ip.includes(":")) return null;
  const [head, tail] = ip.split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail !== undefined && tail !== "" ? tail.split(":") : [];
  const missing = 8 - headParts.length - tailParts.length;
  if (missing < 0 || (tail === undefined && missing !== 0)) return null;
  const groups = [...headParts, ...Array(missing).fill("0"), ...tailParts];
  let n = BigInt(0);
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/i.test(g)) return null;
    n = (n << BigInt(16)) + BigInt(parseInt(g, 16));
  }
  return n;
}

function isCloudflareIp(ip: string): boolean {
  const v4 = ipv4ToInt(ip);
  if (v4 !== null) {
    return CLOUDFLARE_V4.some((cidr) => {
      const [base, bits] = cidr.split("/");
      const size = 2 ** (32 - Number(bits));
      const start = ipv4ToInt(base)!;
      return v4 >= start && v4 < start + size;
    });
  }
  const v6 = ipv6ToBigInt(ip);
  if (v6 === null) return false;
  return CLOUDFLARE_V6.some((cidr) => {
    const [base, bits] = cidr.split("/");
    const shift = BigInt(128 - Number(bits));
    return v6 >> shift === ipv6ToBigInt(base)! >> shift;
  });
}

export function getTrustedClientIp(request: Request): string | null {
  const peer =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    null;
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf && peer && isCloudflareIp(peer)) return cf;
  return peer;
}
