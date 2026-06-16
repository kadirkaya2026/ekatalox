import { Card } from "@/components/ui/card";
import type { ThemeDistributionRow } from "@/lib/data";

export function AdminThemeDistributionPanel({
  rows,
}: {
  rows: ThemeDistributionRow[];
}) {
  if (!rows.length) {
    return (
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Tema dağılımı</h2>
        <p className="mt-2 text-sm text-slate-600">
          Henüz kayıtlı vitrin ayarı bulunmuyor.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-slate-900">Tema dağılımı</h2>
      <p className="mt-2 text-sm text-slate-600">
        Aynı tema + layout + renk + font kombinasyonunu kullanan firmalar. Yüksek tekrar,
        vitrinlerin birbirine benzer göründüğüne işaret edebilir.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-3 py-2 font-medium">Tema</th>
              <th className="px-3 py-2 font-medium">Layout</th>
              <th className="px-3 py-2 font-medium">Renk</th>
              <th className="px-3 py-2 font-medium">Font</th>
              <th className="px-3 py-2 font-medium">Firma sayısı</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.signature} className="border-b border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-900">{row.theme_key}</td>
                <td className="px-3 py-2 text-slate-700">{row.layout_key}</td>
                <td className="px-3 py-2 text-slate-700">{row.brand_primary_color ?? "—"}</td>
                <td className="px-3 py-2 text-slate-700">{row.font_key}</td>
                <td className="px-3 py-2 font-semibold text-slate-900">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
