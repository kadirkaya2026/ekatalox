export function computeDiscountPercentage(original: number, sale: number) {
  if (original <= 0 || sale >= original) {
    return null;
  }

  return Math.round(((original - sale) / original) * 100);
}
