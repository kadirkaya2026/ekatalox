// Alan adı talepleri: istemci bileşenlerinin de kullandığı tip ve sabitler.
// Sunucu tarafı (Supabase + nodemailer) lib/kurumsal/domain-requests.ts'de;
// istemci bundle'ına Node modülleri sızmasın diye ayrıldı.

// Akış (0136): new → purchasing → purchased; cancelled yalnız süper adminden
// (müşteri arayıp isterse). İptal edilen talep admin listesinden düşer ve
// tenant panelinde alan adı seçim ekranı yeniden açılır.
export const DOMAIN_REQUEST_STATUSES = ["new", "purchasing", "purchased", "cancelled"] as const;
export type DomainRequestStatus = (typeof DOMAIN_REQUEST_STATUSES)[number];

/** Süper admin etiketi */
export const DOMAIN_REQUEST_STATUS_LABELS: Record<DomainRequestStatus, string> = {
  new: "Bekliyor",
  purchasing: "Satın alınıyor",
  purchased: "Satın alındı",
  cancelled: "İptal",
};

/** Tenant panelinde bekleyen kartın başlığı ve açıklaması (iptal gösterilmez). */
export const DOMAIN_REQUEST_TENANT_TEXT: Record<Exclude<DomainRequestStatus, "cancelled">, { title: string; body: string }> = {
  new: {
    title: "Talebiniz alındı",
    body: "Ekibimiz alan adını sizin için satın alacak; durum burada güncellenir.",
  },
  purchasing: {
    title: "Alan adınız satın alınıyor",
    body: "Satın alma işlemi başladı; tamamlanınca bağlantı yapılır ve burada \"Bağlandı\" görünür.",
  },
  purchased: {
    title: "Alan adınız satın alındı",
    body: "Şimdi kurumsal sitenize bağlanıyor; tamamlanınca burada \"Bağlandı\" görünür.",
  },
};

export interface DomainRequest {
  id: string;
  tenant_id: string;
  domain: string;
  price_usd: number | null;
  period_years: number | null;
  status: DomainRequestStatus;
  note: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface AdminDomainRequest extends DomainRequest {
  tenant: { company_name: string; subdomain: string; plan: string } | null;
}
