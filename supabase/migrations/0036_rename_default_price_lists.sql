update public.price_lists
set name = '1.Liste'
where is_catalog_only = false
  and name = 'Perakende';

update public.price_lists
set name = '2.Liste'
where is_catalog_only = false
  and name = 'Bayi 1';

update public.price_lists
set name = '3.Liste'
where is_catalog_only = false
  and name = 'Bayi 2';
