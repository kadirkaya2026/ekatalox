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
    <div className="flex flex-col gap-4 px-1 pt-1 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight md:text-[28px]">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
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