import { getSectorThemePresets, getStorefrontThemePreset, hasSectorThemeCollection, matchesThemePreset, PRESET_SETTING_KEYS, STOREFRONT_THEME_PRESETS } from "./theme-presets";

/** Tenant sektörü yalnız doğrulanmış oturumdan alınır; istemcinin sector alanı kullanılmaz. */
export function validateSectorThemeChange(
  sector: string | null | undefined,
  existing: object,
  input: Record<string, unknown>,
): { error: string } | { body: Record<string, unknown>; curated: boolean } {
  const body = { ...input };
  const strict = hasSectorThemeCollection(sector);
  if ("theme_preset_key" in body) {
    const preset = typeof body.theme_preset_key === "string" ? getStorefrontThemePreset(body.theme_preset_key) : undefined;
    if (!preset || preset.sectorCode !== sector) return { error: "Yalnız kayıtlı sektörünüze ait temaları uygulayabilirsiniz." };
    if (strict) Object.assign(body, preset.settings);
    else for (const key of PRESET_SETTING_KEYS) {
      if (key in body) body[key] = preset.settings[key];
    }
    delete body.theme_preset_key;
  }
  const before = existing as Record<string, unknown>;
  const changed = PRESET_SETTING_KEYS.some((key) => key in body && body[key] !== before[key]);
  const candidate = { ...before, ...body };
  if (changed && STOREFRONT_THEME_PRESETS.some((p) => p.sectorCode !== sector && matchesThemePreset(candidate, p))) {
    return { error: "Yalnız kayıtlı sektörünüze ait temaları uygulayabilirsiniz." };
  }
  if (strict) {
    // Eski görünüm korunur: yalnız renk / içerik kaydetmek yeniden tema seçmeyi zorlamaz.
    if (changed && !getSectorThemePresets(sector).some((p) => matchesThemePreset({ ...before, ...body }, p))) {
      return { error: "Kayıtlı sektörünüzün temalarından birini seçin." };
    }
  }
  return { body, curated: strict && "theme_preset_key" in input };
}
