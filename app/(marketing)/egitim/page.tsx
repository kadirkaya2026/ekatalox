import Link from "next/link";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { TrainingCenter } from "@/components/marketing/training-center";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { SITE } from "@/lib/marketing/site";
import { START_HERE_IDS, TUTORIAL_GROUPS, TUTORIAL_PUBLISHED_AT, TUTORIAL_VIDEOS, type TutorialVideo } from "@/lib/marketing/tutorial-videos";

export const metadata = marketingMetadata(
  "/egitim",
  "Eğitim Merkezi: eKatalox Nasıl Kullanılır? Video Anlatımlar",
  "Ürün ekleme, Excel ile toplu yükleme, bayiye özel fiyat listesi, sipariş yönetimi ve katalog görünümü için kısa, adım adım video anlatımlar.",
);

const isoDuration = (seconds: number) => `PT${Math.floor(seconds / 60)}M${seconds % 60}S`;

// Google video sonuçları için VideoObject listesi.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "eKatalox Eğitim Merkezi",
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

const startHere = START_HERE_IDS.map((id) => TUTORIAL_VIDEOS.find((video) => video.id === id)).filter(
  (video): video is TutorialVideo => Boolean(video),
);

export default function TrainingCenterPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <Section tone="white" className="pb-14 sm:pb-20">
        <Container>
          <nav aria-label="Konum" className="mb-4 text-sm text-brand-muted">
            <Link href="/yardim" className="hover:text-brand-navy">
              Yardım merkezi
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-brand-navy">Eğitim Merkezi</span>
          </nav>
          <SectionHeading
            as="h1"
            eyebrow="Eğitim Merkezi"
            title="eKatalox'u adım adım öğrenin"
            lead={`${TUTORIAL_VIDEOS.length} kısa video, her biri tek bir işi baştan sona gösterir. Türkçe altyazılı, ortalama 2 dakika.`}
          />
          <div className="mt-8">
            <TrainingCenter groups={TUTORIAL_GROUPS} startHere={startHere} />
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <div className="mt-12 rounded-lg border border-brand-line bg-white p-6 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Aradığınızı bulamadınız mı?</p>
              <p className="mt-1 text-sm text-brand-muted">
                <a href={SITE.phoneHref} className="font-plex-mono font-medium text-brand-navy">
                  {SITE.phone}
                </a>{" "}
                · <Link href="/yardim">Yardım merkezi</Link>
              </p>
            </div>
            <ButtonLink href="/basvuru" tone="navy" className="mt-4 sm:mt-0">
              Ücretsiz katalog açın
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
