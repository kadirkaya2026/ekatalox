-- Paket içi fiziksel sıra: matbaadan çıkan destede üstten kaçıncı magnet.
-- Tabaka dik tutulduğunda (kartlar okunur yönde) sol üstten satır satır;
-- sayfa sırası paket PDF'indeki sayfa sırası (A01.pdf s1 hücre1 = pozisyon 1).
-- Veri 0103'te (bkz. 0087'deki parse-önce-çalıştır notu).
alter table public.magnet_codes
  add column if not exists package_position smallint;
