import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

// Devredilen parti: seçilen baskı paketlerinin kodlarını başka bir
// kurulumdaki bayiye yönlendirir (bkz. 0130_magnet_partner_redirect.sql).
//
// assign-package'tan iki farkı var: hedef bir bayi değil bir adres (o bayi
// bu kurulumda yok, atama listesinde hiç görünmüyor) ve paketteki TÜM
// kodlara uygulanır — devredilen partide zaten bir bayiye atanmış kartlar da
// var. Hiçbir atama ezilmiyor: adres boşaltılınca eski davranış aynen döner,
// yönlendirmenin süresi de böyle yönetiliyor.

export async function POST(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) return guard;

  const body = await request.json().catch(() => null);

  const packageCodes = [
    ...new Set(
      (Array.isArray(body?.package_codes) ? body.package_codes : [])
        .filter((p: unknown): p is string => typeof p === "string")
        .map((p: string) => p.trim().toUpperCase())
        .filter((p: string) => /^[A-J]\d{2}$/.test(p)),
    ),
  ];

  if (!packageCodes.length) {
    return NextResponse.json({ error: "Geçerli paket kodu yok." }, { status: 400 });
  }

  const raw = typeof body?.url === "string" ? body.url.trim() : "";

  // Boş adres = yönlendirmeyi kaldır. Doluysa şema burada da kontrol edilir;
  // RPC ayrıca bakıyor ama hatayı kullanıcıya anlaşılır döndürmek için önce
  // burada yakalanıyor.
  if (raw && !/^https?:\/\//i.test(raw)) {
    return NextResponse.json(
      { error: "Adres http:// veya https:// ile başlamalı." },
      { status: 400 },
    );
  }

  if (raw) {
    try {
      new URL(raw);
    } catch {
      return NextResponse.json({ error: "Adres okunamadı." }, { status: 400 });
    }
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("set_magnet_package_partner", {
    p_package_codes: packageCodes,
    p_url: raw || null,
  });

  if (error) {
    return NextResponse.json({ error: "Yönlendirme yazılamadı." }, { status: 500 });
  }

  return NextResponse.json({
    updated: typeof data === "number" ? data : 0,
    packages: packageCodes,
    url: raw || null,
  });
}
