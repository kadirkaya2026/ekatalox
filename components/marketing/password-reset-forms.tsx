"use client";

import Link from "next/link";
import { useState } from "react";

const inputClass =
  "w-full rounded-md border border-brand-line bg-white px-4 py-3 text-[16px] text-brand-ink outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20";
const buttonClass =
  "w-full rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white hover:bg-[#126A4F] disabled:opacity-60";

export function ResetRequestForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    await fetch("/api/auth/reset-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => undefined);
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="rounded-lg border border-brand-line bg-white p-6">
        <p className="font-semibold">Bağlantı gönderildi.</p>
        <p className="mt-2 text-sm text-brand-muted">
          Bu e-posta adresi sistemde kayıtlıysa şifre yenileme bağlantısı birkaç dakika içinde gelir. Bağlantı 1 saat geçerlidir. Gelen kutusunda yoksa istenmeyen klasörüne bakın.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-brand-green">Giriş sayfasına dön</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-brand-line bg-white p-6">
      <label className="block text-sm font-medium">
        Kayıtlı e-posta adresiniz
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="ornek@dukkanim.com" />
      </label>
      <button type="submit" disabled={state === "sending"} className={buttonClass}>
        {state === "sending" ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
      </button>
    </form>
  );
}

export function ResetConfirmForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Şifre en az 8 karakter olmalı.");
    if (password !== repeat) return setError("Şifreler aynı değil.");
    setState("sending");
    const res = await fetch("/api/auth/reset-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    if (!res || !res.ok) {
      setState("idle");
      return setError(json.error ?? "Şifre güncellenemedi.");
    }
    setState("done");
  }

  if (!token) {
    return (
      <div className="rounded-lg border border-brand-line bg-white p-6 text-sm">
        Bağlantı eksik ya da bozuk. <Link href="/sifremi-unuttum" className="font-semibold text-brand-green">Yeni bağlantı isteyin.</Link>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="rounded-lg border border-brand-line bg-white p-6">
        <p className="font-semibold">Şifreniz güncellendi.</p>
        <Link href="/login" className="mt-4 inline-block rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white">Giriş yap</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-brand-line bg-white p-6">
      <label className="block text-sm font-medium">
        Yeni şifre
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} mt-1.5`} />
      </label>
      <label className="block text-sm font-medium">
        Yeni şifre (tekrar)
        <input type="password" required minLength={8} value={repeat} onChange={(e) => setRepeat(e.target.value)} className={`${inputClass} mt-1.5`} />
      </label>
      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      <button type="submit" disabled={state === "sending"} className={buttonClass}>
        {state === "sending" ? "Kaydediliyor…" : "Şifreyi güncelle"}
      </button>
    </form>
  );
}
