"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, KeyRound, Plus, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatPriceListLimit, getPriceListLimit } from "@/lib/billing/plans";
import { getPriceListDisplayName } from "@/lib/price-lists/constants";
import { cn } from "@/lib/utils";
import type { AccessCode, PriceList, Tenant } from "@/lib/types";

/** Fiyatlı listede fiyatı girilmemiş ürünler (0139, price_list_missing_prices). */
export type MissingPrices = Record<string, { count: number; sample: Array<{ id: string; name: string; sku: string | null }> }>;

/** Kişiye özel müşteri şifreleri (0138) — listede adla gösterilir, burada silinmez. */
export type PersonalCodeSummary = { id: string; price_list_id: string; label: string };

// Fiyat Listeleri sayfası (28 Eyl 2026): her liste bir kart; altında ortak
// şifreleri, müşteri şifreleri, o listeye şifre ekleme ve fiyatı girilmemiş
// ürün uyarısı. Fiyatsız katalog listesi en sonda, fiyat uyarısı yok.
export function AccessCodesManager({
  tenant,
  initialCodes,
  priceLists: initialPriceLists,
  missingPrices = {},
  personalCodes = [],
}: {
  tenant: Tenant;
  initialCodes: AccessCode[];
  priceLists: PriceList[];
  missingPrices?: MissingPrices;
  personalCodes?: PersonalCodeSummary[];
}) {
  const [codes, setCodes] = useState(initialCodes);
  const [priceLists, setPriceLists] = useState(initialPriceLists);
  const [newCodeByList, setNewCodeByList] = useState<Record<string, string>>({});
  const [codeMessage, setCodeMessage] = useState<{ listId: string; text: string; ok: boolean } | null>(null);
  const [openMissing, setOpenMissing] = useState<string | null>(null);
  const [newPriceListName, setNewPriceListName] = useState("");
  const [priceListMessage, setPriceListMessage] = useState<string | null>(null);
  const [isPasswordProtected, setIsPasswordProtected] = useState(tenant.is_password_protected);
  const [passwordModeMessage, setPasswordModeMessage] = useState<string | null>(null);
  // Magnetle şifresiz giriş: magnet QR'ı okutan şifre görmeden girer,
  // düz linkle gelen şifre kapısına düşer (bkz. proxy.ts + magnet-enter).
  const [magnetLoginEnabled, setMagnetLoginEnabled] = useState(tenant.magnet_login_enabled);
  const [magnetLoginMessage, setMagnetLoginMessage] = useState<string | null>(null);
  const [magnetLoginPending, startMagnetLoginTransition] = useTransition();
  // "" = şifresiz ziyaretçi listesiyle aynı (varsayılan).
  const [magnetPriceListId, setMagnetPriceListId] = useState(tenant.magnet_price_list_id ?? "");
  const [showDisablePicker, setShowDisablePicker] = useState(false);
  const pricedPriceLists = initialPriceLists.filter((list) => !list.is_catalog_only);
  const [pendingPublicPriceListId, setPendingPublicPriceListId] = useState(
    tenant.public_price_list_id ?? pricedPriceLists[0]?.id ?? "",
  );
  const [pending, startTransition] = useTransition();
  const [priceListPending, startPriceListTransition] = useTransition();
  const [confirmDeleteListId, setConfirmDeleteListId] = useState<string | null>(null);
  const [passwordModePending, startPasswordModeTransition] = useTransition();
  const router = useRouter();

  function toggleMagnetLogin(nextValue: boolean) {
    setMagnetLoginMessage(null);

    startMagnetLoginTransition(async () => {
      const response = await fetch("/api/tenant/access-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Bu düğme yalnızca şifre koruması açıkken görünür; koruma durumu
        // olduğu gibi geri gönderilir.
        body: JSON.stringify({ is_password_protected: true, magnet_login_enabled: nextValue }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMagnetLoginMessage(result.error ?? "Ayar güncellenemedi.");
        return;
      }

      setMagnetLoginEnabled(nextValue);
      setMagnetLoginMessage(
        nextValue
          ? "Açıldı: magnet QR'ı okutan müşteri şifre görmeden girer, linkle gelen şifre girer."
          : "Kapatıldı: magnetle gelenler de dahil herkes şifre girer.",
      );
    });
  }

  function changeMagnetPriceList(nextValue: string) {
    setMagnetLoginMessage(null);

    startMagnetLoginTransition(async () => {
      const response = await fetch("/api/tenant/access-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_password_protected: true,
          magnet_price_list_id: nextValue || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMagnetLoginMessage(result.error ?? "Ayar güncellenemedi.");
        return;
      }

      setMagnetPriceListId(nextValue);
      setMagnetLoginMessage(
        nextValue
          ? "Magnetle girenler artık seçtiğiniz fiyat listesini görecek."
          : "Magnetle girenler şifresiz ziyaretçi listesiyle aynı listeyi görecek.",
      );
    });
  }

  function togglePasswordProtection(nextValue: boolean, publicPriceListId?: string) {
    setPasswordModeMessage(null);

    startPasswordModeTransition(async () => {
      const response = await fetch("/api/tenant/access-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_password_protected: nextValue,
          ...(publicPriceListId ? { public_price_list_id: publicPriceListId } : {}),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setPasswordModeMessage(result.error ?? "Ayar güncellenemedi.");
        return;
      }

      setIsPasswordProtected(nextValue);
      setShowDisablePicker(false);
      setPasswordModeMessage(
        nextValue
          ? "Şifre koruması açıldı. Müşteriler artık erişim kodu girmeden mağazaya giremez."
          : "Şifre koruması kapatıldı. Müşteriler artık kod girmeden doğrudan mağazaya girebilir.",
      );
      router.refresh();
    });
  }

  // "Şifre kullanma" kutusu işaretlenince (checked=true) koruma kapanacak —
  // önce hangi fiyat listesinin gösterileceğini sormadan doğrudan kapatmıyoruz.
  function handleProtectionCheckboxChange(checked: boolean) {
    setPasswordModeMessage(null);

    if (checked) {
      setShowDisablePicker(true);
      return;
    }

    setShowDisablePicker(false);
    togglePasswordProtection(true);
  }

  function confirmDisableProtection() {
    if (!pendingPublicPriceListId) return;
    togglePasswordProtection(false, pendingPublicPriceListId);
  }

  // Fiyatsız katalog (is_catalog_only) şifreleri bir fiyat seviyesi
  // göstermediği için paket kotasına dahil edilmez — bkz.
  // ensureAccessCodeLimitResponse (lib/tenancy/guards.ts).
  const catalogOnlyPriceListIds = new Set(
    priceLists.filter((list) => list.is_catalog_only).map((list) => list.id),
  );
  const pricedListCount = priceLists.filter(
    (list) => !catalogOnlyPriceListIds.has(list.id),
  ).length;
  const pricedCodeCount = codes.filter(
    (code) => !catalogOnlyPriceListIds.has(code.price_list_id),
  ).length;
  const codeLimit = getPriceListLimit(tenant.plan);
  const atCodeLimit = codeLimit !== null && pricedCodeCount >= codeLimit;
  const atPriceListLimit = codeLimit !== null && pricedListCount >= codeLimit;

  function addPriceList(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPriceListMessage(null);

    startPriceListTransition(async () => {
      const response = await fetch("/api/tenant/price-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPriceListName.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        setPriceListMessage(result.error ?? "Fiyat listesi eklenemedi.");
        return;
      }

      const created = result.priceList as PriceList;
      setPriceLists((current) => [...current, created]);
      setNewPriceListName("");
      setPriceListMessage(
        `"${created.name}" eklendi. Şimdi ürünlerin bu listedeki fiyatlarını girin ve listeye bir şifre bağlayın.`,
      );
      router.refresh();
    });
  }

  function deletePriceList(listId: string) {
    setCodeMessage(null);

    startPriceListTransition(async () => {
      const response = await fetch("/api/tenant/price-lists", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: listId }),
      });

      const result = await response.json().catch(() => ({}));
      setConfirmDeleteListId(null);

      if (!response.ok) {
        setCodeMessage({ listId, text: result.error ?? "Fiyat listesi silinemedi.", ok: false });
        return;
      }

      const removed = priceLists.find((entry) => entry.id === listId);
      setPriceLists((current) => current.filter((entry) => entry.id !== listId));
      setPriceListMessage(removed ? `"${getPriceListDisplayName(removed)}" silindi.` : "Liste silindi.");
      router.refresh();
    });
  }

  function addCode(listId: string) {
    const passwordCode = (newCodeByList[listId] ?? "").trim();
    if (!passwordCode) return;
    setCodeMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/access-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          password_code: passwordCode,
          price_list_id: listId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setCodeMessage({ listId, text: result.error ?? "Şifre eklenemedi.", ok: false });
        return;
      }

      const created = result.accessCode as AccessCode;
      const list = priceLists.find((entry) => entry.id === created.price_list_id);
      setCodes((current) => [
        {
          ...created,
          price_list_name: list ? getPriceListDisplayName(list) : created.price_list_name,
        },
        ...current,
      ]);
      setNewCodeByList((current) => ({ ...current, [listId]: "" }));
      setCodeMessage({ listId, text: `"${created.password_code}" şifresi eklendi.`, ok: true });
      router.refresh();
    });
  }

  function deleteCode(id: string, listId: string) {
    setCodeMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/access-codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok) {
        setCodeMessage({ listId, text: result.error ?? "Şifre silinemedi.", ok: false });
        return;
      }

      setCodes((current) => current.filter((code) => code.id !== id));
      setCodeMessage({ listId, text: "Şifre kaldırıldı.", ok: true });
      router.refresh();
    });
  }

  // Şifresiz mağaza uyarısı (6 Eki 2026): yeni mağazalar şifresiz açılır; sahibi
  // ürünlerini yükledikten sonra şifreyi açmayı unutmasın.
  const publicPriceList = priceLists.find((list) => list.id === tenant.public_price_list_id);

  return (
    <div className="space-y-6">
      {!isPasswordProtected ? (
        <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-amber-900">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Mağazanız şu anda şifresiz, herkese açık</p>
            <p className="mt-1 text-sm">
              Mağaza adresinizi bilen herkes ürünlerinizi
              {publicPriceList && !publicPriceList.is_catalog_only
                ? ` ve “${getPriceListDisplayName(publicPriceList)}” fiyatlarını`
                : ""}{" "}
              şifre girmeden görebilir. Ürünlerinizi yükledikten sonra fiyatlarınızı yalnız
              bayilerinize göstermek için aşağıdaki “Şifre kullanma” kutusundaki işareti kaldırın
              ve bayileriniz için şifre oluşturun.
            </p>
          </div>
        </div>
      ) : null}

      <Card className="p-5 border-violet-200 bg-violet-50/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Şifre kullanma</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Demo veya tanıtım amaçlı paylaştığınız mağazalarda müşterilerin erişim kodu
              girmesine gerek kalmadan doğrudan girebilmesini istiyorsanız açın. Açıkken
              aşağıdaki şifre yönetimi devre dışı kalır ve mağaza herkese açık olur.
            </p>
          </div>
          <label className="flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={!isPasswordProtected}
              onChange={(event) => handleProtectionCheckboxChange(event.target.checked)}
              disabled={passwordModePending}
              className="size-4 accent-violet-600"
            />
            Şifre kullanma
          </label>
        </div>

        {passwordModeMessage ? (
          <p className="mt-3 text-sm text-emerald-700">{passwordModeMessage}</p>
        ) : null}

        {showDisablePicker && isPasswordProtected ? (
          <div className="mt-4 rounded-xl border border-violet-200 bg-white px-4 py-4">
            <p className="text-sm font-medium text-slate-900">
              Şifresiz ziyaretçilere ürünler hangi fiyat listesinden gösterilsin?
            </p>
            {pricedPriceLists.length ? (
              <>
                <Select
                  value={pendingPublicPriceListId}
                  onChange={(event) => setPendingPublicPriceListId(event.target.value)}
                  className="mt-3"
                >
                  {pricedPriceLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {getPriceListDisplayName(list)}
                    </option>
                  ))}
                </Select>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={confirmDisableProtection}
                    disabled={passwordModePending || !pendingPublicPriceListId}
                  >
                    {passwordModePending ? "Kaydediliyor..." : "Onayla ve şifreyi kapat"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowDisablePicker(false)}
                    disabled={passwordModePending}
                  >
                    Vazgeç
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-amber-700">
                Önce aşağıdan en az bir fiyatlı liste oluşturmalısınız.
              </p>
            )}
          </div>
        ) : null}

        {!isPasswordProtected ? (
          <div className="mt-4 rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm text-violet-800">
            Şifre koruması şu anda kapalı — mağaza şifresiz açık. Aşağıdan tekrar
            açabilirsiniz.
          </div>
        ) : null}

        {/* Magnet QR (Magnet CRM) yalnız market tenantlarında (28 Eyl 2026). */}
        {isPasswordProtected && tenant.business_type === "market" ? (
          <div className="mt-4 rounded-xl border border-violet-200 bg-white px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Magnet QR ile şifresiz giriş</p>
                <p className="mt-1 max-w-xl text-xs text-slate-600">
                  Açıkken magnetteki QR&apos;ı okutan müşteri şifre görmeden girer (şifresiz
                  ziyaretçi listesiyle); mağaza linkini elden ele alan herkes şifre girmek
                  zorunda kalır. Adres çubuğundan kopyalanan link de şifre ekranına düşer —
                  giriş yetkisi linkte değil, QR okutulan cihazdadır.
                </p>
              </div>
              <label className="flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={magnetLoginEnabled}
                  onChange={(event) => toggleMagnetLogin(event.target.checked)}
                  disabled={magnetLoginPending}
                  className="size-4 accent-violet-600"
                />
                Açık
              </label>
            </div>
            {magnetLoginEnabled ? (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <label className="mb-1.5 block text-sm font-medium text-slate-900">
                  Magnetle girenler hangi fiyat listesini görsün?
                </label>
                <Select
                  value={magnetPriceListId}
                  onChange={(event) => changeMagnetPriceList(event.target.value)}
                  disabled={magnetLoginPending}
                  className="max-w-md"
                >
                  <option value="">— Şifresiz ziyaretçi listesiyle aynı (varsayılan) —</option>
                  {pricedPriceLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {getPriceListDisplayName(list)}
                    </option>
                  ))}
                </Select>
                <p className="mt-1.5 text-xs text-slate-500">
                  Değişiklik yeni girişlerde geçerli olur; daha önce girmiş cihazlar mevcut
                  oturum çerezleri süresince eski listeyi görmeye devam edebilir.
                </p>
              </div>
            ) : null}
            {magnetLoginMessage ? (
              <p className="mt-3 text-sm text-emerald-700">{magnetLoginMessage}</p>
            ) : null}
          </div>
        ) : null}
      </Card>

      <div
        aria-disabled={!isPasswordProtected}
        className={cn("space-y-4", !isPasswordProtected && "pointer-events-none opacity-50")}
      >
        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Yeni fiyat listesi</h2>
              <p className="mt-1 max-w-xl text-sm text-slate-600">
                Yeni bir fiyat seviyesi (ör. &quot;4.Liste&quot;, &quot;VIP Bayi&quot;) oluşturun. Sonra ürünlerin bu listedeki
                fiyatlarını girin; fiyatı eksik ürün kalırsa liste kartında uyarı görürsünüz.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {pricedCodeCount} / {formatPriceListLimit(tenant.plan)} fiyatlı şifre
            </span>
          </div>
          {atPriceListLimit ? (
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Paketinizde en fazla {formatPriceListLimit(tenant.plan)} fiyatlı seviye oluşturabilirsiniz. Daha fazlası için
              paketinizi yükseltin.
            </div>
          ) : (
            <form onSubmit={addPriceList} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder="Örn. 4.Liste"
                value={newPriceListName}
                onChange={(event) => setNewPriceListName(event.target.value)}
                className="sm:max-w-sm"
              />
              <Button type="submit" variant="secondary" disabled={priceListPending || !newPriceListName.trim()}>
                <Plus className="size-4" />
                {priceListPending ? "Ekleniyor..." : "Liste ekle"}
              </Button>
            </form>
          )}
          {priceListMessage ? <p className="mt-3 text-sm text-emerald-700">{priceListMessage}</p> : null}
        </Card>

        {[...priceLists]
          .sort((a, b) => Number(a.is_catalog_only) - Number(b.is_catalog_only) || a.sort_order - b.sort_order)
          .map((list) => {
            const listCodes = codes.filter((code) => code.price_list_id === list.id);
            const listCustomers = personalCodes.filter((code) => code.price_list_id === list.id);
            const missing = list.is_catalog_only ? null : missingPrices[list.id];
            const missingCount = missing?.count ?? 0;
            const limitReached = !list.is_catalog_only && atCodeLimit;
            const message = codeMessage?.listId === list.id ? codeMessage : null;
            return (
              <Card key={list.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">{getPriceListDisplayName(list)}</h3>
                  <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{listCodes.length} şifre</span>
                    {listCustomers.length ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">{listCustomers.length} müşteri</span>
                    ) : null}
                    {!list.is_catalog_only && pricedListCount > 1 ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteListId(list.id)}
                        disabled={priceListPending}
                        title="Listeyi sil"
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="size-3.5" /> Sil
                      </button>
                    ) : null}
                  </div>
                </div>

                {confirmDeleteListId === list.id ? (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                    {listCodes.length || listCustomers.length ? (
                      <p>
                        Bu listeye bağlı şifre veya müşteri var. Silmeden önce şifreleri kaldırın ya da müşterileri başka
                        listeye taşıyın.
                      </p>
                    ) : (
                      <p>
                        <span className="font-semibold">{getPriceListDisplayName(list)}</span> silinsin mi? Ürünlerin bu
                        listedeki fiyatları da silinir, geri alınamaz.
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      {!listCodes.length && !listCustomers.length ? (
                        <Button
                          type="button"
                         
                          onClick={() => deletePriceList(list.id)}
                          disabled={priceListPending}
                          className="bg-rose-600 text-white hover:bg-rose-700"
                        >
                          {priceListPending ? "Siliniyor..." : "Evet, sil"}
                        </Button>
                      ) : null}
                      <Button type="button" variant="secondary" onClick={() => setConfirmDeleteListId(null)}>
                        Vazgeç
                      </Button>
                    </div>
                  </div>
                ) : null}

                {list.is_catalog_only ? (
                  <p className="mt-2 text-sm text-slate-500">Bu şifreyle girenler ürünleri fiyatsız görür.</p>
                ) : missingCount > 0 ? (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <button
                      type="button"
                      onClick={() => setOpenMissing((current) => (current === list.id ? null : list.id))}
                      className="flex w-full items-center gap-2 text-left font-semibold"
                    >
                      <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                      Bu listede fiyatı girilmemiş {missingCount} ürün var
                      <span className="ml-auto text-xs font-semibold underline underline-offset-2">
                        {openMissing === list.id ? "Gizle" : "Ürünleri gör"}
                      </span>
                    </button>
                    {openMissing === list.id && missing ? (
                      <ul className="mt-2 space-y-1 border-t border-amber-200 pt-2">
                        {missing.sample.map((product) => (
                          <li key={product.id}>
                            <Link
                              href={`/products?q=${encodeURIComponent(product.sku || product.name)}&focus=${product.id}`}
                              className="hover:underline"
                            >
                              {product.sku ? <span className="font-mono font-semibold">{product.sku}</span> : null}
                              {product.sku ? " · " : ""}
                              {product.name}
                            </Link>
                          </li>
                        ))}
                        {missingCount > missing.sample.length ? (
                          <li className="text-xs text-amber-700">…ve {missingCount - missing.sample.length} ürün daha</li>
                        ) : null}
                      </ul>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="size-4" /> Tüm ürünlerin fiyatı girilmiş
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {listCodes.map((code) => (
                    <span
                      key={code.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-2.5 pr-1 font-mono text-sm font-semibold text-slate-900"
                    >
                      <KeyRound className="size-3.5 text-slate-500" />
                      {code.password_code}
                      <button
                        type="button"
                        onClick={() => deleteCode(code.id, list.id)}
                        disabled={pending}
                        title="Şifreyi kaldır"
                        className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </span>
                  ))}
                  {listCustomers.map((code) => (
                    <Link
                      key={code.id}
                      href={`/customers/${code.id}`}
                      title="Kişiye özel müşteri şifresi — Müşteriler sayfasından yönetilir"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-900 hover:border-emerald-300"
                    >
                      <UserRound className="size-3.5" /> {code.label}
                    </Link>
                  ))}
                  {!listCodes.length && !listCustomers.length ? (
                    <p className="text-sm text-slate-500">Bu listeye bağlı şifre yok.</p>
                  ) : null}
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    addCode(list.id);
                  }}
                  className="mt-4 flex flex-col gap-2 sm:flex-row"
                >
                  <Input
                    placeholder="Yeni şifre, örn. 1111"
                    value={newCodeByList[list.id] ?? ""}
                    onChange={(event) => setNewCodeByList((current) => ({ ...current, [list.id]: event.target.value }))}
                    className="sm:max-w-xs"
                    disabled={limitReached}
                  />
                  <Button type="submit" variant="secondary" disabled={pending || limitReached || !(newCodeByList[list.id] ?? "").trim()}>
                    <Plus className="size-4" /> Bu listeye şifre ekle
                  </Button>
                </form>
                {limitReached ? (
                  <p className="mt-2 text-xs text-amber-700">
                    Paketinizdeki fiyatlı şifre sınırına ulaştınız ({formatPriceListLimit(tenant.plan)}).
                  </p>
                ) : null}
                {message ? (
                  <p className={cn("mt-2 text-sm", message.ok ? "text-emerald-700" : "text-rose-700")}>{message.text}</p>
                ) : null}
              </Card>
            );
          })}
      </div>
    </div>
  );
}
