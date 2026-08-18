"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, Search, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  guessFieldForHeader,
  mapRawRowsToSourceRows,
  parseStockImportSpreadsheet,
  type ColumnMapping,
  type StockImportFieldKey,
  type StockImportRawTable,
  type StockImportSourceRow,
} from "@/lib/csv/parse-stock-import";
import type { StockImportMatchResult, StockImportMatchStatus } from "@/lib/products/stock-import-matching";
import { buildCategoryTree, flattenCategoryTree } from "@/lib/categories/tree";
import { cn } from "@/lib/utils";
import type { Category, PriceList } from "@/lib/types";

type WizardStep = "upload" | "mapping" | "review";
type RowDecisionAction = "approved" | "reassigned" | "skipped" | "pending" | "suggested" | "create";

interface RowDecision {
  rowNumber: number;
  action: RowDecisionAction;
  productId: string | null;
  // Barkodu Master Katalog'da bulunan ama tenant'ta henüz olmayan satırlar
  // için dolu — productId ile birbirini dışlar (biri set edilince diğeri
  // temizlenir). Apply isteğinde productId yerine bu gönderilir.
  masterCatalogSkuCode: string | null;
  // action==="create" iken dolu — hiçbir yerde eşleşmeyen satırı tenant'ta
  // sıfırdan yeni ürün olarak oluşturmak için seçilen kategori. Kategori
  // seçilmeden bu satır "uygulamaya hazır" sayılmaz (bkz. applyCount).
  categoryId: string | null;
  // action==="create" iken dosyadaki isim yerine kullanıcının elle
  // düzenleyebildiği ürün adı — boş bırakılamaz (bkz. isRowReadyForApply).
  productName: string | null;
  // action==="create" iken dosyadaki barkod yerine kullanıcının elle
  // düzenleyebildiği barkod/SKU — boş bırakılamaz.
  skuCode: string | null;
  // action==="create" iken, kullanıcı bir görsel seçip yüklediyse Supabase
  // Storage'daki public URL'i — opsiyonel, boşsa ürün görselsiz oluşturulur
  // (ProductImagePlaceholder ürün adını otomatik gösterir).
  imageUrl: string | null;
  price: number | null;
}

interface ProductPoolEntry {
  id: string;
  sku_code: string;
  product_name: string;
}

interface MatchResponse {
  productPool: ProductPoolEntry[];
  results: StockImportMatchResult[];
  summary: {
    totalRows: number;
    matchedExact: number;
    matchedMasterCatalog: number;
    matchedFuzzyHigh: number;
    needsReview: number;
    noMatch: number;
  };
}

const FIELD_OPTIONS: Array<{ value: StockImportFieldKey; label: string }> = [
  { value: "barcode", label: "Barkod / Stok Kodu" },
  { value: "product_name", label: "Ürün Adı" },
  { value: "price", label: "Fiyat" },
  { value: "ignore", label: "Yoksay" },
];

function Dropzone({ onFile, disabled }: { onFile: (file: File) => void; disabled?: boolean }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) onFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [onFile],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Stok listesi dosyası yükle"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
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
        <p className="text-sm font-semibold text-slate-900">Stok listesi dosyasını sürükleyin veya seçin</p>
        <p className="mt-1 text-xs text-slate-500">.xlsx, .xls veya .csv</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}

function initialDecisionsFromResults(
  results: StockImportMatchResult[],
  sourceRowsByRowNumber: Map<number, StockImportSourceRow>,
): Map<number, RowDecision> {
  const decisions = new Map<number, RowDecision>();

  for (const result of results) {
    const sourcePrice = sourceRowsByRowNumber.get(result.rowNumber)?.price ?? null;
    const hasPriceMissingWarning = result.warnings.includes("price_missing");
    const isAutoMatch =
      result.status === "matched_exact" ||
      result.status === "matched_master_catalog" ||
      result.status === "matched_fuzzy_high";

    decisions.set(result.rowNumber, {
      rowNumber: result.rowNumber,
      action: isAutoMatch && !hasPriceMissingWarning ? "approved" : "pending",
      productId: isAutoMatch ? result.matchedProductId : null,
      masterCatalogSkuCode:
        isAutoMatch && result.status === "matched_master_catalog" ? (result.masterCatalogMatch?.skuCode ?? null) : null,
      categoryId: null,
      productName: null,
      skuCode: null,
      imageUrl: null,
      price: sourcePrice,
    });
  }

  return decisions;
}

// Bir satırın "Uygula"ya dahil edilip edilmeyeceğini tek yerden karar
// vermek için — hem özet sayaç (applyCount) hem de gönderilecek payload bu
// fonksiyona göre filtreleniyor, ikisinin birbirinden sapmasını önler.
function isRowReadyForApply(decision: RowDecision) {
  if (decision.price === null) return false;
  if (decision.action === "create") {
    return (
      Boolean(decision.categoryId) &&
      Boolean(decision.productName?.trim()) &&
      Boolean(decision.skuCode?.trim())
    );
  }
  return (
    (decision.action === "approved" || decision.action === "reassigned") &&
    Boolean(decision.productId || decision.masterCatalogSkuCode)
  );
}

function ProductPicker({
  productPool,
  onSelect,
}: {
  productPool: ProductPoolEntry[];
  onSelect: (product: ProductPoolEntry) => void;
}) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) return [];

    return productPool
      .filter(
        (product) =>
          product.product_name.toLocaleLowerCase("tr-TR").includes(normalized) ||
          product.sku_code.toLocaleLowerCase("tr-TR").includes(normalized),
      )
      .slice(0, 8);
  }, [productPool, query]);

  return (
    <div className="mt-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ürün adı veya barkod ile ara..."
          className="pl-9"
        />
      </div>
      {matches.length ? (
        <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-100 p-1">
          {matches.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product)}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-slate-50"
            >
              <span className="truncate font-medium text-slate-800">{product.product_name}</span>
              <span className="shrink-0 text-xs text-slate-400">{product.sku_code}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ReviewRow({
  result,
  sourceRow,
  decision,
  productById,
  productPool,
  flatCategories,
  onDecisionChange,
}: {
  result: StockImportMatchResult;
  sourceRow: StockImportSourceRow;
  decision: RowDecision;
  productById: Map<string, ProductPoolEntry>;
  productPool: ProductPoolEntry[];
  flatCategories: Array<{ id: string; name: string; depth: number }>;
  onDecisionChange: (next: RowDecision) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [suggestPending, setSuggestPending] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [imageUploadPending, setImageUploadPending] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const matchedProduct = decision.productId
    ? productById.get(decision.productId)
    : decision.masterCatalogSkuCode && result.masterCatalogMatch
      ? {
          id: "",
          sku_code: result.masterCatalogMatch.skuCode,
          product_name: result.masterCatalogMatch.productName,
        }
      : null;
  const isCreatingNew = decision.action === "create";
  const hasResolution = Boolean(
    decision.productId ||
      decision.masterCatalogSkuCode ||
      (isCreatingNew && decision.categoryId && decision.productName?.trim()),
  );
  const canCreateNew = Boolean(sourceRow.barcode);
  const isPending = decision.action === "pending" || decision.action === "skipped";

  async function suggestProduct() {
    if (!sourceRow.barcode) return;
    setSuggestError(null);
    setSuggestPending(true);

    try {
      const response = await fetch("/api/tenant/products/product-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: sourceRow.barcode,
          product_name: sourceRow.productName ?? sourceRow.barcode,
          price: decision.price,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setSuggestError(result.error ?? "Öneri gönderilemedi.");
        return;
      }

      onDecisionChange({ ...decision, action: "suggested", productId: null });
    } catch {
      setSuggestError("Öneri gönderilemedi.");
    } finally {
      setSuggestPending(false);
    }
  }

  async function handleImageSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (!file) return;

    setImageUploadError(null);
    setImageUploadPending(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/tenant/products/stock-import/upload-image", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        setImageUploadError(result.error ?? "Görsel yüklenemedi.");
        return;
      }

      onDecisionChange({ ...decision, imageUrl: result.imageUrl });
    } catch {
      setImageUploadError("Görsel yüklenemedi.");
    } finally {
      setImageUploadPending(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        decision.action === "skipped"
          ? "border-slate-100 bg-slate-50/60 opacity-70"
          : decision.action === "suggested"
            ? "border-violet-200 bg-violet-50/40"
            : isCreatingNew
              ? "border-teal-200 bg-teal-50/40"
              : isPending
                ? "border-amber-200 bg-amber-50/40"
                : "border-emerald-100 bg-emerald-50/30",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {sourceRow.productName ?? "(ürün adı yok)"}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Satır {sourceRow.rowNumber} • Barkod: {sourceRow.barcode ?? "yok"}
          </p>
          {result.warnings.includes("price_missing") ? (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700">
              <AlertTriangle className="size-3.5" /> Dosyada fiyat girilmemiş
            </p>
          ) : null}
          {result.warnings.includes("duplicate_barcode_in_file") ? (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700">
              <AlertTriangle className="size-3.5" /> Bu barkod dosyada birden fazla kez geçiyor
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge
            className={
              decision.action === "approved" || decision.action === "reassigned"
                ? "bg-emerald-100 text-emerald-700"
                : decision.action === "skipped"
                  ? "bg-slate-200 text-slate-600"
                  : decision.action === "suggested"
                    ? "bg-violet-100 text-violet-700"
                    : decision.action === "create"
                      ? "bg-teal-100 text-teal-700"
                      : "bg-amber-100 text-amber-800"
            }
          >
            {decision.action === "approved" && "Onaylı"}
            {decision.action === "reassigned" && "Eşleştirildi"}
            {decision.action === "skipped" && "Atlandı"}
            {decision.action === "pending" && "Bekliyor"}
            {decision.action === "suggested" && "Önerildi"}
            {decision.action === "create" && "Yeni ürün"}
          </Badge>
          {result.status === "matched_master_catalog" ? (
            <Badge className="bg-sky-100 text-sky-700">Master Katalog&apos;dan aktarılacak</Badge>
          ) : null}
        </div>
      </div>

      {matchedProduct ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2">
          <div>
            <p className="text-sm font-medium text-slate-800">{matchedProduct.product_name}</p>
            <p className="text-xs text-slate-500">{matchedProduct.sku_code}</p>
          </div>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={decision.price ?? ""}
            onChange={(event) =>
              onDecisionChange({
                ...decision,
                price: event.target.value === "" ? null : Number(event.target.value),
              })
            }
            placeholder="Fiyat"
            className="w-28"
          />
        </div>
      ) : null}

      {isCreatingNew ? (
        <div className="mt-3 space-y-2 rounded-xl border border-dashed border-teal-200 bg-white/70 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={decision.productName ?? ""}
              onChange={(event) => onDecisionChange({ ...decision, productName: event.target.value })}
              placeholder="Ürün adı"
              className="min-w-[220px] flex-1"
            />
            <Input
              value={decision.skuCode ?? ""}
              onChange={(event) => onDecisionChange({ ...decision, skuCode: event.target.value })}
              placeholder="Barkod / SKU"
              className="w-40"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {decision.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- küçük önizleme, next/image optimizasyonuna gerek yok
                <img src={decision.imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="px-1 text-center text-[9px] leading-tight text-slate-400">Görsel yok</span>
              )}
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => imageInputRef.current?.click()}
              disabled={imageUploadPending}
            >
              {imageUploadPending ? "Yükleniyor..." : decision.imageUrl ? "Görseli değiştir" : "Görsel seç"}
            </Button>
            {decision.imageUrl ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => onDecisionChange({ ...decision, imageUrl: null })}
              >
                Kaldır
              </Button>
            ) : null}
          </div>
          {imageUploadError ? <p className="text-xs font-medium text-rose-600">{imageUploadError}</p> : null}

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={decision.categoryId ?? ""}
              onChange={(event) => onDecisionChange({ ...decision, categoryId: event.target.value || null })}
              className="min-w-[220px]"
            >
              <option value="">Kategori seçin (zorunlu)</option>
              {flatCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {"— ".repeat(category.depth)}
                  {category.name}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={decision.price ?? ""}
              onChange={(event) =>
                onDecisionChange({
                  ...decision,
                  price: event.target.value === "" ? null : Number(event.target.value),
                })
              }
              placeholder="Fiyat"
              className="w-28"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => onDecisionChange({ ...decision, action: "pending", categoryId: null })}
            >
              Vazgeç
            </Button>
          </div>
          {!decision.productName?.trim() ? (
            <p className="text-xs font-medium text-amber-700">Ürün adı boş olamaz.</p>
          ) : !decision.skuCode?.trim() ? (
            <p className="text-xs font-medium text-amber-700">Barkod/SKU boş olamaz.</p>
          ) : !decision.categoryId ? (
            <p className="text-xs font-medium text-amber-700">Kategori seçilmeden bu ürün oluşturulmaz.</p>
          ) : null}
        </div>
      ) : null}

      {result.candidates.length && decision.action !== "approved" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {result.candidates
            .filter((candidate) => candidate.productId !== decision.productId)
            .map((candidate) => (
              <button
                key={candidate.productId}
                type="button"
                onClick={() =>
                  onDecisionChange({
                    ...decision,
                    action: "reassigned",
                    productId: candidate.productId,
                    masterCatalogSkuCode: null,
                    categoryId: null,
                  })
                }
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
              >
                {candidate.product_name} ({candidate.sku_code}) • %{Math.round(candidate.score * 100)}
              </button>
            ))}
        </div>
      ) : null}

      {decision.action === "suggested" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-sm text-violet-700">
            Öneri süper admine iletildi, onaylanınca ürünler sayfanızda bildirim olarak görünecek.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onDecisionChange({ ...decision, action: "pending" })}
          >
            Geri al
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {decision.action !== "approved" && hasResolution ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => onDecisionChange({ ...decision, action: "reassigned" })}
            >
              Onayla
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={() => setShowPicker((current) => !current)}>
            Başka ürün seç
          </Button>
          {!hasResolution && !isCreatingNew && canCreateNew ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                onDecisionChange({
                  ...decision,
                  action: "create",
                  productName: decision.productName ?? sourceRow.productName ?? "",
                  skuCode: decision.skuCode ?? sourceRow.barcode ?? "",
                })
              }
            >
              Yeni ürün olarak oluştur
            </Button>
          ) : null}
          {!hasResolution && sourceRow.barcode ? (
            <Button type="button" variant="secondary" onClick={suggestProduct} disabled={suggestPending}>
              {suggestPending ? "Gönderiliyor..." : "Listede bulamadım, eklenmesini öner"}
            </Button>
          ) : null}
          {decision.action !== "skipped" ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                onDecisionChange({
                  ...decision,
                  action: "skipped",
                  productId: null,
                  masterCatalogSkuCode: null,
                  categoryId: null,
                })
              }
            >
              Atla
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => onDecisionChange({ ...decision, action: "pending" })}
            >
              Atlamayı geri al
            </Button>
          )}
        </div>
      )}

      {suggestError ? <p className="mt-2 text-xs font-medium text-rose-600">{suggestError}</p> : null}

      {showPicker ? (
        <ProductPicker
          productPool={productPool}
          onSelect={(product) => {
            onDecisionChange({
              ...decision,
              action: "reassigned",
              productId: product.id,
              masterCatalogSkuCode: null,
              categoryId: null,
            });
            setShowPicker(false);
          }}
        />
      ) : null}
    </div>
  );
}

export function StockImportPanel({
  priceLists,
  categories,
}: {
  priceLists: PriceList[];
  categories: Category[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("upload");
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{
    updatedCount: number;
    skippedInvalidCount: number;
    importedFromMasterCatalogCount: number;
    skippedForCatalogLimitCount: number;
    createdProductCount: number;
    skippedForNewProductLimitCount: number;
    addedToMasterCatalogCount: number;
  } | null>(null);

  const flatCategories = useMemo(() => flattenCategoryTree(buildCategoryTree(categories)), [categories]);

  const [rawTable, setRawTable] = useState<StockImportRawTable | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  const [selectedPriceListId, setSelectedPriceListId] = useState(priceLists[0]?.id ?? "");

  const [matchResponse, setMatchResponse] = useState<MatchResponse | null>(null);
  const [sourceRowsByRowNumber, setSourceRowsByRowNumber] = useState<Map<number, StockImportSourceRow>>(
    new Map(),
  );
  const [decisions, setDecisions] = useState<Map<number, RowDecision>>(new Map());
  const [statusFilter, setStatusFilter] = useState<StockImportMatchStatus | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setIsParsing(true);
    try {
      const table = await parseStockImportSpreadsheet(file);
      if (!table.headers.length) {
        setError("Dosya boş görünüyor.");
        return;
      }

      setRawTable(table);
      setMapping(
        table.headers.map((header) => ({ sourceHeader: header, field: guessFieldForHeader(header) })),
      );
      setStep("mapping");
    } catch {
      setError("Dosya okunamadı. Lütfen .xlsx, .xls veya .csv formatında bir dosya yükleyin.");
    } finally {
      setIsParsing(false);
    }
  }

  const mappedFieldCounts = useMemo(() => {
    const counts: Record<StockImportFieldKey, number> = { barcode: 0, product_name: 0, price: 0, ignore: 0 };
    for (const entry of mapping) counts[entry.field] += 1;
    return counts;
  }, [mapping]);

  const canRunMatch =
    (mappedFieldCounts.barcode > 0 || mappedFieldCounts.product_name > 0) &&
    mappedFieldCounts.price === 1 &&
    Boolean(selectedPriceListId);

  async function runMatch() {
    if (!rawTable) return;
    setError(null);
    setIsMatching(true);

    try {
      const sourceRows = mapRawRowsToSourceRows(rawTable, mapping);
      const response = await fetch("/api/tenant/products/stock-import/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: sourceRows }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Eşleştirme başarısız oldu.");
        return;
      }

      const byRowNumber = new Map(sourceRows.map((row) => [row.rowNumber, row]));
      setSourceRowsByRowNumber(byRowNumber);
      setMatchResponse(result as MatchResponse);
      setDecisions(initialDecisionsFromResults((result as MatchResponse).results, byRowNumber));
      setStatusFilter(null);
      setStep("review");
    } catch {
      setError("Eşleştirme sırasında bir hata oluştu.");
    } finally {
      setIsMatching(false);
    }
  }

  const productById = useMemo(() => {
    return new Map((matchResponse?.productPool ?? []).map((product) => [product.id, product]));
  }, [matchResponse]);

  const reviewRows = useMemo(() => {
    if (!matchResponse) return [];
    const filtered = statusFilter
      ? matchResponse.results.filter((result) => result.status === statusFilter)
      : matchResponse.results;
    return [...filtered].sort((a, b) => {
      const decisionA = decisions.get(a.rowNumber);
      const decisionB = decisions.get(b.rowNumber);
      const priorityA = decisionA?.action === "approved" ? 1 : 0;
      const priorityB = decisionB?.action === "approved" ? 1 : 0;
      return priorityA - priorityB;
    });
  }, [matchResponse, decisions, statusFilter]);

  const pendingCount = [...decisions.values()].filter((d) => d.action === "pending").length;
  const applyCount = [...decisions.values()].filter((d) => isRowReadyForApply(d)).length;

  async function applyChanges() {
    setError(null);
    setIsApplying(true);

    try {
      const updates = [...decisions.values()]
        .filter((decision) => isRowReadyForApply(decision))
        .map((decision) => {
          const sourceRow = sourceRowsByRowNumber.get(decision.rowNumber);
          const isCreatingNew = decision.action === "create" && decision.categoryId;

          return {
            productId: isCreatingNew ? null : decision.productId,
            masterCatalogSkuCode: isCreatingNew ? null : decision.masterCatalogSkuCode,
            newProduct: isCreatingNew
              ? {
                  categoryId: decision.categoryId!,
                  productName: decision.productName!.trim(),
                  skuCode: decision.skuCode!.trim(),
                  imageUrl: decision.imageUrl,
                }
              : null,
            priceListId: selectedPriceListId,
            price: decision.price!,
            barcode: sourceRow?.barcode ?? null,
          };
        });

      if (!updates.length) {
        setError("Uygulanacak satır yok.");
        return;
      }

      const response = await fetch("/api/tenant/products/stock-import/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Uygulama başarısız oldu.");
        return;
      }

      setApplyResult({
        updatedCount: result.updatedCount,
        skippedInvalidCount: result.skippedInvalidCount,
        importedFromMasterCatalogCount: result.importedFromMasterCatalogCount ?? 0,
        skippedForCatalogLimitCount: result.skippedForCatalogLimitCount ?? 0,
        createdProductCount: result.createdProductCount ?? 0,
        skippedForNewProductLimitCount: result.skippedForNewProductLimitCount ?? 0,
        addedToMasterCatalogCount: result.addedToMasterCatalogCount ?? 0,
      });
      router.refresh();
    } catch {
      setError("Uygulama sırasında bir hata oluştu.");
    } finally {
      setIsApplying(false);
    }
  }

  function resetAll() {
    setStep("upload");
    setRawTable(null);
    setMapping([]);
    setMatchResponse(null);
    setSourceRowsByRowNumber(new Map());
    setDecisions(new Map());
    setStatusFilter(null);
    setApplyResult(null);
    setError(null);
  }

  if (applyResult) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="size-5" />
          <p className="text-base font-semibold">Stok listesi uygulandı</p>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {applyResult.updatedCount} ürün stoğa açıldı ve fiyatı güncellendi.
          {applyResult.importedFromMasterCatalogCount
            ? ` (${applyResult.importedFromMasterCatalogCount} tanesi Master Katalog'dan yeni aktarıldı)`
            : ""}
          {applyResult.createdProductCount
            ? ` ${applyResult.createdProductCount} tanesi yeni ürün olarak oluşturuldu.`
            : ""}
          {applyResult.addedToMasterCatalogCount
            ? ` Bunlardan ${applyResult.addedToMasterCatalogCount} tanesi görseliyle birlikte Master Katalog'a da eklendi.`
            : ""}
          {applyResult.skippedInvalidCount ? ` ${applyResult.skippedInvalidCount} satır atlandı.` : ""}
          {applyResult.skippedForCatalogLimitCount
            ? ` ${applyResult.skippedForCatalogLimitCount} satır ürün limitiniz nedeniyle aktarılamadı.`
            : ""}
          {applyResult.skippedForNewProductLimitCount
            ? ` ${applyResult.skippedForNewProductLimitCount} yeni ürün, ürün limitiniz nedeniyle oluşturulamadı.`
            : ""}
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={resetAll}>Yeni liste yükle</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</Card>
      ) : null}

      {step === "upload" ? (
        <Card className="p-6">
          <Dropzone onFile={handleFile} disabled={isParsing} />
          {isParsing ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" /> Dosya okunuyor...
            </p>
          ) : null}
        </Card>
      ) : null}

      {step === "mapping" && rawTable ? (
        <Card className="p-6">
          <h2 className="text-base font-semibold text-slate-900">Sütunları eşleştirin</h2>
          <p className="mt-1 text-sm text-slate-500">
            Dosyanızdaki her sütunun ne anlama geldiğini seçin. Sistem tahmin ediyor, gerekirse değiştirin.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase text-slate-400">
                  <th className="pb-2 pr-4">Dosya sütunu</th>
                  <th className="pb-2 pr-4">Bu sütun ne?</th>
                  <th className="pb-2">Örnek</th>
                </tr>
              </thead>
              <tbody>
                {rawTable.headers.map((header, index) => (
                  <tr key={`${header}-${index}`} className="border-t border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-800">{header || `Sütun ${index + 1}`}</td>
                    <td className="py-2 pr-4">
                      <Select
                        value={mapping[index]?.field ?? "ignore"}
                        onChange={(event) => {
                          const nextField = event.target.value as StockImportFieldKey;
                          setMapping((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, field: nextField } : entry,
                            ),
                          );
                        }}
                      >
                        {FIELD_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="py-2 text-slate-500">{rawTable.rows[0]?.[index] ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 max-w-xs">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Fiyatlar hangi fiyat listesine yazılsın?
            </label>
            <Select value={selectedPriceListId} onChange={(event) => setSelectedPriceListId(event.target.value)}>
              {priceLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={runMatch} disabled={!canRunMatch || isMatching}>
              {isMatching ? "Eşleştiriliyor..." : "Eşleştir"}
            </Button>
            <Button type="button" variant="secondary" onClick={resetAll} disabled={isMatching}>
              Vazgeç
            </Button>
            {!canRunMatch ? (
              <p className="text-xs text-amber-700">
                En az barkod veya ürün adı, tam olarak bir fiyat sütunu ve fiyat listesi seçin.
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}

      {step === "review" && matchResponse ? (
        <div className="space-y-4">
          <Card className="p-5">
            {(() => {
              const total = matchResponse.summary.totalRows || 1;
              const percent = (count: number) => Math.round((count / total) * 100);
              const resolvedCount = total - pendingCount;
              const resolvedPercent = percent(resolvedCount);

              return (
                <>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="font-medium text-slate-700">
                      %{resolvedPercent} hazır ({resolvedCount}/{matchResponse.summary.totalRows} satır)
                    </p>
                    <p className="text-slate-500">
                      {pendingCount ? `${pendingCount} satır gözden geçirmeni bekliyor` : "Tüm satırlar karara bağlandı"}
                    </p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${resolvedPercent}%` }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {(
                      [
                        {
                          status: "matched_exact",
                          count: matchResponse.summary.matchedExact,
                          label: "barkod eşleşti",
                          className: "bg-emerald-100 text-emerald-700",
                        },
                        {
                          status: "matched_master_catalog",
                          count: matchResponse.summary.matchedMasterCatalog,
                          label: "Master Katalog'da bulundu",
                          className: "bg-sky-100 text-sky-700",
                        },
                        {
                          status: "matched_fuzzy_high",
                          count: matchResponse.summary.matchedFuzzyHigh,
                          label: "isimle eşleşti",
                          className: "bg-emerald-50 text-emerald-700",
                        },
                        {
                          status: "needs_review",
                          count: matchResponse.summary.needsReview,
                          label: "gözden geçirilmeli",
                          className: "bg-amber-100 text-amber-800",
                        },
                        {
                          status: "no_match",
                          count: matchResponse.summary.noMatch,
                          label: "eşleşmedi",
                          className: "bg-slate-100 text-slate-700",
                        },
                      ] satisfies Array<{
                        status: StockImportMatchStatus;
                        count: number;
                        label: string;
                        className: string;
                      }>
                    ).map((item) => (
                      <button
                        key={item.status}
                        type="button"
                        onClick={() =>
                          setStatusFilter((current) => (current === item.status ? null : item.status))
                        }
                        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <Badge
                          className={cn(
                            item.className,
                            "cursor-pointer transition",
                            statusFilter === item.status
                              ? "ring-2 ring-offset-1 ring-slate-400"
                              : statusFilter
                                ? "opacity-50 hover:opacity-80"
                                : "hover:opacity-80",
                          )}
                        >
                          %{percent(item.count)} {item.label} ({item.count})
                        </Badge>
                      </button>
                    ))}
                    {statusFilter ? (
                      <button
                        type="button"
                        onClick={() => setStatusFilter(null)}
                        className="text-xs font-medium text-slate-500 underline hover:text-slate-700"
                      >
                        Filtreyi temizle
                      </button>
                    ) : null}
                  </div>
                </>
              );
            })()}
          </Card>

          <div className="space-y-2">
            {statusFilter && reviewRows.length === 0 ? (
              <Card className="p-6 text-center text-sm text-slate-500">
                Bu filtrede satır yok.
              </Card>
            ) : null}
            {reviewRows.map((result) => {
              const decision = decisions.get(result.rowNumber);
              const sourceRow = sourceRowsByRowNumber.get(result.rowNumber);
              if (!decision || !sourceRow) return null;

              return (
                <ReviewRow
                  key={result.rowNumber}
                  result={result}
                  sourceRow={sourceRow}
                  decision={decision}
                  productById={productById}
                  productPool={matchResponse.productPool}
                  flatCategories={flatCategories}
                  onDecisionChange={(next) =>
                    setDecisions((current) => new Map(current).set(next.rowNumber, next))
                  }
                />
              );
            })}
          </div>

          <Card className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 p-4 shadow-lg">
            <p className="text-sm text-slate-600">
              {applyCount} ürün stoğa açılıp fiyatı güncellenecek
              {selectedPriceListId
                ? ` (${priceLists.find((list) => list.id === selectedPriceListId)?.name ?? ""})`
                : ""}
              .
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={resetAll} disabled={isApplying}>
                Vazgeç
              </Button>
              <Button onClick={applyChanges} disabled={!applyCount || isApplying}>
                {isApplying ? "Uygulanıyor..." : "Uygula"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
