import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/api/rate-limit";
import { getSessionContext } from "@/lib/auth/session";
import {
  buildSearchCandidates,
  isCheckableTld,
  mapSearchResults,
  uncheckableResults,
  type DomainSearchResult,
} from "@/lib/kurumsal/domain-search";
import { ensureTenantPlanFeatureResponse } from "@/lib/tenancy/guards";
import { getRegistrarSupportedTlds, searchRegistrarDomains } from "@/lib/vercel/domains";

// "Yeni alan adı seç" → müsaitlik + fiyat araması. { name } → { results }.
// Tenant admin + "kurumsal_site" paketi; tenant başına dakikada 20 arama;
// aynı sorgu 60 sn bellekte. Vercel yoksa/hata verirse tüm adaylar
// "kontrol edilemiyor" + friendly mesaj (asla sahte "boşta" yok).

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: SearchResponse; expires: number }>();

type SearchResponse = { results: DomainSearchResult[]; warning?: string };

export async function POST(request: Request) {
  const guard = await ensureTenantPlanFeatureResponse("kurumsal_site");
  if (guard) return guard;
  const session = await getSessionContext();
  const tenant = session.tenant!;

  if (isRateLimited(`kurumsal-domain-search:${tenant.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "Çok fazla arama yaptınız; bir dakika sonra tekrar deneyin." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
  const candidates = buildSearchCandidates(typeof body?.name === "string" ? body.name : "");
  if (!candidates.ok) return NextResponse.json({ error: candidates.error }, { status: 400 });

  const key = candidates.domains.join(",");
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return NextResponse.json(hit.value, { headers: { "Cache-Control": "no-store" } });
  }

  let value: SearchResponse;
  const supportedTlds = await getRegistrarSupportedTlds();
  // Desteklenmeyen uzantıları Vercel'e hiç sormayız (null kalır).
  const toQuery = candidates.domains.filter((domain) => isCheckableTld(domain, supportedTlds));

  if (!toQuery.length) {
    value = { results: mapSearchResults(candidates.domains, [], supportedTlds) };
  } else {
    const outcome = await searchRegistrarDomains(toQuery);
    value = outcome.ok
      ? { results: mapSearchResults(candidates.domains, outcome.rows, supportedTlds) }
      : {
          results: uncheckableResults(candidates.domains),
          warning: outcome.configured
            ? outcome.message
            : "Müsaitlik şu an kontrol edilemiyor; istediğiniz adı yine de talep edebilirsiniz, ekibimiz kontrol eder.",
        };
  }

  if (cache.size >= 500) cache.clear();
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
  return NextResponse.json(value, { headers: { "Cache-Control": "no-store" } });
}
