"use client";
import { ElectronicsStorefront, type SectorStorefrontProps } from "./electronics-storefront";
import { FoodStorefront } from "./food-storefront";
export function SectorStorefront(props: SectorStorefrontProps) {
  return props.design.themeId.startsWith("food-") ? <FoodStorefront {...props} /> : <ElectronicsStorefront {...props} />;
}
