import type { OrderStatus } from "@/lib/types";
import type { SalesBucket, SalesPreset } from "@/lib/sales/presets";

export interface SalesSeriesPoint {
  bucketStart: string;
  orderCount: number;
  deliveredCount: number;
  cancelledCount: number;
  pendingCount: number;
  revenue: number;
  cost: number;
  profit: number;
  costMissingOrders: number;
  avgBasket: number;
}

export interface SalesTopProduct {
  productKey: string;
  productName: string;
  skuCode: string | null;
  quantity: number;
  revenue: number;
  cost: number | null;
  profit: number | null;
  costMissing: boolean;
  orderCount: number;
}

export interface SalesCurrencyReport {
  currency: string;
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number | null;
  deliveredCount: number;
  pendingCount: number;
  pendingAmount: number;
  cancelledCount: number;
  totalCount: number;
  byStatus: Record<OrderStatus, number>;
  avgBasket: number;
  cancelRatePct: number | null;
  costMissingOrders: number;
  payment: {
    cash: { count: number; amount: number };
    card: { count: number; amount: number };
    unknown: { count: number; amount: number };
  };
  series: SalesSeriesPoint[];
  topProducts: SalesTopProduct[];
}

export interface SalesReport {
  range: { from: string; to: string; bucket: SalesBucket; preset?: SalesPreset };
  currencies: SalesCurrencyReport[];
  catalogOrderCount: number;
  costMissingProductCount: number;
  generatedAt: string;
}
