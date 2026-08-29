"use client";

import { useEffect, useState } from "react";
import { Gift, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCouponBenefit } from "@/lib/coupons/shared";
import type { Category } from "@/lib/types";

interface CouponRow {
  id: string;
  kind: "percent" | "amount";
  value: number;
  min_order_amount: number | null;
  currency: string;
  title: string;
  message: string | null;
  expires_at: string | null;
  status: "active" | "used" | "cancelled";
  used_at: string | null;
  created_at: string;
  category_ids?: string[] | null;
}

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }) : null;
}

// Cari kartında: müşteriye özel kupon tanımla / aktif kuponu gör / iptal et.
// Tanımlanınca API müşteriye push gönderir (izin verdiyse); kupon sepette
// numarasıyla kendiliğinden uygulanır.
export function CustomerCouponPanel({
  customerId,
  hasPush,
  initialActive,
  categories = [],
}: {
  customerId: string;
  hasPush: boolean;
  initialActive: { id: string; title: string; expires_at: string | null } | null;
  categories?: Category[];
}) {
  // Kapsam: üst kategoriler seçilir (alt kategoriler sunucuda otomatik dahil)
  const topCategories = categories.filter((c) => !c.parent_id).sort((a, b) => a.display_order - b.display_order);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [coupons, setCoupons] = useState<CouponRow[] | null>(null);
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [value, setValue] = useState("10");
  const [minOrder, setMinOrder] = useState("");
  const [days, setDays] = useState("7");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    const r = await fetch(`/api/tenant/customers/${customerId}/coupons`);
    const d = await r.json().catch(() => ({}));
    if (r.ok) setCoupons(d.coupons ?? []);
  };
  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [customerId]);

  const active = coupons ? coupons.find((c) => c.status === "active" && (!c.expires_at || new Date(c.expires_at) > new Date())) ?? null : (initialActive ? { ...initialActive } as Partial<CouponRow> & { id: string; title: string; expires_at: string | null } : null);
  const history = (coupons ?? []).filter((c) => c.status !== "active").slice(0, 3);

  const create = async () => {
    setBusy(true); setError(null); setNotice(null);
    const num = Number(value.replace(",", "."));
    const min = minOrder.trim() ? Number(minOrder.replace(",", ".")) : null;
    const r = await fetch(`/api/tenant/customers/${customerId}/coupons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, value: num, min_order_amount: min, expires_in_days: days.trim() ? Number(days) : null, message: message.trim(), category_ids: selectedCats }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d.error ?? "Kupon oluşturulamadı.");
    } else {
      setOpen(false);
      setMessage("");
      setSelectedCats([]);
      setNotice(hasPush ? "Kupon tanımlandı ve müşterinin telefonuna bildirim gönderildi." : "Kupon tanımlandı. Müşteri bildirim izni vermediği için telefonuna bildirim gitmedi; vitrine girince ve sepette görecek.");
      await load();
    }
    setBusy(false);
  };

  const cancel = async (id: string) => {
    setBusy(true); setError(null);
    await fetch(`/api/tenant/customers/${customerId}/coupons?coupon=${id}`, { method: "DELETE" });
    await load();
    setBusy(false);
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Gift className="size-4 text-amber-600" />
          {active ? (
            <span className="text-slate-800">
              Aktif kupon: <strong>{active.title}</strong>
              {"min_order_amount" in active && active.min_order_amount ? ` · min ${Number(active.min_order_amount).toLocaleString("tr-TR")} ₺` : ""}
              {active.expires_at ? ` · son gün ${fmtDate(active.expires_at)}` : ""}
            </span>
          ) : (
            <span className="text-slate-600">Bu müşteriye özel kupon yok.</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {active ? (
            <Button variant="ghost" disabled={busy} onClick={() => void cancel(active.id)} className="text-rose-600">
              Kuponu iptal et
            </Button>
          ) : null}
          <Button variant={active ? "secondary" : "primary"} onClick={() => setOpen((v) => !v)}>
            <Gift className="size-4" /> {active ? "Yeni kupon" : "Kupon tanımla"}
          </Button>
        </div>
      </div>

      {notice ? <p className="mt-2 text-xs font-medium text-emerald-700">{notice}</p> : null}
      {error ? <p className="mt-2 text-xs font-medium text-rose-600">{error}</p> : null}

      {open ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-600">İndirim türü</p>
              <div className="flex overflow-hidden rounded-lg border border-slate-200">
                {(["percent", "amount"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`flex-1 px-3 py-2 text-sm font-semibold ${kind === k ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
                  >
                    {k === "percent" ? "Yüzde (%)" : "Tutar (₺)"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-600">{kind === "percent" ? "Yüzde" : "Tutar (₺)"}</p>
              <Input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder={kind === "percent" ? "10" : "50"} />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-600">Min. sipariş (₺, isteğe bağlı)</p>
              <Input inputMode="decimal" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="Örn: 300" />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-600">Geçerlilik (gün)</p>
              <Input inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} placeholder="7" />
            </div>
          </div>
          {topCategories.length ? (
            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold text-slate-600">
                Kategori kapsamı <span className="font-normal text-slate-400">(boş = tüm ürünler; seçilirse yalnız bu kategorilerdeki ürünler kupona sayılır)</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {topCategories.map((c) => {
                  const on = selectedCats.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCats((curr) => (on ? curr.filter((x) => x !== c.id) : [...curr, c.id]))}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${on ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"}`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div className="mt-3">
            <p className="mb-1 text-xs font-semibold text-slate-600">Müşteriye mesaj (isteğe bağlı, bildirimde görünür)</p>
            <Input value={message} maxLength={200} onChange={(e) => setMessage(e.target.value)} placeholder="Örn: Sizi özledik, bu hafta size özel 🙂" />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              Önizleme: <strong>{selectedCats.length ? `${topCategories.filter((c) => selectedCats.includes(c.id)).map((c) => c.name).join(", ")} kategorisinde ` : ""}size özel {formatCouponBenefit({ kind, value: Number(value.replace(",", ".")) || 0, currency: "TRY" })} indirim</strong>
              {minOrder.trim() ? ` · ${selectedCats.length ? "bu kategorilerden " : ""}${minOrder} ₺ ve üzeri` : ""}{days.trim() ? ` · ${days} gün` : ""} — sepette kendiliğinden uygulanır, tek kullanımlık.
              {hasPush ? " Telefonuna bildirim gider." : " Müşteri bildirim izni vermemiş; vitrinde ve sepette görecek."}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}><X className="size-4" /> Vazgeç</Button>
              <Button onClick={() => void create()} disabled={busy || !(Number(value.replace(",", ".")) > 0)}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Gift className="size-4" />} Kuponu tanımla{hasPush ? " ve bildir" : ""}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {history.length ? (
        <p className="mt-3 text-xs text-slate-500">
          Geçmiş: {history.map((c) => `${c.title} (${c.status === "used" ? `kullanıldı ${fmtDate(c.used_at) ?? ""}` : "iptal"})`).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
