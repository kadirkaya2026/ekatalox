-- Veresiye takibi (tekel/market, kullanıcı isteği 1 Eyl 2026).
--
-- Bayi bir siparişi "veresiye verildi" işaretler (credit_marked_at), tahsil
-- edince credit_paid_at dolar — geçmiş kaybolmaz. Açık veresiye = marked
-- dolu + paid boş. Panel müşteri bazında toplar, bildirimi açık müşteriye
-- tahsilat push'u gönderir (bkz. lib/push/send-credit-reminder-push.ts).
alter table public.orders
  add column if not exists credit_marked_at timestamptz,
  add column if not exists credit_paid_at timestamptz;

-- Açık veresiye sorguları için kısmi indeks (liste + müşteri toplamı).
create index if not exists orders_open_credit_idx
  on public.orders (tenant_id, customer_id)
  where credit_marked_at is not null and credit_paid_at is null;
