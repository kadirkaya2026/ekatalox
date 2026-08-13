import { NextResponse } from "next/server";
import { getPendingProductSuggestions } from "@/lib/products/suggestions";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

export async function GET() {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const suggestions = await getPendingProductSuggestions();

  return NextResponse.json({ suggestions });
}
