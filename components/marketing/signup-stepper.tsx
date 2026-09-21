// Kayıt sihirbazının üst ilerleme çubuğu (21 Eyl 2026). Daire + ikon + alt
// etiket; dairelerin arkasında tamamlanan adımlara kadar yeşil dolan çizgi.
// Tamamlanmış adımlara tıklayarak geri dönülebilir; ileri atlanamaz.
import { Check, MessageCircle, Store, UserRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const SIGNUP_STEPS = [
  { key: "business", label: "İşletme bilgileri", icon: Store },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "account", label: "Giriş bilgileri", icon: UserRound },
  { key: "ready", label: "Kataloğunuz hazır", icon: Check },
] as const satisfies readonly { key: string; label: string; icon: LucideIcon }[];

export type SignupStepIndex = 0 | 1 | 2 | 3;

export function SignupStepper({
  current,
  onSelect,
}: {
  current: SignupStepIndex;
  /** Tamamlanmış bir adıma tıklanınca; son adımda (kurulum) verilmez. */
  onSelect?: (index: SignupStepIndex) => void;
}) {
  const n = SIGNUP_STEPS.length;
  const half = `${100 / n / 2}%`;
  const fill = `${(current / (n - 1)) * 100}%`;

  return (
    <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} aria-label="Kayıt adımları">
      {/* çizgi: ilk ve son dairenin merkezleri arasında */}
      <div aria-hidden className="absolute top-6 h-1 -translate-y-1/2 rounded-full bg-brand-line" style={{ left: half, right: half }}>
        <div className="h-full rounded-full bg-brand-green transition-[width] duration-500 ease-out" style={{ width: fill }} />
      </div>

      {SIGNUP_STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < current;
        const active = i === current;
        const clickable = done && Boolean(onSelect);
        const circle = (
          <span
            className={cn(
              "relative z-10 flex size-12 items-center justify-center rounded-full border-2 transition-colors",
              done || active
                ? "border-brand-green bg-brand-green text-white"
                : "border-brand-line bg-brand-paper text-brand-muted",
              active && "shadow-[0_0_0_6px_rgba(21,122,91,0.15)]",
            )}
          >
            <Icon className="size-5" strokeWidth={2.2} />
          </span>
        );
        return (
          <li key={step.key} className="flex flex-col items-center gap-2.5 text-center" aria-current={active ? "step" : undefined}>
            {clickable ? (
              <button type="button" onClick={() => onSelect?.(i as SignupStepIndex)} aria-label={`${step.label} adımına dön`} className="rounded-full">
                {circle}
              </button>
            ) : (
              circle
            )}
            <span
              className={cn(
                "text-[11px] font-semibold leading-tight sm:text-sm",
                active ? "text-brand-green" : done ? "text-brand-navy" : "text-brand-muted",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
