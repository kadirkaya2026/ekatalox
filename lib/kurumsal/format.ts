// Kurumsal site görünüm yardımcıları. İstemci ve sunucu tarafında ortak
// (sihirbaz önizlemesi de aynı hesapları kullanır); veri çekmez.

export function titleCaseTr(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .map((word) => word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1))
    .join(" ");
}

export function whatsappLink(number: string | null | undefined, text: string) {
  const digits = (number ?? "").replace(/\D/g, "");
  if (!digits) return null;
  // wa.me yönlendirmesi 4 baytlık karakterleri bozabiliyor; doğrudan api adresi.
  return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(text)}`;
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export const KURUMSAL_DEFAULT_ACCENT = "#0f172a";

/** Vurgu rengi: içerik → kapı markası → mağaza marka rengi → koyu lacivert. */
export function resolveKurumsalAccent(params: {
  contentAccent?: string | null;
  gateAccent?: string | null;
  brandColor?: string | null;
}) {
  return params.contentAccent || params.gateAccent || params.brandColor || KURUMSAL_DEFAULT_ACCENT;
}

/** Hero görseli: içerik → kapı arka planı → vitrin hero'su → ilk banner görseli. */
export function resolveKurumsalHero(params: {
  contentHero?: string | null;
  gateBackground?: string | null;
  settingsHero?: string | null;
  bannerImages?: Array<string | null | undefined>;
}) {
  return (
    params.contentHero ||
    params.gateBackground ||
    params.settingsHero ||
    params.bannerImages?.find((url) => Boolean(url)) ||
    null
  );
}
