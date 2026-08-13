"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { CategoryNode } from "@/lib/categories/tree";
import { getDescendantCategoryIds } from "@/lib/categories/tree";
import type { Category } from "@/lib/types";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
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

export function StorefrontCategoryTree({
  categories,
  categoryTree,
  selectedCategoryId,
  homeHref,
  onCategoryChange,
  onHomeNavigate,
  className,
}: {
  categories: Category[];
  categoryTree: CategoryNode[];
  selectedCategoryId: string;
  homeHref?: string;
  onCategoryChange: (categoryId: string) => void;
  onHomeNavigate?: () => void;
  className?: string;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();

  return (
    <div className={cn("space-y-1", className)}>
      {homeHref ? (
        <a
          href={homeHref}
          onClick={onHomeNavigate}
          className={theme.categorySidebarItem(false)}
        >
          {t("header.allProducts")}
        </a>
      ) : (
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className={theme.categorySidebarItem(selectedCategoryId === "all")}
        >
          {t("header.allProducts")}
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
  const { t } = useStorefrontLocale();

  return (
    <aside className={theme.categorySidebar} aria-label={t("sidebar.categoriesNavAria")}>
      <p className={theme.categorySidebarTitle}>{t("sidebar.categoriesTitle")}</p>
      <StorefrontCategoryTree
        categories={categories}
        categoryTree={categoryTree}
        selectedCategoryId={selectedCategoryId}
        homeHref={homeHref}
        onCategoryChange={onCategoryChange}
      />
    </aside>
  );
}

export function StorefrontCategoryDrawer({
  isOpen,
  onClose,
  categories,
  categoryTree,
  selectedCategoryId,
  homeHref,
  onCategoryChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  categoryTree: CategoryNode[];
  selectedCategoryId: string;
  homeHref?: string;
  onCategoryChange: (categoryId: string) => void;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  function handleCategorySelect(categoryId: string) {
    onCategoryChange(categoryId);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={theme.cartDrawerOverlay}
        >
          <button
            type="button"
            aria-label={t("sidebar.closeCategoriesAria")}
            className="absolute inset-0 h-full w-full"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className={theme.cartDrawerPanel}
            role="dialog"
            aria-modal="true"
            aria-label={t("sidebar.categoriesTitle")}
          >
            <div className="flex max-h-[94dvh] flex-col">
              <div className="flex justify-center pt-3">
                <span className={theme.cartDrawerHandle} />
              </div>

              <div className={cn(theme.cartDrawerHeaderBorder, "px-4 pb-3 pt-3 sm:px-5")}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className={theme.cartDrawerTitle}>{t("sidebar.categoriesTitle")}</h2>
                    <p className={cn("truncate text-xs font-medium sm:text-sm", theme.cartDrawerMuted)}>
                      {t("sidebar.filterDescription")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className={theme.cartDrawerCloseButton}
                    aria-label={t("sidebar.closeCategoriesAria")}
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              <div className="safe-bottom-padding max-h-[min(72dvh,560px)] overflow-y-auto px-4 py-4 sm:px-5">
                <StorefrontCategoryTree
                  categories={categories}
                  categoryTree={categoryTree}
                  selectedCategoryId={selectedCategoryId}
                  homeHref={homeHref}
                  onCategoryChange={handleCategorySelect}
                  onHomeNavigate={onClose}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
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
