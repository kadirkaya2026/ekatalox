import { Header } from "@/components/dashboard/header";
import { ProductSuggestionsList } from "@/components/dashboard/product-suggestions-list";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantAllSuggestions } from "@/lib/products/suggestions";

export default async function ProductSuggestionsPage() {
  const session = await requireTenantAdminPage();
  const suggestions = await getTenantAllSuggestions(session.tenant!.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ürün Yönetimi"
        title="Önerdiğim Ürünler"
        description="Listede bulamayıp süper admine eklenmesini önerdiğiniz ürünler ve güncel durumları."
      />
      <ProductSuggestionsList suggestions={suggestions} />
    </div>
  );
}
