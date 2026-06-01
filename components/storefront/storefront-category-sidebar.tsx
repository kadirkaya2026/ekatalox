"use client";

import type { CategoryNode } from "@/lib/categories/tree";
import { getDescendantCategoryIds } from "@/lib/categories/tree";
import type { Category } from "@/lib/types";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { cn } from "@/lib/utils";

function CategorySidebarNode({
  node,
  categories,
  selectedCategoryId,
  onCategoryChange,
  depth = 0,
}: {
  node: CategoryNode;
  categories: Category[];
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  depth?: number;
}) {
  const theme = useStorefrontTheme();
  const isActive =
    selectedCategoryId === node.id ||
    getDescendantCategoryIds(categories, node.id).includes(selectedCategoryId);
  const itemClass =
    depth === 0 ? theme.categorySidebarItem(isActive) : theme.categorySidebarChildItem(isActive);

  return (
    <div className="space-y-0.5">
      <button type="button" onClick={() => onCategoryChange(node.id)} className={itemClass}>
        {node.name}
      </button>
      {node.children.length ? (
        <div className="space-y-0.5">
          {node.children.map((child) => (
            <CategorySidebarNode
              key={child.id}
              node={child}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={onCategoryChange}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function StorefrontCategorySidebar({
  categories,
  categoryTree,
  selectedCategoryId,
  homeHref,
  onCategoryChange,
}: {
  categories: Category[];
  categoryTree: CategoryNode[];
  selectedCategoryId: string;
  homeHref?: string;
  onCategoryChange: (categoryId: string) => void;
}) {
  const theme = useStorefrontTheme();

  return (
    <aside className={theme.categorySidebar} aria-label="Kategori navigasyonu">
      <p className={theme.categorySidebarTitle}>Kategoriler</p>
      <div className="space-y-1">
        {homeHref ? (
          <a href={homeHref} className={theme.categorySidebarItem(false)}>
            Tüm Ürünler
          </a>
        ) : (
          <button
            type="button"
            onClick={() => onCategoryChange("all")}
            className={theme.categorySidebarItem(selectedCategoryId === "all")}
          >
            Tüm Ürünler
          </button>
        )}

        {categoryTree.map((category) => (
          <CategorySidebarNode
            key={category.id}
            node={category}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={onCategoryChange}
          />
        ))}
      </div>
    </aside>
  );
}

export function StorefrontCategorySidebarSlot({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("hidden shrink-0 lg:block", className)}>{children}</div>;
}

export function StorefrontCatalogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("min-w-0", className)}>{children}</div>;
}
