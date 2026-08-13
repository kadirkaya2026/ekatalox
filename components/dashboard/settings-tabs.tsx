"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SettingsTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  layoutId,
}: {
  tabs: Array<{ key: T; label: string; icon?: React.ComponentType<{ className?: string }> }>;
  activeTab: T;
  onChange: (key: T) => void;
  layoutId: string;
}) {
  return (
    <div className="flex flex-wrap border-b border-slate-100 dark:border-slate-800">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={cn(
            "relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition sm:px-5",
            activeTab === tab.key
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
          )}
        >
          {tab.icon ? <tab.icon className="size-4" /> : null}
          {tab.label}
          {activeTab === tab.key ? (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-x-0 -bottom-px h-0.5 bg-emerald-500"
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
            />
          ) : null}
        </button>
      ))}
    </div>
  );
}
