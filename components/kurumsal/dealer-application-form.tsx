"use client";

import { useState, type FormEvent } from "react";

// Kurumsal sayfadaki bayi başvuru formu (#basvuru). POST
// /api/storefront/kurumsal/basvuru → dealer_applications; bayi panelde
// "Bayi Başvuruları" sayfasında görür. "website" alanı bot tuzağıdır
// (gerçek ziyaretçi görmez; doluysa sunucu sessizce başarılı döner).
// preview: panel sihirbazındaki önizlemede form gönderilmez.

const FIELD =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

export function DealerApplicationForm({
  subdomain,
  companyName,
  preview = false,
}: {
  subdomain: string;
  companyName: string;
  preview?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview || pending) return;
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      subdomain,
      company_name: String(form.get("company_name") ?? "").trim(),
      contact_name: String(form.get("contact_name") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      city: String(form.get("city") ?? "").trim(),
      note: String(form.get("note") ?? "").trim(),
      website: String(form.get("website") ?? ""),
    };

    if (payload.company_name.length < 2) return setError("Firma adını yazın.");
    if (payload.contact_name.length < 2) return setError("Yetkili adını yazın.");
    const digits = payload.phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) {
      return setError("Telefon numarasını 05XX XXX XX XX biçiminde yazın.");
    }

    setPending(true);
    try {
      const res = await fetch("/api/storefront/kurumsal/basvuru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(result?.error ?? "Başvuru gönderilemedi. Lütfen tekrar deneyin.");
        return;
      }
      setDone(true);
    } catch {
      setError("Bağlantı kurulamadı. Lütfen tekrar deneyin.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center" role="status">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white">
          ✓
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">Başvurunuz alındı</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          En kısa sürede sizinle iletişime geçeceğiz. {companyName} ailesine gösterdiğiniz ilgi için teşekkür ederiz.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Firma adı *
          <input name="company_name" required maxLength={120} autoComplete="organization" className={FIELD} placeholder="Örn. Yıldız İletişim" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Yetkili adı *
          <input name="contact_name" required maxLength={80} autoComplete="name" className={FIELD} placeholder="Ad Soyad" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Telefon *
          <input
            name="phone"
            type="tel"
            required
            maxLength={20}
            inputMode="tel"
            autoComplete="tel"
            className={FIELD}
            placeholder="05XX XXX XX XX"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          İl
          <input name="city" maxLength={40} autoComplete="address-level1" className={FIELD} placeholder="Örn. Ankara" />
        </label>
        <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
          Not
          <textarea
            name="note"
            maxLength={1000}
            rows={3}
            className={FIELD}
            placeholder="Kısaca firmanızı ve ilgilendiğiniz ürünleri yazabilirsiniz."
          />
        </label>
        {/* Bot tuzağı: ekran dışında, insan kullanıcı görmez ve doldurmaz. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Web sitesi
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || preview}
        className="mt-6 w-full rounded-full px-6 py-3.5 text-sm font-bold text-white shadow-lg transition disabled:opacity-70 sm:w-auto"
        style={{ backgroundColor: "var(--k-accent)" }}
      >
        {pending ? "Gönderiliyor…" : "Başvuruyu Gönder"}
      </button>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Paylaştığınız bilgiler yalnızca bayilik başvurunuzu değerlendirmek ve sizinle iletişime geçmek amacıyla{" "}
        {companyName} tarafından 6698 sayılı KVKK kapsamında işlenir.
      </p>
    </form>
  );
}
