// iPhone gövdesinde gerçek ekran görüntüsü. Broşür kapağındaki çerçevenin
// web karşılığı: ince çerçeve, Dynamic Island, yan tuşlar. Görsel 1206x2622
// (iPhone 17 Pro ekran görüntüsü) ya da 402:874 oranında olmalı.
import Image from "next/image";
import { cn } from "@/lib/utils";

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
      {/* yan tuşlar */}
      <span aria-hidden className="absolute -left-[3px] top-[17%] h-[3.5%] w-[3px] rounded-l-sm bg-[#3a3e46]" />
      <span aria-hidden className="absolute -left-[3px] top-[23%] h-[7%] w-[3px] rounded-l-sm bg-[#3a3e46]" />
      <span aria-hidden className="absolute -left-[3px] top-[31.5%] h-[7%] w-[3px] rounded-l-sm bg-[#3a3e46]" />
      <span aria-hidden className="absolute -right-[3px] top-[25%] h-[11%] w-[3px] rounded-r-sm bg-[#3a3e46]" />
      <div
        className="relative aspect-[71.9/150] w-full rounded-[13.5%/6.5%] bg-[#2a2d33] p-[2.9%]"
        style={{ boxShadow: "inset 0 0 0 1.5px #5b6069, inset 0 0 0 4px #1a1c20, 0 24px 48px -24px rgba(18,40,74,.45)" }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[12%/5.8%] bg-black">
          <Image src={src} alt={alt} fill sizes="320px" loading={priority ? "eager" : undefined} fetchPriority={priority ? "high" : undefined} className="object-cover object-top" />
          <span aria-hidden className="absolute left-1/2 top-[1.3%] h-[2.2%] w-[29%] -translate-x-1/2 rounded-full bg-black" />
        </div>
      </div>
    </div>
  );
}
