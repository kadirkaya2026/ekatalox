-- Limit dışı ürünlerin otomatik açılması (3 Eki 2026): mağaza vitrinde görünen
-- (is_over_limit=false) ürünlerden birini silerse, açılan yer kadar en eski
-- limit dışı ürün vitrine geri döner. Silme hangi yoldan yapılırsa yapılsın
-- (tekil, toplu, kategori silme) çalışsın diye tetikleyici veritabanında.
create or replace function public.products_unhide_over_limit_after_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  with freed as (
    select tenant_id, count(*)::int as n
    from old_rows
    where not is_over_limit
    group by tenant_id
  ),
  promote as (
    select p.id
    from freed f
    cross join lateral (
      select id
      from public.products
      where tenant_id = f.tenant_id and is_over_limit
      order by created_at asc, id asc
      limit f.n
    ) p
  )
  update public.products set is_over_limit = false
  where id in (select id from promote);
  return null;
end;
$$;

drop trigger if exists products_unhide_over_limit_after_delete on public.products;
create trigger products_unhide_over_limit_after_delete
  after delete on public.products
  referencing old table as old_rows
  for each statement
  execute function public.products_unhide_over_limit_after_delete();
