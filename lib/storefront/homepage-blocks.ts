import type { HomepageBlock, HomepageBlockId } from "@/lib/types";

export const HOMEPAGE_BLOCK_IDS = [
  "hero",
  "heroCluster",
  "promoTiles",
  "categoryTiles",
  "banner",
  "campaigns",
  "showcase",
  "banner2",
  "catalog",
] as const satisfies readonly HomepageBlockId[];

export const DEFAULT_HOMEPAGE_BLOCKS: HomepageBlock[] = [
  { id: "hero", visible: true, order: 1 },
  { id: "heroCluster", visible: true, order: 2 },
  { id: "categoryTiles", visible: true, order: 3 },
  { id: "promoTiles", visible: true, order: 4 },
  { id: "banner", visible: true, order: 5 },
  { id: "campaigns", visible: true, order: 6 },
  { id: "showcase", visible: true, order: 7 },
  { id: "banner2", visible: true, order: 8 },
  { id: "catalog", visible: true, order: 9 },
];

export const HOMEPAGE_BLOCK_LABELS: Record<HomepageBlockId, string> = {
  hero: "Hero metin alanı",
  heroCluster: "Büyük banner + yan kutucuklar",
  promoTiles: "İndirimli ürün kutucukları",
  categoryTiles: "Kategori kutucukları",
  banner: "Anasayfa banner alanı",
  campaigns: "Kampanya barları",
  showcase: "Vitrin bölümleri",
  banner2: "İkinci banner alanı (alt)",
  catalog: "Tam ürün kataloğu",
};

export function normalizeHomepageBlocks(
  blocks: HomepageBlock[] | null | undefined,
): HomepageBlock[] {
  // Yeni tenant (hiç kaydı yok) tam varsayılan set ile başlar. Ama daha önce
  // kaydedilmiş bir bloğu olan tenant'lar için sonradan eklenen yeni block
  // id'leri (ör. heroCluster, categoryTiles) otomatik olarak görünür
  // yapılmamalı — aksi halde canlı bir mağazanın anasayfasına, tenant hiç
  // dokunmadan, yeni bölümler sessizce eklenmiş olur.
  const isNewTenant = !blocks?.length;
  const source = isNewTenant ? DEFAULT_HOMEPAGE_BLOCKS : blocks;
  const known = new Map<HomepageBlockId, HomepageBlock>();

  for (const block of source) {
    if (HOMEPAGE_BLOCK_IDS.includes(block.id)) {
      known.set(block.id, {
        id: block.id,
        visible: block.visible ?? true,
        order: block.order,
      });
    }
  }

  for (const id of HOMEPAGE_BLOCK_IDS) {
    if (!known.has(id)) {
      const fallback = DEFAULT_HOMEPAGE_BLOCKS.find((block) => block.id === id);
      if (fallback) {
        known.set(id, isNewTenant ? fallback : { ...fallback, visible: false });
      }
    }
  }

  return [...known.values()].sort((left, right) => left.order - right.order);
}

export function isHomepageBlockVisible(
  blocks: HomepageBlock[] | null | undefined,
  id: HomepageBlockId,
): boolean {
  return normalizeHomepageBlocks(blocks).find((block) => block.id === id)?.visible ?? true;
}

// Tenant admin, homepage_blocks_editor paket özelliği olmadan da hero'yu
// aç/kapa yapabilmeli (bkz. tenant-homepage-content-form.tsx). Bu yüzden
// "sadece hero görünürlüğü değişti mi" ayrımı gerekiyor: öyleyse tam blok
// editörü paket kısıtına takılmadan kaydedilebilir.
export function isHeroOnlyVisibilityChange(
  existingBlocks: HomepageBlock[] | null | undefined,
  nextBlocks: HomepageBlock[] | null | undefined,
): boolean {
  const existing = normalizeHomepageBlocks(existingBlocks);
  const next = normalizeHomepageBlocks(nextBlocks);

  return existing.every((block, index) => {
    const candidate = next[index];
    if (!candidate || candidate.id !== block.id || candidate.order !== block.order) {
      return false;
    }

    if (block.id === "hero") {
      return true;
    }

    return candidate.visible === block.visible;
  });
}
