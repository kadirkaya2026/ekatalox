"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatMagnetCodeForPrint } from "@/lib/magnet/codes";

// Magnet QR kod havuzu.
//
// Akış: kod üret -> yazdır -> magneti bastır -> sahaya çık -> anlaşınca
// kodu bayiye ata. Atama sonradan DEĞİŞTİRİLEBİLİR; bayi çıkarsa aynı
// magnet başka bayiye devredilir (bkz. app/t/[slug]/route.ts, 302 + no-store).

export interface MagnetCodeRow {
  id: string;
  code: string;
  tenant_id: string | null;
  label: string | null;
  assigned_at: string | null;
  created_at: string;
  scan_count: number;
}

export interface TenantOption {
  id: string;
  subdomain: string;
  company_name: string | null;
}

export function QrCodeManager({
  initialCodes,
  tenants,
  marketingDomain,
}: {
  initialCodes: MagnetCodeRow[];
  tenants: TenantOption[];
  marketingDomain: string;
}) {
  const [codes, setCodes] = useState(initialCodes);
  const [count, setCount] = useState("25");
  const [label, setLabel] = useState("");
  const [filter, setFilter] = useState<"all" | "free" | "assigned">("all");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [rowPending, setRowPending] = useState<string | null>(null);

  async function refresh() {
    const response = await fetch("/api/admin/qr-codes");
    const result = await response.json().catch(() => ({}));
    if (response.ok) setCodes(result.codes ?? []);
  }

  async function generate() {
    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/qr-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: Number(count), label }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(result.error ?? "Kod üretilemedi.");
      return;
    }

    setMessage(`${result.created.length} kod üretildi.`);
    setLabel("");
    await refresh();
  }

  async function assign(id: string, tenantId: string) {
    setRowPending(id);
    setError(null);

    const response = await fetch(`/api/admin/qr-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId || null }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setError(result.error ?? "Kod güncellenemedi.");
    } else {
      await refresh();
    }

    setRowPending(null);
  }

  async function remove(id: string, code: string) {
    if (
      !window.confirm(`${code.toUpperCase()} kodu silinsin mi? Bu kod basıldıysa magnet ölür.`)
    ) {
      return;
    }

    setRowPending(id);
    const response = await fetch(`/api/admin/qr-codes/${id}`, { method: "DELETE" });

    if (!response.ok) {
      setError("Kod silinemedi.");
    } else {
      setCodes((current) => current.filter((row) => row.id !== id));
    }
    setRowPending(null);
  }

  const gorunen = codes.filter((row) =>
    filter === "free" ? !row.tenant_id : filter === "assigned" ? Boolean(row.tenant_id) : true,
  );

  const bostaSayisi = codes.filter((row) => !row.tenant_id).length;

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <p className="text-sm font-semibold text-foreground">Yeni kod üret</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Kodlar bayi belli olmadan üretilir ve bastırılır. Anlaşma yapınca aşağıdan bayiye
          atarsınız; atama sonradan değiştirilebilir, magnet yeniden kullanılabilir.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="w-28">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Adet</label>
            <Input
              type="number"
              min={1}
              max={200}
              value={count}
              onChange={(event) => setCount(event.target.value)}
            />
          </div>
          <div className="min-w-52 flex-1">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Parti notu <span className="text-muted-foreground">(opsiyonel)</span>
            </label>
            <Input
              value={label}
              placeholder="Örn: Bağcılar 1. parti"
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>
          <Button
            variant="primary"
            disabled={pending}
            onClick={() => startTransition(() => void generate())}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Üret
          </Button>
          <a
            href="/admin/qr-kodlari/yazdir"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"
          >
            <Printer className="size-4" />
            Baskı sayfası ({bostaSayisi})
          </a>
        </div>

        <InlineAlert message={error} tone="error" onExpire={() => setError(null)} />
        <InlineAlert message={message} tone="success" onExpire={() => setMessage(null)} />
      </Card>

      <div className="flex items-center gap-2">
        {(
          [
            ["all", `Tümü (${codes.length})`],
            ["free", `Boşta (${bostaSayisi})`],
            ["assigned", `Atanmış (${codes.length - bostaSayisi})`],
          ] as const
        ).map(([key, etiket]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
              filter === key ? "bg-foreground text-background" : "border text-muted-foreground"
            }`}
          >
            {etiket}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        {gorunen.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Kayıt yok.</p>
        ) : (
          <div className="divide-y">
            {gorunen.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-36">
                  <p className="font-mono text-sm font-bold tracking-widest text-foreground">
                    {formatMagnetCodeForPrint(row.code)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {marketingDomain}/t/{row.code}
                  </p>
                </div>

                <div className="min-w-24 text-xs text-muted-foreground">
                  {row.scan_count} okutma
                </div>

                {row.label ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                    {row.label}
                  </span>
                ) : null}

                <div className="ml-auto flex items-center gap-2">
                  <Select
                    value={row.tenant_id ?? ""}
                    disabled={rowPending === row.id}
                    onChange={(event) => void assign(row.id, event.target.value)}
                    className="min-w-52"
                  >
                    <option value="">— atanmamış —</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.company_name || tenant.subdomain} ({tenant.subdomain})
                      </option>
                    ))}
                  </Select>

                  <Button
                    variant="ghost"
                    disabled={rowPending === row.id}
                    onClick={() => void remove(row.id, row.code)}
                  >
                    {rowPending === row.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
