-- Tekel saha uygulaması medya deposu (dükkân fotoğrafı, rızalı görüşme kaydı, temsilci sesli notu).
-- Özel bucket: yalnız service role yazar/okur; uygulama gizli token'lı API üzerinden imzalı URL alır.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('saha-medya', 'saha-medya', false, 26214400,
        array['image/jpeg','image/png','image/webp','audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav','audio/aac','audio/x-m4a'])
on conflict (id) do nothing;
