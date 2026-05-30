import {
  FOOTER_COPYRIGHT_YEAR,
  FOOTER_EKATALOX_URL,
  getFooterEmailHref,
  getFooterLocation,
  getFooterPhoneHref,
  getFooterWebsiteDisplay,
  getFooterWebsiteHref,
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
  const iconClass = cn("size-3.5", className);

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

function FooterSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-800">
      {children}
    </p>
  );
}

function FooterDetailLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className="text-[11px] leading-relaxed text-zinc-500 transition hover:text-zinc-800 hover:underline"
    >
      {children}
    </a>
  );
}

function FooterDetailText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] leading-relaxed text-zinc-500">{children}</p>
  );
}

function MobileSection({
  children,
  className,
  showDivider,
}: {
  children: React.ReactNode;
  className?: string;
  showDivider?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-full",
        showDivider && "border-t border-zinc-100 pt-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StorefrontFooter({
  settings,
}: {
  settings: TenantStorefrontSettings;
}) {
  const showLocation = Boolean(settings.is_footer_location_visible);
  const showWebsite = Boolean(settings.is_footer_website_visible);
  const showContact = Boolean(settings.is_footer_contact_visible);
  const socialLinks = getVisibleFooterSocialLinks(settings);

  const locationText = showLocation ? getFooterLocation(settings) : null;
  const websiteHref = showWebsite
    ? getFooterWebsiteHref(settings.footer_website_url)
    : null;
  const websiteDisplay = showWebsite
    ? getFooterWebsiteDisplay(settings.footer_website_url)
    : null;
  const phoneHref = showContact ? getFooterPhoneHref(settings.footer_phone) : null;
  const phoneDisplay = showContact ? settings.footer_phone?.trim() : null;
  const emailHref = showContact ? getFooterEmailHref(settings.footer_email) : null;
  const emailDisplay = showContact ? settings.footer_email?.trim() : null;

  const hasWebsite = Boolean(websiteHref && websiteDisplay);
  const hasContactInfo = Boolean(
    (phoneHref && phoneDisplay) || (emailHref && emailDisplay),
  );
  const hasContactColumn = Boolean(locationText || hasWebsite || hasContactInfo);
  const hasSocialColumn = socialLinks.length > 0;
  const hasFooterMainContent = hasContactColumn || hasSocialColumn;

  let mobileDividerIndex = 0;

  return (
    <footer className="relative z-0 border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-7">
        {hasFooterMainContent ? (
          <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:items-start md:gap-x-10 lg:gap-x-16">
            {hasContactColumn ? (
              <MobileSection showDivider={mobileDividerIndex++ > 0}>
                <div className="flex flex-col items-center text-center md:items-start md:text-left">
                  <FooterSectionHeading>İletişim &amp; Adres</FooterSectionHeading>
                  <div className="space-y-1">
                    {locationText ? (
                      <FooterDetailText>{locationText}</FooterDetailText>
                    ) : null}
                    {phoneHref && phoneDisplay ? (
                      <p>
                        <FooterDetailLink href={phoneHref}>
                          {phoneDisplay}
                        </FooterDetailLink>
                      </p>
                    ) : null}
                    {emailHref && emailDisplay ? (
                      <p>
                        <FooterDetailLink href={emailHref}>
                          {emailDisplay}
                        </FooterDetailLink>
                      </p>
                    ) : null}
                    {hasWebsite ? (
                      <p>
                        <FooterDetailLink href={websiteHref!} external>
                          {websiteDisplay}
                        </FooterDetailLink>
                      </p>
                    ) : null}
                  </div>
                </div>
              </MobileSection>
            ) : null}

            {hasSocialColumn ? (
              <MobileSection
                showDivider={mobileDividerIndex++ > 0}
                className={cn(
                  "md:justify-self-end",
                  !hasContactColumn && "md:col-start-2",
                )}
              >
                <div className="flex flex-col items-center md:items-end">
                  <FooterSectionHeading>Sosyal Medya</FooterSectionHeading>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 md:justify-end">
                    {socialLinks.map((link) => (
                      <a
                        key={link.platform}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.label}
                        title={link.label}
                        className="inline-flex size-7 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-sm transition hover:border-zinc-300 hover:text-zinc-700"
                      >
                        <SocialIcon platform={link.platform} />
                      </a>
                    ))}
                  </div>
                </div>
              </MobileSection>
            ) : null}
          </div>
        ) : null}

        <div
          className={cn(
            "border-t border-zinc-200 bg-zinc-50/80 py-2.5 text-center text-[11px] text-zinc-500",
            hasFooterMainContent ? "mt-5 md:mt-6" : "mt-0",
          )}
        >
          ©{FOOTER_COPYRIGHT_YEAR}{" "}
          <a
            href={FOOTER_EKATALOX_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-zinc-800 transition hover:text-zinc-950 hover:underline"
          >
            eKatalox
          </a>{" "}
          Tüm Hakları Saklıdır.
        </div>
      </div>
    </footer>
  );
}
