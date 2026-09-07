// User-Agent'tan kaba cihaz/tarayıcı/işletim sistemi çıkarımı + bot süzgeci.
// Kütüphane yok; rapor kırılımı için "Mobil / Chrome / Android" düzeyi yeter.

const BOT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp|telegrambot|twitterbot|linkedinbot|pinterest|embedly|quora|preview|headless|phantom|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|curl\/|wget\/|python-requests|axios\/|go-http-client|java\/|okhttp|scrapy|vercel-screenshot|ahrefs|semrush|mj12|dotbot|petalbot|bytespider|yandex|baidu|duckduck|applebot|bingpreview/i;

export function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent || userAgent.trim().length < 12) return true;
  return BOT_PATTERN.test(userAgent);
}

export interface ParsedUserAgent {
  device: "Mobil" | "Tablet" | "Masaüstü";
  browser: string;
  os: string;
}

export function parseUserAgent(userAgent: string | null): ParsedUserAgent {
  const ua = userAgent ?? "";

  const os = /iphone|ipod/i.test(ua)
    ? "iOS"
    : /ipad|macintosh.*mobile/i.test(ua)
      ? "iPadOS"
      : /android/i.test(ua)
        ? "Android"
        : /windows/i.test(ua)
          ? "Windows"
          : /mac os x|macintosh/i.test(ua)
            ? "macOS"
            : /cros/i.test(ua)
              ? "ChromeOS"
              : /linux/i.test(ua)
                ? "Linux"
                : "Bilinmiyor";

  const device: ParsedUserAgent["device"] = /ipad|tablet|(android(?!.*mobile))/i.test(ua)
    ? "Tablet"
    : /mobi|iphone|ipod|android/i.test(ua)
      ? "Mobil"
      : "Masaüstü";

  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /opr\/|opera/i.test(ua)
      ? "Opera"
      : /samsungbrowser/i.test(ua)
        ? "Samsung Internet"
        : /yabrowser/i.test(ua)
          ? "Yandex"
          : /firefox|fxios/i.test(ua)
            ? "Firefox"
            : /crios/i.test(ua)
              ? "Chrome (iOS)"
              : /chrome|chromium/i.test(ua)
                ? "Chrome"
                : /safari/i.test(ua)
                  ? "Safari"
                  : "Diğer";

  return { device, browser, os };
}

/** Yönlendiren adresin ana makinesi ("www." kırpılır). Geçersizse null. */
export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    return host.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}
