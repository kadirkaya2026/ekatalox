import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const { whatsapp_number } = await request.json();

  if (!whatsapp_number) {
    return NextResponse.json(
      { error: "WhatsApp numarası zorunludur." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      tenant: {
        ...session.tenant,
        whatsapp_number,
      },
    });
  }

  const { data, error } = await supabase
    .from("tenants")
    .update({ whatsapp_number })
    .eq("id", session.tenant!.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ tenant: data });
}