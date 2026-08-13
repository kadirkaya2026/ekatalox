"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { StorefrontCustomerWithStats, StorefrontOrder } from "@/lib/types";

function formatCustomerTotals(totals: Record<string, number>) {
  const entries = Object.entries(totals).filter(([currency]) => currency !== "CATALOG");

  if (!entries.length) {
    return null;
  }

  return entries.map(([currency, amount]) => (
    <Badge key={currency} className="bg-emerald-50 text-emerald-700">
      {formatCurrency(amount, currency)}
    </Badge>
  ));
}

function OrderHistoryRow({ order }: { order: StorefrontOrder }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-slate-900">{order.order_number}</span>
        <span className="text-slate-500">{formatDate(order.created_at)}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-slate-600">
        <span>
          {order.currency === "CATALOG" ? "Fiyatsız katalog" : formatCurrency(order.total_amount, order.currency)}
        </span>
        <span className="text-slate-300">•</span>
        <span>{order.item_count} kalem</span>
        {order.payment_method ? (
          <>
            <span className="text-slate-300">•</span>
            <span>{order.payment_method === "cash" ? "Nakit" : "Kredi Kartı"}</span>
          </>
        ) : null}
      </div>
      {order.items.length ? (
        <ul className="mt-2 space-y-1 text-xs text-slate-500">
          {order.items.map((item, index) => (
            <li key={`${order.id}-${index}`}>
              {item.quantity}x {item.product_name}
              {item.price !== null ? ` — ${formatCurrency(item.price, item.currency)}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function CustomersManager({
  initialCustomers,
  ordersEndpointBase = "/api/tenant/customers",
}: {
  initialCustomers: StorefrontCustomerWithStats[];
  ordersEndpointBase?: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ordersByCustomer, setOrdersByCustomer] = useState<Record<string, StorefrontOrder[]>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function toggleExpand(customerId: string) {
    if (expandedId === customerId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(customerId);

    if (ordersByCustomer[customerId]) {
      return;
    }

    setLoadingId(customerId);
    try {
      const response = await fetch(`${ordersEndpointBase}/${customerId}/orders`);
      const result = await response.json();
      setOrdersByCustomer((current) => ({
        ...current,
        [customerId]: response.ok ? (result.orders as StorefrontOrder[]) : [],
      }));
    } finally {
      setLoadingId(null);
    }
  }

  if (!initialCustomers.length) {
    return (
      <Card className="p-6 text-sm text-slate-600">
        Henüz kayıtlı müşteri yok. Müşteriler WhatsApp ile sipariş verdikçe burada listelenir.
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="space-y-3">
        {initialCustomers.map((customer) => {
          const isExpanded = expandedId === customer.id;
          const totals = formatCustomerTotals(customer.totals_by_currency);

          return (
            <div key={customer.id} className="rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => toggleExpand(customer.id)}
                className="flex w-full flex-col gap-2 p-4 text-left md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-base font-semibold text-slate-900">{customer.full_name}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{customer.phone}</p>
                  <p className="mt-0.5 max-w-md truncate text-sm text-slate-400">{customer.address}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end">
                  <Badge className="bg-slate-100 text-slate-700">{customer.orders_count} sipariş</Badge>
                  <div className="flex flex-wrap gap-1.5">{totals}</div>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    Son sipariş: {formatDate(customer.last_order_at)}
                    {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </span>
                </div>
              </button>

              {isExpanded ? (
                <div className={cn("space-y-2 border-t border-slate-100 p-4")}>
                  {loadingId === customer.id ? (
                    <p className="text-sm text-slate-500">Yükleniyor...</p>
                  ) : (ordersByCustomer[customer.id]?.length ?? 0) === 0 ? (
                    <p className="text-sm text-slate-500">Sipariş geçmişi bulunamadı.</p>
                  ) : (
                    ordersByCustomer[customer.id]!.map((order) => (
                      <OrderHistoryRow key={order.id} order={order} />
                    ))
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
