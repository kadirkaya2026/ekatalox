"use client";

import { useMemo, useState } from "react";
import { KeyRound, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/inline-alert";

export interface StoreMemberRow {
  id: string;
  phone: string;
  full_name: string;
  email: string | null;
  created_at: string;
  last_login_at: string | null;
}

// Vitrin üyeleri (0180): müşteri telefon + şifreyle üye olur, siparişlerini
// "Siparişlerim"de görür. E-postası olmayan şifresini unutursa mağazayı arar;
// "Yeni şifre ver" 6 haneli şifre üretir, bir kez gösterilir.
export function StoreMembersManager({ initialMembers }: { initialMembers: StoreMemberRow[] }) {
  const members = initialMembers;
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ id: string; password: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    const digits = q.replace(/\D/g, "");
    if (!q) return members;
    return members.filter(
      (m) =>
        m.full_name.toLocaleLowerCase("tr-TR").includes(q) ||
        (digits.length >= 3 && m.phone.includes(digits)) ||
        (m.email ?? "").includes(q),
    );
  }, [members, query]);

  async function issuePassword(row: StoreMemberRow) {
    if (!window.confirm(`${row.full_name || row.phone} için yeni şifre üretilsin mi? Eski şifre çalışmaz.`)) return;
    setPendingId(row.id);
    setError(null);
    setIssued(null);
    const response = await fetch("/api/tenant/store-members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.password) setError(result.error ?? "Şifre yenilenemedi.");
    else setIssued({ id: row.id, password: result.password });
    setPendingId(null);
  }

  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-foreground">Üyeler · {members.length}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Vitrinde telefon numarası ve şifreyle üye olan müşteriler. Siparişlerini ve bilgilerini yalnız kendi
        şifreleriyle görürler. Şifresini unutan müşteri e-posta eklemediyse sizi arar: &quot;Yeni şifre ver&quot;e basın,
        çıkan 6 haneli şifreyi müşteriye söyleyin.
      </p>
      <InlineAlert tone="error" message={error} className="mt-3" />
      {members.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Henüz üye yok. Müşteriler sepette ya da Sipariş Takip sayfasında üye olabilir.</p>
      ) : (
        <>
          <div className="relative mt-4 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ad, telefon ya da e-posta ara" className="pl-9" />
          </div>
          <div className="mt-3 divide-y rounded-xl border">
            {filtered.slice(0, 200).map((row) => (
              <div key={row.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{row.full_name || "—"}</p>
                  <p className="text-xs text-slate-500">
                    {row.phone}
                    {row.email ? ` · ${row.email}` : ""} · üye {new Date(row.created_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {issued?.id === row.id ? (
                    <span className="rounded-lg bg-emerald-50 px-3 py-1.5 font-mono text-sm font-semibold text-emerald-800">
                      Yeni şifre: {issued.password}
                    </span>
                  ) : null}
                  <Button variant="secondary" disabled={pendingId === row.id} onClick={() => void issuePassword(row)}>
                    {pendingId === row.id ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                    Yeni şifre ver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
