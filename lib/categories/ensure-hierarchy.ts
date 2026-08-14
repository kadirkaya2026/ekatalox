import type { SupabaseClient } from "@supabase/supabase-js";

export function normalizeCategoryName(name: string) {
  return name.trim().toLocaleLowerCase("tr-TR");
}

export interface CategoryCacheEntry {
  id: string;
  parentId: string | null;
}

export type CategoryCache = Map<string, CategoryCacheEntry>;

export function buildCategoryCache(
  rows: Array<{ id: string; name: string; parent_id: string | null }>,
): CategoryCache {
  return new Map(
    rows.map((row) => [
      normalizeCategoryName(row.name),
      { id: row.id, parentId: row.parent_id },
    ]),
  );
}

// Walks a root-first path of category names (see resolveCategoryPath),
// creating any missing levels with the correct parent_id and re-parenting
// existing ones that don't match — this is what turns previously flat,
// import-created categories into a real tree instead of duplicating them.
// Returns the leaf category's id.
export async function ensureCategoryPath(
  supabase: SupabaseClient,
  tenantId: string,
  cache: CategoryCache,
  path: string[],
  nextDisplayOrder: { value: number },
): Promise<string> {
  let parentId: string | null = null;

  for (const rawName of path) {
    const name = rawName.trim();
    const key = normalizeCategoryName(name);
    const cached = cache.get(key);

    if (cached) {
      if (cached.parentId !== parentId) {
        const { error } = await supabase
          .from("categories")
          .update({ parent_id: parentId })
          .eq("id", cached.id);

        if (error) {
          throw error;
        }

        cached.parentId = parentId;
      }

      parentId = cached.id;
      continue;
    }

    const { data: created, error } = await supabase
      .from("categories")
      .insert({
        tenant_id: tenantId,
        name,
        parent_id: parentId,
        display_order: nextDisplayOrder.value++,
        // "Kategorisiz" — kaynak sitede kategori bilgisi olmayan Master
        // Katalog ürünlerinin düştüğü kova — storefront'ta hiçbir yerde
        // (nav, arama) görünmemeli, admin panelinde ürün yönetimi için
        // olduğu gibi kalır (bkz. lib/categories/tree.ts).
        is_hidden_from_storefront: key === normalizeCategoryName("Kategorisiz"),
      })
      .select("id")
      .single<{ id: string }>();

    if (error) {
      throw error;
    }

    const createdId: string = created.id;
    cache.set(key, { id: createdId, parentId });
    parentId = createdId;
  }

  return parentId!;
}
