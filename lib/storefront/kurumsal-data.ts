import { unstable_cache } from "next/cache";
import {
  getStorefrontProductDescription,
  getStorefrontProductsByIds,
  getStorefrontProductsPage,
  getTenantCategories,
} from "@/lib/data";
import {
  getDescendantCategoryIds,
  getHiddenStorefrontCategoryIds,
  isUncategorizedBucketCategory,
} from "@/lib/categories/tree";
import type { Category, StorefrontProduct } from "@/lib/types";

// Kurumsal site (/kurumsal) verisi: fiyatsız katalog. Sayfa ISR olduğu için
// buradaki her sorgu unstable_cache içinde (admin client no-store yapar,
// sarmalanmazsa statik sayfa dinamiğe düşer). Tag storefront_{tenantId}:
// katalog/ayar değişince revalidateStorefrontCache bunu da tazeler.

export interface KurumsalCategory {
  id: string;
  name: string;
  productCount: number;
  imageUrl: string | null;
}

export interface KurumsalProduct {
  id: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  categoryId: string;
}

export interface KurumsalData {
  categories: KurumsalCategory[];
  featured: KurumsalProduct[];
  productCount: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_PAGES = 20; // 60'lık sayfa × 20 = 1.200 ürün; kurumsal sayfa için fazlasıyla yeterli
const FEATURED_COUNT = 12;

// Kategori id → kök kategori id (en fazla 10 seviye yukarı çıkar).
function makeRootResolver(categories: Category[]) {
  const parentById = new Map(categories.map((category) => [category.id, category.parent_id]));
  return (categoryId: string) => {
    let current: string | null | undefined = categoryId;
    for (let depth = 0; depth < 10 && current; depth += 1) {
      const parent = parentById.get(current);
      if (!parent) return current;
      current = parent;
    }
    return current ?? categoryId;
  };
}

function toKurumsalProduct(product: StorefrontProduct): KurumsalProduct {
  return {
    id: product.id,
    name: product.product_name,
    sku: product.sku_code,
    imageUrl: product.image_url,
    categoryId: product.category_id,
  };
}

// Gizli kategoriler hariç tüm ürünler (en fazla MAX_PAGES sayfa).
async function loadVisibleProducts(tenantId: string, hiddenIds: Set<string>) {
  const products: StorefrontProduct[] = [];
  let total = Infinity;
  for (let page = 1; page <= MAX_PAGES && products.length < total; page += 1) {
    const result = await getStorefrontProductsPage({
      tenantId,
      priceListId: "",
      isCatalogOnly: true,
      page,
      excludeCategoryIds: [...hiddenIds],
    });
    total = result.total;
    if (!result.products.length) break;
    products.push(...result.products);
  }
  return { products, total };
}

async function loadKurumsalData(tenantId: string): Promise<KurumsalData> {
  const allCategories = await getTenantCategories(tenantId);
  const hiddenIds = new Set(getHiddenStorefrontCategoryIds(allCategories));
  const visibleRoots = allCategories.filter(
    (category) =>
      category.parent_id === null &&
      !hiddenIds.has(category.id) &&
      !isUncategorizedBucketCategory(category),
  );

  const { products, total } = await loadVisibleProducts(tenantId, hiddenIds);

  // Alt kategorideki ürün, kök kategorisine sayılır.
  const rootOf = makeRootResolver(allCategories);

  const counts = new Map<string, number>();
  const images = new Map<string, string>();
  for (const product of products) {
    const root = rootOf(product.category_id);
    counts.set(root, (counts.get(root) ?? 0) + 1);
    if (product.image_url && !images.has(root)) images.set(root, product.image_url);
  }

  const categories = visibleRoots
    .map((category) => ({
      id: category.id,
      name: category.name,
      productCount: counts.get(category.id) ?? 0,
      imageUrl: category.tile_image_url ?? images.get(category.id) ?? null,
    }))
    .filter((category) => category.productCount > 0);

  // Öne çıkanlar: önce bayinin "önerilen" işaretledikleri, sonra her
  // kategoriden sırayla birer görselli ürün (vitrinde çeşitlilik olsun).
  const withImage = products.filter((product) => product.image_url && product.is_in_stock);
  const featured: StorefrontProduct[] = withImage.filter((product) => product.is_recommended);
  const byRoot = new Map<string, StorefrontProduct[]>();
  for (const product of withImage) {
    if (featured.includes(product)) continue;
    const root = rootOf(product.category_id);
    byRoot.set(root, [...(byRoot.get(root) ?? []), product]);
  }
  const queues = categories.map((category) => byRoot.get(category.id) ?? []);
  while (featured.length < FEATURED_COUNT && queues.some((queue) => queue.length)) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next && featured.length < FEATURED_COUNT) featured.push(next);
    }
  }

  return {
    categories,
    featured: featured.slice(0, FEATURED_COUNT).map(toKurumsalProduct),
    productCount: total === Infinity ? products.length : total,
  };
}

export function getKurumsalDataCached(tenantId: string): Promise<KurumsalData> {
  return unstable_cache(() => loadKurumsalData(tenantId), ["kurumsal-data", tenantId], {
    revalidate: 300,
    tags: [`storefront_${tenantId}`],
  })();
}

/* ───────────── Kategori sayfası (/kurumsal/kategori/[id]) ───────────── */

export interface KurumsalCategoryPage {
  category: { id: string; name: string };
  products: KurumsalProduct[];
  total: number;
}

const CATEGORY_MAX_PAGES = 5; // 60 × 5 = 300 ürün; fazlası için "Tüm kataloğu gör"

async function loadKurumsalCategory(tenantId: string, categoryId: string): Promise<KurumsalCategoryPage | null> {
  if (!UUID_RE.test(categoryId)) return null;
  const allCategories = await getTenantCategories(tenantId);
  const category = allCategories.find((item) => item.id === categoryId);
  const hiddenIds = new Set(getHiddenStorefrontCategoryIds(allCategories));

  // Yalnız görünür KÖK kategoriler sayfalanır (kurumsal ana sayfadaki kutucuklar).
  if (
    !category ||
    category.parent_id !== null ||
    hiddenIds.has(category.id) ||
    isUncategorizedBucketCategory(category)
  ) {
    return null;
  }

  const categoryIds = getDescendantCategoryIds(allCategories, category.id).filter((id) => !hiddenIds.has(id));
  const products: StorefrontProduct[] = [];
  let total = Infinity;
  for (let page = 1; page <= CATEGORY_MAX_PAGES && products.length < total; page += 1) {
    const result = await getStorefrontProductsPage({
      tenantId,
      priceListId: "",
      isCatalogOnly: true,
      page,
      categoryIds,
    });
    total = result.total;
    if (!result.products.length) break;
    products.push(...result.products);
  }

  return {
    category: { id: category.id, name: category.name },
    products: products.map(toKurumsalProduct),
    total: total === Infinity ? products.length : total,
  };
}

export function getKurumsalCategoryCached(tenantId: string, categoryId: string) {
  return unstable_cache(
    () => loadKurumsalCategory(tenantId, categoryId),
    ["kurumsal-category", tenantId, categoryId],
    { revalidate: 300, tags: [`storefront_${tenantId}`] },
  )();
}

/* ───────────── Ürün sayfası (/kurumsal/urun/[id]) ───────────── */

export interface KurumsalProductDetail {
  id: string;
  name: string;
  sku: string;
  images: string[];
  isInStock: boolean;
  /** normalizeProductDescription'dan geçmiş ham açıklama (HTML olabilir; gösterirken sanitize edilir) */
  description: string | null;
  models: string[];
  packageQuantity: number | null;
  cartonQuantity: number | null;
  /** Kök kategori (kategori sayfasına bağlantı); Kategorisiz kovadaysa null */
  category: { id: string; name: string } | null;
}

async function loadKurumsalProduct(tenantId: string, productId: string): Promise<KurumsalProductDetail | null> {
  if (!UUID_RE.test(productId)) return null;

  const [allCategories, rows] = await Promise.all([
    getTenantCategories(tenantId),
    getStorefrontProductsByIds({ tenantId, priceListId: "", isCatalogOnly: true, ids: [productId] }),
  ]);
  const product = rows[0];
  if (!product) return null;

  // Vitrinde gizli kategorideki ürün kurumsal sayfada da yok sayılır.
  const hiddenIds = new Set(getHiddenStorefrontCategoryIds(allCategories));
  if (hiddenIds.has(product.category_id)) return null;

  const description = await getStorefrontProductDescription(tenantId, productId);
  if (!description.found) return null;

  const rootId = makeRootResolver(allCategories)(product.category_id);
  const root = allCategories.find((category) => category.id === rootId);

  return {
    id: product.id,
    name: product.product_name,
    sku: product.sku_code,
    images: [product.image_url, product.image_url_2, product.image_url_3].filter(
      (url): url is string => Boolean(url),
    ),
    isInStock: product.is_in_stock,
    description: description.description,
    models: product.variants
      .filter((variant) => variant.is_available_for_sale)
      .map((variant) => variant.model_name)
      .filter(Boolean),
    packageQuantity: product.package_quantity,
    cartonQuantity: product.carton_quantity,
    category:
      root && !isUncategorizedBucketCategory(root) && !hiddenIds.has(root.id)
        ? { id: root.id, name: root.name }
        : null,
  };
}

export function getKurumsalProductCached(tenantId: string, productId: string) {
  return unstable_cache(
    () => loadKurumsalProduct(tenantId, productId),
    ["kurumsal-product", tenantId, productId],
    { revalidate: 300, tags: [`storefront_${tenantId}`] },
  )();
}

/* ───────────── sitemap.xml (kurumsal alan adı) ───────────── */

export interface KurumsalSitemapData {
  categoryIds: string[];
  productIds: string[];
}

async function loadKurumsalSitemap(tenantId: string): Promise<KurumsalSitemapData> {
  const allCategories = await getTenantCategories(tenantId);
  const hiddenIds = new Set(getHiddenStorefrontCategoryIds(allCategories));
  const [data, { products }] = await Promise.all([
    getKurumsalDataCached(tenantId),
    loadVisibleProducts(tenantId, hiddenIds),
  ]);
  return {
    categoryIds: data.categories.map((category) => category.id),
    productIds: products.map((product) => product.id),
  };
}

export function getKurumsalSitemapCached(tenantId: string) {
  return unstable_cache(() => loadKurumsalSitemap(tenantId), ["kurumsal-sitemap", tenantId], {
    revalidate: 300,
    tags: [`storefront_${tenantId}`],
  })();
}
