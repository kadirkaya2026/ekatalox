import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/api/rate-limit";
import { isSubdomainTaken } from "@/lib/signup/create-tenant";
import { getClientIp } from "@/lib/storefront/client-ip";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { signupSubdomainSchema } from "@/lib/validators/signup";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (ip && isRateLimited(`subdomain:${ip}`, 60, 60_000)) {
    return NextResponse.json({ available: false, message: "Çok fazla istek." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = signupSubdomainSchema.safeParse(searchParams.get("value") ?? "");
  if (!parsed.success) {
    return NextResponse.json({ available: false, message: parsed.error.issues[0]?.message ?? "Geçersiz adres." });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ available: true, message: "Kontrol edilemedi, kayıtta doğrulanacak." });
  }

  const value = parsed.data;
  if (!(await isSubdomainTaken(supabase, value))) {
    return NextResponse.json({ available: true });
  }

  let suggestion: string | undefined;
  for (let i = 2; i <= 9; i += 1) {
    const candidate = `${value}-${i}`;
    if (!(await isSubdomainTaken(supabase, candidate))) {
      suggestion = candidate;
      break;
    }
  }

  return NextResponse.json({ available: false, message: "Bu adres alınmış.", suggestion });
}
