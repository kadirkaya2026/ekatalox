// Kademeli adet fiyatı (products.volume_pricing, 0142). Sepette miktar paket
// adedine ulaşınca paket, koli adedine ulaşınca koli adet fiyatı uygulanır.
// Kademe verisi olmayan ürünlerde hiçbir şey değişmez.

export type VolumePricing = { package?: number | null; carton?: number | null };

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function normalizeVolumePricing(value: unknown): VolumePricing | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const pick = (v: unknown) => (typeof v === "number" && v > 0 && v <= 1 ? v : null);
  const out: VolumePricing = { package: pick(raw.package), carton: pick(raw.carton) };
  return out.package || out.carton ? out : null;
}

/** Tek kademenin adet fiyatı. */
export function tierUnitPrice(base: number, ratio: number | null | undefined) {
  return round2(base * (ratio ?? 1));
}

/** Toplam adede göre geçerli adet fiyatı. */
export function volumeUnitPrice(params: {
  base: number | null;
  volumePricing: VolumePricing | null | undefined;
  packageQuantity: number | null | undefined;
  cartonQuantity: number | null | undefined;
  units: number;
}): number | null {
  const { base, volumePricing: vp, packageQuantity, cartonQuantity, units } = params;
  if (base === null || !vp) return base;
  if (vp.carton && cartonQuantity && units >= cartonQuantity) return tierUnitPrice(base, vp.carton);
  if (vp.package && packageQuantity && units >= packageQuantity) return tierUnitPrice(base, vp.package);
  return base;
}
