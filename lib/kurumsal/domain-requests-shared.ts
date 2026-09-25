// Alan adı talepleri: istemci bileşenlerinin de kullandığı tip ve sabitler.
// Sunucu tarafı (Supabase + nodemailer) lib/kurumsal/domain-requests.ts'de;
// istemci bundle'ına Node modülleri sızmasın diye ayrıldı.

export const DOMAIN_REQUEST_STATUSES = ["new", "purchased", "cancelled"] as const;
export type DomainRequestStatus = (typeof DOMAIN_REQUEST_STATUSES)[number];

export const DOMAIN_REQUEST_STATUS_LABELS: Record<DomainRequestStatus, string> = {
  new: "Bekliyor",
  purchased: "Satın alındı",
  cancelled: "İptal",
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
