// İstemci + sunucu ortak: kişiye özel bayi şifresinin müşteri bilgisi (0138).

/** Sepet/fişte gösterilen müşteri bilgisi (şifreyle eşleşen). */
export interface DealerProfile {
  accessCodeId: string;
  company: string | null;
  name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
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

