import Link from "next/link";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { YouTubeLite } from "@/components/marketing/youtube-lite";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { SITE } from "@/lib/marketing/site";
import { TUTORIAL_GROUPS, TUTORIAL_PUBLISHED_AT, TUTORIAL_VIDEOS } from "@/lib/marketing/tutorial-videos";

export const metadata = marketingMetadata(
  "/video-egitimler",
  "Video Eğitimler: eKatalox Nasıl Kullanılır?",
  "Ürün ekleme, Excel ile toplu yükleme, bayiye özel fiyat listesi, sipariş yönetimi ve katalog görünümü için kısa, adım adım video eğitimler.",
);

const duration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
const isoDuration = (seconds: number) => `PT${Math.floor(seconds / 60)}M${seconds % 60}S`;

// Google video sonuçları için VideoObject listesi.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "eKatalox video eğitimler",
  itemListElement: TUTORIAL_VIDEOS.map((video, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "VideoObject",
      name: video.title,
      description: video.description,
      thumbnailUrl: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
      uploadDate: TUTORIAL_PUBLISHED_AT,
      duration: isoDuration(video.seconds),
      embedUrl: `https://www.youtube-nocookie.com/embed/${video.id}`,
      contentUrl: `https://www.youtube.com/watch?v=${video.id}`,
      inLanguage: "tr",
    },
  })),
};

export default function VideoTutorialsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <Section tone="white" className="pb-8 sm:pb-10">
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Destek"
            title="Video eğitimler"
            lead={`eKatalox'u adım adım anlatan ${TUTORIAL_VIDEOS.length} kısa video. Her biri tek bir işi baştan sona gösterir; Türkçe altyazılıdır.`}
          />
          <nav aria-label="Konular" className="mt-6 flex flex-wrap gap-2">
            {TUTORIAL_GROUPS.map((group) => (
              <a
                key={group.slug}
                href={`#${group.slug}`}
                className="rounded-full border border-brand-line bg-white px-3.5 py-1.5 text-sm font-medium text-brand-navy transition-colors hover:border-brand-navy"
              >
                {group.title} <span className="text-brand-muted">{group.videos.length}</span>
              </a>
            ))}
          </nav>
        </Container>
      </Section>

      {TUTORIAL_GROUPS.map((group) => (
        <Section key={group.slug} className="scroll-mt-20 pt-0" id={group.slug}>
          <Container>
            <h2 className="text-xl font-semibold text-brand-navy sm:text-2xl">{group.title}</h2>
            <p className="mt-1 text-sm text-brand-muted">{group.lead}</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {group.videos.map((video) => (
                <article key={video.id} className="rounded-lg border border-brand-line bg-white p-3">
                  <YouTubeLite id={video.id} title={video.title} />
                  <div className="px-1 pb-1 pt-3">
                    <h3 className="font-semibold leading-snug text-brand-navy">{video.title}</h3>
                    <p className="mt-1.5 text-sm text-brand-muted">{video.description}</p>
                    <p className="mt-2 font-plex-mono text-xs text-brand-muted">{duration(video.seconds)}</p>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </Section>
      ))}

      <Section className="pt-0">
        <Container>
          <div className="rounded-lg border border-brand-line bg-white p-6 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Aradığınız videoyu bulamadınız mı?</p>
              <p className="mt-1 text-sm text-brand-muted">
                <a href={SITE.phoneHref} className="font-plex-mono font-medium text-brand-navy">{SITE.phone}</a> ·{" "}
                <Link href="/yardim">Yardım merkezi</Link>
              </p>
            </div>
            <ButtonLink href="/basvuru" tone="navy" className="mt-4 sm:mt-0">Ücretsiz katalog açın</ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
