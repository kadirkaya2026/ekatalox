"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, Loader2, Pencil, Plus, Printer, QrCode, Trash2, X } from "lucide-react";
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
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  placed_at: string | null;
  // 0087 ile geldi
  is_disabled: boolean;
  last_scan_at: string | null;
  customer_id: string | null;
  claimed_at: string | null;
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
  total,
  page,
  pageSize,
  durum,
  toplamKod,
  bostaKod,
}: {
  initialCodes: MagnetCodeRow[];
  tenants: TenantOption[];
  marketingDomain: string;
  total: number;
  page: number;
  pageSize: number;
  durum: "all" | "free" | "assigned";
  toplamKod: number;
  bostaKod: number;
}) {
  const router = useRouter();
  const [codes, setCodes] = useState(initialCodes);
  // Sunucudan gelen sayfa degisince yerel listeyi tazele.
  useEffect(() => setCodes(initialCodes), [initialCodes]);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const [count, setCount] = useState("25");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [rowPending, setRowPending] = useState<string | null>(null);
  // Açık olan QR önizlemesi. QR'lar tarayıcıda ÜRETİLİYOR ve sadece
  // butona basılınca: 1000 kodun QR'ını sunucuda önden üretip sayfaya
  // gömmek gereksiz yük olurdu.
  const [qrOpenId, setQrOpenId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);

  // Elle kod ekleme: basılmış magnetin kodu silindiyse geri yazabilmek için.
  const [manualCode, setManualCode] = useState("");
  // Toplu üretimde partinin tamamına işlenecek konum.
  const [batchCity, setBatchCity] = useState("");
  const [batchDistrict, setBatchDistrict] = useState("");
  // Mahalle kırılımı filtresi
  const [hoodFilter, setHoodFilter] = useState("");
  // Satır içi mahalle girişi
  const [hoodEditId, setHoodEditId] = useState<string | null>(null);
  const [hoodValue, setHoodValue] = useState("");

  async function saveNeighborhood(row: MagnetCodeRow) {
    setRowPending(row.id);
    setError(null);

    const response = await fetch(`/api/admin/qr-codes/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // tenant_id gönderilmezse uç atamayı kaldırıyor.
      body: JSON.stringify({ neighborhood: hoodValue, tenant_id: row.tenant_id }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setError(result.error ?? "Mahalle kaydedilemedi.");
    } else {
      setHoodEditId(null);
      await refresh();
    }
    setRowPending(null);
  }
  // Satır içi kod düzenleme
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  async function addManual() {
    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/qr-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: manualCode, label, city: batchCity, district: batchDistrict }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(result.error ?? "Kod eklenemedi.");
      return;
    }

    setMessage(`${manualCode.trim().toUpperCase()} havuza eklendi.`);
    setManualCode("");
    await refresh();
  }

  async function saveCode(row: MagnetCodeRow) {
    const yeni = editingValue.trim().toLowerCase().replace(/[\s-]/g, "");
    if (!yeni || yeni === row.code.toLowerCase()) {
      setEditingId(null);
      return;
    }

    setRowPending(row.id);
    setError(null);

    const response = await fetch(`/api/admin/qr-codes/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // tenant_id de gönderilmeli: PATCH gövdede yoksa atamayı kaldırıyor.
      body: JSON.stringify({ code: yeni, tenant_id: row.tenant_id }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(result.error ?? "Kod güncellenemedi.");
    } else {
      setEditingId(null);
      setQrOpenId(null);
      await refresh();
    }

    setRowPending(null);
  }

  function codeUrl(code: string) {
    return `https://${marketingDomain}/t/${code}`;
  }

  async function toggleQr(row: MagnetCodeRow) {
    if (qrOpenId === row.id) {
      setQrOpenId(null);
      setQrDataUrl(null);
      setQrSvg(null);
      return;
    }

    setQrOpenId(row.id);
    setQrDataUrl(null);
    setQrSvg(null);

    // Dinamik import: qrcode paketi sadece bu özellik kullanılınca yükleniyor,
    // admin sayfasının ilk açılışını yavaşlatmıyor.
    const QRCodeLib = (await import("qrcode")).default;
    const url = codeUrl(row.code);

    // Hata düzeltme M: magnetin köşesi aşınsa bile okunur ama H kadar
    // yoğun değil — küçük baskıda modüller çok ufalmasın.
    const opts = { errorCorrectionLevel: "M" as const, margin: 1 };

    const [png, svg] = await Promise.all([
      QRCodeLib.toDataURL(url, { ...opts, width: 512 }),
      QRCodeLib.toString(url, { ...opts, type: "svg", width: 512 }),
    ]);

    setQrDataUrl(png);
    setQrSvg(svg);
  }

  function downloadSvg(code: string, svg: string) {
    // SVG'yi Blob üzerinden indiriyoruz; data: URL'de Türkçe/özel karakter
    // kaçışları sorun çıkarabiliyor.
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `magnet-${code.toUpperCase()}.svg`;
    link.click();
    URL.revokeObjectURL(href);
  }

  async function refresh() {
    // Bulundugumuz sayfayi ve suzgeci tazele — liste artik sunucu tarafli.
    const response = await fetch(`/api/admin/qr-codes?page=${page}&durum=${durum}`);
    const result = await response.json().catch(() => ({}));
    if (response.ok) setCodes(result.codes ?? []);
  }

  async function generate() {
    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/qr-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: Number(count), label, city: batchCity, district: batchDistrict }),
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

  const gorunen = codes
    .filter((row) => (hoodFilter ? row.neighborhood === hoodFilter : true));

  // Mahalle kırılımı. Mahallesi girilmemiş kodlar tabloya girmiyor —
  // henüz sahaya bırakılmamış demektir.
  const mahalleOzeti = (() => {
    const harita = new Map<
      string,
      { neighborhood: string; district: string; toplam: number; atanmis: number; okutma: number }
    >();

    for (const row of codes) {
      if (!row.neighborhood) continue;
      const anahtar = `${row.district ?? ""}|${row.neighborhood}`;
      const mevcut = harita.get(anahtar) ?? {
        neighborhood: row.neighborhood,
        district: row.district ?? "",
        toplam: 0,
        atanmis: 0,
        okutma: 0,
      };
      mevcut.toplam += 1;
      if (row.tenant_id) mevcut.atanmis += 1;
      mevcut.okutma += row.scan_count;
      harita.set(anahtar, mevcut);
    }

    return [...harita.values()].sort(
      (a, b) => b.okutma - a.okutma || b.toplam - a.toplam || a.neighborhood.localeCompare(b.neighborhood, "tr"),
    );
  })();

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
          <div className="w-36">
            <label className="mb-1.5 block text-sm font-medium text-foreground">İl</label>
            <Input
              value={batchCity}
              placeholder="İstanbul"
              onChange={(event) => setBatchCity(event.target.value)}
            />
          </div>
          <div className="w-36">
            <label className="mb-1.5 block text-sm font-medium text-foreground">İlçe</label>
            <Input
              value={batchDistrict}
              placeholder="Bağcılar"
              onChange={(event) => setBatchDistrict(event.target.value)}
            />
          </div>
          <div className="min-w-40 flex-1">
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
            Baskı sayfası ({bostaKod})
          </a>
        </div>

        {/* Elle kod ekleme: basılmış bir magnetin kodu yanlışlıkla
            silindiyse aynı kodu geri yazmak tek kurtarma yolu. */}
        <div className="mt-4 border-t pt-4">
          <p className="text-sm font-semibold text-foreground">
            Elle kod ekle{" "}
            <span className="font-normal text-muted-foreground">
              (silinen bir magnetin kodunu geri yazmak için)
            </span>
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <div className="w-48">
              <Input
                value={manualCode}
                placeholder="örn. K7M2XQ"
                onChange={(event) => setManualCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && manualCode.trim()) {
                    event.preventDefault();
                    void addManual();
                  }
                }}
                className="font-mono uppercase"
              />
            </div>
            <Button variant="secondary" disabled={!manualCode.trim()} onClick={() => void addManual()}>
              <Plus className="size-4" />
              Ekle
            </Button>
            <p className="text-xs text-muted-foreground">
              Boşluk ve tire yok sayılır, büyük/küçük harf fark etmez.
            </p>
          </div>
        </div>

        <InlineAlert message={error} tone="error" onExpire={() => setError(null)} />
        <InlineAlert message={message} tone="success" onExpire={() => setMessage(null)} />
      </Card>

      {/* MAHALLE TAKİBİ: hangi mahalleye kaç magnet bırakıldı, kaçı bayiye
          bağlandı, oradan kaç okutma geldi. Saha ekibinin asıl baktığı tablo. */}
      {mahalleOzeti.length ? (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Mahalle Takibi</p>
            {hoodFilter ? (
              <button
                type="button"
                onClick={() => setHoodFilter("")}
                className="text-xs font-semibold text-muted-foreground underline"
              >
                filtreyi kaldır
              </button>
            ) : null}
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Mahalle</th>
                  <th className="px-4 py-2 font-medium">İlçe</th>
                  <th className="px-4 py-2 text-right font-medium">Magnet</th>
                  <th className="px-4 py-2 text-right font-medium">Bayiye bağlı</th>
                  <th className="px-4 py-2 text-right font-medium">Okutma</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mahalleOzeti.map((satir) => (
                  <tr
                    key={`${satir.district}|${satir.neighborhood}`}
                    onClick={() =>
                      setHoodFilter(hoodFilter === satir.neighborhood ? "" : satir.neighborhood)
                    }
                    className={`cursor-pointer hover:bg-slate-50 ${
                      hoodFilter === satir.neighborhood ? "bg-slate-100" : ""
                    }`}
                  >
                    <td className="px-4 py-2 font-medium text-foreground">{satir.neighborhood}</td>
                    <td className="px-4 py-2 text-muted-foreground">{satir.district || "—"}</td>
                    <td className="px-4 py-2 text-right">{satir.toplam}</td>
                    <td className="px-4 py-2 text-right">{satir.atanmis}</td>
                    <td className="px-4 py-2 text-right font-semibold">{satir.okutma}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", `Tümü (${toplamKod})`],
            ["free", `Boşta (${bostaKod})`],
            ["assigned", `Atanmış (${toplamKod - bostaKod})`],
          ] as const
        ).map(([key, etiket]) => (
          <button
            key={key}
            type="button"
            onClick={() => router.push(`?durum=${key}`)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
              durum === key ? "bg-foreground text-background" : "border text-muted-foreground"
            }`}
          >
            {etiket}
          </button>
        ))}
        {hoodFilter ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-800">
            Mahalle: {hoodFilter}
          </span>
        ) : null}
      </div>

      <Card className="overflow-hidden p-0">
        {gorunen.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Kayıt yok.</p>
        ) : (
          <div className="divide-y">
            {gorunen.map((row) => (
              <div key={row.id}>
              <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-44">
                  {editingId === row.id ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        autoFocus
                        value={editingValue}
                        onChange={(event) => setEditingValue(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void saveCode(row);
                          }
                          if (event.key === "Escape") setEditingId(null);
                        }}
                        className="h-8 w-32 font-mono uppercase"
                      />
                      <Button variant="ghost" onClick={() => void saveCode(row)} title="Kaydet">
                        <Check className="size-4" />
                      </Button>
                      <Button variant="ghost" onClick={() => setEditingId(null)} title="Vazgeç">
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div>
                        <p className="font-mono text-sm font-bold tracking-widest text-foreground">
                          {formatMagnetCodeForPrint(row.code)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {marketingDomain}/t/{row.code}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        title="Kodu düzenle — bu kod basıldıysa eski magnetler ölür"
                        onClick={() => {
                          setEditingId(row.id);
                          setEditingValue(row.code);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="min-w-24 text-xs text-muted-foreground">
                  {row.scan_count} okutma
                </div>

                {/* Mahalle: magnet dükkana bırakıldığında buraya yazılıyor.
                    Mahalle girildiği an kod "sahaya bırakıldı" sayılıyor. */}
                {hoodEditId === row.id ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      autoFocus
                      value={hoodValue}
                      placeholder="Mahalle"
                      onChange={(event) => setHoodValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void saveNeighborhood(row);
                        }
                        if (event.key === "Escape") setHoodEditId(null);
                      }}
                      className="h-8 w-36"
                    />
                    <Button variant="ghost" onClick={() => void saveNeighborhood(row)} title="Kaydet">
                      <Check className="size-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => setHoodEditId(null)} title="Vazgeç">
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setHoodEditId(row.id);
                      setHoodValue(row.neighborhood ?? "");
                    }}
                    className={`rounded-full px-2.5 py-1 text-[11px] ${
                      row.neighborhood
                        ? "bg-emerald-100 font-semibold text-emerald-800"
                        : "border border-dashed text-muted-foreground"
                    }`}
                    title="Mahalle gir / değiştir"
                  >
                    {row.neighborhood ?? "+ mahalle"}
                  </button>
                )}

                {row.label ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                    {row.label}
                  </span>
                ) : null}

                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => void toggleQr(row)}
                    aria-expanded={qrOpenId === row.id}
                    title="QR'ı göster / indir"
                  >
                    <QrCode className="size-4" />
                  </Button>

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

              {qrOpenId === row.id ? (
                <div className="flex flex-wrap items-center gap-5 border-t bg-slate-50/70 px-4 py-4">
                  {qrDataUrl ? (
                    <>
                      {/* next/image değil: data: URL'i optimize etmenin anlamı
                          yok ve loader'ı gereksiz yere devreye sokar. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt={`${row.code} QR kodu`}
                        className="size-36 rounded-xl border bg-white p-2"
                      />

                      <div className="min-w-52 space-y-2">
                        <p className="font-mono text-sm font-bold tracking-widest text-foreground">
                          {formatMagnetCodeForPrint(row.code)}
                        </p>
                        <p className="break-all text-xs text-muted-foreground">
                          {codeUrl(row.code)}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <a
                            href={qrDataUrl}
                            download={`magnet-${row.code.toUpperCase()}.png`}
                            className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold"
                          >
                            <Download className="size-3.5" />
                            PNG
                          </a>
                          {qrSvg ? (
                            <button
                              type="button"
                              onClick={() => downloadSvg(row.code, qrSvg)}
                              className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold"
                            >
                              <Download className="size-3.5" />
                              SVG
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => void navigator.clipboard.writeText(codeUrl(row.code))}
                            className="rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold"
                          >
                            Adresi kopyala
                          </button>
                        </div>

                        <p className="pt-1 text-[11px] text-muted-foreground">
                          Matbaa için SVG tercih edin — vektör olduğu için her boyutta keskin
                          basılır.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      QR hazırlanıyor…
                    </div>
                  )}
                </div>
              ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <span className="text-slate-500">
            Toplam {total} kod · sayfa {page} / {pageCount}
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
    </div>

  );
}
