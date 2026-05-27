"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { EkataloxLogo } from "@/components/brand/ekatalox-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth/translate-error";

export function LoginForm({ target }: { target?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const supabase = createSupabaseBrowserClient();
  const canUseDemoFallback =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname.endsWith(".localhost"));

  function redirectFallback() {
    if (target === "admin") {
      window.location.href = "https://admin.ekatalox.com/";
      return;
    }

    if (target === "app") {
      window.location.href = "https://app.ekatalox.com/";
      return;
    }

    window.location.href = "/";
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("E-posta adresi zorunludur.");
      return;
    }

    if (!password) {
      setError("Şifre zorunludur.");
      return;
    }

    if (!supabase) {
      if (!canUseDemoFallback) {
        setError("Supabase yapılandırması eksik. Lütfen production environment değerlerini girin.");
        return;
      }

      redirectFallback();
      return;
    }

    startTransition(async () => {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(translateAuthError(signInError.message));
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Oturum açılamadı.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, must_change_password")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role === "super_admin") {
        window.location.href = "https://admin.ekatalox.com/";
        return;
      }

      if (profile?.must_change_password) {
        window.location.href = "https://app.ekatalox.com/settings?forcePasswordChange=1";
        return;
      }

      window.location.href = "https://app.ekatalox.com/";
    });
  }

  return (
    <div className="container-shell flex min-h-screen items-center justify-center py-10">
      <Card className="w-full max-w-md p-6">
        <Link href="/#top" className="inline-flex">
          <EkataloxLogo variant="light" className="h-10 w-[176px]" priority />
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">
          Yönetim paneline erişin
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Supabase Auth ile süper admin veya tenant admin hesabınızla giriş yapın.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Giriş yapılıyor..." : "Giriş yap"}
          </Button>
        </form>

        {!supabase && canUseDemoFallback ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Supabase değişkenleri tanımlı değil. Demo gezinimi için doğrudan
            <a href="https://admin.ekatalox.com/" className="mx-1 font-semibold text-slate-900">
              admin
            </a>
            veya
            <a href="https://app.ekatalox.com/" className="ml-1 font-semibold text-slate-900">
              tenant paneline
            </a>
            geçebilirsiniz.
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-slate-600">{error}</p> : null}
      </Card>
    </div>
  );
}