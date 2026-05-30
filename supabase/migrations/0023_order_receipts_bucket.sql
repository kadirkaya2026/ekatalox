insert into storage.buckets (id, name, public)
values ('order-receipts', 'order-receipts', true)
on conflict (id) do nothing;

drop policy if exists "public read order receipts" on storage.objects;
create policy "public read order receipts"
on storage.objects
for select
using (bucket_id = 'order-receipts');

drop policy if exists "super admin manage order receipts" on storage.objects;
create policy "super admin manage order receipts"
on storage.objects
for all
using (
  bucket_id = 'order-receipts'
  and public.is_super_admin()
)
with check (
  bucket_id = 'order-receipts'
  and public.is_super_admin()
);
