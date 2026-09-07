export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { SiteVisitorDetailView } from "@/components/admin/site-visitor-detail";
import { Header } from "@/components/dashboard/header";
import { getSiteVisitorDetail } from "@/lib/site-analytics/report";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminSiteVisitorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { id } = await params;
  const { from, to } = await searchParams;

  if (!UUID.test(id)) {
    notFound();
  }

  const visitor = await getSiteVisitorDetail(id);

  if (!visitor) {
    notFound();
  }

  const back = from && to ? `/admin/ziyaretciler?preset=custom&from=${from}&to=${to}` : "/admin/ziyaretciler";

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ziyaretçi"
        title={`Ziyaretçi ${visitor.visitorKey.slice(0, 8)}`}
        description="Bu kişinin sitede yaptığı her oturum, sırasıyla gördüğü sayfalar, tıkladığı düğmeler ve her sayfada ne kadar kaldığı."
      />

      <SiteVisitorDetailView visitor={visitor} backHref={back} />
    </div>
  );
}
