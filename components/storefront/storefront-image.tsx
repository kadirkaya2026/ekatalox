"use client";

import Image from "next/image";

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
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized={isSvgUrl(src)}
    />
  );
}
