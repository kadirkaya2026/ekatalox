import type { CSSProperties } from "react";
import { getDesignContent, type DesignDocument } from "@/lib/storefront/sector-design/config";
export const textilePalettes = {
  "textile-atelier": ["#594338", "#f7f4ee", "#eae3d8"],
  "textile-vitrin": ["#993645", "#fffafa", "#f3dce2"],
  "textile-seri": ["#354a60", "#f2f4f6", "#e4e9ee"],
} as const;
export function paletteStyle(doc: DesignDocument, dark: boolean): CSSProperties {
  if (!doc.themeId.startsWith("textile-")) return {};
  const c = getDesignContent(doc);
  const vars: Record<string, string> = {};
  if (c.accentColor) {
    vars["--accent"] = vars["--cc-accent"] = c.accentColor;
    const rgb = [1,3,5].map(i => parseInt(c.accentColor!.slice(i,i+2),16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
    const ink = rgb[0]*.2126 + rgb[1]*.7152 + rgb[2]*.0722 > .179 ? "#111111" : "#ffffff";
    vars["--on-accent"] = vars["--cc-on-accent"] = ink;
  }
  if (!dark) {
    if (c.backgroundColor) vars["--bg"] = vars["--cc-bg"] = c.backgroundColor;
    if (c.surfaceColor) vars["--soft"] = vars["--cc-soft"] = c.surfaceColor;
  }
  return vars as CSSProperties;
}
