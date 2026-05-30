import { EkataloxLogo } from "@/components/brand/ekatalox-logo";
import {
  getFooterCopyright,
  getFooterLocation,
  getVisibleFooterSocialLinks,
  type FooterSocialPlatform,
} from "@/lib/storefront/footer-links";
import type { TenantStorefrontSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

function SocialIcon({
  platform,
  className,
}: {
  platform: FooterSocialPlatform;
  className?: string;
}) {
  const iconClass = cn("size-4", className);

  switch (platform) {
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass} fill="currentColor">
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zM12 9.5A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5z" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass} fill="currentColor">
          <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5A3 3 0 0 0 2.4 7.2 31.4 31.4 0 0 0 2 12a31.4 31.4 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 22 12a31.4 31.4 0 0 0-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass} fill="currentColor">
          <path d="M18.9 2H22l-6.8 7.8L23 22h-6.7l-5.2-6.8L5.4 22H2.3l7.3-8.4L1 2h6.9l4.7 6.2L18.9 2zm-1.2 18h1.9L7.1 3.9H5.1L17.7 20z" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass} fill="currentColor">
          <path d="M13.5 22v-8h2.7l.4-3.1H13.5V9.1c0-.9.2-1.5 1.5-1.5h1.6V4.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10.9H7.8v3.1h2.1V22h3.6z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass} fill="currentColor">
          <path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5.1 5.2-1.4A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3.1.8.8-3-.2-.3A8 8 0 1 1 12 20zm4.3-5.7c-.2-.1-1.3-.6-1.5-.7s-.4-.1-.5.1-.6.7-.8.9-.3.2-.5.1a6.1 6.1 0 0 1-1.8-1.1 6.8 6.8 0 0 1-1.2-1.6c-.1-.2 0-.3.1-.4.1-.1.2-.3.3-.4s0-.2 0-.3-.5-1.2-.7-1.6-.4-.4-.5-.4h-.4a.8.8 0 0 0-.6.3 2.4 2.4 0 0 0-.8 1.9 4.2 4.2 0 0 0 .9 2.2 9.6 9.6 0 0 0 3.7 3.2c.5.2.9.4 1.2.5.5.2 1 .2 1.4.1.4-.1 1.3-.5 1.5-1 .2-.5.2-.9.1-1 0-.1-.2-.1-.4-.2z" />
        </svg>
      );
    default:
      return null;
  }
}

export function StorefrontFooter({
  settings,
}: {
  settings: TenantStorefrontSettings;
}) {
  const showLogo = settings.is_footer_logo_visible;
  const showLocation = settings.is_footer_location_visible;
  const showCopyright = settings.is_footer_copyright_visible;
  const socialLinks = getVisibleFooterSocialLinks(settings);

  const locationText = showLocation ? getFooterLocation(settings) : null;
  const copyrightText = showCopyright ? getFooterCopyright(settings) : null;
  const metaParts = [locationText, copyrightText].filter(Boolean);

  if (!showLogo && !socialLinks.length && !metaParts.length) {
    return null;
  }

  return (
    <footer className="border-t border-slate-200/60 bg-zinc-50 px-4 py-6 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 md:grid md:grid-cols-3 md:items-center md:gap-6">
        <div className="flex justify-center md:justify-start">
          {showLogo ? (
            <EkataloxLogo className="h-6 w-[92px]" sizes="92px" />
          ) : (
            <span aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          {socialLinks.length ? (
            <>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Sosyal Medya
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.platform}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    title={link.label}
                    className="inline-flex size-8 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  >
                    <SocialIcon platform={link.platform} />
                  </a>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="text-center md:text-right">
          {metaParts.length ? (
            <p className="leading-5 text-slate-500">
              {metaParts.join(" | ")}
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
