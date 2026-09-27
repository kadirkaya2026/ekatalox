"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, ChevronRight, MessageCircle, Phone, Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { DealerCustomerForm, type DealerCustomerFormValues } from "@/components/dashboard/dealer-customer-form";
import Link from "next/link";
import { normalizeTrPhoneDigits } from "@/lib/kurumsal/applications";
import type { DealerCustomer } from "@/lib/kurumsal/dealer-customers";
import type { PriceList } from "@/lib/types";

// Panel → Müşteriler (toptancı, Kurumsal paket): kişiye özel şifreli bayi
// müşterileri. Onaylı başvurular buraya düşer; elle de eklenebilir. Liste
// sade satır; satıra tıklayınca müşteri sayfası (/customers/[id]) açılır.

const EMPTY: DealerCustomerFormValues = {
  customer_company: "",
  customer_name: "",
  customer_phone: "",
  customer_city: "",
  customer_address: "",
  price_list_id: "",
  password_code: "",
};

export function DealerCustomersManager({
  initialCustomers,
  priceLists,
  storefrontUrl,
}: {
  initialCustomers: DealerCustomer[];
  priceLists: PriceList[];
  storefrontUrl: string;
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return customers;
    return customers.filter((customer) =>
      [customer.customer_company, customer.customer_name, customer.customer_phone, customer.customer_city, customer.password_code]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase("tr").includes(q)),
    );
  }, [customers, query]);

  async function save(values: DealerCustomerFormValues): Promise<string | null> {
    const res = await fetch("/api/tenant/bayi-musteriler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = (await res.json().catch(() => null)) as { error?: string; accessCodeId?: string } | null;
    if (!res.ok) return result?.error ?? "Kaydedilemedi.";
    setCustomers((list) => [
      {
        id: result?.accessCodeId ?? crypto.randomUUID(),
        customer_company: values.customer_company.trim() || null,
        customer_name: values.customer_name.trim(),
        customer_phone: values.customer_phone.trim() || null,
        customer_city: values.customer_city.trim() || null,
        customer_address: values.customer_address.trim() || null,
        customer_note: null,
        price_list_id: values.price_list_id,
        price_list_name: priceLists.find((list) => list.id === values.price_list_id)?.name ?? null,
        password_code: values.password_code,
        dealer_application_id: null,
        created_at: new Date().toISOString(),
        order_count: 0,
        last_order_at: null,
        has_push: false,
      },
      ...list,
    ]);
    setAdding(false);
    if (result?.accessCodeId) router.push(`/customers/${result.accessCodeId}`);
    return null;
  }

  const waHref = (customer: DealerCustomer) =>
    customer.customer_phone
      ? `https://api.whatsapp.com/send?phone=${normalizeTrPhoneDigits(customer.customer_phone)}&text=${encodeURIComponent(
          `Merhaba ${customer.customer_name ?? ""}, kataloğumuza ${storefrontUrl} adresinden size özel şifrenizle girebilirsiniz.\nŞifreniz: ${customer.password_code}`,
        )}`
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Firma, ad, telefon, il veya şifre ara"
            className="pl-9"
          />
        </div>
        <Button onClick={() => setAdding(true)} disabled={!priceLists.length}>
          <Plus className="size-4" /> Müşteri ekle
        </Button>
      </div>

      {!customers.length ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Users className="size-6" />
          </div>
          <h2 className="text-lg font-semibold">Henüz müşteri yok</h2>
          <p className="max-w-lg text-sm leading-6 text-muted-foreground">
            Bayi Başvuruları&apos;nda bir başvuruyu onaylayıp şifre verdiğinizde müşteri buraya gelir. &quot;Müşteri ekle&quot; ile başvurusuz da
            ekleyebilirsiniz. Ortak liste şifreleriniz (Fiyat Listeleri sayfası) aynen çalışmaya devam eder.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((customer) => {
            const wa = waHref(customer);
            return (
              <Card key={customer.id} className="flex items-center gap-3 p-0 transition hover:border-emerald-300 hover:shadow-sm">
                <Link
                  href={`/customers/${customer.id}`}
                  className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3.5"
                >
                  <span className="min-w-0 truncate text-[15px] font-semibold">
                    {customer.customer_company || customer.customer_name}
                    {customer.customer_company && customer.customer_name ? (
                      <span className="font-normal text-muted-foreground"> · {customer.customer_name}</span>
                    ) : null}
                  </span>
                  {customer.has_push ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      <BellRing className="size-3" /> Bildirim açık
                    </span>
                  ) : null}
                  {customer.customer_phone ? (
                    <span className="inline-flex items-center gap-1 text-sm tabular-nums text-slate-600">
                      <Phone className="size-3.5" /> {customer.customer_phone}
                    </span>
                  ) : null}
                  <ChevronRight className="ml-auto hidden size-4 text-slate-400 sm:block" />
                </Link>
                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Şifreyi WhatsApp'tan gönder"
                    className="mr-3 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-white"
                  >
                    <MessageCircle className="size-4" /> <span className="hidden sm:inline">Şifreyi gönder</span>
                  </a>
                ) : null}
              </Card>
            );
          })}
          {!visible.length ? <p className="py-6 text-center text-sm text-muted-foreground">Aramaya uyan müşteri yok.</p> : null}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Yeni müşteri">
        {adding ? (
          <DealerCustomerForm
            priceLists={priceLists}
            submitLabel="Müşteriyi ekle"
            initial={EMPTY}
            onSubmit={save}
            onCancel={() => setAdding(false)}
          />
        ) : null}
      </Modal>
    </div>
  );
}
