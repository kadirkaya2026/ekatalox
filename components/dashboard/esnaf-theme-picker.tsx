"use client";

// Esnaf mağazalar için üç net tema kartı (kullanıcı isteği, 8 Eyl 2026:
// eski 6 sekmeli tema formu "karmakarışık"tı). Gelişmiş ayarlar aşağıda
// katlanır bölümde durur; varsayılan görünüm yalnız bu üç karttır.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ESNAF_THEME_PRESETS, type EsnafThemeKey } from "@/lib/storefront/esnaf-themes";
import { cn } from "@/lib/utils";

function ThemeMock({ theme }: { theme: EsnafThemeKey }) {
  if (theme === "vitrin") {
    return (
      <div className="rounded-lg bg-[#111418] p-3">
        <div className="flex items-center justify-between"><span className="h-2 w-16 rounded bg-white/80" /><span className="h-2 w-6 rounded bg-white/30" /></div>
        <div className="mt-2 h-2 w-full rounded bg-emerald-500/80" />
        <div className="mt-2 h-10 rounded-md bg-gradient-to-r from-sky-300 to-orange-300" />
        <div className="mt-2 grid grid-cols-3 gap-1.5">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-md bg-white/90" />)}</div>
      </div>
    );
  }
  if (theme === "taze") {
    return (
      <div className="rounded-lg bg-[#F7F5EF] p-3">
        <div className="flex items-center justify-between"><span className="h-2 w-16 rounded bg-slate-800" /><span className="h-2 w-6 rounded bg-slate-400" /></div>
        <div className="mt-2 h-12 rounded-md bg-gradient-to-r from-lime-300 via-emerald-300 to-amber-200" />
        <div className="mt-2 grid grid-cols-2 gap-1.5">{[0, 1].map((i) => <div key={i} className="h-14 rounded-md bg-white shadow-sm" />)}</div>
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="flex items-center justify-between"><span className="h-2 w-16 rounded bg-slate-800" /><span className="h-2 w-6 rounded bg-slate-400" /></div>
      <div className="mt-2 h-6 rounded-md bg-slate-200" />
      <div className="mt-2 grid grid-cols-3 gap-1.5">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-md border border-slate-200 bg-white" />)}</div>
    </div>
  );
}

export function EsnafThemePicker({ currentTheme }: { currentTheme: EsnafThemeKey | null }) {
  const router = useRouter();
  const [applying, setApplying] = useState<EsnafThemeKey | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function apply(theme: EsnafThemeKey) {
    setApplying(theme);
    setMessage(null);
    try {
      const res = await fetch("/api/tenant/settings/esnaf-theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Tema uygulanamadı.");
      setMessage({ tone: "ok", text: "Tema uygulandı. Vitrininiz birkaç saniye içinde yenilenir." });
      router.refresh();
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof Error ? e.message : "Tema uygulanamadı." });
    } finally {
      setApplying(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {ESNAF_THEME_PRESETS.map((preset) => {
          const active = currentTheme === preset.key;
          return (
            <Card key={preset.key} className={cn("flex flex-col p-4", active && "border-emerald-500 ring-2 ring-emerald-500/30")}>
              <ThemeMock theme={preset.key} />
              <div className="mt-4 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold">{preset.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{preset.description}</p>
                  <p className="mt-2 text-xs font-medium text-emerald-700">Önerilen: {preset.recommendedFor}</p>
                </div>
                {active ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700"><Check className="size-3" /> Seçili</span> : null}
              </div>
              <Button
                className="mt-4"
                variant={active ? "secondary" : "primary"}
                disabled={applying !== null}
                onClick={() => apply(preset.key)}
              >
                {applying === preset.key ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {active ? "Yeniden uygula" : "Bu temayı uygula"}
              </Button>
            </Card>
          );
        })}
      </div>
      {message ? (
        <p className={cn("text-sm font-medium", message.tone === "ok" ? "text-emerald-700" : "text-rose-700")}>{message.text}</p>
      ) : null}
    </div>
  );
}
