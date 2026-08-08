import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

// Ürün silindiğinde kalan ürünlerin display_order'ında boşluk kalır (ör.
// 1-30 silinince kalanlar 31'den başlar). Bu, kalan ürünleri mevcut
// sıralarını koruyarak 1'den yeniden numaralandırır.
export async function compactProductDisplayOrder(supabase: AdminClient, tenantId: string) {
  const { data: products, error } = await supabase
    .from("products")
    .select("id, display_order")
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: true });

  if (error || !products?.length) {
    return;
  }

  const updates = products
    .map((product, index) => ({ id: product.id as string, display_order: index + 1 }))
    .filter((update, index) => update.display_order !== products[index].display_order);

  await Promise.all(
    updates.map((update) =>
      supabase
        .from("products")
        .update({ display_order: update.display_order })
        .eq("id", update.id)
        .eq("tenant_id", tenantId),
    ),
  );
}
