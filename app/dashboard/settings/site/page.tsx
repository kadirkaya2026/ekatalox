import { redirect } from "next/navigation";

// "Site Kimliği" sayfası /settings/identity olarak yeniden adlandırıldı;
// eski bookmark'lar/linkler kırılmasın diye burada yönlendirme bırakıldı.
export default function TenantSiteIdentityLegacyRedirect() {
  redirect("/dashboard/settings/identity");
}
