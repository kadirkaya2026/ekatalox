// Shown instantly on every dashboard navigation while the page's server
// render + data fetch is in flight. The sidebar (in layout) stays put, so the
// user gets immediate feedback instead of waiting on a blank content area.
export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Yükleniyor">
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-7 w-56 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5"
          >
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
