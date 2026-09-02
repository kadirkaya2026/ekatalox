"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Select } from "@/components/ui/select";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PairingRow {
  source_category_id: string;
  target_category_id: string;
  priority: number;
}

// "Yanında iyi gider" düzenleyicisi: kaynak kategori seç → hedefleri sırayla
// tıkla. Sıra = öneri önceliği. Kaydet kaynağın tamamını değiştirir.
export function PairingsManager({
  categories,
  initialPairings,
}: {
  categories: Category[];
  initialPairings: PairingRow[];
}) {
  const [pairings, setPairings] = useState(initialPairings);
  const [sourceId, setSourceId] = useState("");
  const [targets, setTargets] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const nameById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [categories],
  );
  const bySource = useMemo(() => {
    const map = new Map<string, PairingRow[]>();
    for (const row of pairings) {
      const list = map.get(row.source_category_id) ?? [];
      list.push(row);
      map.set(row.source_category_id, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.priority - b.priority);
    return map;
  }, [pairings]);

  const pickSource = (id: string) => {
    setSourceId(id);
    setTargets((bySource.get(id) ?? []).map((r) => r.target_category_id));
    setNotice(null);
    setError(null);
  };

  const save = async (source: string, targetIds: string[]) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/tenant/pairings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_category_id: source, target_category_ids: targetIds }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error ?? "Kaydedilemedi.");
    } else {
      setPairings((curr) => [
        ...curr.filter((r) => r.source_category_id !== source),
        ...targetIds.map((t, i) => ({ source_category_id: source, target_category_id: t, priority: i + 1 })),
      ]);
      setNotice(targetIds.length ? "Kaydedildi. Vitrin birkaç dakika içinde güncellenir." : "Eşleme kaldırıldı.");
    }
    setBusy(false);
  };

  const configured = [...bySource.entries()].filter(([, rows]) => rows.length);

  return (
    <div className="space-y-4">
      <InlineAlert tone="error" message={error} />

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-64">
            <p className="mb-1 text-xs font-semibold text-slate-600">Müşteri şu kategoriden ürün eklerse…</p>
            <Select value={sourceId} onChange={(e) => pickSource(e.target.value)} className="w-full">
              <option value="">Kategori seçin</option>
              {sorted.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parent_id ? `— ${c.name}` : c.name}
                  {bySource.get(c.id)?.length ? ` (${bySource.get(c.id)!.length} öneri)` : ""}
                </option>
              ))}
            </Select>
          </div>
          {sourceId ? (
            <Button disabled={busy} onClick={() => void save(sourceId, targets)}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Kaydet
            </Button>
          ) : null}
          {notice ? <p className="text-xs font-medium text-emerald-700">{notice}</p> : null}
        </div>

        {sourceId ? (
          <>
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-600">
                …bunları öner <span className="font-normal text-slate-400">(tıklama sırası = öneri sırası; alt kategoriler otomatik dahildir)</span>
              </p>
              {targets.length ? (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {targets.map((id, index) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTargets((curr) => curr.filter((x) => x !== id))}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                      title="Kaldır"
                    >
                      <span className="flex size-4 items-center justify-center rounded-full bg-white/20 text-[10px]">{index + 1}</span>
                      {nameById.get(id) ?? "?"}
                      <X className="size-3 opacity-70" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mb-3 text-sm text-slate-400">Henüz öneri seçilmedi.</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {sorted
                  .filter((c) => c.id !== sourceId && !targets.includes(c.id))
                  .map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setTargets((curr) => [...curr, c.id])}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400"
                    >
                      {c.parent_id ? `${c.name}` : c.name}
                    </button>
                  ))}
              </div>
            </div>
          </>
        ) : null}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <Sparkles className="size-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-900">Tanımlı eşlemeler · {configured.length} kategori</h3>
        </div>
        {configured.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Henüz eşleme yok. Yukarıdan kategori seçip önerileri belirleyin.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {configured
              .sort((a, b) => (nameById.get(a[0]) ?? "").localeCompare(nameById.get(b[0]) ?? "", "tr"))
              .map(([source, rows]) => (
                <div key={source} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-sm">
                  <button
                    type="button"
                    onClick={() => pickSource(source)}
                    className={cn("font-semibold text-slate-900 underline-offset-2 hover:underline", sourceId === source && "text-emerald-700")}
                  >
                    {nameById.get(source) ?? "?"}
                  </button>
                  <span className="text-slate-400">→</span>
                  <span className="min-w-0 flex-1 truncate text-slate-600">
                    {rows.map((r) => nameById.get(r.target_category_id) ?? "?").join(" · ")}
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (sourceId === source) setTargets([]);
                      void save(source, []);
                    }}
                    className="text-slate-400 transition hover:text-rose-600"
                    title="Eşlemeyi kaldır"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
