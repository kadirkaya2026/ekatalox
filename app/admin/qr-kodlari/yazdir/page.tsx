import QRCode from "qrcode";
import { requireSuperAdminPage } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { appEnv } from "@/lib/env";
import { formatMagnetCodeForPrint } from "@/lib/magnet/codes";

// Matbaaya verilecek QR sayfası.
//
// QR'lar sunucuda SVG olarak üretiliyor: vektör olduğu için magnet
// boyutundan bağımsız keskin basılır, istemci tarafı kütüphaneye de
// gerek kalmaz.
//
// Hata düzeltme seviyesi M: magnetin köşesi aşınsa/kirlense bile okunur,
// ama H kadar yoğun değil — küçük baskıda modüller çok ufalmasın.

export const dynamic = "force-dynamic";

async function buildQrSvg(url: string) {
  return QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 240,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>;
}) {
  await requireSuperAdminPage();
  const { durum } = await searchParams;

  const supabase = createSupabaseAdminClient();
  let query = supabase
    ?.from("magnet_codes")
    .select("id, code, label, tenant_id")
    .order("created_at", { ascending: false })
    .limit(500);

  // Varsayılan olarak sadece atanmamışlar: basılacak olanlar bunlar.
  if (query && durum !== "hepsi") {
    query = query.is("tenant_id", null);
  }

  const { data } = query ? await query : { data: [] };
  const codes = data ?? [];

  const withSvg = await Promise.all(
    codes.map(async (row) => ({
      ...row,
      svg: await buildQrSvg(`https://${appEnv.marketingDomain}/t/${row.code}`),
    })),
  );

  return (
    <div className="bg-white p-6 text-black">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold">Magnet QR Baskı Sayfası</h1>
          <p className="mt-1 text-sm text-slate-600">
            {withSvg.length} kod · {durum === "hepsi" ? "tümü" : "yalnızca atanmamışlar"} ·
            Ctrl/Cmd + P ile PDF alıp matbaaya verin
          </p>
        </div>
        <a
          href={
            durum === "hepsi"
              ? "/admin/qr-kodlari/yazdir"
              : "/admin/qr-kodlari/yazdir?durum=hepsi"
          }
          className="rounded-lg border px-3 py-1.5 text-sm"
        >
          {durum === "hepsi" ? "Sadece atanmamışlar" : "Tümünü göster"}
        </a>
      </div>

      {withSvg.length === 0 ? (
        <p className="text-sm text-slate-600">
          Basılacak kod yok. Önce Magnet QR Kodları ekranından kod üretin.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
          {withSvg.map((row) => (
            <div
              key={row.id}
              // break-inside-avoid: bir QR sayfa sonunda ikiye bölünmesin.
              className="flex break-inside-avoid flex-col items-center rounded-xl border border-slate-300 p-3"
            >
              <div
                className="w-full [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: row.svg }}
              />
              <p className="mt-2 font-mono text-sm font-bold tracking-widest">
                {formatMagnetCodeForPrint(row.code)}
              </p>
              <p className="text-[10px] text-slate-500">
                {appEnv.marketingDomain}/t/{row.code}
              </p>
              {row.label ? (
                <p className="mt-0.5 text-[10px] text-slate-400 print:hidden">{row.label}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
