-- Baskı paketleri: matbaa magnetleri 100'erli paketliyor (4 tabaka × 25 göz).
-- Her kod, fiziksel olarak hangi pakette basıldıysa o paketin koduyla
-- işaretlenir (A01..J10: harf = 1000'lik tabaka PDF dosyası tabaka-01..10,
-- sayı = o dosyadaki 4 sayfalık grup). Böylece süper admin "A01 paketini bu
-- markete ver" diyebilir — kutu açılmadan kodlar bayiye atanır.
--
-- Bu dosya SADECE şema açar; veri ve RPC'ler 0101'de (bkz. 0087'deki
-- parse-önce-çalıştır notu — yeni sütuna dokunan ifadeler ayrı dosyada).
alter table public.magnet_codes
  add column if not exists package_code text;

create index if not exists magnet_codes_package_idx
  on public.magnet_codes (package_code);
