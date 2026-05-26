alter table public.products
  add column if not exists package_quantity integer
    check (package_quantity is null or package_quantity > 0),
  add column if not exists carton_quantity integer
    check (carton_quantity is null or carton_quantity > 0);