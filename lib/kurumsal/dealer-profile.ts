// İstemci + sunucu ortak: kişiye özel bayi şifresinin müşteri bilgisi (0138).

/** Sepet/fişte gösterilen müşteri bilgisi (şifreyle eşleşen). */
export interface DealerProfile {
  accessCodeId: string;
  company: string | null;
  name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  /** Ek teslimat adresleri (0163); varsayılan adres yukarıdaki address/city. */
  addresses?: DealerAddress[];
}

/** Bayi müşterisinin kayıtlı teslimat adresi (0163). */
export interface DealerAddress {
  id: string;
  label: string | null;
  address: string;
  city: string | null;
}

/** Varsayılan adresin (access_codes.customer_address/customer_city) sabit kimliği. */
export const PRIMARY_DEALER_ADDRESS_ID = "primary";

/** jsonb dizisini güvenle okur; bozuk satırları atar. */
export function normalizeDealerAddresses(value: unknown): DealerAddress[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : "";
    const address = typeof row.address === "string" ? row.address.trim() : "";
    if (!id || !address) return [];
    return [
      {
        id,
        label: typeof row.label === "string" && row.label.trim() ? row.label.trim() : null,
        address,
        city: typeof row.city === "string" && row.city.trim() ? row.city.trim() : null,
      },
    ];
  });
}

/** Sepette/Hesabım'da gösterilen tüm adresler: varsayılan (varsa) önce. */
export function listDealerAddresses(profile: DealerProfile): DealerAddress[] {
  const primary: DealerAddress[] =
    profile.address?.trim() || profile.city?.trim()
      ? [
          {
            id: PRIMARY_DEALER_ADDRESS_ID,
            label: null,
            address: profile.address?.trim() ?? "",
            city: profile.city?.trim() || null,
          },
        ]
      : [];
  return [...primary, ...(profile.addresses ?? [])];
}

/** Fiş ve sipariş listesinde görünen ad: "Firma (Yetkili)" ya da yalnız ad. */
export function formatDealerDisplayName(profile: { company: string | null; name: string | null }) {
  const company = profile.company?.trim();
  const name = profile.name?.trim();
  if (company && name && company.toLocaleLowerCase("tr") !== name.toLocaleLowerCase("tr")) {
    return `${company} (${name})`;
  }
  return company || name || "";
}

/** Fişe yazılan adres: adres + il (adres ili zaten içermiyorsa). */
export function formatDealerAddress(profile: { address: string | null; city: string | null }) {
  const address = profile.address?.trim() ?? "";
  const city = profile.city?.trim() ?? "";
  if (!city) return address;
  if (!address) return city;
  return address.toLocaleLowerCase("tr").includes(city.toLocaleLowerCase("tr")) ? address : `${address} / ${city}`;
}

