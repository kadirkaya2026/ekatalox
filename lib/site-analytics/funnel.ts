// Sabit olay adları; form değerleri ve kişisel bilgiler gönderilmez.
export const FUNNEL_EVENTS = [
  "demo_open", "signup_cta", "signup_start", "signup_business_complete",
  "signup_whatsapp_complete", "signup_submit", "signup_error", "signup_complete",
] as const;
export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];
export const FUNNEL_LABELS: Record<FunnelEvent, string> = {
  demo_open: "Demo açma", signup_cta: "Başvuruya geçiş", signup_start: "Formu doldurmaya başlayan",
  signup_business_complete: "İşletme adımını geçen", signup_whatsapp_complete: "WhatsApp adımını geçen",
  signup_submit: "Kaydı gönderen", signup_error: "Kayıt hatası yaşayan", signup_complete: "Kaydı tamamlayan",
};
export const FUNNEL_SIGNAL = "ekatalox:funnel";
export function trackFunnel(event: FunnelEvent, plan?: string) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(FUNNEL_SIGNAL, { detail: { event, plan } }));
  } catch { /* Ölçüm kayıt işlemini engellemez. */ }
}
