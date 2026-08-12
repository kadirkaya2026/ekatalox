import type { Category } from "@/lib/types";

export interface CategoryNode extends Category {
  children: CategoryNode[];
  depth: number;
}

export function sortCategoriesByOrder(categories: Category[]) {
  return [...categories].sort((left, right) => {
    if (left.display_order !== right.display_order) {
      return left.display_order - right.display_order;
    }

    return left.name.localeCompare(right.name, "tr-TR");
  });
}

export function buildCategoryTree(categories: Category[]) {
  const sortedCategories = sortCategoriesByOrder(categories);
  const nodes = new Map<string, CategoryNode>(
    sortedCategories.map((category) => [
      category.id,
      {
        ...category,
        children: [],
        depth: 0,
      },
    ]),
  );
  const roots: CategoryNode[] = [];

  for (const category of sortedCategories) {
    const node = nodes.get(category.id)!;
    const parent = category.parent_id ? nodes.get(category.parent_id) : null;

    if (!parent) {
      roots.push(node);
      continue;
    }

    node.depth = parent.depth + 1;
    parent.children.push(node);
  }

  return roots;
}

export function flattenCategoryTree(nodes: CategoryNode[]) {
  const items: CategoryNode[] = [];

  for (const node of nodes) {
    items.push(node);

    if (node.children.length) {
      items.push(...flattenCategoryTree(node.children));
    }
  }

  return items;
}

export function getDescendantCategoryIds(categories: Category[], categoryId: string) {
  const childMap = new Map<string | null, Category[]>();

  for (const category of categories) {
    const key = category.parent_id ?? null;
    const current = childMap.get(key) ?? [];
    current.push(category);
    childMap.set(key, current);
  }

  const result = new Set<string>();
  const queue = [categoryId];

  while (queue.length) {
    const currentId = queue.shift()!;

    if (result.has(currentId)) {
      continue;
    }

    result.add(currentId);

    for (const child of childMap.get(currentId) ?? []) {
      queue.push(child.id);
    }
  }

  return [...result];
}

// "is_hidden_from_storefront" kategoriler (ör. toplu içe aktarımdan kalan,
// henüz elle kategorilendirilmemiş "Kategorisiz" ürünlerin geçici olarak
// tutulduğu kova) storefront'ta hiçbir yerde (navigasyon, "Tüm Ürünler",
// arama) görünmesin — ama tenant admin panelinde ürün yönetimi bunları
// olduğu gibi görmeye devam eder (bu filtre sadece storefront sayfalarında
// uygulanır, bkz. app/store/[subdomain]/page.tsx).
// "is_hidden_from_storefront" kök kategorilerinin kendisi + tüm alt
// kategorileri — storefront'un ürün sorgularında hariç tutması gereken tam
// id kümesi. Hem eski (tüm kategori/ürün listesini elde tutup filtreleyen)
// hem yeni (sunucu taraflı sayfalanmış sorgu, bu kümeyi WHERE'e ekleyen)
// yollarda aynı mantığı paylaşmak için ayrı bir fonksiyon.
export function getHiddenStorefrontCategoryIds(categories: Category[]): string[] {
  const hiddenRootIds = categories
    .filter((category) => category.is_hidden_from_storefront)
    .map((category) => category.id);

  if (!hiddenRootIds.length) {
    return [];
  }

  return [...new Set(hiddenRootIds.flatMap((id) => getDescendantCategoryIds(categories, id)))];
}

export function filterHiddenCategoriesAndProducts<P extends { category_id: string }>(
  categories: Category[],
  products: P[],
): { categories: Category[]; products: P[] } {
  const hiddenIds = new Set(getHiddenStorefrontCategoryIds(categories));

  if (!hiddenIds.size) {
    return { categories, products };
  }

  return {
    categories: categories.filter((category) => !hiddenIds.has(category.id)),
    products: products.filter((product) => !hiddenIds.has(product.category_id)),
  };
}

export function getCategoryLineage(categories: Category[], categoryId: string) {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const lineage: Category[] = [];
  let current = categoryMap.get(categoryId) ?? null;

  while (current) {
    lineage.unshift(current);
    current = current.parent_id ? categoryMap.get(current.parent_id) ?? null : null;
  }

  return lineage;
}