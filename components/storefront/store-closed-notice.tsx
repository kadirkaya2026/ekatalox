/**
 * Deneme süresi dolan tenant'ın vitrininde son müşteriye gösterilen nötr
 * kapalıyız ekranı. Ziyaretçi tenant'ın müşterisi olduğu için paket/ödeme
 * detayı içermez; o mesaj yalnızca yönetim panelinde gösterilir.
 */
export function StoreClosedNotice() {
  return (
    <div className="container-shell flex min-h-screen items-center justify-center py-8">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Geçici olarak mağazamız kapalıdır
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Kısa süre içinde tekrar hizmetinizde olacağız. Anlayışınız için
          teşekkür ederiz.
        </p>
      </div>
    </div>
  );
}
