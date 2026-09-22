import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { TenantSettingsForm } from "@/components/dashboard/tenant-settings-form";
import { Card } from "@/components/ui/card";
import { requireTenantAdminPage } from "@/lib/auth/session";

export default async function TenantSettingsPage(
  props: PageProps<"/dashboard/settings">,
) {
  const session = await requireTenantAdminPage();
  const searchParams = await props.searchParams;
  const forcePasswordChange = searchParams.forcePasswordChange === "1";

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Hesap Ayarları"
        title="Sipariş ve üyelik bilgileri"
        description="WhatsApp yönlendirme numarasını ve üyelik bilgilerinizi buradan yönetin."
      />

      <TenantSettingsForm
        tenant={session.tenant!}
        profile={session.profile!}
        forcePasswordChange={forcePasswordChange}
      />

      {/* Kurulum sihirbazı, kurulum bitmiş olsa da buradan yeniden açılır
          (kullanıcı isteği, 22 Eyl 2026). */}
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Kurulum sihirbazı</p>
            <p className="mt-0.5 text-sm text-slate-500">
              Mağaza adı, logo, tema, banner, kategori ve ürün adımlarını baştan adım adım gözden geçirin.
              Mevcut ayarlarınız silinmez; her adımda değiştirmek istediğinizi güncellersiniz.
            </p>
          </div>
        </div>
        <Link
          href="/?sihirbaz=1"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Sihirbazı baştan başlat
        </Link>
      </Card>
    </div>
  );
}
