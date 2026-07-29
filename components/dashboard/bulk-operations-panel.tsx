"use client";

import {
  useCallback,
  useRef,
  useState,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Images,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { parseProductsCsv } from "@/lib/csv/parse-products";
import { buildPackageUpgradeHref } from "@/lib/billing/plans";
import { sanitizeFileName } from "@/lib/storage/storage-helpers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ParsedCsvResult } from "@/lib/csv/parse-products";
import type { Category, Product, Tenant } from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_ZIP_BYTES = 100 * 1024 * 1024; // 100 MB
const BATCH_SIZE = 5;
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]);
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.2,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
  initialQuality: 0.75,
};

// Türkçe kolon başlıkları → teknik alan adı eşlemesi
const TURKISH_COLUMN_MAP: Record<string, string> = {
  "Kategori Adı": "category_name",
  "Model No": "sku_code",
  "Stok Kodu (SKU)": "sku_code",
  "Ürün Adı": "product_name",
  "Para Birimi": "currency",
  "1. Liste Fiyatı": "price_tier_1",
  "2. Liste Fiyatı": "price_tier_2",
  "3. Liste Fiyatı": "price_tier_3",
  "Stok Durumu": "is_in_stock",
  "Paket Adedi": "package_quantity",
  "Koli Adedi": "carton_quantity",
};

const TURKISH_TEMPLATE_HEADERS = [
  "Kategori Adı",
  "Model No",
  "Ürün Adı",
  "Para Birimi",
  "1. Liste Fiyatı",
  "2. Liste Fiyatı",
  "3. Liste Fiyatı",
  "Stok Durumu",
  "Paket Adedi",
  "Koli Adedi",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TabId = "products" | "images";

interface CsvState {
  status: "idle" | "parsing" | "ready" | "importing" | "done" | "error";
  file: File | null;
  parsed: ParsedCsvResult | null;
  message: string | null;
}

interface ZipProgress {
  total: number;
  completed: number;
  currentName: string;
  failedSkus: string[];
}

interface ZipState {
  status: "idle" | "validating" | "extracting" | "processing" | "done" | "error";
  file: File | null;
  message: string | null;
  progress: ZipProgress | null;
}

interface Props {
  tenant: Tenant;
  usage: {
    total: number;
    limit: number;
    remaining: number;
  };
  onProductsUpdated?: (products: Product[]) => void;
  onCategoriesUpdated?: (categories: Category[]) => void;
}

function PackageLimitAlert({
  tenant,
  usage,
}: {
  tenant: Tenant;
  usage: Props["usage"];
}) {
  if (usage.remaining > 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Paketiniz doldu, yeni ürün eklemek için paketinizi yükseltin.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Mevcut kullanım: {usage.total} / {usage.limit}. Ürün sildiğiniz anda kapasiteniz tekrar açılır.
          </p>
        </div>
        <Button
          asChild
          href={buildPackageUpgradeHref(tenant.company_name)}
          className="shrink-0"
        >
          Paketimi Yükseltmek İstiyorum
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: parse xlsx/csv → ParsedCsvResult (Türkçe ve İngilizce başlık destekli)
// ---------------------------------------------------------------------------
async function parseSpreadsheetFile(file: File): Promise<ParsedCsvResult> {
  const XLSX = await import("xlsx");
  const Papa = (await import("papaparse")).default;
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  // Ham satırları dizi olarak al
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  });

  if (!rawRows.length) {
    return { parsedHeaders: [], rows: [], errors: ["Dosya boş."] };
  }

  const headers = (rawRows[0] as string[]).map((h) => String(h ?? "").trim());
  const isTurkish = headers.some((h) => h in TURKISH_COLUMN_MAP);
  const englishHeaders = isTurkish
    ? headers.map((h) => TURKISH_COLUMN_MAP[h] ?? h)
    : headers;

  // image_url şablonda yok; parse fonksiyonu için boş sütun olarak ekle
  const hasImageUrl = englishHeaders.includes("image_url");
  if (!hasImageUrl) englishHeaders.push("image_url");

  // Barkod/Model No gibi büyük sayısal hücreler XLSX.utils.sheet_to_csv'nin
  // "General" sayı biçimiyle bilimsel gösterime (8.68183E+12) yuvarlanıyor
  // ve farklı Model No'lar aynı metne çöküp içe aktarmada kayboluyordu.
  // Ham sayıyı doğrudan String() ile yazarak tam hassasiyeti koruyoruz.
  const dataRows = rawRows.slice(1).map((row) => {
    const stringified = (row as unknown[]).map((cell) =>
      typeof cell === "number" ? String(cell) : cell,
    );
    return hasImageUrl ? stringified : [...stringified, ""];
  });

  const csvString = Papa.unparse([englishHeaders, ...dataRows]);
  return parseProductsCsv(csvString);
}

// ---------------------------------------------------------------------------
// Helpers: ZIP image filtering and SKU extraction
// ---------------------------------------------------------------------------
function getZipEntryBaseName(entryName: string) {
  const segments = entryName.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

function shouldIgnoreZipEntry(entryName: string) {
  const segments = entryName.split("/").filter(Boolean);
  if (segments.length === 0) {
    return true;
  }

  if (segments.some((segment) => segment === "__MACOSX")) {
    return true;
  }

  const baseName = segments[segments.length - 1] ?? "";
  if (!baseName || baseName === ".DS_Store" || baseName.startsWith(".")) {
    return true;
  }

  return segments.slice(0, -1).some((segment) => segment.startsWith("."));
}

function getZipImageEntryInfo(entryName: string) {
  if (shouldIgnoreZipEntry(entryName)) {
    return null;
  }

  const baseName = getZipEntryBaseName(entryName);
  const extensionIndex = baseName.lastIndexOf(".");
  if (extensionIndex <= 0) {
    return null;
  }

  const extension = baseName.slice(extensionIndex).toLowerCase();
  if (!IMAGE_EXTS.has(extension)) {
    return null;
  }

  const skuCode = baseName.slice(0, extensionIndex).trim();
  if (!skuCode || skuCode.startsWith(".")) {
    return null;
  }

  return { baseName, skuCode };
}

// ---------------------------------------------------------------------------
// Helper: upload a single compressed image to Supabase Storage
// ---------------------------------------------------------------------------
async function uploadCompressedImage(params: {
  tenantId: string;
  skuCode: string;
  file: File;
}): Promise<string> {
  const imageCompression = (await import("browser-image-compression")).default;
  const compressed = await imageCompression(params.file, COMPRESSION_OPTIONS);

  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase bağlantısı kurulamadı.");
  }

  const safeFileName = sanitizeFileName(`${params.skuCode}.jpg`);
  const storagePath = `${params.tenantId}/products/${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(storagePath, compressed, {
      upsert: true,
      contentType: "image/jpeg",
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

// ---------------------------------------------------------------------------
// Sub-component: Step indicator
// ---------------------------------------------------------------------------
function Step({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: number;
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
          {number}
        </div>
        <div className="mt-1 flex-1 border-l-2 border-dashed border-slate-200" />
      </div>
      <div className="pb-5">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-emerald-600" />
          <p className="text-sm font-semibold text-slate-900">{title}</p>
        </div>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Dropzone
// ---------------------------------------------------------------------------
function Dropzone({
  accept,
  onFile,
  disabled,
  label,
  hint,
}: {
  accept: string;
  onFile: (file: File) => void;
  disabled?: boolean;
  label: string;
  hint?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [onFile],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled) inputRef.current?.click();
        }
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition",
        isDragging
          ? "border-emerald-400 bg-emerald-50"
          : "border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/50",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
        <Upload className="size-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        {hint ? (
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Progress bar
// ---------------------------------------------------------------------------
function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-semibold text-slate-700">
        <span>Yükleniyor…</span>
        <span>%{pct}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 1: Toplu Ürün Ekleme
// ---------------------------------------------------------------------------
function ProductImportTab({
  tenant,
  usage,
  onProductsUpdated,
  onCategoriesUpdated,
}: {
  tenant: Tenant;
  usage: Props["usage"];
  onProductsUpdated?: (products: Product[]) => void;
  onCategoriesUpdated?: (categories: Category[]) => void;
}) {
  const [state, setState] = useState<CsvState>({
    status: "idle",
    file: null,
    parsed: null,
    message: null,
  });
  const router = useRouter();

  const handleFile = useCallback(async (file: File) => {
    if (usage.remaining <= 0) {
      setState({
        status: "error",
        file: null,
        parsed: null,
        message: "Ürün limitiniz dolu. Yeni ürün eklemek için paketinizi yükseltin veya ürün silin.",
      });
      return;
    }

    const isValid =
      file.name.endsWith(".csv") ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls");

    if (!isValid) {
      setState((s) => ({
        ...s,
        status: "error",
        message: "Yalnızca .csv veya .xlsx dosyaları kabul edilir.",
      }));
      return;
    }

    setState({ status: "parsing", file, parsed: null, message: null });

    try {
      const result = await parseSpreadsheetFile(file);
      setState({
        status: "ready",
        file,
        parsed: result,
        message: null,
      });
    } catch {
      setState({
        status: "error",
        file,
        parsed: null,
        message: "Dosya okunamadı. Lütfen şablona uygun bir dosya yükleyin.",
      });
    }
  }, [usage.remaining]);

  const handleImport = useCallback(async () => {
    if (!state.parsed?.rows.length) return;
    if (usage.remaining <= 0) {
      setState((s) => ({
        ...s,
        status: "error",
        message: "Ürün limitiniz dolu. Yeni ürün eklemek için paketinizi yükseltin veya ürün silin.",
      }));
      return;
    }

    setState((s) => ({ ...s, status: "importing", message: null }));

    try {
      const response = await fetch("/api/tenant/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: state.parsed.rows,
          parsedHeaders: state.parsed.parsedHeaders,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setState((s) => ({
          ...s,
          status: "error",
          message: result.error ?? "İçe aktarım başarısız.",
        }));
        return;
      }

      if (result.products) {
        onProductsUpdated?.(result.products as Product[]);
      }

      if (result.categories) {
        onCategoriesUpdated?.(result.categories as Category[]);
      }

      setState({
        status: "done",
        file: null,
        parsed: null,
        message: `${result.count ?? 0} ürün başarıyla aktarıldı.`,
      });
      router.refresh();
    } catch {
      setState((s) => ({
        ...s,
        status: "error",
        message: "Sunucuya bağlanılamadı. Lütfen tekrar deneyin.",
      }));
    }
  }, [state.parsed, onCategoriesUpdated, onProductsUpdated, usage.remaining, router]);

  const reset = useCallback(() => {
    setState({ status: "idle", file: null, parsed: null, message: null });
  }, []);

  const isLoading =
    state.status === "parsing" || state.status === "importing";

  return (
    <div className="space-y-6">
      <PackageLimitAlert tenant={tenant} usage={usage} />

      {/* Steps */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
        <Step
          number={1}
          icon={Download}
          title="Örnek Excel Şablonunu İndirin"
          description="Aşağıdaki butona tıklayarak tüm gerekli sütunları içeren şablonu indirin."
        />
        <Step
          number={2}
          icon={FileSpreadsheet}
          title="Şablonu doldurun"
          description='Ürün bilgilerinizi şablondaki sütunlara girin: "Kategori Adı", "Model No", "Ürün Adı", "Para Birimi", "1. Liste Fiyatı", "2. Liste Fiyatı", "3. Liste Fiyatı", "Stok Durumu", "Paket Adedi", "Koli Adedi". Stok Durumu için "Var" veya "Yok" yazın. Paket/Koli adedi boş bırakılabilir. Sütun adlarını değiştirmeyin.'
        />
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
              3
            </div>
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-2">
              <Upload className="size-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-900">
                Hazırladığınız dosyayı aşağıya sürükleyin
              </p>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              .xlsx veya .csv formatındaki dosyayı bırakarak ürünlerinizi saniyeler içinde yükleyin.
            </p>
          </div>
        </div>
      </div>

      {/* Template download */}
      <Button
        variant="secondary"
        onClick={async () => {
          const XLSX = await import("xlsx");
          const sampleRow = [
            "Elektronik",
            "A1001",
            "Örnek Ürün",
            "TRY",
            "100",
            "110",
            "120",
            "Var",
            "20",
            "200",
          ];
          const ws = XLSX.utils.aoa_to_sheet([
            TURKISH_TEMPLATE_HEADERS,
            sampleRow,
          ]);
          ws["!cols"] = TURKISH_TEMPLATE_HEADERS.map(() => ({ wch: 22 }));
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Ürünler");
          XLSX.writeFile(wb, "urun-sablonu.xlsx");
        }}
        className="gap-2"
      >
        <Download className="size-4" />
        Şablonu İndir (.xlsx)
      </Button>

      {/* Dropzone */}
      {state.status === "idle" || state.status === "error" ? (
        <Dropzone
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onFile={handleFile}
          disabled={usage.remaining <= 0}
          label="Excel veya CSV dosyasını buraya sürükleyin ya da tıklayın"
          hint=".xlsx veya .csv — maks. boyut sınırı yok"
        />
      ) : null}

      {/* Parsing indicator */}
      {state.status === "parsing" ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          <Loader2 className="size-4 animate-spin text-emerald-600" />
          Dosya okunuyor…
        </div>
      ) : null}

      {/* Preview */}
      {state.status === "ready" && state.parsed ? (
        <div className="rounded-xl border border-slate-100 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-900">
                {state.file?.name}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="px-4 py-4">
            {state.parsed.errors.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                  <AlertCircle className="size-4" />
                  {state.parsed.errors.length} hata tespit edildi
                </div>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-slate-600">
                  {state.parsed.errors.map((err, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-0.5 shrink-0 text-red-400">•</span>
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="size-4" />
                <span>
                  <span className="font-semibold">{state.parsed.rows.length} satır</span>{" "}
                  başarıyla doğrulandı. İçe aktarmaya hazır.
                </span>
              </div>
            )}
          </div>

          {state.parsed.errors.length === 0 ? (
            <div className="border-t border-slate-100 px-4 py-3">
              <Button onClick={handleImport} disabled={isLoading || usage.remaining <= 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Aktarılıyor…
                  </>
                ) : (
                  `${state.parsed.rows.length} ürünü içe aktar`
                )}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Importing indicator */}
      {state.status === "importing" ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          <Loader2 className="size-4 animate-spin" />
          Ürünler veritabanına aktarılıyor, lütfen bekleyin…
        </div>
      ) : null}

      {/* Done */}
      {state.status === "done" && state.message ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="size-4 shrink-0" />
          {state.message}
          <button
            type="button"
            onClick={reset}
            className="ml-auto rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      {/* Error */}
      {state.status === "error" && state.message ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-sm font-medium text-red-800">
          <AlertCircle className="size-4 shrink-0" />
          {state.message}
          <button
            type="button"
            onClick={reset}
            className="ml-auto rounded-lg p-1 text-red-600 hover:bg-red-100"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 2: Toplu Ürün Resmi Ekleme
// ---------------------------------------------------------------------------
function ImageImportTab({ tenant }: { tenant: Tenant }) {
  const [state, setState] = useState<ZipState>({
    status: "idle",
    file: null,
    message: null,
    progress: null,
  });
  const router = useRouter();

  const handleFile = useCallback(
    async (file: File) => {
      // 1) Validate extension
      if (!file.name.endsWith(".zip")) {
        setState({
          status: "error",
          file: null,
          message: "Yalnızca .zip formatındaki dosyalar kabul edilir.",
          progress: null,
        });
        return;
      }

      // 2) Validate size
      if (file.size > MAX_ZIP_BYTES) {
        setState({
          status: "error",
          file: null,
          message: `Dosya boyutu 100 MB limitini aşıyor (${(file.size / 1024 / 1024).toFixed(1)} MB). Daha küçük bir zip oluşturun.`,
          progress: null,
        });
        return;
      }

      setState({
        status: "extracting",
        file,
        message: null,
        progress: null,
      });

      try {
        // 3) Extract ZIP client-side
        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(file);

        // 4) Filter image files
        const imageEntries: Array<{
          name: string;
          baseName: string;
          skuCode: string;
          entry: import("jszip").JSZipObject;
        }> = [];
        zip.forEach((relativePath, entry) => {
          if (entry.dir) return;
          const imageInfo = getZipImageEntryInfo(relativePath);
          if (!imageInfo) return;
          imageEntries.push({
            name: relativePath,
            baseName: imageInfo.baseName,
            skuCode: imageInfo.skuCode,
            entry,
          });
        });

        if (imageEntries.length === 0) {
          setState({
            status: "error",
            file: null,
            message: "Zip içinde desteklenen resim dosyası bulunamadı (.jpg, .jpeg, .png, .webp, .gif).",
            progress: null,
          });
          return;
        }

        // 5) Start processing
        setState({
          status: "processing",
          file,
          message: null,
          progress: {
            total: imageEntries.length,
            completed: 0,
            currentName: "",
            failedSkus: [],
          },
        });

        const allUpdates: Array<{ sku_code: string; image_url: string }> = [];
        const uploadFailedSkus: string[] = [];

        // Process in batches of BATCH_SIZE
        for (let i = 0; i < imageEntries.length; i += BATCH_SIZE) {
          const batch = imageEntries.slice(i, i + BATCH_SIZE);

          const batchResults = await Promise.allSettled(
            batch.map(async ({ baseName, skuCode, entry }) => {
              setState((s) => ({
                ...s,
                progress: s.progress
                  ? { ...s.progress, currentName: baseName }
                  : null,
              }));

              // Get file blob from zip
              const blob = await entry.async("blob");
              const imageFile = new File([blob], baseName, {
                type: blob.type || "image/jpeg",
              });

              // Compress + upload
              const imageUrl = await uploadCompressedImage({
                tenantId: tenant.id,
                skuCode,
                file: imageFile,
              });

              return { sku_code: skuCode, image_url: imageUrl };
            }),
          );

          for (const result of batchResults) {
            if (result.status === "fulfilled") {
              allUpdates.push(result.value);
            } else {
              const idx = batchResults.indexOf(result);
              uploadFailedSkus.push(batch[idx].skuCode);
            }
          }

          setState((s) => ({
            ...s,
            progress: s.progress
              ? {
                  ...s.progress,
                  completed: Math.min(i + batch.length, imageEntries.length),
                  failedSkus: [...uploadFailedSkus],
                }
              : null,
          }));
        }

        let successCount = allUpdates.length;
        const dbFailedSkus: string[] = [];

        // 6) Bulk-update DB
        if (allUpdates.length > 0) {
          const response = await fetch("/api/tenant/products/bulk-image-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ updates: allUpdates }),
          });

          const result = (await response.json().catch(() => null)) as
            | { count?: number; failedSkus?: string[]; error?: string }
            | null;

          if (!response.ok) {
            throw new Error(result?.error ?? "Ürün resimleri eşleştirilemedi.");
          }

          if (typeof result?.count === "number") {
            successCount = result.count;
          }

          if (Array.isArray(result?.failedSkus)) {
            dbFailedSkus.push(
              ...result.failedSkus.filter(
                (sku): sku is string =>
                  typeof sku === "string" && sku.trim().length > 0,
              ),
            );
          }
        }

        const failedSkus = Array.from(
          new Set([...uploadFailedSkus, ...dbFailedSkus]),
        );

        setState({
          status: "done",
          file: null,
          message:
            failedSkus.length > 0
              ? `${successCount} resim yüklendi. ${failedSkus.length} resim yüklenemedi: ${failedSkus.join(", ")}.`
              : `${successCount} resim başarıyla yüklendi ve ürünlerle eşleştirildi.`,
          progress: null,
        });
        router.refresh();
      } catch (err) {
        setState({
          status: "error",
          file: null,
          message:
            err instanceof Error
              ? err.message
              : "Zip dosyası işlenirken hata oluştu.",
          progress: null,
        });
      }
    },
    [tenant.id, router],
  );

  const reset = useCallback(() => {
    setState({ status: "idle", file: null, message: null, progress: null });
  }, []);

  const progressPct =
    state.progress && state.progress.total > 0
      ? (state.progress.completed / state.progress.total) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Steps */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
        <Step
          number={1}
          icon={FileSpreadsheet}
          title="Resim dosyalarını model noya göre adlandırın"
          description="Her ürün fotoğrafını, o ürünün model no/barkod koduyla aynı isimde kaydedin. Örnek: model no 'A1001' olan ürünün resmi 'A1001.jpg' olmalıdır."
        />
        <Step
          number={2}
          icon={Archive}
          title="Tüm fotoğrafları tek bir .zip dosyasına sıkıştırın"
          description="Adlandırdığınız tüm resimleri seçerek bir .zip arşivi oluşturun. Maksimum dosya boyutu 100 MB'tır."
        />
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
              3
            </div>
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-2">
              <Upload className="size-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-900">
                Zip dosyasını aşağıya sürükleyin
              </p>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Sistem resimleri otomatik sıkıştıracak (maks. 1200px, %75 kalite), Supabase Storage&apos;a yükleyecek ve her resmi ilgili ürünle eşleştirecektir.
            </p>
          </div>
        </div>
      </div>

      {/* Dropzone */}
      {state.status === "idle" || state.status === "error" ? (
        <Dropzone
          accept=".zip,application/zip,application/x-zip-compressed"
          onFile={handleFile}
          label="ZIP dosyasını buraya sürükleyin ya da tıklayın"
          hint=".zip — maks. 100 MB"
        />
      ) : null}

      {/* Processing */}
      {(state.status === "extracting" || state.status === "processing") ? (
        <div className="rounded-xl border border-slate-100 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Loader2 className="size-4 animate-spin text-emerald-600" />
            {state.status === "extracting"
              ? "Zip dosyası açılıyor…"
              : "Resimler sıkıştırılıp yükleniyor…"}
          </div>

          {state.progress ? (
            <>
              <ProgressBar value={progressPct} />
              <p className="text-xs text-slate-500">
                {state.progress.completed} / {state.progress.total} resim işlendi
                {state.progress.currentName
                  ? ` — şu an: ${state.progress.currentName}`
                  : ""}
              </p>
            </>
          ) : null}
        </div>
      ) : null}

      {/* Done */}
      {state.status === "done" && state.message ? (
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-4 text-sm font-medium",
            state.message.includes("yüklenemedi")
              ? "border-yellow-100 bg-yellow-50 text-yellow-800"
              : "border-emerald-100 bg-emerald-50 text-emerald-800",
          )}
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span className="flex-1">{state.message}</span>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg p-1 hover:bg-black/5"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      {/* Error */}
      {state.status === "error" && state.message ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-sm font-medium text-red-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span className="flex-1">{state.message}</span>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg p-1 hover:bg-red-100"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------
export function BulkOperationsPanel({
  tenant,
  usage,
  onProductsUpdated,
  onCategoriesUpdated,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("products");

  return (
    <Card className="overflow-hidden">
      {/* Panel header */}
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Toplu İşlemler</h2>
        <p className="mt-1 text-sm text-slate-500">
          Excel/CSV ile yüzlerce ürünü tek seferde ekleyin veya toplu resim yükleyin.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          type="button"
          onClick={() => setActiveTab("products")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition",
            activeTab === "products"
              ? "border-emerald-500 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700",
          )}
        >
          <FileSpreadsheet className="size-4" />
          Toplu Ürün Ekleme
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("images")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition",
            activeTab === "images"
              ? "border-emerald-500 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700",
          )}
        >
          <Images className="size-4" />
          Toplu Ürün Resmi Ekleme
        </button>
      </div>

      {/* Tab content */}
      <div className="p-5">
        {activeTab === "products" ? (
          <ProductImportTab
            tenant={tenant}
            usage={usage}
            onProductsUpdated={onProductsUpdated}
            onCategoriesUpdated={onCategoriesUpdated}
          />
        ) : (
          <ImageImportTab tenant={tenant} />
        )}
      </div>
    </Card>
  );
}
