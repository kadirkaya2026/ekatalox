"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import type { ProductImageSlot } from "@/lib/hooks/use-product-form";

const SLOTS: ProductImageSlot[] = [1, 2, 3];
const SLOT_LABELS: Record<ProductImageSlot, string> = {
  1: "1. Fotoğraf",
  2: "2. Fotoğraf",
  3: "3. Fotoğraf",
};

function ImageSlotField({
  label,
  file,
  existingUrl,
  onSelect,
  onRemove,
}: {
  label: string;
  file: File | null;
  existingUrl: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const displayUrl = previewUrl ?? existingUrl;

  return (
    <label className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50/40">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const nextFile = event.target.files?.[0];
          if (nextFile) {
            onSelect(nextFile);
          }
          event.target.value = "";
        }}
      />
      {displayUrl ? (
        <>
          <Image src={displayUrl} alt={label} fill className="object-cover" unoptimized />
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRemove();
            }}
            className="absolute right-1.5 top-1.5 z-10 flex size-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            aria-label={`${label} kaldır`}
          >
            <X className="size-3.5" />
          </button>
        </>
      ) : (
        <>
          <ImagePlus className="size-5 text-emerald-700" />
          <span>{label}</span>
        </>
      )}
    </label>
  );
}

export function ProductImageFields({
  images,
  existingUrls,
  removedSlots,
  onSelect,
  onRemove,
}: {
  images: [File | null, File | null, File | null];
  existingUrls?: [string | null, string | null, string | null];
  removedSlots?: [boolean, boolean, boolean];
  onSelect: (slot: ProductImageSlot, file: File) => void;
  onRemove: (slot: ProductImageSlot) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">
        Ürün fotoğrafları (en fazla 3)
      </p>
      <div className="grid grid-cols-3 gap-3">
        {SLOTS.map((slot) => (
          <ImageSlotField
            key={slot}
            label={SLOT_LABELS[slot]}
            file={images[slot - 1]}
            existingUrl={removedSlots?.[slot - 1] ? null : existingUrls?.[slot - 1] ?? null}
            onSelect={(file) => onSelect(slot, file)}
            onRemove={() => onRemove(slot)}
          />
        ))}
      </div>
    </div>
  );
}
