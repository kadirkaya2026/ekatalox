import type { HomepageBlock, HomepageBlockId } from "@/lib/types";

export const HOMEPAGE_BLOCK_IDS = [
  "hero",
  "banner",
  "campaigns",
  "showcase",
  "catalog",
] as const satisfies readonly HomepageBlockId[];

export const DEFAULT_HOMEPAGE_BLOCKS: HomepageBlock[] = [
  { id: "hero", visible: true, order: 1 },
  { id: "banner", visible: true, order: 2 },
  { id: "campaigns", visible: true, order: 3 },
  { id: "showcase", visible: true, order: 4 },
  { id: "catalog", visible: true, order: 5 },
];

export const HOMEPAGE_BLOCK_LABELS: Record<HomepageBlockId, string> = {
  hero: "Hero metin alanı",
  banner: "Banner carousel",
  campaigns: "Kampanya barları",
  showcase: "Vitrin bölümleri",
  catalog: "Tam ürün kataloğu",
};

export function normalizeHomepageBlocks(
  blocks: HomepageBlock[] | null | undefined,
): HomepageBlock[] {
  const source = blocks?.length ? blocks : DEFAULT_HOMEPAGE_BLOCKS;
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
        known.set(id, fallback);
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
