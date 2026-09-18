"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PriceList } from "@/lib/types";

// Serbest duyuru bildirimi: "Yeni ürün geldi", "Stok azalıyor" gibi.
// Müşteri mağazadaki Kampanyalar bölümünden bildirimi açmış olmalı;
// fiyat listesi seçilirse yalnız o şifreyle girenler alır.
export function TenantPushBroadcastCard({ priceLists }: { priceLists: PriceList[] }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priceListId, setPriceListId] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const params = priceListId ? `?price_list_id=${encodeURIComponent(priceListId)}` : "";
    fetch(`/api/tenant/push/broadcast${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCount(typeof d?.count === "number" ? d.count : 0))
      .catch(() => setCount(0));
  }, [priceListId]);

  async function send() {
    if (!title.trim()) { setError("Başlık yazın."); return; }
    setPending(true); setError(null); setSuccess(null);
    const response = await fetch("/api/tenant/push/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), body: body.trim(), price_list_id: priceListId || null }),
    });
    const result = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) { setError(result.error ?? "Bildirim gönderilemedi."); return; }
    const sent = Number(result.sent ?? 0);
    setSuccess(sent ? `${sent} cihaza gönderildi.` : "Henüz bildirim açan müşteri yok.");
    if (sent) { setTitle(""); setBody(""); }
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Bell className="size-4" /> Müşterilere bildirim gönder
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Yeni ürün, indirim ya da stok duyurusunu WhatsApp&apos;tan tek tek yazmak yerine buradan tek seferde gönderin.
            Müşteriniz mağazadaki <strong>Kampanyalar</strong> bölümünden &quot;Bildirimleri aç&quot; demiş olmalı.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
          {count === null ? "…" : `${count} cihaz`}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <Input
          value={title}
          maxLength={80}
          placeholder="Başlık — ör. Yeni ürün: 65W hızlı şarj geldi"
          onChange={(event) => setTitle(event.target.value)}
        />
        <Select value={priceListId} onChange={(event) => setPriceListId(event.target.value)}>
          <option value="">Tüm müşteriler</option>
          {priceLists.map((list) => (
            <option key={list.id} value={list.id}>Sadece: {list.name}</option>
          ))}
        </Select>
      </div>
      <Textarea
        value={body}
        maxLength={200}
        rows={2}
        placeholder="Metin (isteğe bağlı) — ör. İlk 100 adete özel fiyat, Kampanyalar'dan bakın."
        onChange={(event) => setBody(event.target.value)}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Bildirime dokunan müşteri mağazanızın Kampanyalar bölümüne düşer.</p>
        <Button variant="primary" disabled={pending} onClick={() => void send()}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {pending ? "Gönderiliyor…" : "Gönder"}
        </Button>
      </div>
      <InlineAlert message={error} tone="error" onExpire={() => setError(null)} />
      <InlineAlert message={success} tone="success" onExpire={() => setSuccess(null)} />
    </Card>
  );
}
