"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, Power, RotateCcw, ShieldBan, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatMagnetCodeForPrint } from "@/lib/magnet/code-format";
import type { TenantMagnetRow } from "@/lib/magnet/tenant-data";

interface BlockedPhone {
  id: string;
  phone: string;
  reason: string | null;
  created_at: string;
}

// Bayi paneli "Magnetlerim": tarafına atanan kodlar, okutma sayıları ve ilk
// siparişten gelen müşteri bilgisi. "Sahibi" diye kesin bir ifade
// KULLANILMIYOR — sessiz sahiplenme yanlış kişiyi işaretleyebilir (ev
// telefonu, arkadaşın cihazından sipariş); bu yüzden "İlk sipariş" deniyor ve
// bayi düzeltebiliyor.
export function MagnetsManager({
  initialMagnets,
  initialBlocked,
  total,
  page,
  pageSize,
}: {
  initialMagnets: TenantMagnetRow[];
  initialBlocked: BlockedPhone[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const [magnets, setMagnets] = useState(initialMagnets);
  const [blocked, setBlocked] = useState(initialBlocked);
  useEffect(() => setMagnets(initialMagnets), [initialMagnets]);
  useEffect(() => setBlocked(initialBlocked), [initialBlocked]);

  const [error, setError] = useState<string | null>(null);
  const [rowPending, setRowPending] = useState<string | null>(null);
  const [blockPhoneInput, setBlockPhoneInput] = useState("");
  const [blockReasonInput, setBlockReasonInput] = useState("");
  const [blockPending, setBlockPending] = useState(false);
  // Engelleme geri bildirimi KARTIN İÇİNDE gösterilir: genel hata alanı
  // sayfanın en üstünde, düğmeden ekranlarca uzakta — kullanıcı hatayı
  // görmeyip "engelledim" sanabiliyor.
  const [blockError, setBlockError] = useState<string | null>(null);
  const [blockSuccess, setBlockSuccess] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  async function refresh() {
    const response = await fetch(`/api/tenant/magnets?page=${page}`);
    const result = await response.json().catch(() => ({}));
    if (response.ok) setMagnets(result.magnets ?? []);
  }

  async function refreshBlocked() {
    const response = await fetch("/api/tenant/blocked-phones");
    const result = await response.json().catch(() => ({}));
    if (response.ok) setBlocked(result.phones ?? []);
  }

  async function patchMagnet(id: string, body: Record<string, unknown>) {
    setRowPending(id);
    setError(null);

    const response = await fetch(`/api/tenant/magnets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setError(result.error ?? "Magnet güncellenemedi.");
    } else {
      await refresh();
    }
    setRowPending(null);
  }

  async function blockPhone(phone: string, reason: string | null) {
    setBlockPending(true);
    setBlockError(null);
    setBlockSuccess(null);

    const response = await fetch("/api/tenant/blocked-phones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, reason }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setBlockError(result.error ?? "Numara engellenemedi.");
    } else {
      setBlockPhoneInput("");
      setBlockReasonInput("");
      setBlockSuccess(`${phone} engellendi — bu numaradan artık sipariş alınmaz.`);
      await refreshBlocked();
    }
    setBlockPending(false);
  }

  async function unblockPhone(id: string) {
    setBlockError(null);
    setBlockSuccess(null);
    const response = await fetch(`/api/tenant/blocked-phones?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setBlockError(result.error ?? "Engel kaldırılamadı.");
    } else {
      await refreshBlocked();
    }
  }

  return (
    <div className="space-y-5">
      <InlineAlert tone="error" message={error} />

      <Card className="overflow-hidden p-0">
        {magnets.length === 0 ? (
          <p className="p-6 text-sm text-slate-600">
            Henüz tarafınıza atanmış magnet yok. Magnetler eKatalox tarafından üretilip
            bastırıldıktan sonra hesabınıza tanımlanır.
          </p>
        ) : (
          <div className="divide-y">
            {magnets.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <span className="w-20 font-mono text-sm font-bold tracking-wide">
                  {formatMagnetCodeForPrint(row.code)}
                </span>

                {row.is_disabled ? (
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                    Pasif{row.disabled_by_role === "super_admin" ? " (eKatalox)" : ""}
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    Aktif
                  </span>
                )}

                <span className="text-sm text-slate-600">
                  {row.scan_count > 0 ? (
                    <>
                      {row.scan_count} okutma
                      {row.last_scan_at
                        ? ` · son ${new Date(row.last_scan_at).toLocaleDateString("tr-TR")}`
                        : ""}
                    </>
                  ) : (
                    "okutulmadı"
                  )}
                </span>

                {[row.city, row.district, row.neighborhood].filter(Boolean).length ? (
                  <span className="text-xs text-slate-400">
                    {[row.city, row.district, row.neighborhood].filter(Boolean).join(" / ")}
                  </span>
                ) : null}

                <div className="min-w-56 flex-1 text-sm">
                  {row.customer ? (
                    <>
                      <span className="font-medium">{row.customer.full_name}</span>
                      <span className="text-slate-500"> — {row.customer.phone}</span>
                      {row.customer.address ? (
                        <span className="text-slate-400"> — {row.customer.address}</span>
                      ) : null}
                      {row.claimed_at ? (
                        <span className="text-xs text-slate-400">
                          {" "}
                          (ilk sipariş {new Date(row.claimed_at).toLocaleDateString("tr-TR")})
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-slate-400">Henüz sipariş gelmedi</span>
                  )}
                </div>

                <div className="ml-auto flex items-center gap-2">
                  {row.customer && row.order_customers.length ? (
                    <span
                      className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700"
                      title="Bu magnetten, tanımlı müşteriden farklı kişiler de sipariş verdi — teyit edin"
                    >
                      ⚠ farklı kişi siparişi
                    </span>
                  ) : null}
                  {row.order_customers.length ? (
                    <Select
                      value=""
                      disabled={rowPending === row.id}
                      onChange={(event) => {
                        if (event.target.value) {
                          void patchMagnet(row.id, { customer_id: event.target.value });
                        }
                      }}
                      className="min-w-44"
                      title="Bu magnetten sipariş veren başka bir müşteriyi tanımla"
                    >
                      <option value="">Müşteri değiştir…</option>
                      {row.order_customers.map((aday) => (
                        <option key={aday.id} value={aday.id}>
                          {aday.full_name} ({aday.phone})
                        </option>
                      ))}
                    </Select>
                  ) : null}

                  {row.customer ? (
                    <>
                      <Button
                        variant="ghost"
                        disabled={rowPending === row.id}
                        onClick={() => void patchMagnet(row.id, { customer_id: null })}
                        title="Müşteri kaydını sıfırla — bir sonraki sipariş magneti yeniden tanımlar"
                      >
                        <RotateCcw className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={blockPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `${row.customer!.phone} numarası engellensin mi? Bu numaradan sipariş alınmaz.`,
                            )
                          ) {
                            void blockPhone(row.customer!.phone, `Magnet ${row.code.toUpperCase()}`);
                          }
                        }}
                        title="Bu müşterinin telefonunu engelle"
                      >
                        <ShieldBan className="size-4 text-red-500" />
                      </Button>
                    </>
                  ) : null}

                  <Button
                    variant="ghost"
                    disabled={rowPending === row.id}
                    onClick={() => void patchMagnet(row.id, { is_disabled: !row.is_disabled })}
                    title={
                      row.is_disabled
                        ? "Aktifleştir — magnet yeniden vitrininize yönlenir"
                        : "Pasife al — magnet vitrininize gitmez"
                    }
                  >
                    {rowPending === row.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : row.is_disabled ? (
                      <Power className="size-4 text-emerald-600" />
                    ) : (
                      <Ban className="size-4 text-red-500" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <span className="text-slate-500">
            Toplam {total} magnet · sayfa {page} / {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => router.push(`?page=${page - 1}`)}
            >
              Önceki
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= pageCount}
              onClick={() => router.push(`?page=${page + 1}`)}
            >
              Sonraki
            </Button>
          </div>
        </div>
      ) : null}

      <Card className="p-5">
        <p className="text-sm font-semibold text-foreground">Engelli numaralar</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Engellenen numaradan sipariş alınmaz. Magneti pasife almak müşteriyi durdurmaz
          (siteye doğrudan da girebilir); asıl engel budur.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="w-44">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Telefon</label>
            <Input
              value={blockPhoneInput}
              placeholder="05xx xxx xx xx"
              onChange={(event) => setBlockPhoneInput(event.target.value)}
            />
          </div>
          <div className="min-w-40 flex-1">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Sebep <span className="text-muted-foreground">(opsiyonel)</span>
            </label>
            <Input
              value={blockReasonInput}
              onChange={(event) => setBlockReasonInput(event.target.value)}
            />
          </div>
          <Button
            onClick={() => void blockPhone(blockPhoneInput, blockReasonInput.trim() || null)}
            disabled={blockPending || !blockPhoneInput.trim()}
          >
            {blockPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldBan className="size-4" />}
            Engelle
          </Button>
        </div>

        <InlineAlert tone="error" message={blockError} className="mt-3" />
        {blockSuccess ? (
          <p className="mt-3 text-sm font-medium text-emerald-700">{blockSuccess}</p>
        ) : null}

        {blocked.length ? (
          <div className="mt-4 divide-y rounded-xl border">
            {blocked.map((kayit) => (
              <div key={kayit.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="font-medium">{kayit.phone}</span>
                {kayit.reason ? <span className="text-slate-500">{kayit.reason}</span> : null}
                <span className="ml-auto text-xs text-slate-400">
                  {new Date(kayit.created_at).toLocaleDateString("tr-TR")}
                </span>
                <Button
                  variant="ghost"
                  onClick={() => void unblockPhone(kayit.id)}
                  title="Engeli kaldır"
                >
                  <ShieldOff className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
