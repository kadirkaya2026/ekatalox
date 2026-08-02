import { NextResponse } from "next/server";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

interface ReorderItem {
  id: string;
  parent_id: string | null;
  display_order: number;
}

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const body = await request.json();
  const items: ReorderItem[] = body.items;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Güncellenecek kategori listesi boş." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Sunucu yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  }

  // Verify all category IDs belong to this tenant
  const ids = items.map((item) => item.id);
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("tenant_id", session.tenant!.id)
    .in("id", ids);

  const validIds = new Set((existing ?? []).map((row: { id: string }) => row.id));
  const invalid = ids.filter((id) => !validIds.has(id));

  if (invalid.length > 0) {
    return NextResponse.json(
      { error: "Bazı kategoriler bu hesaba ait değil." },
      { status: 403 },
    );
  }

  // Update each item individually (Supabase doesn't support bulk upsert with different values per row easily)
  const updates = items.map((item) =>
    supabase
      .from("categories")
      .update({
        parent_id: item.parent_id,
        display_order: item.display_order,
      })
      .eq("id", item.id)
      .eq("tenant_id", session.tenant!.id),
  );

  const results = await Promise.all(updates);
  const firstError = results.find((result) => result.error);

  if (firstError?.error) {
    return NextResponse.json(
      { error: firstError.error.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
