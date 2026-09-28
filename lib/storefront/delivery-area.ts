// Mağazaya özel teslimat bölgesi (0147, 29 Eyl 2026 — kalitemarket).
// tenant_storefront_settings.delivery_area doluysa sepette il/ilçe sabit
// gösterilir, müşteri mahalleyi listeden seçer, kalan adresi elle yazar.
// Boşsa sepet eskisi gibi tek serbest adres alanıdır.

export interface DeliveryArea {
  city: string;
  district: string;
  neighborhoods: string[];
}

export function resolveDeliveryArea(raw: unknown): DeliveryArea | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<DeliveryArea>;
  const neighborhoods = Array.isArray(value.neighborhoods)
    ? value.neighborhoods.filter((name): name is string => typeof name === "string" && Boolean(name.trim())).map((name) => name.trim())
    : [];
  if (!neighborhoods.length) return null;
  return {
    city: typeof value.city === "string" ? value.city.trim() : "",
    district: typeof value.district === "string" ? value.district.trim() : "",
    neighborhoods,
  };
}

function areaSuffix(area: DeliveryArea) {
  return [area.district, area.city].filter(Boolean).join(" / ");
}

/** "Özgürlük Mahallesi, Gül Sk. No:5, Çayırova / Kocaeli". Mahalle seçilmediyse "" (adres eksik sayılır). */
export function composeAreaAddress(area: DeliveryArea, neighborhood: string, detail: string) {
  if (!neighborhood) return "";
  return [neighborhood, detail.trim(), areaSuffix(area)].filter(Boolean).join(", ");
}

export function parseAreaAddress(area: DeliveryArea, address: string) {
  const neighborhood = area.neighborhoods.find((name) => address === name || address.startsWith(`${name}, `)) ?? "";
  if (!neighborhood) return { neighborhood: "", detail: "" };
  let detail = address.slice(neighborhood.length).replace(/^,\s*/, "");
  const suffix = areaSuffix(area);
  if (suffix && detail.endsWith(suffix)) detail = detail.slice(0, -suffix.length).replace(/,\s*$/, "");
  return { neighborhood, detail };
}
