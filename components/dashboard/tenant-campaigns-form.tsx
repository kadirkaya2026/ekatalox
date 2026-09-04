"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ChevronDown, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Category, TenantBusinessType, TenantCampaign } from "@/lib/types";
import { buildCampaignRuleSentence } from "@/lib/validators/campaign";
import { cn } from "@/lib/utils";

// Kampanya kartları: bayi hem sadece anlatan duyuru kartı ("2 al 1 öde")
// hem de sepeti gerçekten indiren kural ("1500 TL al, 100 TL indirim")
// tanımlayabiliyor. İkisi aynı kayıt; ayrımı rule_type yapıyor.
//
// tenant-banner-form.tsx aynı düzeni JSON dizisi üstünde kuruyor; burada
// her kart ayrı tablo satırı olduğu için kaydetme de kart bazında.

type CampaignDraft = Omit<
  TenantCampaign,
  "tenant_id" | "created_at" | "updated_at" | "gift_product_ids"
> & {
  /** Henüz sunucuya yazılmamış kartlar için işaret */
  isNew?: boolean;
  // Formda hep dizi (TenantCampaign'de null/undefined olabiliyor, DB'den
  // gelirken normalize edilir — bkz. campaigns/page.tsx).
  gift_product_ids: string[];
};

const CURRENCY_FORMATTER = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 2,
});

const RULE_SENTENCE_LABELS = {
  template: (threshold: string, benefit: string) =>
    `${threshold} ve üzeri alışverişte ${benefit} indirim`,
  cashOnly: "(nakit ödemede)",
  cardOnly: "(kart ile ödemede)",
};

function createEmptyCampaign(displayOrder: number): CampaignDraft {
  return {
    id: `new-${Date.now()}`,
    title: "",
    description: null,
    image_url: null,
    badge_label: null,
    starts_at: null,
    ends_at: null,
    is_active: true,
    link_category_id: null,
    display_order: displayOrder,
    rule_type: "none",
    min_cart_amount: null,
    discount_kind: null,
    discount_value: null,
    payment_method: "any",
    excluded_category_ids: [],
    gift_trigger_product_id: null,
    gift_trigger_quantity: null,
    gift_product_ids: [],
    gift_quantity_per_product: 1,
    gift_scales_with_multiples: false,
    isNew: true,
  };
}

/** timestamptz -> <input type="datetime-local"> değeri (yerel saat) */
function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

/** <input type="datetime-local"> değeri -> ISO 8601 UTC */
function fromDateTimeLocal(value: string) {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function TenantCampaignsForm({
  initialCampaigns,
  categories,
  businessType,
}: {
  initialCampaigns: TenantCampaign[];
  categories: Category[];
  /** "buy_x_get_y" seçeneği yalnız market'te sunulur (kullanıcı isteği, 4 Eyl 2026). */
  businessType?: TenantBusinessType;
}) {
  const [campaigns, setCampaigns] = useState<CampaignDraft[]>(
    initialCampaigns.map((campaign) => ({
      ...campaign,
      gift_product_ids: campaign.gift_product_ids ?? [],
    })),
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rowState, setRowState] = useState<
    Record<string, { pending?: boolean; error?: string | null; success?: string | null }>
  >({});
  const [, startTransition] = useTransition();
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const isMarket = businessType === "market";

  // "N al Y hediye" ürün seçicileri: id -> ad. Aranan/seçilen ürünlerden
  // dolar; kaydedilmiş bir kampanya ilk açıldığında eksik adlar id ile
  // ayrıca çözülür (bkz. aşağıdaki useEffect).
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [triggerSearchOpenId, setTriggerSearchOpenId] = useState<string | null>(null);
  const [triggerSearchTerm, setTriggerSearchTerm] = useState("");
  const [triggerSearchResults, setTriggerSearchResults] = useState<
    { id: string; product_name: string }[]
  >([]);
  const [giftSearchOpenId, setGiftSearchOpenId] = useState<string | null>(null);
  const [giftSearchTerm, setGiftSearchTerm] = useState("");
  const [giftSearchResults, setGiftSearchResults] = useState<
    { id: string; product_name: string }[]
  >([]);

  // Kaydedilmiş kampanyaların hediye ürün id'lerini ada çevir.
  useEffect(() => {
    const missing = new Set<string>();
    for (const campaign of campaigns) {
      if (campaign.rule_type !== "buy_x_get_y") continue;
      if (campaign.gift_trigger_product_id && !productNames[campaign.gift_trigger_product_id]) {
        missing.add(campaign.gift_trigger_product_id);
      }
      for (const id of campaign.gift_product_ids) {
        if (!productNames[id]) missing.add(id);
      }
    }
    if (!missing.size) return;

    fetch(`/api/tenant/products?ids=${[...missing].join(",")}`)
      .then((res) => res.json())
      .then((json) => {
        const found = (json.products as { id: string; product_name: string }[] | undefined) ?? [];
        if (!found.length) return;
        setProductNames((current) => {
          const next = { ...current };
          for (const p of found) next[p.id] = p.product_name;
          return next;
        });
      })
      .catch(() => undefined);
    // productNames kasıtlı dışarıda: sonucu yazdıkça bu effect'i tekrar
    // tetiklemesin (yalnız yeni kampanya/kaydedilmiş id geldiğinde çalışsın).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns]);

  useEffect(() => {
    if (!triggerSearchOpenId) {
      setTriggerSearchResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      const params = new URLSearchParams({ page: "1" });
      if (triggerSearchTerm.trim()) params.set("q", triggerSearchTerm.trim());
      fetch(`/api/tenant/products?${params.toString()}`)
        .then((res) => res.json())
        .then((json) => setTriggerSearchResults(json.products ?? []))
        .catch(() => undefined);
    }, 300);
    return () => clearTimeout(timeout);
  }, [triggerSearchOpenId, triggerSearchTerm]);

  useEffect(() => {
    if (!giftSearchOpenId) {
      setGiftSearchResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      const params = new URLSearchParams({ page: "1" });
      if (giftSearchTerm.trim()) params.set("q", giftSearchTerm.trim());
      fetch(`/api/tenant/products?${params.toString()}`)
        .then((res) => res.json())
        .then((json) => setGiftSearchResults(json.products ?? []))
        .catch(() => undefined);
    }, 300);
    return () => clearTimeout(timeout);
  }, [giftSearchOpenId, giftSearchTerm]);

  function setRow(
    id: string,
    next: { pending?: boolean; error?: string | null; success?: string | null },
  ) {
    setRowState((current) => ({ ...current, [id]: { ...current[id], ...next } }));
  }

  function updateField<K extends keyof CampaignDraft>(
    id: string,
    key: K,
    value: CampaignDraft[K],
  ) {
    setCampaigns((current) =>
      current.map((campaign) => (campaign.id === id ? { ...campaign, [key]: value } : campaign)),
    );
  }

  function addCampaign() {
    const draft = createEmptyCampaign(campaigns.length);
    setCampaigns((current) => [...current, draft]);
    setExpandedId(draft.id);
  }

  function buildPayload(campaign: CampaignDraft) {
    const hasRule = campaign.rule_type === "cart_threshold";
    const hasGiftRule = campaign.rule_type === "buy_x_get_y";

    return {
      title: campaign.title,
      description: campaign.description,
      image_url: campaign.image_url,
      badge_label: campaign.badge_label,
      starts_at: campaign.starts_at,
      ends_at: campaign.ends_at,
      is_active: campaign.is_active,
      link_category_id: campaign.link_category_id,
      display_order: campaign.display_order,
      rule_type: campaign.rule_type,
      // Kural kapatıldıysa eski değerler sunucuya gitmesin — veri temiz kalsın.
      min_cart_amount: hasRule ? campaign.min_cart_amount : null,
      discount_kind: hasRule ? campaign.discount_kind : null,
      discount_value: hasRule ? campaign.discount_value : null,
      payment_method: campaign.payment_method,
      // Kural kapalıyken hariç kategori tutmanın anlamı yok.
      excluded_category_ids: hasRule ? campaign.excluded_category_ids : [],
      gift_trigger_product_id: hasGiftRule ? campaign.gift_trigger_product_id : null,
      gift_trigger_quantity: hasGiftRule ? campaign.gift_trigger_quantity : null,
      gift_product_ids: hasGiftRule ? campaign.gift_product_ids : [],
      gift_quantity_per_product: hasGiftRule ? campaign.gift_quantity_per_product : 1,
      gift_scales_with_multiples: hasGiftRule ? campaign.gift_scales_with_multiples : false,
    };
  }

  async function saveCampaign(campaign: CampaignDraft) {
    setRow(campaign.id, { pending: true, error: null, success: null });

    const isNew = Boolean(campaign.isNew);
    const response = await fetch(
      isNew ? "/api/tenant/campaigns" : `/api/tenant/campaigns/${campaign.id}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(campaign)),
      },
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setRow(campaign.id, { pending: false, error: result.error ?? "Kampanya kaydedilemedi." });
      return;
    }

    const saved = result.campaign as TenantCampaign;
    setCampaigns((current) =>
      current.map((entry) =>
        entry.id === campaign.id
          ? { ...saved, gift_product_ids: saved.gift_product_ids ?? [], isNew: false }
          : entry,
      ),
    );
    setRowState((current) => {
      const next = { ...current };
      delete next[campaign.id];
      next[saved.id] = { pending: false, success: "Kaydedildi." };
      return next;
    });
    setExpandedId((current) => (current === campaign.id ? saved.id : current));
  }

  async function deleteCampaign(campaign: CampaignDraft) {
    if (campaign.isNew) {
      setCampaigns((current) => current.filter((entry) => entry.id !== campaign.id));
      return;
    }

    setRow(campaign.id, { pending: true, error: null });

    const response = await fetch(`/api/tenant/campaigns/${campaign.id}`, { method: "DELETE" });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setRow(campaign.id, { pending: false, error: result.error ?? "Kampanya silinemedi." });
      return;
    }

    setCampaigns((current) => current.filter((entry) => entry.id !== campaign.id));
  }

  async function uploadImage(campaign: CampaignDraft, file: File) {
    setRow(campaign.id, { pending: true, error: null });

    const formData = new FormData();
    formData.append("image", file);
    if (campaign.image_url) {
      formData.append("previous_image_url", campaign.image_url);
    }

    const response = await fetch("/api/tenant/campaigns/image", {
      method: "POST",
      body: formData,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setRow(campaign.id, { pending: false, error: result.error ?? "Görsel yüklenemedi." });
      return;
    }

    updateField(campaign.id, "image_url", result.image_url as string);
    setRow(campaign.id, { pending: false, error: null });
  }

  return (
    <div className="space-y-4">
      {campaigns.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm font-semibold text-foreground">Henüz kampanya eklemediniz.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Müşterileriniz mağazanızdaki &quot;Kampanyalar&quot; bölümünde burada
            tanımladıklarınızı görecek.
          </p>
        </Card>
      ) : null}

      {campaigns.map((campaign) => {
        const state = rowState[campaign.id] ?? {};
        const isExpanded = expandedId === campaign.id;
        const ruleSentence = buildCampaignRuleSentence({
          minCartAmount: campaign.min_cart_amount,
          discountKind: campaign.discount_kind,
          discountValue: campaign.discount_value,
          paymentMethod: campaign.payment_method,
          formatAmount: (value) => CURRENCY_FORMATTER.format(value),
          labels: RULE_SENTENCE_LABELS,
        });

        return (
          <Card key={campaign.id} className="overflow-hidden p-0">
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : campaign.id)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {campaign.title || "Yeni kampanya"}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {campaign.rule_type === "cart_threshold" && ruleSentence
                    ? ruleSentence
                    : campaign.rule_type === "buy_x_get_y"
                      ? `${campaign.gift_trigger_quantity ?? "?"} adet al, ${campaign.gift_product_ids.length || "?"} ürün hediye`
                      : "Duyuru kartı — sepete indirim uygulamaz"}
                </p>
              </div>
              {!campaign.is_active ? (
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  Pasif
                </span>
              ) : null}
              <ChevronDown
                className={cn(
                  "size-5 shrink-0 text-muted-foreground transition",
                  isExpanded && "rotate-180",
                )}
              />
            </button>

            {isExpanded ? (
              <div className="space-y-4 border-t px-5 pb-5 pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Başlık
                    </label>
                    <Input
                      value={campaign.title}
                      maxLength={80}
                      placeholder="Örn: Hafta sonuna özel"
                      onChange={(event) => updateField(campaign.id, "title", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Rozet <span className="text-muted-foreground">(opsiyonel)</span>
                    </label>
                    <Input
                      value={campaign.badge_label ?? ""}
                      maxLength={24}
                      placeholder="Örn: 100 TL İNDİRİM"
                      onChange={(event) =>
                        updateField(campaign.id, "badge_label", event.target.value || null)
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Açıklama
                  </label>
                  <Textarea
                    rows={2}
                    maxLength={280}
                    value={campaign.description ?? ""}
                    placeholder="Örn: Salı günleri süt ürünlerinde geçerlidir."
                    onChange={(event) =>
                      updateField(campaign.id, "description", event.target.value || null)
                    }
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Görsel <span className="text-muted-foreground">(önerilen 800×450)</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    {campaign.image_url ? (
                      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl border bg-slate-50">
                        <Image
                          src={campaign.image_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      </div>
                    ) : null}
                    <input
                      ref={(element) => {
                        fileInputs.current[campaign.id] = element;
                      }}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void uploadImage(campaign, file);
                        }
                        event.target.value = "";
                      }}
                    />
                    <Button
                      variant="secondary"
                      disabled={state.pending}
                      onClick={() => fileInputs.current[campaign.id]?.click()}
                    >
                      {campaign.image_url ? "Görseli Değiştir" : "Görsel Yükle"}
                    </Button>
                    {campaign.image_url ? (
                      <Button
                        variant="ghost"
                        disabled={state.pending}
                        onClick={() => updateField(campaign.id, "image_url", null)}
                      >
                        Kaldır
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border bg-slate-50/60 p-4">
                  <p className="mb-2 text-sm font-semibold text-foreground">Kampanya türü</p>
                  <div className="flex flex-wrap gap-2">
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                        campaign.rule_type === "none"
                          ? "border-foreground bg-white font-semibold"
                          : "border-slate-200 bg-white text-muted-foreground",
                      )}
                    >
                      <input
                        type="radio"
                        className="size-4"
                        checked={campaign.rule_type === "none"}
                        onChange={() => updateField(campaign.id, "rule_type", "none")}
                      />
                      Sadece duyuru
                    </label>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                        campaign.rule_type === "cart_threshold"
                          ? "border-foreground bg-white font-semibold"
                          : "border-slate-200 bg-white text-muted-foreground",
                      )}
                    >
                      <input
                        type="radio"
                        className="size-4"
                        checked={campaign.rule_type === "cart_threshold"}
                        onChange={() => updateField(campaign.id, "rule_type", "cart_threshold")}
                      />
                      Sepet indirimi
                    </label>
                    {isMarket ? (
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                          campaign.rule_type === "buy_x_get_y"
                            ? "border-foreground bg-white font-semibold"
                            : "border-slate-200 bg-white text-muted-foreground",
                        )}
                      >
                        <input
                          type="radio"
                          className="size-4"
                          checked={campaign.rule_type === "buy_x_get_y"}
                          onChange={() => updateField(campaign.id, "rule_type", "buy_x_get_y")}
                        />
                        N al, Y hediye
                      </label>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    &quot;Sepet indirimi&quot;: sepet belirlediğiniz tutara ulaşınca otomatik
                    indirim uygulanır.
                    {isMarket
                      ? ' "N al, Y hediye": müşteri belirlediğiniz üründen eşik adedi alınca, seçtiğiniz hediye ürün(ler) otomatik ve bedelsiz sepete eklenir.'
                      : ""}{" "}
                    &quot;Sadece duyuru&quot;da kart yalnız bilgi verir, sepete dokunmaz.
                  </p>

                  {campaign.rule_type === "cart_threshold" ? (
                    <div className="mt-4 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Minimum sepet tutarı
                          </label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            value={campaign.min_cart_amount ?? ""}
                            placeholder="1500"
                            onChange={(event) =>
                              updateField(
                                campaign.id,
                                "min_cart_amount",
                                event.target.value === "" ? null : Number(event.target.value),
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-foreground">
                            İndirim tipi
                          </label>
                          <Select
                            value={campaign.discount_kind ?? ""}
                            onChange={(event) =>
                              updateField(
                                campaign.id,
                                "discount_kind",
                                (event.target.value || null) as CampaignDraft["discount_kind"],
                              )
                            }
                          >
                            <option value="">Seçin</option>
                            <option value="amount">Tutar (TL)</option>
                            <option value="percentage">Yüzde (%)</option>
                          </Select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-foreground">
                            İndirim değeri
                          </label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            value={campaign.discount_value ?? ""}
                            placeholder={campaign.discount_kind === "percentage" ? "10" : "100"}
                            onChange={(event) =>
                              updateField(
                                campaign.id,
                                "discount_value",
                                event.target.value === "" ? null : Number(event.target.value),
                              )
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                          Geçerli ödeme yöntemi
                        </label>
                        <Select
                          value={campaign.payment_method}
                          onChange={(event) =>
                            updateField(
                              campaign.id,
                              "payment_method",
                              event.target.value as CampaignDraft["payment_method"],
                            )
                          }
                        >
                          <option value="any">Fark etmez</option>
                          <option value="cash">Sadece nakit</option>
                          <option value="card">Sadece kart</option>
                        </Select>
                        <p className="mt-1 text-xs text-muted-foreground">
                          &quot;Fark etmez&quot; seçerseniz indirim müşteri ödeme yöntemini
                          seçmeden de sepet toplamına yansır.
                        </p>
                      </div>

                      {/* Bazı ürünler kampanya eşiğine sayılmasın: "1.000 TL'ye
                          100 TL indirim ama sigara sayılmasın" gibi. Seçilen
                          kategorinin ALT kategorileri de otomatik hariç kalır. */}
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                          Kampanyaya sayılmayacak kategoriler{" "}
                          <span className="text-muted-foreground">(opsiyonel)</span>
                        </label>
                        <div className="max-h-44 overflow-y-auto rounded-xl border bg-white p-2">
                          {categories.length === 0 ? (
                            <p className="px-1 py-2 text-xs text-muted-foreground">
                              Kategori bulunamadı.
                            </p>
                          ) : (
                            categories.map((category) => {
                              const secili = campaign.excluded_category_ids.includes(category.id);
                              return (
                                <label
                                  key={category.id}
                                  className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-50"
                                >
                                  <input
                                    type="checkbox"
                                    className="size-4"
                                    checked={secili}
                                    onChange={(event) =>
                                      updateField(
                                        campaign.id,
                                        "excluded_category_ids",
                                        event.target.checked
                                          ? [...campaign.excluded_category_ids, category.id]
                                          : campaign.excluded_category_ids.filter(
                                              (id) => id !== category.id,
                                            ),
                                      )
                                    }
                                  />
                                  <span className="text-sm text-foreground">{category.name}</span>
                                </label>
                              );
                            })
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          İşaretlediğiniz kategorilerdeki ürünlerin tutarı eşiğe sayılmaz ve
                          yüzde indirimin matrahına girmez. Alt kategoriler de otomatik hariç
                          tutulur.
                        </p>
                      </div>

                      {ruleSentence ? (
                        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                          Müşteri şunu görecek: {ruleSentence}
                        </p>
                      ) : null}

                      <p className="text-xs text-muted-foreground">
                        Aynı anda birden fazla kampanya kuralı tutarsa müşteriye{" "}
                        <strong>sadece en avantajlısı</strong> uygulanır, indirimler
                        toplanmaz.
                      </p>
                    </div>
                  ) : null}

                  {campaign.rule_type === "buy_x_get_y" ? (
                    <div className="mt-4 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="relative">
                          <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Hangi üründen alınca
                          </label>
                          {campaign.gift_trigger_product_id ? (
                            <div className="flex items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                              <span className="truncate">
                                {productNames[campaign.gift_trigger_product_id] ?? "Ürün seçildi"}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateField(campaign.id, "gift_trigger_product_id", null)
                                }
                                className="shrink-0 text-muted-foreground hover:text-foreground"
                              >
                                <X className="size-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="relative">
                              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                              <input
                                type="text"
                                placeholder="Ürün ara..."
                                value={triggerSearchOpenId === campaign.id ? triggerSearchTerm : ""}
                                onFocus={() => {
                                  setTriggerSearchOpenId(campaign.id);
                                  setTriggerSearchTerm("");
                                }}
                                onChange={(event) => setTriggerSearchTerm(event.target.value)}
                                className="w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                              />
                              {triggerSearchOpenId === campaign.id && triggerSearchResults.length ? (
                                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border bg-white shadow-lg">
                                  {triggerSearchResults.map((product) => (
                                    <button
                                      key={product.id}
                                      type="button"
                                      onClick={() => {
                                        updateField(campaign.id, "gift_trigger_product_id", product.id);
                                        setProductNames((current) => ({
                                          ...current,
                                          [product.id]: product.product_name,
                                        }));
                                        setTriggerSearchOpenId(null);
                                      }}
                                      className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-slate-50"
                                    >
                                      {product.product_name}
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Eşik adedi
                          </label>
                          <Input
                            type="number"
                            min={1}
                            step="1"
                            value={campaign.gift_trigger_quantity ?? ""}
                            placeholder="10"
                            onChange={(event) =>
                              updateField(
                                campaign.id,
                                "gift_trigger_quantity",
                                event.target.value === "" ? null : Number(event.target.value),
                              )
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                          Hediye ürün(ler)i
                        </label>
                        {campaign.gift_product_ids.length ? (
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            {campaign.gift_product_ids.map((id) => (
                              <span
                                key={id}
                                className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                              >
                                {productNames[id] ?? "Ürün"}
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateField(
                                      campaign.id,
                                      "gift_product_ids",
                                      campaign.gift_product_ids.filter((x) => x !== id),
                                    )
                                  }
                                >
                                  <X className="size-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Hediye ürün ara ve ekle..."
                            value={giftSearchOpenId === campaign.id ? giftSearchTerm : ""}
                            onFocus={() => {
                              setGiftSearchOpenId(campaign.id);
                              setGiftSearchTerm("");
                            }}
                            onChange={(event) => setGiftSearchTerm(event.target.value)}
                            className="w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                          />
                          {giftSearchOpenId === campaign.id && giftSearchResults.length ? (
                            <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border bg-white shadow-lg">
                              {giftSearchResults
                                .filter((product) => !campaign.gift_product_ids.includes(product.id))
                                .map((product) => (
                                  <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => {
                                      updateField(campaign.id, "gift_product_ids", [
                                        ...campaign.gift_product_ids,
                                        product.id,
                                      ]);
                                      setProductNames((current) => ({
                                        ...current,
                                        [product.id]: product.product_name,
                                      }));
                                    }}
                                    className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-slate-50"
                                  >
                                    {product.product_name}
                                  </button>
                                ))}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Hediye ürün başına adet
                          </label>
                          <Input
                            type="number"
                            min={1}
                            step="1"
                            value={campaign.gift_quantity_per_product}
                            onChange={(event) =>
                              updateField(
                                campaign.id,
                                "gift_quantity_per_product",
                                event.target.value === "" ? 1 : Number(event.target.value),
                              )
                            }
                          />
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2.5 pb-2.5">
                            <input
                              type="checkbox"
                              className="size-4"
                              checked={campaign.gift_scales_with_multiples}
                              onChange={(event) =>
                                updateField(
                                  campaign.id,
                                  "gift_scales_with_multiples",
                                  event.target.checked,
                                )
                              }
                            />
                            <span className="text-sm text-foreground">
                              Eşiğin katında hediyeyi de katla
                            </span>
                          </label>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {campaign.gift_scales_with_multiples
                          ? "Örn: eşik 10, müşteri 20 alırsa hediye sayısı da 2 katına çıkar."
                          : "Eşik bir kez geçilince hediye(ler) eklenir; müşteri üründen ne kadar çok alırsa alsın hediye sayısı artmaz."}{" "}
                        Müşteri tetikleyici üründen eşiğin altına inerse hediye otomatik kalkar;
                        hediye satırını müşteri kendisi silemez.
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Başlangıç <span className="text-muted-foreground">(boş = hemen)</span>
                    </label>
                    <Input
                      type="datetime-local"
                      value={toDateTimeLocal(campaign.starts_at)}
                      onChange={(event) =>
                        updateField(campaign.id, "starts_at", fromDateTimeLocal(event.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Bitiş <span className="text-muted-foreground">(boş = süresiz)</span>
                    </label>
                    <Input
                      type="datetime-local"
                      value={toDateTimeLocal(campaign.ends_at)}
                      onChange={(event) =>
                        updateField(campaign.id, "ends_at", fromDateTimeLocal(event.target.value))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Bağlı kategori <span className="text-muted-foreground">(opsiyonel)</span>
                    </label>
                    <Select
                      value={campaign.link_category_id ?? ""}
                      onChange={(event) =>
                        updateField(campaign.id, "link_category_id", event.target.value || null)
                      }
                    >
                      <option value="">Yok</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Seçerseniz kartta &quot;Ürünleri gör&quot; butonu çıkar.
                    </p>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2.5 pb-2.5">
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={campaign.is_active}
                        onChange={(event) =>
                          updateField(campaign.id, "is_active", event.target.checked)
                        }
                      />
                      <span className="text-sm font-medium text-foreground">Kampanya aktif</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t pt-4">
                  <Button
                    variant="ghost"
                    disabled={state.pending}
                    onClick={() => void deleteCampaign(campaign)}
                  >
                    <Trash2 className="size-4" />
                    Sil
                  </Button>
                  <Button
                    variant="primary"
                    disabled={state.pending}
                    onClick={() => startTransition(() => void saveCampaign(campaign))}
                  >
                    {state.pending ? <Loader2 className="size-4 animate-spin" /> : null}
                    {state.pending ? "Kaydediliyor…" : "Kaydet"}
                  </Button>
                </div>

                <InlineAlert
                  message={state.error ?? null}
                  tone="error"
                  onExpire={() => setRow(campaign.id, { error: null })}
                />
                <InlineAlert
                  message={state.success ?? null}
                  tone="success"
                  onExpire={() => setRow(campaign.id, { success: null })}
                />
              </div>
            ) : null}
          </Card>
        );
      })}

      <Button variant="secondary" onClick={addCampaign}>
        <Plus className="size-4" />
        Kampanya Ekle
      </Button>
    </div>
  );
}
