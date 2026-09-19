"use client";

import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { SettingsTabs } from "@/components/dashboard/settings-tabs";

// Kural (kullanıcı, 19 Eyl 2026): ayar sayfalarında bölümler alt alta
// yığılmaz, sekme sekme gösterilir. Sunucu sayfası formları hazır JSX olarak
// verir; bu kabuk yalnız hangisinin görüneceğini seçer (formlara dokunmaz).
export function SettingsTabShell({
  tabs,
  panels,
  layoutId,
  initialTab,
}: {
  tabs: Array<{ key: string; label: string }>;
  panels: Record<string, ReactNode>;
  layoutId: string;
  initialTab?: string;
}) {
  const [active, setActive] = useState(initialTab ?? tabs[0]?.key ?? "");
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <SettingsTabs tabs={tabs} activeTab={active} onChange={setActive} layoutId={layoutId} />
      </Card>
      {panels[active] ?? null}
    </div>
  );
}
