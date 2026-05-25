# eKatalox

Çok kiracılı B2B katalog ve sipariş altyapısı.

## Domain Mimarisi

- `ekatalox.com` → landing
- `admin.ekatalox.com` → süper admin paneli
- `app.ekatalox.com` → tenant admin paneli
- `*.ekatalox.com` → tenant storefront

## Yerel Geliştirme

```bash
npm install
npm run dev
```

Yerelde açılabilen host örnekleri:

- `http://localhost:3000`
- `http://admin.localhost:3000`
- `http://app.localhost:3000`
- `http://lucatech.localhost:3000`

Supabase environment değişkenleri yoksa uygulama demo veriyle açılır. Bu davranış production için kullanılmamalıdır.

## Environment Değişkenleri

`.env.local` veya Vercel Production ortamına şu değerleri girin:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_ROOT_DOMAIN=ekatalox.com
NEXT_PUBLIC_MARKETING_DOMAIN=ekatalox.com
NEXT_PUBLIC_ADMIN_DOMAIN=admin.ekatalox.com
NEXT_PUBLIC_APP_DOMAIN=app.ekatalox.com
```

## Supabase Production Kurulumu

Production için ayrı bir **Supabase EU** projesi açın.

Migration sırası:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_rls_policies.sql`
3. `supabase/migrations/0003_storage_setup.sql`
4. `supabase/migrations/0005_reserved_subdomains.sql`

`supabase/migrations/0004_seed_demo_data.sql` yalnız local / demo bootstrap için opsiyoneldir. Production'da otomatik uygulanmamalıdır.

### Migration Çalıştırma

Supabase SQL Editor ile dosyaları sırayla çalıştırabilirsiniz.

Supabase CLI kullanacaksanız:

```bash
supabase login
supabase link --project-ref <SUPABASE_PROJECT_REF>
supabase db push
```

Production'da yalnız kontrollü SQL geçirmek istiyorsanız SQL Editor yöntemi daha güvenlidir.

## Production Auth ve İlk Seed

Production ortamında `auth.users` tablosuna doğrudan SQL insert yapılmamalıdır.

Önce Supabase Dashboard → Authentication → Users üzerinden iki kullanıcı oluşturun:

- `superadmin@ekatalox.com`
- `demo-admin@ekatalox.com`

Sonra bu kullanıcıların UUID değerlerini alıp aşağıdaki seed dosyasını manuel çalıştırın:

- `supabase/seeds/production_initial_seed.template.sql`

Bu seed şunları oluşturur:

- `super_admin` profili
- `tenant_admin` profili
- `demo.ekatalox.com` tenant kaydı
- tenant membership kaydı
- `1111`, `2222`, `3333` access code kayıtları

Seed sonrası hızlı doğrulama sorguları:

- `supabase/seeds/production_verification_queries.sql`

## Reserved Subdomain Kuralları

Şu alt alan adları tenant olarak kullanılamaz:

- `admin`
- `app`
- `www`
- `api`
- `ekatalox`
- `assets`

Bu koruma:

- UI seviyesinde
- API seviyesinde
- veritabanı constraint seviyesinde

ayrı ayrı uygulanır.

## Supabase Storage Güvenlik Modeli

- Bucket: `product-images`
- Bucket görünürlüğü: public read
- Write erişimleri:
  - `INSERT`
  - `UPDATE`
  - `DELETE`

yalnız `auth.uid()` + `tenant_memberships` + tenant path prefix eşleşmesi ile verilir.

Dosya yolu standardı:

- `<tenant_id>/products/<product-id>-<safe-file-name>`

Tenant admin yalnız kendi tenant klasörüne dosya yükleyebilir veya güncelleyebilir.

## Vercel Production Yayını

Tek Vercel projesi kullanılmalıdır.

Bu projeye şu domainler bağlanmalıdır:

- `ekatalox.com`
- `admin.ekatalox.com`
- `app.ekatalox.com`
- `*.ekatalox.com`

### Vercel Production Environment

Vercel Production ortamına şu değişkenleri girin:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_ROOT_DOMAIN=ekatalox.com
NEXT_PUBLIC_MARKETING_DOMAIN=ekatalox.com
NEXT_PUBLIC_ADMIN_DOMAIN=admin.ekatalox.com
NEXT_PUBLIC_APP_DOMAIN=app.ekatalox.com
```

Vercel CLI ile eklemek isterseniz:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_ROOT_DOMAIN production
vercel env add NEXT_PUBLIC_MARKETING_DOMAIN production
vercel env add NEXT_PUBLIC_ADMIN_DOMAIN production
vercel env add NEXT_PUBLIC_APP_DOMAIN production
```

Production domain değerleri:

```bash
NEXT_PUBLIC_ROOT_DOMAIN=ekatalox.com
NEXT_PUBLIC_MARKETING_DOMAIN=ekatalox.com
NEXT_PUBLIC_ADMIN_DOMAIN=admin.ekatalox.com
NEXT_PUBLIC_APP_DOMAIN=app.ekatalox.com
```

## Cloudflare DNS Notu

Cloudflare kullanılıyorsa:

- `admin.ekatalox.com` → proxied olabilir
- `app.ekatalox.com` → proxied olabilir
- `*.ekatalox.com` → **DNS Only (Gri Bulut)** olmalıdır

Wildcard kaydı proxied yapılırsa Vercel wildcard SSL ve handshake sürecinde sorun yaşanabilir.

## Production Smoke Test

Yayın sonrası en az şu akışlar doğrulanmalıdır:

- `ekatalox.com` açılıyor
- `admin.ekatalox.com` login çalışıyor
- `app.ekatalox.com` tenant paneli açılıyor
- `tenant.ekatalox.com` storefront açılıyor
- access code ile fiyat katmanı belirleniyor
- client tarafına yalnız tek `price` alanı gidiyor
- ürün görsel upload çalışıyor
- WhatsApp sipariş linki tenant numarasına yönleniyor

## Build

```bash
npm run lint
npm run build
```
