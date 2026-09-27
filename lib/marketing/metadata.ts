import type { Metadata } from "next";
import { SITE } from "./site";

/** Keep search and social previews consistent for each public marketing page. */
export function marketingMetadata(path: string, title: string, description: string): Metadata {
  const fullTitle = `${title} | ${SITE.name}`;
  const url = new URL(path, SITE.url).toString();
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: SITE.name,
      url,
      title: fullTitle,
      description,
      images: [{ url: `${SITE.url}/site/ekatalox-share.png`, width: 1200, height: 630, alt: "eKatalox dijital katalog ve WhatsApp sipariş" }],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [`${SITE.url}/site/ekatalox-share.png`] },
  };
}
