"use client";

import { useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/products/constants";
import type { StorefrontCustomerWithStats, StorefrontOrder } from "@/lib/types";

function formatOrderTotal(order: StorefrontOrder) {
  return order.currency === "CATALOG"
    ? "Fiyatsız katalog"
    : formatCurrency(order.total_amount, order.currency as CurrencyCode);
}

function formatCustomerTotals(totals: Record<string, number>) {
  const entries = Object.entries(totals).filter(([currency]) => currency !== "CATALOG");
  if (!entries.length) {
    return null;
  }

  return entries.map(([currency, amount]) => formatCurrency(amount, currency as CurrencyCode)).join(" + ");
}

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
    >
      <ArrowLeft className="size-4" />
      {label}
    </button>
  );
}

function OrderDetailView({ order, onBack }: { order: StorefrontOrder; onBack: () => void }) {
  return (
    <div>
      <BackButton label="Siparişlere dön" onClick={onBack} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">{order.order_number}</h3>
        <span className="text-sm text-slate-500">{formatDate(order.created_at)}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span className="font-semibold text-slate-900">{formatOrderTotal(order)}</span>
        {order.payment_method ? (
          <>
            <span className="text-slate-300">•</span>
            <span>{order.payment_method === "cash" ? "Nakit" : "Kredi Kartı"}</span>
          </>
        ) : null}
      </div>

      {order.note ? (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Not: </span>
          {order.note}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        {order.items.map((item, index) => (
          <div
            key={`${order.id}-${index}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm"
          >
            <div>
              <p className="font-medium text-slate-900">{item.product_name}</p>
              <p className="text-slate-500">{item.quantity} adet</p>
            </div>
            {item.price !== null ? (
              <p className="font-medium text-slate-700">
                {formatCurrency(item.price * item.quantity, item.currency as CurrencyCode)}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerOrdersView({
  customer,
  orders,
  loading,
  onBack,
  onSelectOrder,
}: {
  customer: StorefrontCustomerWithStats;
  orders: StorefrontOrder[] | undefined;
  loading: boolean;
  onBack: () => void;
  onSelectOrder: (order: StorefrontOrder) => void;
}) {
  return (
    <div>
      <BackButton label="Müşterilere dön" onClick={onBack} />

      <div>
        <h3 className="text-base font-semibold text-slate-900">{customer.full_name}</h3>
        <p className="text-sm text-slate-500">{customer.phone}</p>
        <p className="mt-0.5 text-sm text-slate-400">{customer.address}</p>
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-slate-500">Yükleniyor...</p>
        ) : !orders?.length ? (
          <p className="text-sm text-slate-500">Sipariş geçmişi bulunamadı.</p>
        ) : (
          orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => onSelectOrder(order)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left text-sm hover:border-slate-200 hover:bg-white"
            >
              <div>
                <p className="font-medium text-slate-900">{order.order_number}</p>
                <p className="mt-0.5 text-slate-500">
                  {formatDate(order.created_at)} • {order.item_count} kalem
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">{formatOrderTotal(order)}</span>
                <ChevronRight className="size-4 text-slate-400" />
              </div>
            </button>
          ))
        )}
      </div>
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
  const [selectedCustomer, setSelectedCustomer] = useState<StorefrontCustomerWithStats | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<StorefrontOrder | null>(null);
  const [ordersByCustomer, setOrdersByCustomer] = useState<Record<string, StorefrontOrder[]>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function openCustomer(customer: StorefrontCustomerWithStats) {
    setSelectedCustomer(customer);
    setSelectedOrder(null);

    if (ordersByCustomer[customer.id]) {
      return;
    }

    setLoadingId(customer.id);
    try {
      const response = await fetch(`${ordersEndpointBase}/${customer.id}/orders`);
      const result = await response.json();
      setOrdersByCustomer((current) => ({
        ...current,
        [customer.id]: response.ok ? (result.orders as StorefrontOrder[]) : [],
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
      {selectedOrder ? (
        <OrderDetailView order={selectedOrder} onBack={() => setSelectedOrder(null)} />
      ) : selectedCustomer ? (
        <CustomerOrdersView
          customer={selectedCustomer}
          orders={ordersByCustomer[selectedCustomer.id]}
          loading={loadingId === selectedCustomer.id}
          onBack={() => setSelectedCustomer(null)}
          onSelectOrder={setSelectedOrder}
        />
      ) : (
        <div className="space-y-2">
          {initialCustomers.map((customer) => {
            const totalsLabel = formatCustomerTotals(customer.totals_by_currency);

            return (
              <button
                key={customer.id}
                type="button"
                onClick={() => openCustomer(customer)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3 text-left hover:border-slate-200 hover:bg-slate-50"
              >
                <div>
                  <p className="text-base font-semibold text-slate-900">{customer.full_name}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{customer.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <Badge className="bg-slate-100 text-slate-700">{customer.orders_count} sipariş</Badge>
                    {totalsLabel ? <p className="mt-1 text-xs text-slate-500">{totalsLabel}</p> : null}
                  </div>
                  <ChevronRight className="size-4 text-slate-400" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
