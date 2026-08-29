import { computeCouponDiscount } from "@/lib/coupons/shared";
import {
  defaultCurrencyCode,
  supportedCurrencyCodes,
  type CurrencyCode,
} from "@/lib/products/constants";
import type { CartItem, CashDiscountTier, CardCampaignTier, InstallmentOption, TenantCampaign, StorefrontCoupon } from "@/lib/types";

export function getCartTotal(items: CartItem[]) {
  return items.reduce((total, item) => total + (item.price ?? 0) * item.quantity, 0);
}

export function getCartTotalsByCurrency(items: CartItem[]) {
  return items.reduce<Partial<Record<CurrencyCode, number>>>((totals, item) => {
    totals[item.currency] = (totals[item.currency] ?? 0) + (item.price ?? 0) * item.quantity;
    return totals;
  }, {});
}

export function getCartCurrency(items: CartItem[]) {
  return items[0]?.currency ?? defaultCurrencyCode;
}

// ─── Installment defaults ─────────────────────────────────────────────────────

export const DEFAULT_INSTALLMENT_OPTIONS: InstallmentOption[] = [
  { count: 1,  label: "Peşin",     isActive: true,  surchargePercentage: 0 },
  { count: 2,  label: "2 Taksit",  isActive: false, surchargePercentage: 0 },
  { count: 3,  label: "3 Taksit",  isActive: false, surchargePercentage: 0 },
  { count: 4,  label: "4 Taksit",  isActive: false, surchargePercentage: 0 },
  { count: 5,  label: "5 Taksit",  isActive: false, surchargePercentage: 0 },
  { count: 6,  label: "6 Taksit",  isActive: false, surchargePercentage: 0 },
  { count: 7,  label: "7 Taksit",  isActive: false, surchargePercentage: 0 },
  { count: 8,  label: "8 Taksit",  isActive: false, surchargePercentage: 0 },
  { count: 9,  label: "9 Taksit",  isActive: false, surchargePercentage: 0 },
  { count: 10, label: "10 Taksit", isActive: false, surchargePercentage: 0 },
  { count: 11, label: "11 Taksit", isActive: false, surchargePercentage: 0 },
  { count: 12, label: "12 Taksit", isActive: false, surchargePercentage: 0 },
];

// ─── Config interfaces ────────────────────────────────────────────────────────

/** Nakit iskonto tiered config */
export interface CashTieredConfig {
  tiers: CashDiscountTier[];
  isActive: boolean;
}

/** Kart 0-komisyon tiered config */
export interface CardTieredConfig {
  tiers: CardCampaignTier[];
  isActive: boolean;
}

// Backward-compat — hâlâ kullanılabilir
export interface CartDiscountConfig {
  threshold: number;
  percentage: number;
  isActive: boolean;
  conditionNote?: string | null;
}

/** Full summary combining discount + installment surcharge */
export interface CartPaymentSummary {
  currency: CurrencyCode;
  paymentMethod: "cash" | "card";
  subtotal: number;
  discountThreshold: number;
  isQualified: boolean;
  remainingAmount: number;
  discountPercentage: number;
  discountAmount: number;
  afterDiscount: number;
  selectedInstallment: InstallmentOption | null;
  surchargePercentage: number;
  surchargeAmount: number;
  finalTotal: number;
  zeroCommissionApplied: boolean;
  /** Hangi nakit tier uygulandı */
  appliedCashTier: CashDiscountTier | null;
  /** Hangi kart tier uygulandı */
  appliedCardTier: CardCampaignTier | null;
  /** Bayinin kendi kampanyalarından uygulanan (varsa) — bkz. getBestCampaignDiscount */
  appliedCampaign: TenantCampaign | null;
  campaignDiscountAmount: number;
  /** Müşteriye özel kupon (telefona bağlı, 0097) */
  appliedCoupon: StorefrontCoupon | null;
  couponDiscountAmount: number;
  /** Kupon var ama minimum sepet tutmuyor: eksik tutar */
  couponMissingAmount: number;
}

// ─── Tier seçim helpers ────────────────────────────────────────────────────────

function getBestCashTier(tiers: CashDiscountTier[], subtotal: number): CashDiscountTier | null {
  return (
    tiers
      .filter((t) => t.threshold > 0 && t.percentage > 0 && subtotal >= t.threshold)
      .sort((a, b) => b.threshold - a.threshold)[0] ?? null
  );
}

export function getNextCashTier(
  tiers: CashDiscountTier[],
  subtotal: number,
): CashDiscountTier | null {
  return (
    tiers
      .filter((t) => t.threshold > 0 && t.percentage > 0 && subtotal < t.threshold)
      .sort((a, b) => a.threshold - b.threshold)[0] ?? null
  );
}

function getBestCardTier(tiers: CardCampaignTier[], subtotal: number): CardCampaignTier | null {
  return (
    tiers
      .filter((t) => t.threshold > 0 && subtotal >= t.threshold)
      .sort((a, b) => b.threshold - a.threshold)[0] ?? null
  );
}

export function getNextCardTier(
  tiers: CardCampaignTier[],
  subtotal: number,
): CardCampaignTier | null {
  return (
    tiers
      .filter((t) => t.threshold > 0 && subtotal < t.threshold)
      .sort((a, b) => a.threshold - b.threshold)[0] ?? null
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roundCurrencyAmount(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatDiscountPercentage(value: number) {
  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

// ─── Bayi kampanyaları ────────────────────────────────────────────────────────

export interface CampaignDiscountCandidate {
  campaign: TenantCampaign;
  /** Bu kampanya uygulanırsa sepetten düşecek tutar */
  amount: number;
}

export interface CampaignDiscountStatus {
  currency: CurrencyCode;
  subtotal: number;
  /** Şu an gerçekten uygulanan kampanya (en avantajlısı) */
  applied: CampaignDiscountCandidate | null;
  /**
   * Eşiği tutan ama ödeme yöntemi henüz seçilmediği/uyuşmadığı için
   * uygulanmayanlar. "Nakit ödemede 100 TL indirim kazanırsınız" ipucu için.
   */
  potential: CampaignDiscountCandidate[];
  /**
   * Eşiği tutmayanların içinde en yakını — "X TL daha ekle" için.
   * Uygulanandan daha fazla indirim getirecek olanlar arasından seçilir,
   * yoksa null (zaten en iyisi uygulanıyorsa yukarı satış anlamsız).
   */
  nextTarget: { campaign: TenantCampaign; amount: number; remaining: number } | null;
}

/**
 * Kampanyaya SAYILAN sepet tutarı.
 *
 * Bayi bazı kategorileri kampanya dışında bırakabiliyor (kullanıcı isteği,
 * 22 Ağu 2026): "1.000 TL'ye 100 TL indirim ama sigara sayılmasın". Bu
 * durumda 900 TL market + 600 TL sigara alan müşteride eşik TUTMAZ, çünkü
 * uygun tutar 900 TL.
 *
 * excludedByCampaign: kampanya id -> hariç kategori id kümesi. Alt
 * kategoriler ÇAĞIRAN TARAFTA genişletiliyor (kategori ağacı burada yok);
 * verilmezse hiçbir kategori hariç tutulmaz ve eski davranış korunur.
 */
export function getCampaignEligibleSubtotal(
  items: CartItem[],
  campaign: TenantCampaign,
  excludedByCampaign?: Map<string, Set<string>>,
) {
  const haric = excludedByCampaign?.get(campaign.id);

  const toplam = items.reduce((tutar, item) => {
    if (haric?.size && item.category_id && haric.has(item.category_id)) {
      return tutar;
    }
    return tutar + (item.price ?? 0) * item.quantity;
  }, 0);

  return roundCurrencyAmount(toplam);
}

/** Kampanyanın bu sepette getireceği indirim (eşiği tutmazsa 0). */
export function getCampaignDiscountAmount(
  campaign: TenantCampaign,
  items: CartItem[],
  excludedByCampaign?: Map<string, Set<string>>,
) {
  if (campaign.rule_type !== "cart_threshold") return 0;
  if (campaign.discount_value === null || campaign.min_cart_amount === null) return 0;

  const uygunTutar = getCampaignEligibleSubtotal(items, campaign, excludedByCampaign);
  if (uygunTutar < campaign.min_cart_amount) return 0;

  // Yüzde indirim de UYGUN TUTAR üzerinden hesaplanıyor: eşiğe saymadığımız
  // ürünün üzerinden indirim vermek tutarsız olurdu.
  const raw =
    campaign.discount_kind === "percentage"
      ? (uygunTutar * campaign.discount_value) / 100
      : campaign.discount_value;

  // İndirim uygun tutardan büyük olamaz.
  return roundCurrencyAmount(Math.min(raw, uygunTutar));
}

/** Kampanya eşiği tutmasa da getireceği indirim — "X TL daha ekle" hesabı için. */
function getCampaignDiscountAtThreshold(campaign: TenantCampaign) {
  if (campaign.rule_type !== "cart_threshold") return 0;
  if (campaign.discount_value === null || campaign.min_cart_amount === null) return 0;

  return roundCurrencyAmount(
    campaign.discount_kind === "percentage"
      ? (campaign.min_cart_amount * campaign.discount_value) / 100
      : campaign.discount_value,
  );
}

function campaignAppliesToPaymentMethod(
  campaign: TenantCampaign,
  paymentMethod: "cash" | "card" | null,
) {
  if (campaign.payment_method === "any") return true;
  // Ödeme yöntemi henüz seçilmediyse yönteme bağlı kampanya uygulanamaz;
  // sadece "kazanabilirsiniz" ipucu olarak gösterilir.
  return campaign.payment_method === paymentMethod;
}

/**
 * Uygulanabilir kampanyalardan EN AVANTAJLISINI seçer (kullanıcı kararı,
 * 21 Ağu 2026): birden fazla kural aynı anda tutsa bile indirimler
 * toplanmaz, en çok indirim getiren tek kampanya uygulanır. Eşitlikte
 * display_order küçük olan kazanır.
 *
 * Tarih penceresi burada kontrol edilmiyor — süresi geçmiş kampanyalar
 * sunucuda (getStorefrontCampaigns) zaten süzülüyor.
 */
export function getCampaignDiscountStatus(
  items: CartItem[],
  campaigns: TenantCampaign[],
  paymentMethod: "cash" | "card" | null,
  /** kampanya id -> hariç kategori id kümesi (alt kategoriler genişletilmiş) */
  excludedByCampaign?: Map<string, Set<string>>,
): CampaignDiscountStatus | null {
  if (!items.length) return null;

  const totalsByCurrency = getCartTotalsByCurrency(items);
  const currencies = Object.entries(totalsByCurrency).filter(
    (entry): entry is [CurrencyCode, number] => typeof entry[1] === "number",
  );
  if (currencies.length !== 1) return null;

  const [currency, subtotal] = currencies[0];
  const rounded = roundCurrencyAmount(subtotal);

  const rules = campaigns.filter((campaign) => campaign.rule_type === "cart_threshold");
  if (!rules.length) return null;

  const byBestDiscount = (a: CampaignDiscountCandidate, b: CampaignDiscountCandidate) =>
    b.amount - a.amount || a.campaign.display_order - b.campaign.display_order;

  const qualified = rules
    .map((campaign) => ({
      campaign,
      amount: getCampaignDiscountAmount(campaign, items, excludedByCampaign),
    }))
    .filter((entry) => entry.amount > 0);

  const applied =
    qualified
      .filter((entry) => campaignAppliesToPaymentMethod(entry.campaign, paymentMethod))
      .sort(byBestDiscount)[0] ?? null;

  const potential = qualified
    .filter((entry) => !campaignAppliesToPaymentMethod(entry.campaign, paymentMethod))
    .sort(byBestDiscount);

  // "X TL daha ekle" kalan tutarı da UYGUN TUTAR üzerinden: hariç kategoriler
  // eşiğe saymadığı için sepet toplamına göre hesaplarsak müşteriye yanlış
  // rakam gösterir (sigarayı da sayıp "200 TL kaldı" der, oysa 800 TL kalmış).
  const nextTarget =
    rules
      .filter((campaign) => {
        if (campaign.min_cart_amount === null) return false;
        const uygun = getCampaignEligibleSubtotal(items, campaign, excludedByCampaign);
        if (uygun >= campaign.min_cart_amount) return false;
        // Zaten uygulanandan daha iyisini vaat etmiyorsa yukarı satış anlamsız.
        return getCampaignDiscountAtThreshold(campaign) > (applied?.amount ?? 0);
      })
      .map((campaign) => ({
        campaign,
        amount: getCampaignDiscountAtThreshold(campaign),
        remaining: roundCurrencyAmount(
          campaign.min_cart_amount! -
            getCampaignEligibleSubtotal(items, campaign, excludedByCampaign),
        ),
      }))
      .sort((a, b) => a.remaining - b.remaining || a.campaign.display_order - b.campaign.display_order)[0] ??
    null;

  return { currency, subtotal: rounded, applied, potential, nextTarget };
}

// ─── Core calculation ─────────────────────────────────────────────────────────

export function getCartPaymentSummary(
  items: CartItem[],
  paymentMethod: "cash" | "card",
  cashConfig: CashTieredConfig | null,
  cardConfig: CardTieredConfig | null,
  selectedInstallment: InstallmentOption | null,
  campaigns: TenantCampaign[] = [],
  excludedByCampaign?: Map<string, Set<string>>,
  coupon: StorefrontCoupon | null = null,
): CartPaymentSummary | null {
  if (!items.length) return null;

  const totalsByCurrency = getCartTotalsByCurrency(items);
  const currencies = Object.entries(totalsByCurrency).filter(
    (entry): entry is [CurrencyCode, number] => typeof entry[1] === "number",
  );
  if (currencies.length !== 1) return null;

  const [currency, subtotal] = currencies[0];
  const roundedSubtotal = roundCurrencyAmount(subtotal);

  // ── Nakit ──
  const appliedCashTier =
    paymentMethod === "cash" && cashConfig?.isActive && (cashConfig.tiers?.length ?? 0) > 0
      ? getBestCashTier(cashConfig.tiers, roundedSubtotal)
      : null;

  const discountThreshold = appliedCashTier?.threshold ?? 0;
  const isQualified = appliedCashTier !== null;
  const discountPercentage = appliedCashTier?.percentage ?? 0;
  const discountAmount =
    discountPercentage > 0
      ? roundCurrencyAmount((roundedSubtotal * discountPercentage) / 100)
      : 0;
  // ── Bayi kampanyası ──
  // Eski nakit basamağıyla üst üste binebilir (kullanıcı kararı: eski
  // sistem dursun, bağımsız çalışsın). Pratikte hiçbir bayide nakit
  // basamağı açık değil, o yüzden teorik bir durum.
  const campaignStatus = getCampaignDiscountStatus(
    items,
    campaigns,
    paymentMethod,
    excludedByCampaign,
  );
  const appliedCampaign = campaignStatus?.applied?.campaign ?? null;
  const campaignDiscountAmount = campaignStatus?.applied?.amount ?? 0;

  // ── Müşteriye özel kupon ── (kampanya/nakit indiriminden sonra, kart
  // vade farkından önce; ara toplam üzerinden hesaplanır)
  const couponResult = computeCouponDiscount(coupon, items, currency);
  const couponDiscountAmount = couponResult.eligible
    ? roundCurrencyAmount(Math.min(couponResult.amount, Math.max(roundedSubtotal - discountAmount - campaignDiscountAmount, 0)))
    : 0;

  const afterDiscount = roundCurrencyAmount(
    Math.max(roundedSubtotal - discountAmount - campaignDiscountAmount - couponDiscountAmount, 0),
  );

  // ── Kart ──
  const appliedCardTier =
    paymentMethod === "card" && cardConfig?.isActive && (cardConfig.tiers?.length ?? 0) > 0
      ? getBestCardTier(cardConfig.tiers, roundedSubtotal)
      : null;

  const zeroCommissionApplied =
    paymentMethod === "card" &&
    appliedCardTier !== null &&
    selectedInstallment !== null &&
    selectedInstallment.count <= appliedCardTier.maxFreeInstallmentCount;

  const surchargePercentage = zeroCommissionApplied
    ? 0
    : paymentMethod === "card"
      ? (selectedInstallment?.surchargePercentage ?? 0)
      : 0;

  const finalTotal =
    surchargePercentage > 0
      ? roundCurrencyAmount(afterDiscount / (1 - surchargePercentage / 100))
      : afterDiscount;
  const surchargeAmount = roundCurrencyAmount(finalTotal - afterDiscount);

  const remainingForNextCashTier =
    paymentMethod === "cash" && cashConfig?.isActive
      ? roundCurrencyAmount(
          Math.max((getNextCashTier(cashConfig.tiers ?? [], roundedSubtotal)?.threshold ?? 0) - roundedSubtotal, 0),
        )
      : 0;

  return {
    currency,
    paymentMethod,
    subtotal: roundedSubtotal,
    discountThreshold,
    isQualified,
    remainingAmount:
      paymentMethod === "cash"
        ? remainingForNextCashTier
        : roundCurrencyAmount(
            Math.max((appliedCardTier?.threshold ?? cardConfig?.tiers?.[0]?.threshold ?? 0) - roundedSubtotal, 0),
          ),
    discountPercentage,
    discountAmount,
    afterDiscount,
    selectedInstallment,
    surchargePercentage,
    surchargeAmount,
    finalTotal,
    zeroCommissionApplied,
    appliedCashTier,
    appliedCardTier,
    appliedCampaign,
    campaignDiscountAmount,
    appliedCoupon: couponDiscountAmount > 0 ? coupon : null,
    couponDiscountAmount,
    couponMissingAmount: coupon && !couponResult.eligible ? couponResult.missing : 0,
  };
}

/** Kart kampanyası upsell bar — ödeme yöntemi seçilmeden önce de gösterilir */
export interface CartCardCampaignStatus {
  currency: CurrencyCode;
  subtotal: number;
  isQualified: boolean;
  /** Ulaşılan en iyi tier */
  appliedTier: CardCampaignTier | null;
  /** Bir sonraki tier */
  nextTier: CardCampaignTier | null;
  /** Sonraki tiere kalan tutar */
  remainingAmount: number;
}

export function getCartCardCampaignStatus(
  items: CartItem[],
  config: CardTieredConfig,
): CartCardCampaignStatus | null {
  if (!items.length || !config.isActive || !config.tiers?.length) return null;

  const totalsByCurrency = getCartTotalsByCurrency(items);
  const currencies = Object.entries(totalsByCurrency).filter(
    (entry): entry is [CurrencyCode, number] => typeof entry[1] === "number",
  );
  if (currencies.length !== 1) return null;

  const [currency, subtotal] = currencies[0];
  const rounded = roundCurrencyAmount(subtotal);

  const appliedTier = getBestCardTier(config.tiers, rounded);
  const nextTier = getNextCardTier(config.tiers, rounded);

  return {
    currency,
    subtotal: rounded,
    isQualified: appliedTier !== null,
    appliedTier,
    nextTier,
    remainingAmount: roundCurrencyAmount(Math.max((nextTier?.threshold ?? 0) - rounded, 0)),
  };
}

/** Nakit kampanyası upsell bar — taksit yok, sadece iskonto özeti */
export interface CartDiscountSummary {
  currency: CurrencyCode;
  subtotal: number;
  isQualified: boolean;
  /** Ulaşılan en iyi tier */
  appliedTier: CashDiscountTier | null;
  /** Bir sonraki tier */
  nextTier: CashDiscountTier | null;
  /** Backward compat */
  threshold: number;
  percentage: number;
  remainingAmount: number;
  discountAmount: number;
  totalAfterDiscount: number;
}

export function getCartDiscountSummary(
  items: CartItem[],
  config?: CashTieredConfig | null,
): CartDiscountSummary | null {
  if (!items.length || !config?.isActive || !config.tiers?.length) return null;

  const totalsByCurrency = getCartTotalsByCurrency(items);
  const currencies = Object.entries(totalsByCurrency).filter(
    (entry): entry is [CurrencyCode, number] => typeof entry[1] === "number",
  );
  if (currencies.length !== 1) return null;

  const [currency, subtotal] = currencies[0];
  const rounded = roundCurrencyAmount(subtotal);

  const appliedTier = getBestCashTier(config.tiers, rounded);
  const nextTier = getNextCashTier(config.tiers, rounded);

  const percentage = appliedTier?.percentage ?? 0;
  const threshold = appliedTier?.threshold ?? nextTier?.threshold ?? 0;
  const discountAmount =
    appliedTier
      ? roundCurrencyAmount((rounded * appliedTier.percentage) / 100)
      : 0;

  return {
    currency,
    subtotal: rounded,
    isQualified: appliedTier !== null,
    appliedTier,
    nextTier,
    threshold,
    percentage,
    remainingAmount: roundCurrencyAmount(Math.max((nextTier?.threshold ?? 0) - rounded, 0)),
    discountAmount,
    totalAfterDiscount: roundCurrencyAmount(rounded - discountAmount),
  };
}

export function buildAppliedCampaignBenefitNotes(summary: CartPaymentSummary): string[] {
  const notes: string[] = [];
  const thresholdLabel = `${summary.discountThreshold} ${summary.currency}`;

  if (summary.paymentMethod === "cash" && summary.appliedCashTier && summary.discountAmount > 0) {
    notes.push(
      `${thresholdLabel} ve üzerine nakit alıma %${formatDiscountPercentage(summary.discountPercentage)} iskonto kampanyasından faydalanılmıştır.`,
    );
  }

  if (
    summary.paymentMethod === "card" &&
    summary.zeroCommissionApplied &&
    summary.appliedCardTier
  ) {
    notes.push(
      `${summary.appliedCardTier.threshold} ${summary.currency} ve üzerine kart ile ${summary.appliedCardTier.maxFreeInstallmentCount} taksite kadar 0 komisyon kampanyasından faydalanılmıştır.`,
    );
  }

  // Bayinin kendi kampanyası — WhatsApp mesajı ve sipariş PDF'i bu notları
  // kullandığı için indirim burada da yazılı kalıyor.
  if (summary.appliedCoupon && summary.couponDiscountAmount > 0) {
    notes.push(`Size özel kupon uygulanmıştır: -${summary.couponDiscountAmount} ${summary.currency} (${summary.appliedCoupon.title}).`);
  }

  if (summary.appliedCampaign && summary.campaignDiscountAmount > 0) {
    const campaign = summary.appliedCampaign;
    const benefit =
      campaign.discount_kind === "percentage"
        ? `%${formatDiscountPercentage(campaign.discount_value ?? 0)}`
        : `${campaign.discount_value} ${summary.currency}`;

    notes.push(
      `${campaign.min_cart_amount} ${summary.currency} ve üzeri alışverişte ${benefit} indirim ("${campaign.title}") kampanyasından faydalanılmıştır.`,
    );
  }

  return notes;
}

// ─── WhatsApp message builder ─────────────────────────────────────────────────

export function buildWhatsAppMessage(params: {
  tenantName: string;
  customerReferenceName: string;
  customerAddress?: string;
  customerPhone?: string;
  pdfUrl?: string | null;
  trackingUrl?: string | null;
  // Alkol/sigara bayii (tekel) tenant'lar yasal olarak dağıtım/teslimat
  // yapamaz — bu mesaj adres satırı içermemeli, bunun yerine ürünün
  // mağazadan elden teslim alınacağını açıkça belirten bir ibare taşımalı
  // (kullanıcı isteği, 20 Ağu 2026). Bu, hem "adres istemedik" savunmasını
  // hem de her siparişte WhatsApp geçmişinde kayıtlı bir "elden teslim"
  // beyanını sağlar.
  isTekel?: boolean;
}) {
  const lines = [
    `Merhaba, ${params.tenantName} için sipariş oluşturmak istiyorum`,
    `👤 Müşteri/cari : ${params.customerReferenceName.trim()}`,
  ];

  if (!params.isTekel && params.customerAddress?.trim()) {
    lines.push(`📍 Adres : ${params.customerAddress.trim()}`);
  }

  if (params.customerPhone?.trim()) {
    lines.push(`📞 Telefon : ${params.customerPhone.trim()}`);
  }

  if (params.pdfUrl?.trim()) {
    lines.push(`📄 Sipariş Fişi : ${params.pdfUrl.trim()}`);
  }

  // Takip linki mesaja YAZILMIYOR (kullanıcı kararı, 29 Ağu 2026): müşteri
  // vitrindeki "Sipariş Takip" ikonundan numarasıyla ulaşıyor; mesaj kısa kalsın.
  // trackingUrl parametresi geriye dönük uyumluluk için duruyor.
  if (params.isTekel) {
    lines.push(`🏪 Bu sipariş mağazadan elden teslim alınacaktır. Kargo/gönderi yapılmamaktadır.`);
  }

  return lines.join("\n");
}

export function getCartVariantCount(items: CartItem[], productId: string) {
  return new Set(
    items
      .filter((item) => item.product_id === productId && item.variant_id)
      .map((item) => item.variant_id),
  ).size;
}

export function updateCartLineQuantity(
  items: CartItem[],
  lineId: string,
  nextQuantity: number,
) {
  if (nextQuantity <= 0) {
    return items.filter((item) => item.id !== lineId);
  }

  return items.map((item) =>
    item.id === lineId
      ? {
          ...item,
          quantity: nextQuantity,
          sales_unit: "adet" as const,
          unit_quantity: nextQuantity,
        }
      : item,
  );
}
