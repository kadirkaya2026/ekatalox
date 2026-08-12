import { Button } from "@/components/ui/button";

export function Header({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 text-card-foreground shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-semibold md:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function HeaderActionLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return <Button asChild href={href}>{label}</Button>;
}