"use client";

import type { ReactNode } from "react";
import type { HomepageBlockId } from "@/lib/types";
import { normalizeHomepageBlocks } from "@/lib/storefront/homepage-blocks";

export function useOrderedHomepageBlocks(
  homepageBlocks: Parameters<typeof normalizeHomepageBlocks>[0],
) {
  return normalizeHomepageBlocks(homepageBlocks);
}

export function StorefrontHomeBlockSlot({
  blockId,
  blocks,
  children,
}: {
  blockId: HomepageBlockId;
  blocks: ReturnType<typeof normalizeHomepageBlocks>;
  children: ReactNode;
}) {
  const block = blocks.find((item) => item.id === blockId);
  if (!block?.visible) {
    return null;
  }
  return <>{children}</>;
}

export function sortHomepageBlockNodes(
  blocks: ReturnType<typeof normalizeHomepageBlocks>,
  nodes: Partial<Record<HomepageBlockId, ReactNode>>,
) {
  return blocks
    .filter((block) => block.visible && nodes[block.id])
    .map((block) => (
      <div key={block.id} data-homepage-block={block.id}>
        {nodes[block.id]}
      </div>
    ));
}
