import Image from "next/image";
import { cn } from "@/lib/utils";

export function EkataloxLogo({
  className,
  priority = false,
  alt = "eKatalox",
  sizes = "(max-width: 768px) 140px, 180px",
  variant = "dark",
}: {
  className?: string;
  priority?: boolean;
  alt?: string;
  sizes?: string;
  variant?: "dark" | "light";
}) {
  const src = variant === "light" ? "/ekatalox-logo-rgb-v2.png" : "/ekatalox-logo-v2.png";
  return (
    <div className={cn("relative h-9 w-[160px] shrink-0", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        unoptimized
        className="object-cover object-center"
      />
    </div>
  );
}