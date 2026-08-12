"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { EkataloxLogo } from "@/components/brand/ekatalox-logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth/translate-error";

function Field({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-[#10b981]/60"
      />
    </div>
  );
}

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090d16] px-6 py-10">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#10b981]/15 blur-[160px]" />
      <div className="pointer-events-none absolute right-0 top-40 h-[500px] w-[500px] rounded-full bg-[#00ff87]/15 blur-[140px]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 backdrop-blur-xl md:p-9"
      >
        <Link href="/#top" className="inline-flex">
          <EkataloxLogo variant="light" className="h-10 w-[176px]" priority />
        </Link>
        <h1 className="mt-5 text-2xl font-semibold text-white" style={{ letterSpacing: "-0.02em" }}>
          Yönetim paneline erişin
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Supabase Auth ile süper admin veya tenant admin hesabınızla giriş yapın.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field
            id="login-email"
            type="email"
            label="E-posta"
            placeholder="ornek@sirketiniz.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Field
            id="login-password"
            type="password"
            label="Şifre"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="submit"
            disabled={pending}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-black transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {pending ? "Giriş yapılıyor..." : "Giriş yap"}
          </button>
        </form>

        {!supabase && canUseDemoFallback ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            Supabase değişkenleri tanımlı değil. Demo gezinimi için doğrudan
            <a href="https://admin.ekatalox.com/" className="mx-1 font-semibold text-white">
              admin
            </a>
            veya
            <a href="https://app.ekatalox.com/" className="ml-1 font-semibold text-white">
              tenant paneline
            </a>
            geçebilirsiniz.
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
      </motion.div>
    </div>
  );
}
