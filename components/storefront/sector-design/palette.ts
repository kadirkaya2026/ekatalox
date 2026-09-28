import type { CSSProperties } from "react";
import { getDesignContent, type DesignDocument } from "@/lib/storefront/sector-design/config";
export const textilePalettes = {
  "electronics-forma": ["#c94824", "#f8f7f4", "#eeeee7"],
  "electronics-akim": ["#d7ff5f", "#131619", "#20262a"],
  "electronics-modul": ["#146354", "#f4f6f6", "#dcece6"],
  "food-hasat": ["#416439", "#faf9f4", "#edf0df"],
  "food-mahalle": ["#a52d3d", "#fffaf5", "#f8e7df"],
  "food-kiler": ["#285861", "#f3f6f7", "#e3edf0"],
  "general-atlas": ["#254f65", "#f7f9fa", "#e5edf1"],
  "general-odak": ["#755248", "#faf8f5", "#ede5df"],
  "general-birim": ["#384857", "#f3f5f7", "#e4e9ee"],
  "automotive-apex": ["#ba392a", "#f6f6f5", "#eceeed"],
  "automotive-garaj": ["#ac610c", "#ffffff", "#f6efdc"],
  "automotive-sevk": ["#315c78", "#f1f4f7", "#e3ebf1"],
  "homeware-yuva": ["#795347", "#faf7f2", "#eee6dc"],
  "homeware-sofra": ["#a33e32", "#ffffff", "#f8ede5"],
  "homeware-istif": ["#345c56", "#f3f6f4", "#e6eee8"],
  "electricity-lumen": ["#795534", "#faf8f4", "#eee7dd"],
  "electricity-volt": ["#174e9c", "#ffffff", "#eaf0fa"],
  "electricity-devre": ["#24545b", "#f2f5f5", "#e4eded"],
  "packaging-kraft": ["#b43f2a", "#ffffff", "#f5ecdf"],
  "packaging-ferah": ["#164a82", "#ffffff", "#e6f3f3"],
  "packaging-tedarik": ["#216453", "#f4f6f5", "#e1ebe5"],
  "stationery-cizgi": ["#b52b35", "#ffffff", "#fbf1e7"],
  "stationery-oyun": ["#2256bc", "#ffffff", "#eaf2ff"],
  "stationery-rota": ["#df5b18", "#f6f7f9", "#fff0b5"],
  "textile-atelier": ["#594338", "#f7f4ee", "#eae3d8"],
  "textile-vitrin": ["#993645", "#fffafa", "#f3dce2"],
  "textile-seri": ["#354a60", "#f2f4f6", "#e4e9ee"],
  "hardware-usta": ["#ba421e", "#f6f5f1", "#eee8df"],
  "hardware-yapi": ["#245c50", "#fafbf8", "#e5eee3"],
  "hardware-depo": ["#2b516d", "#f0f3f5", "#dfe7ed"],
  "cosmetics-duru": ["#58694d", "#f7f7f0", "#e6ebdf"],
  "cosmetics-aura": ["#993f55", "#fff9f6", "#f5ddd7"],
  "cosmetics-rituel": ["#356974", "#f3f7f7", "#dfecef"],
} as const;
export function paletteStyle(doc: DesignDocument, dark: boolean): CSSProperties {
  if (!(doc.themeId in textilePalettes)) return {};
  const c = getDesignContent(doc);
  const vars: Record<string, string> = {};
  if (c.accentColor) {
    vars["--accent"] = vars["--cc-accent"] = c.accentColor;
    const rgb = [1,3,5].map(i => parseInt(c.accentColor!.slice(i,i+2),16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
    const ink = rgb[0]*.2126 + rgb[1]*.7152 + rgb[2]*.0722 > .179 ? "#111111" : "#ffffff";
    vars["--on-accent"] = vars["--cc-on-accent"] = ink;
  }
  if (!dark || doc.themeId === "electronics-akim") {
    if (c.backgroundColor) vars["--bg"] = vars["--cc-bg"] = c.backgroundColor;
    if (c.surfaceColor) vars["--custom-surface"] = vars["--surface"] = vars["--soft"] = vars["--cc-soft"] = c.surfaceColor;
  }
  if(c.imageFit) vars["--banner-fit"]=c.imageFit;
  if(c.imagePosition) vars["--banner-position"]=c.imagePosition;
  return vars as CSSProperties;
}
