import { redirect } from "next/navigation";

// "Vitrin" sayfası /settings/footer (footer içeriği) ve /settings/identity
// (fiyat güncelleme tarihi) olarak ikiye ayrıldı; eski bookmark'lar/linkler
// kırılmasın diye burada footer sayfasına yönlendirme bırakıldı.
export default function TenantStorefrontLegacyRedirect() {
  redirect("/dashboard/settings/footer");
}
