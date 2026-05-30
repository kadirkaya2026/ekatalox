import type { TenantStorefrontSettings } from "@/lib/types";

export type FooterSocialPlatform =
  | "instagram"
  | "youtube"
  | "x"
  | "facebook"
  | "whatsapp";

export const DEFAULT_FOOTER_LOCATION = "Beykent, İstanbul";
export const FOOTER_COPYRIGHT_YEAR = 2026;
export const FOOTER_EKATALOX_URL = "https://ekatalox.com";

export interface FooterSocialLink {
  platform: FooterSocialPlatform;
  href: string;
  label: string;
}

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeWhatsappHref(value: string | null | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);

      if (url.hostname.includes("wa.me") || url.hostname.includes("whatsapp.com")) {
        const digits = normalizeDigits(url.pathname.replace(/^\/+/, ""));

        if (digits.length >= 10) {
          return `https://wa.me/${digits}`;
        }
      }
    } catch {
      return null;
    }
  }

  const digits = normalizeDigits(trimmed);

  if (digits.length < 10) {
    return null;
  }

  return `https://wa.me/${digits}`;
}

function normalizeSocialUrl(
  value: string | null | undefined,
  platform: Exclude<FooterSocialPlatform, "whatsapp">,
): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed).toString();
    } catch {
      return null;
    }
  }

  const handle = trimmed.replace(/^@+/, "");

  switch (platform) {
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "youtube":
      if (/^(channel\/|c\/|user\/|@)/i.test(handle)) {
        return `https://youtube.com/${handle.startsWith("@") ? handle : handle}`;
      }
      return `https://youtube.com/@${handle}`;
    case "x":
      return `https://x.com/${handle}`;
    case "facebook":
      return `https://facebook.com/${handle}`;
    default:
      return null;
  }
}

function normalizeWebsiteUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withProtocol).toString();
  } catch {
    return null;
  }
}

const PLATFORM_LABELS: Record<FooterSocialPlatform, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  x: "X",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
};

export function getFooterLocation(settings: TenantStorefrontSettings): string {
  return settings.footer_location?.trim() || DEFAULT_FOOTER_LOCATION;
}

export function getFooterWebsiteHref(url: string | null | undefined): string | null {
  return normalizeWebsiteUrl(url);
}

export function getFooterWebsiteDisplay(url: string | null | undefined): string | null {
  const href = normalizeWebsiteUrl(url);

  if (!href) {
    return null;
  }

  try {
    const hostname = new URL(href).hostname.replace(/^www\./i, "");
    return hostname || null;
  } catch {
    return null;
  }
}

export function getFooterPhoneHref(phone: string | null | undefined): string | null {
  const trimmed = phone?.trim();

  if (!trimmed) {
    return null;
  }

  const digits = normalizeDigits(trimmed);

  if (digits.length < 10) {
    return null;
  }

  return `tel:+${digits}`;
}

export function getFooterEmailHref(email: string | null | undefined): string | null {
  const trimmed = email?.trim();

  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return null;
  }

  return `mailto:${trimmed}`;
}

export function getVisibleFooterSocialLinks(
  settings: TenantStorefrontSettings,
): FooterSocialLink[] {
  if (!Boolean(settings.is_footer_social_visible)) {
    return [];
  }

  const candidates: Array<{
    platform: FooterSocialPlatform;
    visible: boolean;
    href: string | null;
  }> = [
    {
      platform: "instagram",
      visible: Boolean(settings.is_footer_instagram_visible),
      href: normalizeSocialUrl(settings.footer_instagram_url, "instagram"),
    },
    {
      platform: "youtube",
      visible: Boolean(settings.is_footer_youtube_visible),
      href: normalizeSocialUrl(settings.footer_youtube_url, "youtube"),
    },
    {
      platform: "x",
      visible: Boolean(settings.is_footer_x_visible),
      href: normalizeSocialUrl(settings.footer_x_url, "x"),
    },
    {
      platform: "facebook",
      visible: Boolean(settings.is_footer_facebook_visible),
      href: normalizeSocialUrl(settings.footer_facebook_url, "facebook"),
    },
    {
      platform: "whatsapp",
      visible: Boolean(settings.is_footer_whatsapp_visible),
      href: normalizeWhatsappHref(settings.footer_whatsapp),
    },
  ];

  return candidates
    .filter((item) => item.visible && item.href)
    .map((item) => ({
      platform: item.platform,
      href: item.href!,
      label: PLATFORM_LABELS[item.platform],
    }));
}
