"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Copy, Link2, Loader2, RefreshCw, Search, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { Category, PriceList } from "@/lib/types";
import type { PushSubscriberRow } from "@/app/api/tenant/push/subscribers/route";
import { cn } from "@/lib/utils";

// Bildirim açan müşteriler + duyuru gönderme. Liste satırında müşterinin
// hangi şifreyle girdiği ve o şifrenin fiyat listesi görünür; bayi ister
// tek kişiyi, ister bir listenin tamamını, ister herkesi seçer. Başlık ve
// metinde {ad} yazılırsa herkese kendi adıyla gider.
type TargetType = "campaigns" | "category" | "product";

export function TenantPushBroadcastCard({ priceLists, categories, inviteUrl }: { priceLists: PriceList[]; categories: Category[]; inviteUrl?: string }) {
  const [copied, setCopied] = useState(false);
  async function copyInvite() {
    if (!inviteUrl) return;
    try { await navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* yok say */ }
  }
  const [rows, setRows] = useState<PushSubscriberRow[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterList, setFilterList] = useState<string>("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  // Bildirime tıklanınca nereye gitsin: Kampanyalar paneli (duyuru metni
  // orada kart olarak görünür), bir kategori ya da tek ürün (detay açılır).
  const [targetType, setTargetType] = useState<TargetType>("campaigns");
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [targetProduct, setTargetProduct] = useState<{ id: string; product_name: string } | null>(null);
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<{ id: string; product_name: string; sku_code?: string | null }[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const load = () => setReloadKey((k) => k + 1);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/tenant/push/subscribers")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((d) => {
        if (cancelled) return;
        setRows(Array.isArray(d?.subscribers) ? (d.subscribers as PushSubscriberRow[]) : []);
      });
    return () => { cancelled = true; };
  }, [reloadKey]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (targetType !== "product" || targetProduct) { setProductResults([]); return; }
      const params = new URLSearchParams({ page: "1" });
      if (productQuery.trim()) params.set("q", productQuery.trim());
      fetch(`/api/tenant/products?${params.toString()}`)
        .then((res) => res.json())
        .then((json) => setProductResults((json.products ?? []).slice(0, 8)))
        .catch(() => undefined);
    }, 300);
    return () => clearTimeout(timeout);
  }, [targetType, targetProduct, productQuery]);

  const visible = useMemo(
    () => (rows ?? []).filter((row) => !filterList || row.price_list_id === filterList),
    [rows, filterList],
  );
  const allVisibleSelected = visible.length > 0 && visible.every((row) => selected.has(row.id));
  const selectedCount = selected.size;
  const targetIds = selectedCount ? [...selected] : visible.map((row) => row.id);
  const targetLabel = selectedCount
    ? `Seçili ${selectedCount} kişiye gönder`
    : filterList
      ? `Bu listedeki ${visible.length} kişiye gönder`
      : `Herkese gönder (${visible.length})`;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAllVisible() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visible.forEach((row) => next.delete(row.id));
      else visible.forEach((row) => next.add(row.id));
      return next;
    });
  }

  async function send() {
    if (!title.trim()) { setError("Başlık yazın."); return; }
    if (!targetIds.length) { setError("Gönderilecek kimse yok."); return; }
    if (targetType === "category" && !targetCategoryId) { setError("Kategori seçin."); return; }
    if (targetType === "product" && !targetProduct) { setError("Ürün seçin."); return; }
    setPending(true); setError(null); setSuccess(null);
    const target =
      targetType === "category" ? { type: "category", id: targetCategoryId }
      : targetType === "product" ? { type: "product", id: targetProduct!.id }
      : { type: "campaigns" };
    const response = await fetch("/api/tenant/push/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), body: body.trim(), subscription_ids: targetIds, target }),
    });
    const result = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) { setError(result.error ?? "Bildirim gönderilemedi."); return; }
    const sent = Number(result.sent ?? 0);
    setSuccess(sent ? `${sent} cihaza gönderildi.` : "Gönderilemedi (cihazlar bildirimi kapatmış olabilir).");
    if (sent) { setTitle(""); setBody(""); setSelected(new Set()); setTargetType("campaigns"); setTargetCategoryId(""); setTargetProduct(null); load(); }
  }

  const listName = (id: string | null) => priceLists.find((l) => l.id === id)?.name ?? null;

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Bell className="size-4" /> Müşterilere bildirim gönder
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Müşteriniz mağazadaki <strong>Kampanyalar</strong> bölümünden adını ve telefonunu yazıp bildirimi açınca burada listelenir.
          Kişi seçin ya da hiç seçmeden herkese gönderin. Metinde <code className="rounded bg-muted px-1">(ad)</code> yazarsanız herkese kendi adıyla gider.
        </p>
      </div>

      {inviteUrl ? (
        <div className="rounded-xl border border-dashed p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><Link2 className="size-4" /> Müşteriye gönderilecek link</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {"WhatsApp'tan bu linki atın: müşteri adını ve telefonunu yazıp bildirimi tek dokunuşla açar. iPhone'da site ana ekrana eklenir (Apple şartı), sayfa adım adım gösterir."}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1.5 text-xs">{inviteUrl}</code>
            <Button type="button" variant="secondary" onClick={() => void copyInvite()}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Kopyalandı" : "Kopyala"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3">
        <Input
          value={title}
          maxLength={80}
          placeholder="Başlık — ör. (ad), size özel: kılıflarda %10"
          onChange={(event) => setTitle(event.target.value)}
        />
        <Textarea
          value={body}
          maxLength={200}
          rows={2}
          placeholder="Metin (isteğe bağlı) — ör. Bu hafta geçerli, Kampanyalar'dan bakın."
          onChange={(event) => setBody(event.target.value)}
        />

        <div className="rounded-xl border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bildirime dokununca nereye gitsin?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {([
              ["campaigns", "Kampanyalar bölümü"],
              ["category", "Bir kategori"],
              ["product", "Bir ürün"],
            ] as [TargetType, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTargetType(value)}
                className={cn("rounded-full border px-3 py-1 text-xs font-semibold", targetType === value ? "bg-foreground text-background" : "text-foreground")}
              >
                {label}
              </button>
            ))}
          </div>
          {targetType === "category" ? (
            <Select className="mt-3" value={targetCategoryId} onChange={(event) => setTargetCategoryId(event.target.value)}>
              <option value="">Kategori seçin</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.parent_id ? "— " : ""}{category.name}</option>
              ))}
            </Select>
          ) : null}
          {targetType === "product" ? (
            targetProduct ? (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2 text-sm">
                <span className="font-medium text-foreground">{targetProduct.product_name}</span>
                <button type="button" onClick={() => { setTargetProduct(null); setProductQuery(""); }} className="text-muted-foreground" aria-label="Ürünü kaldır">
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="mt-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" value={productQuery} placeholder="Ürün adı veya kodu ara" onChange={(event) => setProductQuery(event.target.value)} />
                </div>
                {productResults.length ? (
                  <ul className="mt-2 max-h-56 divide-y overflow-y-auto rounded-lg border text-sm">
                    {productResults.map((product) => (
                      <li key={product.id}>
                        <button type="button" onClick={() => setTargetProduct(product)} className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted">
                          <span className="text-foreground">{product.product_name}</span>
                          {product.sku_code ? <span className="font-mono text-xs text-muted-foreground">{product.sku_code}</span> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterList("")}
          className={cn("rounded-full border px-3 py-1 text-xs font-semibold", !filterList ? "bg-foreground text-background" : "text-foreground")}
        >
          Tüm listeler
        </button>
        {priceLists.map((list) => (
          <button
            key={list.id}
            type="button"
            onClick={() => setFilterList((current) => (current === list.id ? "" : list.id))}
            className={cn("rounded-full border px-3 py-1 text-xs font-semibold", filterList === list.id ? "bg-foreground text-background" : "text-foreground")}
          >
            {list.name}
          </button>
        ))}
        <button type="button" onClick={() => { setRows(null); load(); }} className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
          <RefreshCw className="size-3.5" /> Yenile
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-10 px-3 py-2">
                <input type="checkbox" className="size-4" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Tümünü seç" />
              </th>
              <th className="px-3 py-2">Müşteri</th>
              <th className="px-3 py-2">Telefon</th>
              <th className="px-3 py-2">Girdiği şifre · Liste</th>
              <th className="px-3 py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground"><Loader2 className="mx-auto size-4 animate-spin" /></td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Henüz bildirim açan müşteri yok.</td></tr>
            ) : (
              visible.map((row) => (
                <tr key={row.id} className={cn("border-t", selected.has(row.id) && "bg-muted/40")} onClick={() => toggle(row.id)}>
                  <td className="px-3 py-2">
                    <input type="checkbox" className="size-4" checked={selected.has(row.id)} onChange={() => toggle(row.id)} onClick={(e) => e.stopPropagation()} aria-label="Seç" />
                  </td>
                  <td className="px-3 py-2 font-medium text-foreground">{row.name || <span className="text-muted-foreground">İsimsiz cihaz</span>}</td>
                  <td className="px-3 py-2 text-foreground">{row.phone || "—"}</td>
                  <td className="px-3 py-2 text-foreground">
                    {row.access_code ? <span className="font-mono">{row.access_code}</span> : <span className="text-muted-foreground">şifresiz</span>}
                    {row.price_list_name || listName(row.price_list_id) ? (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{row.price_list_name ?? listName(row.price_list_id)}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                      <Bell className="size-3" /> Bildirim açık
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {selectedCount ? `${selectedCount} kişi seçili.` : "Kimse seçili değil — listedeki herkese gider."}
        </p>
        <Button variant="primary" disabled={pending || !targetIds.length} onClick={() => void send()}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {pending ? "Gönderiliyor…" : targetLabel}
        </Button>
      </div>
      <InlineAlert message={error} tone="error" onExpire={() => setError(null)} />
      <InlineAlert message={success} tone="success" onExpire={() => setSuccess(null)} />
    </Card>
  );
}
