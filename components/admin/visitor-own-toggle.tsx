"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function VisitorOwnToggle({ visitorId, isOwn }: { visitorId: string; isOwn: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setError(false);
          const response = await fetch("/api/admin/site-analytics/visitor-note", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visitorId, note: isOwn ? null : "ben" }),
          });
          if (!response.ok) setError(true);
          else router.refresh();
        })
      }
      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
    >
      {pending ? "…" : error ? "Hata, tekrar dene" : isOwn ? "Ben değilim" : "Bu benim"}
    </button>
  );
}
