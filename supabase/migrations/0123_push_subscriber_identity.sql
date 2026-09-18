-- Kampanya bildirimi aboneliğinde müşteri kimliği: vitrindeki bildirim
-- kartı ad soyad + telefon ister (herkese aynı şifreyi veren bayide şifre
-- kimlik olmadığı için). Telefon mevcut bir customers kaydıyla eşleşirse
-- customer_id de bağlanır; eşleşmezse sahte müşteri kaydı AÇILMAZ, bilgi
-- burada durur. Bayi panelinde kişi seçip bildirim gönderilir.
alter table public.push_subscriptions
  add column if not exists subscriber_name text,
  add column if not exists subscriber_phone text;
