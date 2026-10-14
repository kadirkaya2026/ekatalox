// Ziyaretçi analitiği biçimlendiricileri — hem sunucu (ziyaretçi detayı) hem
// istemci (rapor paneli) kullanır. "use client" dosyasından dışa aktarılan
// fonksiyon sunucu bileşeninde çağrılamaz; bu yüzden ayrı modülde.

export function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} sn`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m < 60) return rest ? `${m} dk ${rest} sn` : `${m} dk`;
  const h = Math.floor(m / 60);
  return `${h} sa ${m % 60} dk`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}
