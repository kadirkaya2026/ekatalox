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
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
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