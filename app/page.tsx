export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="bg-slate-900 text-white">
        <div className="container-shell py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                eKatalox
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Multi-tenant B2B katalog ve sipariş altyapısı
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a href="/login" className="text-sm text-slate-300 hover:text-white">
                Giriş yap
              </a>
              <a
                href="https://wa.me/905354172510?text=eKatalox%20demo%20talep%20ediyorum."
                className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                WhatsApp ile ulaş
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-12 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Premium • Güvenilir • Hızlı
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
              Toptancıların kendi alt alan adında şifreli fiyat katmanlarıyla sipariş topladığı
              modern B2B vitrin.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              eKatalox; toptancı, bayi ve telefoncu seviyeleri için 3 katmanlı fiyatlama,
              tenant bazlı yönetim paneli, ürün görsel yükleme ve WhatsApp sipariş akışı sunar.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="https://wa.me/905354172510?text=eKatalox%20i%C3%A7in%20demo%20almak%20istiyorum."
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-4 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                WhatsApp ile demo iste
              </a>
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Yönetim paneline geç
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
            <div className="grid gap-4">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Tenant bazlı mağaza</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  [tenant].ekatalox.com
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Fiyat görünürlüğü</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  Şifreye göre tek fiyat katmanı
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Sipariş akışı</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  Sepetten tek tıkla WhatsApp siparişi
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell pb-12 md:pb-20">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Başlangıç
            </p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">2.500₺</h3>
            <p className="mt-2 text-sm text-slate-600">300 ürün limiti</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li>• Şifreli mağaza girişi</li>
              <li>• 3 katmanlı fiyat yönetimi</li>
              <li>• WhatsApp sipariş akışı</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm ring-2 ring-emerald-100">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Büyüme
              </p>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Popüler
              </span>
            </div>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">3.500₺</h3>
            <p className="mt-2 text-sm text-slate-600">500 ürün limiti</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li>• CSV içe aktarma</li>
              <li>• Supabase Storage görsel yükleme</li>
              <li>• Mobil sabit sepet barı</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Kurumsal
            </p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">6.000₺</h3>
            <p className="mt-2 text-sm text-slate-600">1000 ürün limiti</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li>• Merkezi süper admin kontrolü</li>
              <li>• Çok tenant ölçeklenebilirliği</li>
              <li>• Premium mobil-first arayüz</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
