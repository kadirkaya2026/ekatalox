import { Header } from "@/components/dashboard/header";
import { ProductSuggestionsList } from "@/components/dashboard/product-suggestions-list";
import { SuggestionNotificationBell } from "@/components/dashboard/suggestion-notification-bell";
import { requireTenantAdminPage } from "@/lib/auth/session";
import {
  getTenantAllSuggestions,
  getTenantPendingSuggestionNotices,
} from "@/lib/products/suggestions";

export default async function ProductSuggestionsPage() {
  const session = await requireTenantAdminPage();
  const [suggestions, notices] = await Promise.all([
    getTenantAllSuggestions(session.tenant!.id),
    getTenantPendingSuggestionNotices(session.tenant!.id),
  ]);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ürün Yönetimi"
        title="Önerdiğim Ürünler"
        description="Listede bulamayıp süper admine eklenmesini önerdiğiniz ürünler ve güncel durumları."
        action={<SuggestionNotificationBell notices={notices} />}
      />
      <ProductSuggestionsList suggestions={suggestions} />
    </div>
  );
}
