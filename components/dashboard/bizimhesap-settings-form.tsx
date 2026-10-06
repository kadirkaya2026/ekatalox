"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Link2, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SettingsSectionHeader } from "@/components/dashboard/settings-section-header";

type View = { connected: boolean; firmIdHint: string | null; vatRate: number; isEnabled: boolean };

export function BizimHesapSettingsForm({ initial }: { initial: View }) {
  const [view, setView] = useState<View>(initial);
  const [firmId, setFirmId] = useState("");
  const [vatRate, setVatRate] = useState(String(initial.vatRate));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const save = (payload: Record<string, unknown>, okText: string) => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/tenant/integrations/bizimhesap", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage({ ok: false, text: result.error ?? "Kaydedilemedi." });
        return;
      }
      setView(result);
      setVatRate(String(result.vatRate));
      setFirmId("");
      setMessage({ ok: true, text: okText });
    });
  };

  const test = () => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/tenant/integrations/bizimhesap", { method: "POST" });
      const result = (await response.json()) as { ok: boolean; message: string };
      setMessage({ ok: result.ok, text: result.message });
    });
  };

  return (
    <Card className="space-y-5 p-5">
      <SettingsSectionHeader icon={PlugZap} title="Bağlantı" />

      {view.connected ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="size-4" />
          BizimHesap bağlı (firma kimliği …{view.firmIdHint}) —{" "}
          {view.isEnabled ? "siparişler otomatik aktarılıyor." : "aktarım şu an kapalı."}
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          BizimHesap hesabınızın B2B API firma kimliğini girin. Kimlik kaydedildikten sonra güvenlik için
          bir daha gösterilmez.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-slate-500">
            {view.connected ? "Yeni firma kimliği (değiştirmek için)" : "Firma kimliği"}
          </label>
          <Input
            value={firmId}
            onChange={(event) => setFirmId(event.target.value)}
            placeholder={view.connected ? "Değiştirmeyecekseniz boş bırakın" : "ör. 8117…"}
            autoComplete="off"
            spellCheck={false}
            className="mt-1.5 font-mono"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">KDV oranı (%)</label>
          <Input
            type="number"
            min={0}
            max={50}
            value={vatRate}
            onChange={(event) => setVatRate(event.target.value)}
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-slate-500">Fiyatlar KDV dahil kabul edilir; KDV fiyatın içinden ayrılır.</p>
        </div>
      </div>

      {message ? (
        <p className={message.ok ? "text-sm text-emerald-700" : "text-sm text-rose-700"}>{message.text}</p>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <Button
          onClick={() => save({ firmId, vatRate: Number(vatRate) }, "Kaydedildi.")}
          disabled={pending || (!view.connected && !firmId.trim())}
        >
          <Link2 className="size-4" />
          {view.connected ? "Kaydet" : "Bağla"}
        </Button>
        {view.connected ? (
          <>
            <Button variant="secondary" onClick={test} disabled={pending}>
              Bağlantıyı test et
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                save({ isEnabled: !view.isEnabled }, view.isEnabled ? "Aktarım durduruldu." : "Aktarım açıldı.")
              }
              disabled={pending}
            >
              {view.isEnabled ? "Aktarımı durdur" : "Aktarımı aç"}
            </Button>
            <Button variant="secondary" onClick={() => save({ disconnect: true }, "Bağlantı kaldırıldı.")} disabled={pending}>
              Bağlantıyı kaldır
            </Button>
          </>
        ) : null}
      </div>
    </Card>
  );
}
