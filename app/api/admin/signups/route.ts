import { NextResponse } from "next/server";
import { listSignupRequests, signupListQuerySchema } from "@/lib/admin/self-service";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

export async function GET(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { searchParams } = new URL(request.url);
  const parsed = signupListQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    status: searchParams.get("status") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz sorgu." }, { status: 400 });
  }

  try {
    const result = await listSignupRequests({ page: parsed.data.page, status: parsed.data.status ?? null });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Başvurular okunamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
