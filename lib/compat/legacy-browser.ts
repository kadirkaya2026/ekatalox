// Eski iOS Safari kapısı.
//
// Next.js 16 kendi dokümanında (node_modules/next/dist/docs/03-architecture/
// supported-browsers.md) asgari Safari 16.4 diyor. Derlenen JS'te
// `class X { static { ... } }` blokları vardı; eski Safari bunu ayrıştıramayıp
// SyntaxError atıyor, chunk komple ölüyor ve React hiç hidrasyona geçmiyordu.
// BU TARAF ÇÖZÜLDÜ: package.json'daki browserslist Safari 15.4'e derliyor,
// static blok kalmadı ve JS artık iOS 13'te bile çalışıyor (elle doğrulandı —
// iPhone 11 / iOS 13.3'te şifre girilip vitrin gezilebildi).
//
// Kırılan ASIL taraf CSS: Tailwind'in ürettiği 183 KB'lık stilin tamamı
// @layer blokları içinde (theme/base/components/utilities/properties) ve
// @layer Safari 15.4'te geldi. Eski Safari bilmediği bir at-kuralını bloğuyla
// birlikte tamamen attığı için stil sıfırlanıyor. Sonuç: sayfa ÇALIŞIYOR ama
// ürün kartları, yazılar ve düğmeler iç içe geçmiş halde görünüyor — müşteri
// pratikte alışveriş yapamıyor. Kendi telefonlarımız güncel olduğu için bunu
// göremiyorduk; bir tekel müşterisinin telefonunda ortaya çıktı (5 Eyl 2026).
//
// Eşik neden tam 15.4:
// Hem CSS hem JS tarafındaki gerçek taban aynı sürümde buluşuyor.
//   - CSS: Tailwind çıktısı @layer kullanıyor (Safari 15.4) ve dvh/svh
//     birimleri geçiyor (Safari 15.4). Daha yenisini isteyen bir şey yok:
//     @container ve :has() hiç kullanılmıyor. @property için Tailwind zaten
//     @supports yedeği üretiyor, color-mix() kullanımlarının da düz renk
//     fallback'i var — ikisi de eski Safari'de sorunsuz düşüyor.
//   - JS: browserslist Safari 15.4'e derliyor, static blok kalmıyor.
//     Kalan modern API'ler (Object.hasOwn, Array#at, Array#findLast) yine
//     15.4'te geliyor.
//   - 15.4 ALTINDA @layer düşüyor ve Tailwind'in tamamı çöpe gidiyor; sayfa
//     komple stilsiz kalıyor. iPhone 11/iOS 13 ve iPhone 12/iOS 14'te
//     BrowserStack'te birebir bu görüldü.
// iPhone 6s/7/SE(1) gibi en fazla iOS 15.8'e çıkabilen telefonlar bu sayede
// uyarı görmek yerine gerçekten sipariş verebiliyor (iPhone 13/iOS 15'te
// elle doğrulandı, 5 Eyl 2026).
export const MIN_SUPPORTED_IOS_MAJOR = 15;
export const MIN_SUPPORTED_IOS_MINOR = 4;

export const LEGACY_BROWSER_COOKIE = "ekatalox-eski-tarayici";
export const LEGACY_BROWSER_BYPASS_PARAM = "eskiTarayici";
export const LEGACY_BROWSER_BYPASS_VALUE = "devam";
export const LEGACY_BROWSER_COOKIE_MAX_AGE = 60 * 60 * 24;

// Arama motorları ve link önizleyicileri kapıya takılmamalı: SEO'yu
// bozmasın, WhatsApp'ta paylaşılan link kartı bozulmasın.
const BOT_PATTERN =
  /bot|crawl|spider|slurp|googlebot|bingbot|yandex|duckduck|facebookexternalhit|whatsapp|telegram|twitterbot|linkedin|embedly|preview|lighthouse|headless|pingdom|uptime/i;

// "iPhone OS 15_7 like Mac OS X" / iPad'de "CPU OS 16_3 like Mac OS X".
const IOS_VERSION_PATTERN = /\b(?:iPhone OS|iPhone_OS|CPU OS)\s+(\d+)[._](\d+)/i;

export function isUnsupportedIosBrowser(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  if (BOT_PATTERN.test(userAgent)) return false;
  if (!/iPhone|iPad|iPod/i.test(userAgent)) return false;

  const match = IOS_VERSION_PATTERN.exec(userAgent);
  // Sürüm okunamıyorsa engelleme: yanlış pozitif, çalışan bir telefonu
  // dükkânın dışında bırakmaktan iyidir.
  if (!match) return false;

  const major = Number(match[1]);
  const minor = Number(match[2]);
  if (!Number.isFinite(major) || !Number.isFinite(minor)) return false;

  if (major > MIN_SUPPORTED_IOS_MAJOR) return false;
  if (major < MIN_SUPPORTED_IOS_MAJOR) return true;
  return minor < MIN_SUPPORTED_IOS_MINOR;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}

// wa.me ve tel: için sadece rakam. Numara başında 0 varsa Türkiye kodu
// eklenir; zaten 90 ile başlıyorsa dokunulmaz.
function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("5")) digits = `90${digits}`;
  else if (digits.length === 11 && digits.startsWith("0")) digits = `90${digits.slice(1)}`;
  return digits.length >= 10 ? digits : null;
}

export function renderLegacyBrowserNotice({
  companyName,
  whatsappNumber,
  continueHref,
}: {
  companyName?: string | null;
  whatsappNumber?: string | null;
  continueHref: string;
}): string {
  const name = escapeHtml((companyName ?? "").trim() || "Mağaza");
  const phone = normalizePhone(whatsappNumber);

  // Tailwind ve JS bu tarayıcılarda çalışmadığı için her şey satır içi stil
  // ve düz HTML. Hiçbir dış kaynak (font, script, stylesheet) yüklenmiyor.
  const contactBlock = phone
    ? `
      <p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#334155;">
        Güncelleyemiyorsanız siparişinizi doğrudan bize iletebilirsiniz:
      </p>
      <a href="https://wa.me/${phone}" style="display:block;margin:0 0 10px;padding:15px 18px;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:12px;font-size:17px;font-weight:bold;text-align:center;">WhatsApp'tan yaz</a>
      <a href="tel:+${phone}" style="display:block;margin:0 0 22px;padding:15px 18px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:12px;font-size:17px;font-weight:bold;text-align:center;">Telefonla ara</a>`
    : `
      <p style="margin:0 0 22px;font-size:16px;line-height:1.5;color:#334155;">
        Güncelleyemiyorsanız siparişinizi telefonla da verebilirsiniz.
      </p>`;

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>${name} — Telefonunuzu güncellemeniz gerekiyor</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:28px 20px 48px;">
    <div style="background:#ffffff;border-radius:18px;padding:26px 22px;box-shadow:0 10px 30px rgba(15,23,42,0.10);">

      <div style="width:62px;height:62px;margin:0 auto 18px;background:#fef3c7;border-radius:31px;text-align:center;line-height:62px;font-size:32px;">&#9888;</div>

      <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#0f172a;text-align:center;">
        Telefonunuzun yazılımı eski
      </h1>

      <p style="margin:0 0 18px;font-size:16px;line-height:1.55;color:#334155;">
        <strong>${name}</strong> sayfası telefonunuzda düzgün görüntülenmiyor. Ürünler,
        yazılar ve düğmeler iç içe geçtiği için alışveriş yapmanız çok zor olur.
        Bunun sebebi internet bağlantınız veya mağaza değil, telefonunuzdaki
        <strong>iOS sürümünün eski olması</strong>.
      </p>

      <div style="margin:0 0 20px;padding:16px 18px;background:#f8fafc;border-radius:12px;border-left:4px solid #f59e0b;">
        <p style="margin:0 0 8px;font-size:15px;font-weight:bold;color:#0f172a;">Nasıl düzeltirim?</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">
          Telefonunuzda <strong>Ayarlar</strong> &rarr; <strong>Genel</strong> &rarr;
          <strong>Yazılım Güncelleme</strong> adımlarını izleyip güncellemeyi kurun,
          sonra bu sayfayı yeniden açın.
        </p>
      </div>

      <p style="margin:0 0 22px;padding:14px 16px;background:#fef2f2;border-radius:12px;font-size:14px;line-height:1.6;color:#7f1d1d;">
        <strong>Not:</strong> iPhone'da Chrome, Firefox ve diğer tarayıcılar da Safari'nin
        motorunu kullanır. Bu yüzden başka bir tarayıcı denemek sonucu değiştirmez —
        güncelleme yapmak gerekir.
      </p>

      ${contactBlock}

      <p style="margin:0;text-align:center;">
        <a href="${escapeHtml(continueHref)}" style="font-size:14px;color:#64748b;">
          Yine de siteye girmeyi dene
        </a>
      </p>

    </div>
  </div>
</body>
</html>`;
}
