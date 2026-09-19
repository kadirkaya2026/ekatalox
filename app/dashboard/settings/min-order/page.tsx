import { redirect } from "next/navigation";

// Minimum sepet tutarı artık Sepet Ayarları sayfasının içinde (kullanıcı
// isteği, 19 Eyl 2026). Eski bağlantılar oraya yönlensin.
export default function TenantMinCartAmountSettingsPage() {
  redirect("/settings/cart");
}
