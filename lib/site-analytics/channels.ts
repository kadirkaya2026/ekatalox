// Ziyaretçi kaynaklarını (utm_source ya da referrer host'u) okunur kanallara
// ayırır. site_analytics_referrers RPC'si kaynağı tek metin olarak döndürür:
// utm_source → referrer_host → "Doğrudan / yer imi". Hikâyeler sekmesindeki
// sınıflandırmayla (stories.ts) aynı mantık; burada pazarlama kanalı odaklı.

export type SiteChannel =
  | "search"
  | "ai"
  | "social"
  | "whatsapp"
  | "email"
  | "storefront"
  | "direct"
  | "other"
  | "panel"
  | "own_site"
  | "internal";

export const DIRECT_SOURCE = "Doğrudan / yer imi";

export interface SiteChannelInfo {
  label: string;
  /** Kullanıcıya "bu ne demek?" açıklaması. */
  description: string;
  /** Yeni müşteri getiren dış trafik mi (panel/test/iç gezinme değil)? */
  external: boolean;
  color: string;
}

export const CHANNEL_INFO: Record<SiteChannel, SiteChannelInfo> = {
  search: {
    label: "Arama motoru",
    description: "Google, Bing, Yandex'te arama yapıp sonuçlardan tıklayanlar.",
    external: true,
    color: "bg-sky-500",
  },
  ai: {
    label: "Yapay zekâ",
    description: "ChatGPT, Gemini, Claude gibi asistanların önerdiği bağlantıdan gelenler.",
    external: true,
    color: "bg-violet-500",
  },
  social: {
    label: "Sosyal medya",
    description: "Instagram, Facebook, YouTube, TikTok gibi yerlerdeki paylaşım ve reklamlardan gelenler.",
    external: true,
    color: "bg-pink-500",
  },
  whatsapp: {
    label: "WhatsApp",
    description: "WhatsApp Web'den bağlantıya tıklayanlar. Telefondaki WhatsApp kaynak bildirmez, “Doğrudan”da görünür.",
    external: true,
    color: "bg-green-500",
  },
  email: {
    label: "E-posta",
    description: "Gmail, Outlook gibi e-posta uygulamalarındaki bağlantıdan gelenler.",
    external: true,
    color: "bg-amber-500",
  },
  storefront: {
    label: "Müşteri vitrinleri",
    description: "Bir mağazanın vitrinindeki “eKatalox ile hazırlandı” gibi bağlantılardan gelenler.",
    external: true,
    color: "bg-teal-500",
  },
  direct: {
    label: "Doğrudan",
    description:
      "Adresi elle yazan, yer iminden açan ya da kaynak bildirmeyen uygulamalardan (telefondaki WhatsApp, Telegram, SMS, QR kod) gelenler.",
    external: true,
    color: "bg-slate-500",
  },
  other: {
    label: "Diğer siteler",
    description: "Başka bir sitedeki bağlantıdan gelenler.",
    external: true,
    color: "bg-orange-500",
  },
  panel: {
    label: "Bayi paneli (mevcut müşteri)",
    description: "app.ekatalox.com'dan giriş sayfasına düşen mevcut müşteriler (oturumu kapanan, çıkış yapan). Yeni ziyaretçi değildir.",
    external: false,
    color: "bg-indigo-400",
  },
  own_site: {
    label: "Site içi geçiş",
    description: "ekatalox.com içinde bir sayfadan diğerine geçerken yeni oturum açanlar (çoğu “Giriş” düğmesi). Yeni ziyaretçi değildir.",
    external: false,
    color: "bg-slate-300",
  },
  internal: {
    label: "Sen / test",
    description: "admin.ekatalox.com ve localhost: kendi denemelerin. Yeni ziyaretçi değildir.",
    external: false,
    color: "bg-rose-300",
  },
};

const AI = /chatgpt|openai|gemini|bard|claude|anthropic|perplexity|copilot|deepseek|grok|meta\.ai|you\.com|phind|poe\.com/i;
const SEARCH = /(^|\.)(google|bing|yandex|duckduckgo|yahoo|ecosia|brave)\.|^(google|bing|yandex)$/i;
const SOCIAL = /instagram|facebook|fb\.|^ig$|youtube|youtu\.be|tiktok|twitter|^t\.co$|(^|\.)x\.com$|linkedin|pinterest|threads|reddit|telegram|^tg$/i;
const WHATSAPP = /whatsapp|wa\.me/i;
const EMAIL = /mail|com\.google\.android\.gm|outlook|^gm$|newsletter|e-?posta/i;
const INTERNAL = /^(admin\.ekatalox\.com|localhost|127\.0\.0\.1)$|\.localhost$|^localhost:/i;
const EKATALOX_SUB = /^([a-z0-9-]+)\.ekatalox\.com$/i;

/** RPC'nin tek metin kaynağını kanala çevirir. */
export function classifySiteSource(source: string | null | undefined): SiteChannel {
  const s = (source ?? "").trim().toLowerCase();
  if (!s || s === DIRECT_SOURCE.toLowerCase()) return "direct";
  if (INTERNAL.test(s)) return "internal";
  if (s === "app.ekatalox.com") return "panel";
  if (s === "ekatalox.com" || s === "www.ekatalox.com") return "own_site";
  if (AI.test(s)) return "ai";
  if (WHATSAPP.test(s)) return "whatsapp";
  if (EMAIL.test(s)) return "email";
  if (SEARCH.test(s)) return "search";
  if (SOCIAL.test(s)) return "social";
  // utm_source=vitrin ya da bir mağazanın alt alanı (lucatech.ekatalox.com).
  if (s === "vitrin" || EKATALOX_SUB.test(s)) return "storefront";
  return "other";
}

/** Alt kaynak adını sadeleştirir: "l.instagram.com" → "Instagram". */
export function prettySourceName(source: string): string {
  const s = source.trim().toLowerCase();
  if (s === DIRECT_SOURCE.toLowerCase()) return "Kaynak bildirilmedi";
  const known: Array<[RegExp, string]> = [
    [/chatgpt|openai/, "ChatGPT"],
    [/gemini|bard/, "Gemini"],
    [/claude|anthropic/, "Claude"],
    [/perplexity/, "Perplexity"],
    [/copilot/, "Copilot"],
    [/google\.android\.gm|^gm$|mail\.google/, "Gmail"],
    [/google/, "Google"],
    [/bing/, "Bing"],
    [/yandex/, "Yandex"],
    [/instagram|^ig$/, "Instagram"],
    [/facebook|fb\./, "Facebook"],
    [/youtube|youtu\.be/, "YouTube"],
    [/tiktok/, "TikTok"],
    [/whatsapp|wa\.me/, "WhatsApp Web"],
    [/^vitrin$/, "Vitrin bağlantısı"],
    [/^admin\.ekatalox\.com$/, "Süper admin paneli"],
    [/localhost/, "Bilgisayarındaki test (localhost)"],
  ];
  for (const [re, label] of known) if (re.test(s)) return label;
  return source;
}

export interface ChannelGroup {
  channel: SiteChannel;
  sessions: number;
  visitors: number;
  sources: { name: string; sessions: number; visitors: number }[];
}

/** Kaynak satırlarını kanal kanal toplar. Kişi sayısı kanal içinde toplanır
 *  (aynı kişi iki kaynaktan geldiyse iki kez sayılır — üst sınır). */
export function groupByChannel(rows: { source: string; sessions: number; visitors: number }[]): ChannelGroup[] {
  const map = new Map<SiteChannel, ChannelGroup>();
  for (const r of rows) {
    const channel = classifySiteSource(r.source);
    const g = map.get(channel) ?? { channel, sessions: 0, visitors: 0, sources: [] };
    g.sessions += r.sessions;
    g.visitors += r.visitors;
    const name = prettySourceName(r.source);
    const existing = g.sources.find((x) => x.name === name);
    if (existing) {
      existing.sessions += r.sessions;
      existing.visitors += r.visitors;
    } else {
      g.sources.push({ name, sessions: r.sessions, visitors: r.visitors });
    }
    map.set(channel, g);
  }
  return [...map.values()]
    .map((g) => ({ ...g, sources: g.sources.sort((a, b) => b.sessions - a.sessions) }))
    .sort((a, b) => {
      const ea = CHANNEL_INFO[a.channel].external ? 0 : 1;
      const eb = CHANNEL_INFO[b.channel].external ? 0 : 1;
      return ea - eb || b.sessions - a.sessions;
    });
}
