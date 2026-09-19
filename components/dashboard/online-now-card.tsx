"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";

// "Şu an sitede" canlı ziyaretçi sayısı. Sunucudan gelen anlık değerle başlar,
// /api/tenant/presence'i periyodik yoklar (reports özelliği yoksa 403 döner,
// o durumda ilk değer korunur). Yeşil nabız noktası "canlı" hissi verir.
export function OnlineNowCard({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    let stop = false;
    async function poll() {
      try {
        const r = await fetch("/api/tenant/presence", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as { presence?: { total?: number } };
        if (!stop && typeof data.presence?.total === "number") setCount(data.presence.total);
      } catch {
        /* sessizce yoksay */
      }
    }
    const id = setInterval(poll, 20000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Users className="size-5" />
        </div>
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500">Şu an sitede</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{count}</p>
      <p className="mt-1 text-xs text-slate-400">Son 2 dakikada aktif müşteri</p>
    </Card>
  );
}
