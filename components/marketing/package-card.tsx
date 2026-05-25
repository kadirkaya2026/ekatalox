import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PackageCard({
  title,
  price,
  limit,
  features,
  highlighted = false,
}: {
  title: string;
  price: string;
  limit: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm ${
        highlighted
          ? "border-emerald-200 bg-white ring-2 ring-emerald-100"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            {title}
          </p>
          <h3 className="mt-3 text-3xl font-bold text-slate-900">{price}</h3>
          <p className="mt-2 text-sm text-slate-600">{limit}</p>
        </div>
        {highlighted ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            En çok tercih edilen
          </span>
        ) : null}
      </div>

      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-slate-700">
            <Check className="mt-0.5 size-4 text-emerald-600" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        href="https://wa.me/905354172510?text=eKatalox%20paketleri%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
        className="mt-8 w-full"
      >
        WhatsApp ile iletişime geç
      </Button>
    </div>
  );
}