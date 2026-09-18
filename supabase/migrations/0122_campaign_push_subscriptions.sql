-- Kampanya/duyuru bildirimleri: müşteri vitrindeki Kampanyalar panelinden
-- (sipariş vermeden) abone olabilir. Abonelik şifre kapısındaki erişim
-- koduna ve fiyat listesine bağlanır; bayi panelden "tüm müşterilere" ya da
-- tek bir fiyat listesine bildirim gönderir (lib/push/send-tenant-broadcast-push.ts).
--
-- kind: 'order' = takip sayfasından (sipariş durumu), 'campaign' = Kampanyalar
-- panelinden. Aynı cihaz ikisini de yaparsa endpoint tek satırdır; sipariş
-- bildirimi order_id/customer_id ile, duyuru kind ile seçildiğinden ikisi
-- birbirini bozmaz.
alter table public.push_subscriptions
  add column if not exists kind text not null default 'order',
  add column if not exists access_code_id uuid references public.access_codes(id) on delete set null,
  add column if not exists price_list_id uuid references public.price_lists(id) on delete set null;

alter table public.push_subscriptions
  drop constraint if exists push_subscriptions_kind_check;
alter table public.push_subscriptions
  add constraint push_subscriptions_kind_check check (kind in ('order', 'campaign'));

create index if not exists push_subscriptions_tenant_kind_idx
  on public.push_subscriptions (tenant_id, kind);
