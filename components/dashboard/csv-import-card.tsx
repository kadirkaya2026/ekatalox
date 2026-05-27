"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { parseProductsCsv } from "@/lib/csv/parse-products";
import type { ParsedCsvResult } from "@/lib/csv/parse-products";
import type { Tenant } from "@/lib/types";

export function CsvImportCard({ tenant }: { tenant: Tenant }) {
  const router = useRouter();
  const [csvSummary, setCsvSummary] = useState<{
    totalRows: number;
    errors: string[];
    parsedHeaders: string[];
    rows: ParsedCsvResult["rows"];
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function downloadTemplate() {
    window.location.assign("/api/tenant/products/export-template");
  }

  function handleCsvSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setCsvSummary(null);
      return;
    }

    file.text().then((csvText) => {
      const parsed = parseProductsCsv(csvText);
      setCsvSummary({
        totalRows: parsed.rows.length,
        errors: parsed.errors,
        parsedHeaders: parsed.parsedHeaders,
        rows: parsed.rows,
      });
    });
  }

  function importCsv() {
    if (!csvSummary?.rows.length) {
      setMessage("Önce bir CSV seçin.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/tenant/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: csvSummary.rows,
          parsedHeaders: csvSummary.parsedHeaders,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "CSV içeri aktarılamadı.");
        return;
      }

      setMessage(`CSV içeri alındı. ${result.count ?? 0} satır işlendi.`);
      setCsvSummary(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.refresh();
    });
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
          <FileSpreadsheet className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">CSV içe aktarma</h2>
          <p className="text-sm text-slate-600">
            Beklenen kolonlar: sku_code, product_name, image_url, currency,
            fiyatlar, is_in_stock, package_quantity ve carton_quantity.
          </p>
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <Button variant="secondary" onClick={downloadTemplate}>
          Örnek CSV İndir
        </Button>

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          <Upload className="size-4 text-emerald-700" />
          <span>CSV dosyası seç</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvSelect}
          />
        </label>

        {csvSummary ? (
          <div className="rounded-xl border border-slate-100 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">
              Önizleme: {csvSummary.totalRows} satır
            </p>
            {csvSummary.errors.length ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {csvSummary.errors.map((error) => (
                  <li key={error}>• {error}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-emerald-700">
                Dosya başarılı şekilde parse edildi.
              </p>
            )}

            <Button
              className="mt-4"
              onClick={importCsv}
              disabled={pending || csvSummary.errors.length > 0}
            >
              CSV&apos;yi içeri al
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
