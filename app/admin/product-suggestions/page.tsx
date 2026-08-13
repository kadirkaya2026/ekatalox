// Onay bekleyen öneriler her ziyarette güncel olmalı.
export const dynamic = "force-dynamic";

import { ProductSuggestionsPanel } from "@/components/admin/product-suggestions-panel";
import { Header } from "@/components/dashboard/header";
import { getPendingProductSuggestions } from "@/lib/products/suggestions";

export default async function AdminProductSuggestionsPage() {
  const suggestions = await getPendingProductSuggestions();

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ürün Yönetimi"
        title="Ürün Önerileri"
        description="Bayilerin stok listesi eşleştirmesinde sistemde bulamayıp eklenmesini önerdiği ürünleri onaylayın veya reddedin."
      />
      <ProductSuggestionsPanel initialSuggestions={suggestions} />
    </div>
  );
}
