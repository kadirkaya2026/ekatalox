-- Magnet kodlarına konum bilgisi.
--
-- Saha akışı şöyle: bir ilçe için toplu kod üretilip bastırılıyor, sonra
-- mahalle mahalle gezilip dükkanlara bırakılıyor. "Hangi mahalleye kaç
-- magnet bıraktım, hangisinden okutma geliyor" sorusunun cevabı şu an
-- hiçbir yerde yok — elde sadece serbest metin bir `label` var
-- ("1.parti" gibi), mahalle kırılımı yapılamıyor.
--
-- Alanlar ayrı tutuldu (tek bir "konum" metni yerine): mahalleye göre
-- gruplama ve ilçeye göre filtreleme metin ayrıştırmadan yapılabilsin.
-- Hepsi nullable — kod üretildiğinde henüz nereye gideceği belli değil.

alter table public.magnet_codes
  add column if not exists city text,
  add column if not exists district text,
  add column if not exists neighborhood text,
  -- Magnetin fiziksel olarak bırakıldığı an. assigned_at'ten farklı:
  -- magnet dükkana yapıştırılmış ama bayi henüz sisteme alınmamış olabilir.
  add column if not exists placed_at timestamptz;

create index if not exists magnet_codes_location_idx
  on public.magnet_codes (lower(district), lower(neighborhood));

comment on column public.magnet_codes.neighborhood is
  'Magnetin bırakıldığı mahalle. Mahalle kırılımlı takip için (bkz. /admin/qr-kodlari).';
