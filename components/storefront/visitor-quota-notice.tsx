/**
 * Aylık ziyaretçi kotası dolan tenant'ın vitrininde son müşteriye gösterilen
 * nötr ekran. Ziyaretçi tenant'ın müşterisi olduğu için paket/kota detayı
 * içermez; o mesaj yalnızca yönetim panelinde gösterilir.
 */
export function VisitorQuotaNotice() {
  return (
    <div className="container-shell flex min-h-screen items-center justify-center py-8">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Şu anda yoğunluk nedeniyle gösterilemiyor
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Mağaza şu anda beklenenin üzerinde ilgi görüyor. Kısa süre içinde
          tekrar deneyin. Anlayışınız için teşekkür ederiz.
        </p>
      </div>
    </div>
  );
}
