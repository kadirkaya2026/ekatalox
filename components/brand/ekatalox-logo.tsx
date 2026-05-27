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
  const src = variant === "light" ? "/ekatalox-logo-rgb.png" : "/ekatalox-logo.png";
  return (
    <div className={cn("relative h-9 w-[160px] shrink-0", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover object-center"
      />
    </div>
  );
}