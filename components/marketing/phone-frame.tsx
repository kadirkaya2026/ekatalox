// iPhone 16 Pro gövdesinde ekran görüntüsü (30 Eyl 2026, gerçek ölçülerle
// yeniden çizildi): doğal titanyum kenar, ince siyah çerçeve, 126×37 pt
// Dynamic Island, Action düğmesi, ses tuşları, yan tuş ve Kamera Kontrolü.
// Görsel 1206x2622 (402×874 pt @3x) olmalı; üstte iOS durum çubuğu olan
// görüntülerde (public/site/sektor) Dynamic Island saatle aynı hizaya oturur.
import Image from "next/image";
import { cn } from "@/lib/utils";

const TITANIUM = "linear-gradient(90deg,#8d8b86 0%,#c9c6bf 18%,#a8a59f 50%,#cfccc5 82%,#8d8b86 100%)";

function SideButton({ side, top, height }: { side: "left" | "right"; top: string; height: string }) {
  return (
    <span
      aria-hidden
      className={cn("absolute w-[1.1%] min-w-[3px]", side === "left" ? "-left-[1%] rounded-l-[2px]" : "-right-[1%] rounded-r-[2px]")}
      style={{ top, height, background: "linear-gradient(90deg,#77756f,#bdbab3,#8a8781)" }}
    />
  );
}

export function PhoneFrame({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative mx-auto w-[280px] sm:w-[320px]", className)} aria-label={alt}>
      <SideButton side="left" top="16.5%" height="3.2%" />
      <SideButton side="left" top="23%" height="6.2%" />
      <SideButton side="left" top="30.6%" height="6.2%" />
      <SideButton side="right" top="25.5%" height="9.5%" />
      <SideButton side="right" top="55%" height="5.8%" />
      {/* titanyum kenar */}
      <div
        className="relative w-full rounded-[16%/7.4%] p-[1.2%]"
        style={{ aspectRatio: "71.5 / 149.6", background: TITANIUM, boxShadow: "0 30px 60px -28px rgba(15,23,42,.55), 0 0 0 0.5px rgba(0,0,0,.35)" }}
      >
        {/* siyah ekran çerçevesi */}
        <div className="relative h-full w-full rounded-[14.8%/6.9%] bg-black p-[3.1%]">
          <div className="relative h-full w-full overflow-hidden rounded-[12.6%/5.8%] bg-black">
            <Image
              src={src}
              alt={alt}
              fill
              sizes="320px"
              loading={priority ? "eager" : undefined}
              fetchPriority={priority ? "high" : undefined}
              className="object-cover object-top"
            />
            {/* Dynamic Island: 126×37 pt, üstten 11 pt (402×874 ekranda) */}
            <span aria-hidden className="absolute left-1/2 top-[1.26%] h-[4.23%] w-[31.3%] -translate-x-1/2 rounded-full bg-black" />
            {/* cam yansıması */}
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(115deg,rgba(255,255,255,.07)_0%,rgba(255,255,255,0)_38%)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
