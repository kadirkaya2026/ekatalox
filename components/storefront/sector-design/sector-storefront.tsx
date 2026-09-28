"use client";
import { ElectronicsStorefront, type SectorStorefrontProps } from "./electronics-storefront";
import { FoodStorefront } from "./food-storefront";
import { TextileStorefront } from "./textile-storefront";
import { HardwareStorefront } from "./hardware-storefront";
export function SectorStorefront(props: SectorStorefrontProps) {
  return props.design.themeId.startsWith("hardware-") ? <HardwareStorefront {...props} /> : props.design.themeId.startsWith("textile-") ? <TextileStorefront {...props} /> : props.design.themeId.startsWith("food-") ? <FoodStorefront {...props} /> : <ElectronicsStorefront {...props} />;
}
