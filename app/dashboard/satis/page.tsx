import { redirect } from "next/navigation";

// Satış & Kârlılık, Raporlar'ın alt menüsüne taşındı (29 Ağu 2026).
// Eski yer imleri kırılmasın diye kalıcı yönlendirme.
export default function LegacySalesRedirect() {
  redirect("/dashboard/reports/satis");
}
