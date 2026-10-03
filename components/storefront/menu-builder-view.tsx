"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, MessageCircle } from "lucide-react";
import { formatDeliveryDate, type RetailMenuBuilder } from "@/lib/storefront/retail-config";
import { cn } from "@/lib/utils";

// "Menünü Oluştur" (0155): müşteri pickCount çeşit, kişi sayısı ve teslim
// tarihi seçer; istek /api/storefront/menu-request ile fiyatsız sipariş olarak
// kaydedilir ve mağazanın WhatsApp'ı hazır mesajla açılır. Fiyatı mağaza verir.
type Group = { id: string; name: string; products: { id: string; name: string; imageUrl: string | null }[] };

export function MenuBuilderView({
  subdomain,
  tenantName,
  logoUrl,
  brandColor,
  builder,
  groups,
  minDate,
  districts,
}: {
  subdomain: string;
  tenantName: string;
  logoUrl: string | null;
  brandColor: string;
  builder: RetailMenuBuilder;
  groups: Group[];
  minDate: string;
  districts: string[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [people, setPeople] = useState(String(Math.max(builder.minPeople, 10)));
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ orderNo: number | null; whatsappUrl: string | null } | null>(null);

  const productName = useMemo(() => new Map(groups.flatMap((g) => g.products.map((p) => [p.id, p.name] as const))), [groups]);
  const full = selected.length >= builder.pickCount;

  function toggle(id: string) {
    setError(null);
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : current.length >= builder.pickCount ? current : [...current, id],
    );
  }

  async function submit() {
    setError(null);
    if (selected.length !== builder.pickCount) return setError(`Lütfen ${builder.pickCount} çeşit seçin (${selected.length} seçildi).`);
    const peopleCount = Number.parseInt(people, 10);
    if (!Number.isFinite(peopleCount) || peopleCount < builder.minPeople) return setError(`Menü siparişleri en az ${builder.minPeople} kişiliktir.`);
    if (!date || date < minDate) return setError(`Teslim tarihi en erken ${formatDeliveryDate(minDate)} olabilir.`);
    if (districts.length && !district) return setError("Lütfen ilçenizi seçin.");
    const address = [addressDetail.trim(), district, districts.length ? "İstanbul" : ""].filter(Boolean).join(", ");
    setSending(true);
    try {
      const response = await fetch("/api/storefront/menu-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain, productIds: selected, people: peopleCount, date, name, phone, address, note }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "İsteğiniz gönderilemedi.");
        return;
      }
      setDone({ orderNo: result.orderNo ?? null, whatsappUrl: result.whatsappUrl ?? null });
      if (result.whatsappUrl) window.location.href = result.whatsappUrl;
    } finally {
      setSending(false);
    }
  }

  const field = "h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-[16px] text-stone-900 outline-none focus:border-stone-400";

  return (
    <div className="min-h-svh bg-[#fbf7f4] text-stone-900">
      <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-[#fbf7f4]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900">
            <ArrowLeft className="size-4" /> Mağaza
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {logoUrl ? <Image src={logoUrl} alt="" width={32} height={32} className="size-8 rounded-full object-cover" unoptimized /> : null}
            <span className="font-semibold">{tenantName}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-40 pt-6">
        <h1 className="text-3xl font-bold tracking-tight">{builder.title}</h1>
        {builder.intro ? <p className="mt-2 max-w-2xl whitespace-pre-line text-stone-600">{builder.intro}</p> : null}
        {builder.priceNote ? (
          <p className="mt-3 inline-block rounded-2xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: brandColor }}>
            {builder.priceNote}
          </p>
        ) : null}

        <h2 className="mt-8 text-lg font-bold">
          1. {builder.pickCount} çeşit seçin <span className="text-sm font-medium text-stone-500">({selected.length}/{builder.pickCount})</span>
        </h2>
        <div className="mt-3 space-y-6">
          {groups.map((group) => (
            <section key={group.id}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">{group.name}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.products.map((product) => {
                  const active = selected.includes(product.id);
                  const disabled = !active && full;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggle(product.id)}
                      disabled={disabled}
                      className={cn(
                        "relative overflow-hidden rounded-2xl border bg-white text-left transition",
                        active ? "border-transparent" : "border-stone-200",
                        disabled && "opacity-40",
                      )}
                      style={active ? { boxShadow: `0 0 0 2px ${brandColor}` } : undefined}
                    >
                      {product.imageUrl ? (
                        <Image src={product.imageUrl} alt="" width={300} height={300} className="aspect-square w-full object-cover" unoptimized />
                      ) : (
                        <div className="aspect-square w-full bg-stone-100" />
                      )}
                      <p className="px-3 py-2 text-sm font-medium leading-5">{product.name}</p>
                      {active ? (
                        <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full text-white" style={{ backgroundColor: brandColor }}>
                          <Check className="size-4" />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <h2 className="mt-10 text-lg font-bold">2. Kişi sayısı ve teslim tarihi</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-stone-600">
            Kişi sayısı (en az {builder.minPeople})
            <input type="number" min={builder.minPeople} inputMode="numeric" value={people} onChange={(e) => setPeople(e.target.value)} className={cn(field, "mt-1")} />
          </label>
          <label className="text-sm font-medium text-stone-600">
            Teslim tarihi (en erken {formatDeliveryDate(minDate)})
            <input type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} className={cn(field, "mt-1")} />
          </label>
        </div>

        <h2 className="mt-10 text-lg font-bold">3. İletişim ve teslimat</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input placeholder="Adınız soyadınız" value={name} onChange={(e) => setName(e.target.value)} className={field} />
          <input placeholder="Telefon (05xx xxx xx xx)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
          {districts.length ? (
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className={field}>
              <option value="">İlçe seçin (İstanbul Avrupa Yakası)</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          ) : null}
          <input placeholder="Mahalle, sokak, bina no, daire" value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} className={field} />
          <textarea
            placeholder="Notunuz (davet türü, saat tercihi, özel istek…)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-24 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-[16px] sm:col-span-2"
          />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          {error ? <p className="w-full text-sm font-medium text-rose-600">{error}</p> : null}
          {done && !done.whatsappUrl ? (
            <p className="w-full text-sm font-medium text-emerald-700">
              İsteğiniz alındı{done.orderNo ? ` (#${done.orderNo})` : ""}. Size en kısa sürede dönüş yapılacak.
            </p>
          ) : null}
          <p className="min-w-0 flex-1 truncate text-sm text-stone-600">
            {selected.length ? selected.map((id) => productName.get(id)).join(", ") : `${builder.pickCount} çeşit seçin`}
          </p>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={sending}
            className="inline-flex h-12 items-center gap-2 rounded-2xl px-6 font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: brandColor }}
          >
            {sending ? <Loader2 className="size-5 animate-spin" /> : <MessageCircle className="size-5" />}
            Teklif iste
          </button>
        </div>
      </div>
    </div>
  );
}
