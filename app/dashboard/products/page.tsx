import { Header } from "@/components/dashboard/header";
import { ProductSuggestionNotice } from "@/components/dashboard/product-suggestion-notice";
import { ProductsPageShell } from "@/components/dashboard/products-page-shell";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantCategories, getTenantPriceLists, getTenantProductsPage } from "@/lib/data";
import { parseProductStockFilter } from "@/lib/products/constants";
import { getTenantPendingSuggestionNotices } from "@/lib/products/suggestions";

// Bildirim zilinden gelen "stok açmak için tıklayın" bağlantısı ?q=<barkod>
// &focus=<productId> ile geliyor: arama sunucu tarafında uygulanır ki ürün
// ilk sayfaya düşsün, focus da satırı vurgulayıp ekrana kaydırır.
export default async function TenantProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; focus?: string; stock?: string }>;
}) {
  const session = await requireTenantAdminPage();
  const { q, focus, stock } = await searchParams;
  const initialSearchTerm = q?.trim() ?? "";
  const initialStockFilter = parseProductStockFilter(stock);
  const [firstPage, categories, priceLists, suggestionNotices] = await Promise.all([
    getTenantProductsPage({
      tenantId: session.tenant!.id,
      page: 1,
      search: initialSearchTerm || undefined,
      stockFilter: initialStockFilter,
    }),
    getTenantCategories(session.tenant!.id),
    getTenantPriceLists(session.tenant!.id),
    getTenantPendingSuggestionNotices(session.tenant!.id),
  ]);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ürün Yönetimi"
        title="Ürünler"
        description="Ürün listesini yönetin. Tekil ürün eklemek için «Ürün Ekle», toplu içe aktarma için «Toplu Ürün Ekleme» sayfasını kullanın."
      />
      <ProductSuggestionNotice suggestions={suggestionNotices} />
      <ProductsPageShell
        tenant={session.tenant!}
        initialProducts={firstPage.products}
        initialTotal={firstPage.total}
        initialCategories={categories}
        priceLists={priceLists}
        initialSearchTerm={initialSearchTerm}
        initialStockFilter={initialStockFilter}
        focusProductId={focus ?? null}
      />
    </div>
  );
}
