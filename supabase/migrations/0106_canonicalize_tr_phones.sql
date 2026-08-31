-- TR telefonlarını tek biçime çevirir: 0090 5xx / 90 5xx / 5xx → 05xxxxxxxxx.
-- normalizeCustomerPhone (lib/storefront/customer-phone.ts) artık bu kanonik
-- biçimi üretiyor; eski kayıtlar da hizalanmazsa telefonla otomatik doldurma,
-- Siparişlerim ve telefon engeli eski siparişleri bulamazdı.
--
-- customers ve blocked_customer_phones'ta (tenant_id, phone) benzersiz —
-- kanonik hali zaten var olan satırlara DOKUNULMAZ (çakışma yaratmamak için;
-- mükerrer müşteri birleştirme ayrı bir iş). orders.customer_phone serbest.

-- customers: 905xxxxxxxxx → 05xxxxxxxxx
update public.customers c
   set phone = '0' || substr(phone, 3)
 where phone ~ '^905[0-9]{9}$'
   and not exists (
     select 1 from public.customers c2
      where c2.tenant_id = c.tenant_id and c2.phone = '0' || substr(c.phone, 3)
   );

-- customers: 5xxxxxxxxx → 05xxxxxxxxx
update public.customers c
   set phone = '0' || phone
 where phone ~ '^5[0-9]{9}$'
   and not exists (
     select 1 from public.customers c2
      where c2.tenant_id = c.tenant_id and c2.phone = '0' || c.phone
   );

-- customers: 00905xxxxxxxxx → 05xxxxxxxxx
update public.customers c
   set phone = '0' || substr(phone, 5)
 where phone ~ '^00905[0-9]{9}$'
   and not exists (
     select 1 from public.customers c2
      where c2.tenant_id = c.tenant_id and c2.phone = '0' || substr(c.phone, 5)
   );

-- orders: benzersizlik yok, tek geçişte hepsi
update public.orders
   set customer_phone = case
     when customer_phone ~ '^00905[0-9]{9}$' then '0' || substr(customer_phone, 5)
     when customer_phone ~ '^905[0-9]{9}$'   then '0' || substr(customer_phone, 3)
     when customer_phone ~ '^5[0-9]{9}$'     then '0' || customer_phone
     else customer_phone
   end
 where customer_phone ~ '^(00905|905|5)[0-9]{9}$';

-- blocked_customer_phones: (tenant_id, phone) benzersiz, çakışanı atla
update public.blocked_customer_phones b
   set phone = '0' || substr(phone, 3)
 where phone ~ '^905[0-9]{9}$'
   and not exists (
     select 1 from public.blocked_customer_phones b2
      where b2.tenant_id = b.tenant_id and b2.phone = '0' || substr(b.phone, 3)
   );

update public.blocked_customer_phones b
   set phone = '0' || phone
 where phone ~ '^5[0-9]{9}$'
   and not exists (
     select 1 from public.blocked_customer_phones b2
      where b2.tenant_id = b.tenant_id and b2.phone = '0' || b.phone
   );
