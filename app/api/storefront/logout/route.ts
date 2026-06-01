import { NextResponse } from "next/server";
import {
  clearStorefrontTierCookie,
  isSecureStorefrontRequest,
} from "@/lib/storefront/session";

export async function POST(request: Request) {
  const body = await request.json();
  const subdomain = String(body.subdomain ?? "").trim().toLowerCase();
  const secure = isSecureStorefrontRequest(request);

  if (!subdomain) {
    return NextResponse.json({ error: "Subdomain zorunludur." }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  clearStorefrontTierCookie({ response, subdomain, secure });
  return response;
}
