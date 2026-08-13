import type { LucideIcon } from "lucide-react";

export function SettingsSectionHeader({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
      <Icon className="size-4 text-emerald-700 dark:text-emerald-400" />
      <span>{title}</span>
    </div>
  );
}
