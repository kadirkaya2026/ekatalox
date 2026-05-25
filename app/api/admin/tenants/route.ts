import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { demoTenants } from "@/lib/demo-data";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  isReservedSubdomain,
  RESERVED_SUBDOMAIN_MESSAGE,
} from "@/lib/tenancy/reserved-subdomains";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import type { Tenant } from "@/lib/types";
import { tenantSchema } from "@/lib/validators/tenant";

export async function GET() {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({ tenants: demoTenants });
  }

  const { data, error } = await supabase.from("tenants").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ tenants: data ?? [] });
}

export async function POST(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const body = await request.json();
  const parsed = tenantSchema.safeParse({
    ...body,
    max_product_limit: Number(body.max_product_limit),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz tenant verisi." },
      { status: 400 },
    );
  }

  if (isReservedSubdomain(parsed.data.subdomain)) {
    return NextResponse.json(
      { error: RESERVED_SUBDOMAIN_MESSAGE },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    const tenant: Tenant = {
      id: randomUUID(),
      status: "active",
      created_at: new Date().toISOString(),
      ...parsed.data,
    };

    return NextResponse.json({ tenant });
  }

  const payload = {
    ...parsed.data,
    subdomain: parsed.data.subdomain.toLowerCase(),
    status: "active",
  };

  const { data, error } = await supabase
    .from("tenants")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Tenant oluşturulamadı. Alt alan adı veya veri çakışması olabilir." },
      { status: 400 },
    );
  }

  return NextResponse.json({ tenant: data });
}