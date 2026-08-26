"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldBan, ShieldOff, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Select } from "@/components/ui/select";

export interface IpBlockRow {
  id: string;
  ip: string;
  reason: string;
  blocked_until: string | null;
  created_at: string;
  updated_at: string;
}

// Sipariş ucundaki IP taşkın freninin bayi yüzü: 10 dakikada 5'ten fazla
// deneme yapan IP otomatik 1 saat engellenir; bayi buradan kaldırır,
// süresize çevirir ya da uzatır.
export function IpBlocksManager({ initialBlocks }: { initialBlocks: IpBlockRow[] }) {
  const [blocks, setBlocks] = useState(initialBlocks);
  useEffect(() => setBlocks(initialBlocks), [initialBlocks]);

  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [extendHours, setExtendHours] = useState<Record<string, string>>({});

  async function refresh() {
    const response = await fetch("/api/tenant/ip-blocks");
    const result = await response.json().catch(() => ({}));
    if (response.ok) setBlocks(result.blocks ?? []);
  }

  async function patchBlock(id: string, body: Record<string, unknown>) {
    setPendingId(id);
    setError(null);
    const response = await fetch("/api/tenant/ip-blocks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setError(result.error ?? "Engel güncellenemedi.");
    } else {
      await refresh();
    }
    setPendingId(null);
  }

  async function removeBlock(id: string) {
    setPendingId(id);
    setError(null);
    const response = await fetch(`/api/tenant/ip-blocks?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setError(result.error ?? "Engel kaldırılamadı.");
    } else {
      await refresh();
    }
    setPendingId(null);
  }

  function durum(row: IpBlockRow): { etiket: string; ton: "aktif" | "suresiz" | "dolmus" } {
    if (row.blocked_until === null) return { etiket: "Süresiz engelli", ton: "suresiz" };
    const kalanMs = new Date(row.blocked_until).getTime() - Date.now();
    if (kalanMs <= 0) return { etiket: "Süresi doldu", ton: "dolmus" };
    const dk = Math.ceil(kalanMs / 60_000);
    const etiket =
      dk < 60
        ? `${dk} dk kaldı`
        : dk < 60 * 48
          ? `${Math.ceil(dk / 60)} saat kaldı`
          : `${Math.ceil(dk / (60 * 24))} gün kaldı`;
    return { etiket, ton: "aktif" };
  }

  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-foreground">Engellenen IP adresleri</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Aynı IP&apos;den 10 dakikada 5&apos;ten fazla sipariş denemesi gelirse sistem o IP&apos;yi
        otomatik olarak 1 saat engeller ve müşteriye bilgi mesajı gösterir. Dikkat: mobil
        internette bir IP&apos;yi binlerce kişi paylaşabilir — süresiz engeli yalnızca emin
        olduğunuzda kullanın; kalıcı müşteri engeli için telefon engelleme daha isabetlidir.
      </p>

      <InlineAlert tone="error" message={error} className="mt-3" />

      {blocks.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Şu an engelli IP yok. Otomatik engeller burada görünür.
        </p>
      ) : (
        <div className="mt-4 divide-y rounded-xl border">
          {blocks.map((row) => {
            const d = durum(row);
            return (
              <div key={row.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                <span className="font-mono text-sm font-semibold">{row.ip}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    d.ton === "suresiz"
                      ? "bg-red-100 text-red-700"
                      : d.ton === "aktif"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {d.etiket}
                </span>
                <span className="text-xs text-slate-400">
                  {row.reason === "auto" ? "otomatik" : "elle"} ·{" "}
                  {new Date(row.created_at).toLocaleString("tr-TR")}
                </span>

                <div className="ml-auto flex items-center gap-2">
                  <Select
                    value={extendHours[row.id] ?? "24"}
                    onChange={(event) =>
                      setExtendHours((curr) => ({ ...curr, [row.id]: event.target.value }))
                    }
                    className="w-28"
                  >
                    <option value="1">1 saat</option>
                    <option value="24">1 gün</option>
                    <option value="168">1 hafta</option>
                  </Select>
                  <Button
                    variant="secondary"
                    disabled={pendingId === row.id}
                    onClick={() =>
                      void patchBlock(row.id, {
                        mode: "extend",
                        hours: Number(extendHours[row.id] ?? "24"),
                      })
                    }
                    title="Engeli şu andan itibaren seçilen süre kadar uzat"
                  >
                    <Timer className="size-4" />
                    Uzat
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={pendingId === row.id || row.blocked_until === null}
                    onClick={() => void patchBlock(row.id, { mode: "permanent" })}
                    title="Süresiz engelle"
                  >
                    <ShieldBan className="size-4 text-red-500" />
                    Süresiz
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={pendingId === row.id}
                    onClick={() => void removeBlock(row.id)}
                    title="Engeli kaldır"
                  >
                    {pendingId === row.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ShieldOff className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
