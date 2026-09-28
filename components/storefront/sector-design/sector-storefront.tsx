"use client";
import { ElectronicsStorefront, type SectorStorefrontProps } from "./electronics-storefront";
import { FoodStorefront } from "./food-storefront";
import { TextileStorefront } from "./textile-storefront";
import { HardwareStorefront } from "./hardware-storefront";
import { CosmeticsStorefront } from "./cosmetics-storefront";
import { StationeryStorefront } from "./stationery-storefront";
import { PackagingStorefront } from "./packaging-storefront";
import { ElectricityStorefront } from "./electricity-storefront";
import { HomewareStorefront } from "./homeware-storefront";
import { AutomotiveStorefront } from "./automotive-storefront";
import { GeneralStorefront } from "./general-storefront";
export function SectorStorefront(props: SectorStorefrontProps) {
  return props.design.themeId.startsWith("general-") ? <GeneralStorefront {...props} /> : props.design.themeId.startsWith("automotive-") ? <AutomotiveStorefront {...props} /> : props.design.themeId.startsWith("homeware-") ? <HomewareStorefront {...props} /> : props.design.themeId.startsWith("electricity-") ? <ElectricityStorefront {...props} /> : props.design.themeId.startsWith("packaging-") ? <PackagingStorefront {...props} /> : props.design.themeId.startsWith("stationery-") ? <StationeryStorefront {...props} /> : props.design.themeId.startsWith("cosmetics-") ? <CosmeticsStorefront {...props} /> : props.design.themeId.startsWith("hardware-") ? <HardwareStorefront {...props} /> : props.design.themeId.startsWith("textile-") ? <TextileStorefront {...props} /> : props.design.themeId.startsWith("food-") ? <FoodStorefront {...props} /> : <ElectronicsStorefront {...props} />;
}
