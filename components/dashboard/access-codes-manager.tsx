"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatPriceListLimit, getPriceListLimit } from "@/lib/billing/plans";
import { getPriceListDisplayName, normalizePriceListName } from "@/lib/price-lists/constants";
import type { AccessCode, PriceList, Tenant } from "@/lib/types";

export function AccessCodesManager({
  tenant,
  initialCodes,
  priceLists: initialPriceLists,
}: {
  tenant: Tenant;
  initialCodes: AccessCode[];
  priceLists: PriceList[];
}) {
  const [codes, setCodes] = useState(initialCodes);
  const [priceLists, setPriceLists] = useState(initialPriceLists);
  const [passwordCode, setPasswordCode] = useState("");
  const [priceListId, setPriceListId] = useState(initialPriceLists[0]?.id ?? "");
  const [newPriceListName, setNewPriceListName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [priceListMessage, setPriceListMessage] = useState<string | null>(null);
  const [isPasswordProtected, setIsPasswordProtected] = useState(tenant.is_password_protected);
  const [passwordModeMessage, setPasswordModeMessage] = useState<string | null>(null);
  // Magnetle şifresiz giriş: magnet QR'ı okutan şifre görmeden girer,
  // düz linkle gelen şifre kapısına düşer (bkz. proxy.ts + magnet-enter).
  const [magnetLoginEnabled, setMagnetLoginEnabled] = useState(tenant.magnet_login_enabled);
  const [magnetLoginMessage, setMagnetLoginMessage] = useState<string | null>(null);
  const [magnetLoginPending, startMagnetLoginTransition] = useTransition();
  const [showDisablePicker, setShowDisablePicker] = useState(false);
  const pricedPriceLists = initialPriceLists.filter((list) => !list.is_catalog_only);
  const [pendingPublicPriceListId, setPendingPublicPriceListId] = useState(
    tenant.public_price_list_id ?? pricedPriceLists[0]?.id ?? "",
  );
  const [pending, startTransition] = useTransition();
  const [priceListPending, startPriceListTransition] = useTransition();
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
  const selectedIsCatalogOnly = catalogOnlyPriceListIds.has(priceListId);
  const atCodeLimit =
    codeLimit !== null && !selectedIsCatalogOnly && pricedCodeCount >= codeLimit;
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
      setPriceListId(created.id);
      setNewPriceListName("");
      setPriceListMessage("Yeni fiyat listesi eklendi. Şimdi bu listeye bir şifre bağlayın.");
      router.refresh();
    });
  }

  function addCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/access-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          password_code: passwordCode,
          price_list_id: priceListId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Şifre eklenemedi.");
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
      setPasswordCode("");
      setMessage("Yeni erişim şifresi eklendi.");
      router.refresh();
    });
  }

  function deleteCode(id: string) {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/access-codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Şifre silinemedi.");
        return;
      }

      setCodes((current) => current.filter((code) => code.id !== id));
      setMessage("Şifre kaldırıldı.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
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

        {isPasswordProtected ? (
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
            {magnetLoginMessage ? (
              <p className="mt-3 text-sm text-emerald-700">{magnetLoginMessage}</p>
            ) : null}
          </div>
        ) : null}
      </Card>

      <div
        aria-disabled={!isPasswordProtected}
        className={
          !isPasswordProtected ? "pointer-events-none opacity-50" : undefined
        }
      >
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-slate-900">Fiyat listeleri</h2>
        <p className="mt-1 text-sm text-slate-600">
          Yeni bir fiyatlı seviye (ör. &quot;4.Liste&quot;, &quot;VIP Bayi&quot;) oluşturun,
          ardından aşağıdan bu listeye bağlı bir şifre ekleyin.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {priceLists
            .filter((list) => !list.is_catalog_only)
            .map((list) => (
              <span
                key={list.id}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                {getPriceListDisplayName(list)}
              </span>
            ))}
        </div>

        {atPriceListLimit ? (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Paketinizde en fazla {formatPriceListLimit(tenant.plan)} fiyatlı seviye
            oluşturabilirsiniz. Daha fazlası için paketinizi yükseltin.
          </div>
        ) : (
          <form onSubmit={addPriceList} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Örn. 4.Liste"
              value={newPriceListName}
              onChange={(event) => setNewPriceListName(event.target.value)}
              className="sm:flex-1"
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={priceListPending || !newPriceListName.trim()}
            >
              {priceListPending ? "Ekleniyor..." : "Liste ekle"}
            </Button>
          </form>
        )}

        {priceListMessage ? (
          <p className="mt-3 text-sm text-emerald-700">{priceListMessage}</p>
        ) : null}
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Yeni erişim kodu</h2>
        <p className="mt-1 text-sm text-slate-600">
          Müşteri vitrini için yeni şifre kodu buradan oluşturabilirsiniz. Seçilen fiyat
          listesine göre vitrin davranışı belirlenir.
        </p>

        {atCodeLimit ? (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Paketinizde en fazla {formatPriceListLimit(tenant.plan)} fiyatlı seviye
            oluşturabilirsiniz (fiyatsız katalog şifreleri bu sayıma dahil değildir).
            Daha fazla fiyat seviyesi için paketinizi yükseltin.
          </div>
        ) : null}

        <form onSubmit={addCode} className="mt-5 grid gap-3">
          <Input
            placeholder="Örn. 1111"
            value={passwordCode}
            onChange={(event) => setPasswordCode(event.target.value)}
          />
          <Select
            value={priceListId}
            onChange={(event) => setPriceListId(event.target.value)}
          >
            {priceLists.map((list) => (
              <option key={list.id} value={list.id}>
                {getPriceListDisplayName(list)}
              </option>
            ))}
          </Select>
          <Button type="submit" disabled={pending || !priceListId || atCodeLimit}>
            {pending ? "Kaydediliyor..." : "Kodu ekle"}
          </Button>
        </form>
      </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Aktif erişim kodları</h2>
            <p className="mt-1 text-sm text-slate-600">
              {tenant.company_name} • {tenant.subdomain}.ekatalox.com
            </p>
          </div>
          <Badge className="bg-slate-100 text-slate-700">
            {pricedCodeCount} / {formatPriceListLimit(tenant.plan)} fiyat seviyesi
          </Badge>
        </div>

        {message ? (
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {codes.map((code) => {
            const linkedList = priceLists.find((entry) => entry.id === code.price_list_id);
            const listLabel = linkedList
              ? getPriceListDisplayName(linkedList)
              : normalizePriceListName(code.price_list_name ?? "Fiyat listesi");

            return (
            <div
              key={code.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-base font-semibold text-slate-900">{code.password_code}</p>
                <p className="mt-1 text-sm text-slate-500">{listLabel}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => deleteCode(code.id)}
                disabled={pending}
              >
                Kaldır
              </Button>
            </div>
            );
          })}
        </div>
      </Card>
        </div>
      </div>
    </div>
  );
}
