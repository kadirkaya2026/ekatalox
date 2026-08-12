"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

function isSvgUrl(url: string) {
  return /\.svg($|\?)/i.test(url);
}

export function StorefrontImage({
  src,
  alt,
  className,
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  // priority (LCP-kritik) görseller anında görünsün diye zaten yüklü
  // kabul edilir; geri kalanı yüklendiğinde yumuşak bir fade-in yapar —
  // önceden her görsel aniden beliriyordu.
  const [isLoaded, setIsLoaded] = useState(priority);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={cn(
        className,
        "transition-opacity duration-300",
        isLoaded ? "opacity-100" : "opacity-0",
      )}
      sizes={sizes}
      priority={priority}
      unoptimized={isSvgUrl(src)}
      onLoad={() => setIsLoaded(true)}
    />
  );
}
