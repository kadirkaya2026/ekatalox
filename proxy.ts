import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { appEnv } from "@/lib/env";
import { getInternalPathFromHost, resolveHost } from "@/lib/tenancy/resolve-host";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const hostHeader = request.headers.get("host");
  const hostResolution = resolveHost(hostHeader);
  const normalizedHost = (hostHeader ?? "").replace(/:\d+$/, "").toLowerCase();
  const isManagedProductionHost = normalizedHost.endsWith(`.${appEnv.rootDomain}`);
  const isManagedLocalHost = normalizedHost.endsWith(".localhost");

  if (hostResolution.kind === "unknown" && (isManagedProductionHost || isManagedLocalHost)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (hostResolution.kind === "unknown" || hostResolution.kind === "marketing") {
    return NextResponse.next();
  }

  const rewrittenPath = getInternalPathFromHost(hostHeader, pathname);
  const url = request.nextUrl.clone();
  url.pathname = rewrittenPath;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: "/:path*",
};