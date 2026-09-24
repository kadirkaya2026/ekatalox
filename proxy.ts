import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getStorefrontTenant, getTenantByCustomDomain } from "@/lib/data";
import { appEnv } from "@/lib/env";
import {
  isUnsupportedIosBrowser,
  renderLegacyBrowserNotice,
  LEGACY_BROWSER_BYPASS_PARAM,
  LEGACY_BROWSER_BYPASS_VALUE,
  LEGACY_BROWSER_COOKIE,
  LEGACY_BROWSER_COOKIE_MAX_AGE,
} from "@/lib/compat/legacy-browser";
import { toPublicStorefrontPath } from "@/lib/storefront/paths";
import {
  getStorefrontAgeCookieName,
  getStorefrontTierCookieName,
} from "@/lib/storefront/tier-cookie";
import {
  getStorefrontMagnetCookieName,
  MAGNET_COOKIE_MAX_AGE,
  MAGNET_QUERY_PARAM,
} from "@/lib/storefront/magnet-cookie";
import type { Tenant } from "@/lib/types";
import {
  getInternalPathFromResolution,
  resolveHost,
  type HostResolution,
} from "@/lib/tenancy/resolve-host";
import { isTenantCustomDomainHost } from "@/lib/tenancy/request-host";
import { hasKurumsalSiteAccess } from "@/lib/kurumsal/domain";
import { getTenantByKurumsalDomain, isKurumsalSitePublished } from "@/lib/kurumsal/tenant-lookup";

/**
 * Resolve the effective hostname for a request.
 *
 * Vercel and other CDN/proxy layers sometimes forward the original domain in
 * `x-forwarded-host` while the `host` header contains an internal service
 * address. We prefer `x-forwarded-host` so that tenant routing is always
 * based on the public-facing domain.
 */
function effectiveHost(request: NextRequest): string | null {
  return (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host")
  );
}

function stripPort(value: string) {
  return value.replace(/:\d+$/, "").toLowerCase();
}

// Proxy her istekte (CDN cache'inden ÖNCE) çalıştığı için tenant sorgularını
// instance başına kısa süreli bellekte tutuyoruz; ısınmış bir instance'ta
// istek başına Supabase sorgusu sıfıra iner. TTL kısa tutuldu ki
// custom_domain / status değişiklikleri en geç bir dakikada yansısın.
const TENANT_LOOKUP_TTL_MS = 60_000;
const TENANT_LOOKUP_MAX_ENTRIES = 500;
const tenantLookupCache = new Map<
  string,
  { value: Tenant | null; expires: number }
>();

async function cachedTenantLookup(
  key: string,
  load: () => Promise<Tenant | null>,
): Promise<Tenant | null> {
  const hit = tenantLookupCache.get(key);
  if (hit && hit.expires > Date.now()) {
    return hit.value;
  }

  const value = await load();

  if (tenantLookupCache.size >= TENANT_LOOKUP_MAX_ENTRIES) {
    tenantLookupCache.clear();
  }
  tenantLookupCache.set(key, {
    value,
    expires: Date.now() + TENANT_LOOKUP_TTL_MS,
  });

  return value;
}

// Kurumsal sitenin yayında olup olmadığı (katalog adresindeki /kurumsal
// yollarını 301'lemek için); tenant sorgusu gibi 60 sn bellekte.
const kurumsalPublishedCache = new Map<string, { value: boolean; expires: number }>();

async function cachedKurumsalPublished(tenantId: string): Promise<boolean> {
  const hit = kurumsalPublishedCache.get(tenantId);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await isKurumsalSitePublished(tenantId);
  if (kurumsalPublishedCache.size >= TENANT_LOOKUP_MAX_ENTRIES) kurumsalPublishedCache.clear();
  kurumsalPublishedCache.set(tenantId, { value, expires: Date.now() + TENANT_LOOKUP_TTL_MS });
  return value;
}

/**
 * Kurumsal site alan adı (tenants.kurumsal_domain, bkz. 0134): ör.
 * lucatech.com.tr kökünde tenant'ın kurumsal sitesi yayınlanır. Şifre/yaş/
 * kota kapısı, magnet ve noindex YOK (bilerek Google'a açık). Yol eşlemesi:
 *   /            → /store/{sub}/kurumsal
 *   /kategori/*  → /store/{sub}/kurumsal/kategori/*
 *   /urun/*      → /store/{sub}/kurumsal/urun/*
 *   /robots.txt  → /store/{sub}/kurumsal/robots
 *   /sitemap.xml → /store/{sub}/kurumsal/sitemap
 *   diğer        → kurumsal 404 (vitrin kapısına ASLA düşmez)
 * www.alanadi → alanadi 301. Paket/yayın kontrolü sayfaların kendisinde
 * (yoksa 404). Platform ve özel katalog alan adlarında null döner.
 */
async function maybeServeKurumsalHost(request: NextRequest, pathname: string): Promise<NextResponse | null> {
  const normalizedHost = stripPort(effectiveHost(request) ?? "");
  if (!normalizedHost || resolveHost(normalizedHost).kind !== "unknown") return null;
  if (normalizedHost.endsWith(`.${appEnv.rootDomain}`) || normalizedHost.endsWith(".localhost")) return null;

  const apex = normalizedHost.replace(/^www\./, "");
  const tenant = await cachedTenantLookup(`kurumsal-domain:${apex}`, () => getTenantByKurumsalDomain(apex));
  if (!tenant) return null;

  if (normalizedHost !== apex) {
    const redirectUrl = new URL(
      `${pathname}${request.nextUrl.search}`,
      `${request.headers.get("x-forwarded-proto") ?? "https"}://${apex}`,
    );
    return NextResponse.redirect(redirectUrl, 301);
  }

  const base = `/store/${tenant.subdomain}/kurumsal`;
  let internalPath: string;
  if (pathname === "/" || pathname === "") {
    internalPath = base;
  } else if (/^\/(kategori|urun)\/[^/]+\/?$/.test(pathname)) {
    internalPath = `${base}${pathname.replace(/\/$/, "")}`;
  } else if (pathname === "/robots.txt") {
    internalPath = `${base}/robots`;
  } else if (pathname === "/sitemap.xml") {
    internalPath = `${base}/sitemap`;
  } else {
    // Bilinmeyen yol: kurumsal kapsamında olmayan bir rota → Next 404 sayfası.
    internalPath = `${base}/bulunamadi/yok`;
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = internalPath;
  return NextResponse.rewrite(rewriteUrl);
}

async function resolveRequestHost(hostHeader: string | null): Promise<HostResolution> {
  const hostResolution = resolveHost(hostHeader);
  const normalizedHost = stripPort(hostHeader ?? "");

  if (hostResolution.kind !== "unknown") {
    return hostResolution;
  }

  const isManagedProductionHost = normalizedHost.endsWith(`.${appEnv.rootDomain}`);
  const isManagedLocalHost = normalizedHost.endsWith(".localhost");

  if (isManagedProductionHost || isManagedLocalHost) {
    return hostResolution;
  }

  const tenant = await cachedTenantLookup(`custom-domain:${normalizedHost}`, () =>
    getTenantByCustomDomain(normalizedHost),
  );
  if (!tenant) {
    return hostResolution;
  }

  return {
    host: normalizedHost,
    kind: "storefront",
    subdomain: tenant.subdomain,
  };
}

function buildStorefrontRedirectUrl(params: {
  host: string;
  pathname: string;
  search: string;
  protocol?: string | null;
}) {
  const redirectUrl = new URL(params.pathname || "/", `${params.protocol ?? "https"}://${params.host}`);
  redirectUrl.search = params.search;
  return redirectUrl;
}

async function maybeRedirectStorefrontRequest(params: {
  request: NextRequest;
  hostResolution: HostResolution;
  normalizedHost: string;
  pathname: string;
}) {
  if (params.hostResolution.kind !== "storefront" || !params.hostResolution.subdomain) {
    return null;
  }

  // Panel içi tema önizlemesi (?preview=1) ekatalox alt alan adından iframe'le
  // açılır; custom domain'e yönlendirilirse aynı-site çerezi çalışmaz. Kapı
  // ve yetki değişmez, yalnız bu kanonik yönlendirme atlanır.
  if (params.request.nextUrl.searchParams.get("preview") === "1") {
    return null;
  }

  const subdomain = params.hostResolution.subdomain;
  const tenant = await cachedTenantLookup(`subdomain:${subdomain}`, () =>
    getStorefrontTenant(subdomain),
  );

  if (!tenant?.custom_domain) {
    return null;
  }

  // custom_domain artık yalnızca süper admin tarafından, DNS gerçekten
  // Vercel'e bağlandığı doğrulandıktan sonra yazılabiliyor (bkz.
  // /api/admin/tenants) — bu yüzden aşağıdaki yönlendirmeler artık güvenli:
  // rastgele bir tenant kendi subdomain'ini dışarıya yönlendiremiyor, çünkü
  // custom_domain kendisi self-servis değil.
  const isManagedSubdomainHost =
    params.normalizedHost.endsWith(`.${appEnv.rootDomain}`) ||
    params.normalizedHost.endsWith(".localhost");
  const isCustomDomainHost = isTenantCustomDomainHost(params.normalizedHost, tenant);
  const forwardedProto = params.request.headers.get("x-forwarded-proto");

  // Doğrulanmış özel alan adı olan tenant'larda kanonik adres artık
  // custom_domain'dir: musteri.ekatalox.com'a gelen ziyaretçi oraya
  // yönlendirilir (SEO açısından da tek kanonik URL doğrusu budur).
  if (isManagedSubdomainHost) {
    const publicPath = toPublicStorefrontPath(
      params.pathname,
      params.hostResolution.subdomain,
    );

    return NextResponse.redirect(
      buildStorefrontRedirectUrl({
        host: tenant.custom_domain,
        pathname: publicPath,
        search: params.request.nextUrl.search,
        protocol: forwardedProto,
      }),
      301,
    );
  }

  if (!isCustomDomainHost) {
    return null;
  }

  const publicPath = toPublicStorefrontPath(
    params.pathname,
    params.hostResolution.subdomain,
  );

  if (publicPath === params.pathname) {
    return null;
  }

  return NextResponse.redirect(
    buildStorefrontRedirectUrl({
      host: params.normalizedHost,
      pathname: publicPath,
      search: params.request.nextUrl.search,
      protocol: forwardedProto,
    }),
    301,
  );
}

// iOS 16.4 altındaki telefonlarda site sessizce çöküyor (bkz.
// lib/compat/legacy-browser.ts). Kapı proxy'de duruyor çünkü vitrin
// sayfaları ISR ile CDN'de tutuluyor — tarayıcıya göre değişen bir yanıt
// sayfanın içinde üretilseydi önbelleğe düşüp herkese servis edilirdi.
async function maybeServeLegacyBrowserNotice({
  request,
  hostResolution,
}: {
  request: NextRequest;
  hostResolution: HostResolution;
}): Promise<NextResponse | null> {
  // "Yine de dene" bağlantısı: çerezi kurup temiz adrese döner, böylece
  // müşteri ısrar ederse sonraki sayfalarda kapı tekrar çıkmaz.
  if (
    request.nextUrl.searchParams.get(LEGACY_BROWSER_BYPASS_PARAM) ===
    LEGACY_BROWSER_BYPASS_VALUE
  ) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete(LEGACY_BROWSER_BYPASS_PARAM);
    const bypassResponse = NextResponse.redirect(cleanUrl, 302);
    bypassResponse.cookies.set({
      name: LEGACY_BROWSER_COOKIE,
      value: "1",
      maxAge: LEGACY_BROWSER_COOKIE_MAX_AGE,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
    bypassResponse.headers.set("Cache-Control", "no-store, max-age=0");
    return bypassResponse;
  }

  if (request.cookies.get(LEGACY_BROWSER_COOKIE)?.value === "1") {
    return null;
  }

  if (!isUnsupportedIosBrowser(request.headers.get("user-agent"))) {
    return null;
  }

  // Mağaza adı ve WhatsApp numarası zaten 60sn önbellekli tenant satırından
  // geliyor; ekstra sorgu eklemiyor.
  let companyName: string | null = null;
  let whatsappNumber: string | null = null;

  if (hostResolution.kind === "storefront" && hostResolution.subdomain) {
    const subdomain = hostResolution.subdomain;
    const tenant = await cachedTenantLookup(`subdomain:${subdomain}`, () =>
      getStorefrontTenant(subdomain),
    );
    companyName = tenant?.company_name ?? null;
    whatsappNumber = tenant?.whatsapp_number ?? null;
  }

  const continueUrl = request.nextUrl.clone();
  continueUrl.searchParams.set(LEGACY_BROWSER_BYPASS_PARAM, LEGACY_BROWSER_BYPASS_VALUE);

  return new NextResponse(
    renderLegacyBrowserNotice({
      companyName,
      whatsappNumber,
      continueHref: `${continueUrl.pathname}${continueUrl.search}`,
    }),
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store, max-age=0",
        "x-robots-tag": "noindex, nofollow",
      },
    },
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Kurumsal alan adında robots/sitemap tenant'a özel; diğer tüm hostlarda
  // eskisi gibi app/robots.ts ve app/sitemap.ts'e gider.
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") {
    return (await maybeServeKurumsalHost(request, pathname)) ?? NextResponse.next();
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    // Kısa link çözücü (bkz. app/f/[code]/route.ts). Şifre/yaş/kota
    // kapılarından muaf: linke basan kişi bayinin WhatsApp'ına düşen
    // sipariş fişini veya konumu açmak isteyen kişidir, vitrine girmek
    // istemiyor. Muaf tutulmazsa istek kapıya yönlenip 307 ile geri döner.
    pathname.startsWith("/f/") ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const host = effectiveHost(request);
  const hostResolution = await resolveRequestHost(host);
  const normalizedHost = stripPort(host ?? "");
  const isManagedProductionHost = normalizedHost.endsWith(`.${appEnv.rootDomain}`);
  const isManagedLocalHost = normalizedHost.endsWith(".localhost");

  // Kurumsal site alan adı: özel katalog alan adı değilse (resolveRequestHost
  // "unknown" döndü) ve bir tenant'ın kurumsal_domain'iyse burada biter —
  // vitrin kanonik yönlendirmesi ve kapılar hiç çalışmaz.
  if (hostResolution.kind === "unknown" && !isManagedProductionHost && !isManagedLocalHost) {
    const kurumsalResponse = await maybeServeKurumsalHost(request, pathname);
    if (kurumsalResponse) {
      return kurumsalResponse;
    }
  }

  if (hostResolution.kind === "unknown" && (isManagedProductionHost || isManagedLocalHost)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (hostResolution.kind === "unknown") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const legacyBrowserResponse = await maybeServeLegacyBrowserNotice({
    request,
    hostResolution,
  });

  if (legacyBrowserResponse) {
    return legacyBrowserResponse;
  }

  if (hostResolution.kind === "marketing") {
    return NextResponse.next();
  }

  // Katalog adresindeki (alt alan adı / özel alan adı) eski /kurumsal yolları:
  // kurumsal site artık yalnız tenant'ın kendi kök alan adında. Alan adı
  // bağlı, paket kapsıyor ve site yayındaysa oradaki karşılığına 301; yoksa
  // 404. Kanonik custom_domain yönlendirmesinden ÖNCE (çift 301 olmasın).
  if (
    hostResolution.kind === "storefront" &&
    hostResolution.subdomain &&
    (pathname === "/kurumsal" || pathname.startsWith("/kurumsal/"))
  ) {
    const subdomain = hostResolution.subdomain;
    const kurumsalTenant = await cachedTenantLookup(`subdomain:${subdomain}`, () =>
      getStorefrontTenant(subdomain),
    );
    const kurumsalDomain = kurumsalTenant?.kurumsal_domain?.trim().toLowerCase();

    if (
      kurumsalTenant &&
      kurumsalDomain &&
      hasKurumsalSiteAccess(kurumsalTenant) &&
      (await cachedKurumsalPublished(kurumsalTenant.id))
    ) {
      const rest = pathname.slice("/kurumsal".length) || "/";
      const target = new URL(rest, `https://${kurumsalDomain}`);
      return NextResponse.redirect(target, 301);
    }

    const notFoundUrl = request.nextUrl.clone();
    notFoundUrl.pathname = `/store/${subdomain}/kurumsal/bulunamadi/yok`;
    notFoundUrl.search = "";
    const notFoundResponse = NextResponse.rewrite(notFoundUrl);
    notFoundResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    return notFoundResponse;
  }

  const redirectResponse = await maybeRedirectStorefrontRequest({
    request,
    hostResolution,
    normalizedHost,
    pathname,
  });

  if (redirectResponse) {
    return redirectResponse;
  }

  // Magnet devri: /t/{kod} vitrine ?m={kod} ile yönlendirir (bkz.
  // app/t/[slug]/route.ts). Kod burada — sayfalar ISR önbellekli olduğu ve
  // aşağıdaki kota/yaş/gate dalları query'yi sildiği için çerezi
  // set edebilecek TEK yer burası — kalıcı HttpOnly çereze çevrilir ve
  // parametre düşürülerek kendine 302 atılır (kod adres çubuğunda ve
  // referer'da kalmasın). Koşulsuz üzerine yazma = son okutulan kazanır.
  if (hostResolution.kind === "storefront" && hostResolution.subdomain) {
    const magnetParam = request.nextUrl.searchParams.get(MAGNET_QUERY_PARAM);
    const magnetCode = magnetParam?.trim().toLowerCase().replace(/[\s-]/g, "") ?? "";

    if (magnetCode && /^[a-z0-9]{4,16}$/.test(magnetCode)) {
      const cleanUrl = request.nextUrl.clone();
      cleanUrl.searchParams.delete(MAGNET_QUERY_PARAM);

      // Magnetle şifresiz giriş açık tenant'ta kod DB'den doğrulanıp fiyat
      // listesi çerezi de kurulmalı; DB işi proxy'de değil magnet-enter
      // route'unda yapılır (çerezleri o kurar, temiz adrese o döndürür).
      const magnetTenant = await cachedTenantLookup(
        `subdomain:${hostResolution.subdomain}`,
        () => getStorefrontTenant(hostResolution.subdomain as string),
      );

      if (magnetTenant?.is_password_protected && magnetTenant.magnet_login_enabled) {
        const enterUrl = request.nextUrl.clone();
        enterUrl.pathname = "/api/storefront/magnet-enter";
        enterUrl.search = "";
        enterUrl.searchParams.set("subdomain", hostResolution.subdomain);
        enterUrl.searchParams.set("code", magnetCode);
        enterUrl.searchParams.set("redirectTo", `${cleanUrl.pathname}${cleanUrl.search}`);

        const enterResponse = NextResponse.redirect(enterUrl, 302);
        enterResponse.headers.set("Cache-Control", "no-store, max-age=0");
        return enterResponse;
      }

      const magnetResponse = NextResponse.redirect(cleanUrl, 302);
      magnetResponse.cookies.set({
        name: getStorefrontMagnetCookieName(hostResolution.subdomain),
        value: magnetCode,
        maxAge: MAGNET_COOKIE_MAX_AGE,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
      });
      magnetResponse.headers.set("Cache-Control", "no-store, max-age=0");
      return magnetResponse;
    }
  }

  // Oturum çerezi olmayan ziyaretçi her koşulda şifre ekranını görecek;
  // onu ISR ile CDN'de tutulan /gate sayfasına yönlendir ki istek
  // serverless fonksiyona hiç inmesin (cold start'ı devre dışı bırakır).
  // Çerezi olup da süresi/değeri geçersiz olanları dinamik sayfa yakalar.
  if (hostResolution.kind === "storefront" && hostResolution.subdomain) {
    // Aylık ziyaretçi kotası dolan tenant'lar, oturum çerezinden bağımsız
    // olarak yoğunluk sayfasına yönlendirilir. Bayrak zaten cachedTenantLookup
    // ile 60sn önbelleklenen tenant satırından okunur, ekstra sorgu eklemez.
    const tenant = await cachedTenantLookup(`subdomain:${hostResolution.subdomain}`, () =>
      getStorefrontTenant(hostResolution.subdomain as string),
    );

    // Sipariş takip sayfası (/siparis/{token}): müşteri WhatsApp'taki linkten
    // gelir; şifre/yaş/kota kapılarından bağımsız açılmalı — token'ın kendisi
    // yetkidir. Kota dolu olsa da müşteri verdiği siparişin durumunu görebilir.
    // /siparislerim: telefon numarasıyla sipariş listesi — aynı gerekçe.
    // /bildirim: tek-link bildirim daveti — ana ekran uygulamasında çerez
    // olmayabilir, sayfa şifre kapısını kendisi gösterir/çözer.
    if (pathname.startsWith("/siparis/") || pathname === "/siparislerim" || pathname === "/bildirim") {
      const trackUrl = request.nextUrl.clone();
      trackUrl.pathname = `/store/${hostResolution.subdomain}${pathname}`;
      const trackResponse = NextResponse.rewrite(trackUrl);
      trackResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
      return trackResponse;
    }

    if (tenant?.visitor_quota_exceeded) {
      const quotaUrl = request.nextUrl.clone();
      quotaUrl.pathname = `/store/${hostResolution.subdomain}/yogunluk`;
      quotaUrl.search = "";

      const quotaResponse = NextResponse.rewrite(quotaUrl);
      quotaResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
      return quotaResponse;
    }

    // Market tipi tenant 18+ doğrulamayı açtıysa, fiyat/şifre gate'inden
    // ÖNCE bu kontrolden geçilmesi gerekir; ayrı bir çerezle takip edilir ki
    // fiyat listesi seçimiyle karışmasın (bkz. tier-cookie.ts).
    if (tenant?.business_type === "market" && tenant.age_verification_required) {
      const hasAgeCookie = request.cookies.has(
        getStorefrontAgeCookieName(hostResolution.subdomain),
      );

      if (!hasAgeCookie) {
        const ageGateUrl = request.nextUrl.clone();
        ageGateUrl.pathname = `/store/${hostResolution.subdomain}/yas-dogrulama`;
        ageGateUrl.search = "";

        const ageGateResponse = NextResponse.rewrite(ageGateUrl);
        ageGateResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
        return ageGateResponse;
      }
    }

    const hasTierCookie = request.cookies.has(
      getStorefrontTierCookieName(hostResolution.subdomain),
    );

    if (!hasTierCookie) {
      // Magnetle şifresiz giriş: daha önce magnet okutmuş cihazda (kalıcı
      // magnet çerezi) fiyat listesi çerezi yoksa/süresi dolduysa şifre
      // ekranı yerine magnet-enter'dan sessizce yeniden girilir. Kod orada
      // DB'den doğrulanır; geçersizse çerez silinir ve bir sonraki istek
      // normal şifre kapısına düşer (döngü yok).
      if (tenant?.is_password_protected && tenant.magnet_login_enabled) {
        const magnetCookie =
          request.cookies.get(getStorefrontMagnetCookieName(hostResolution.subdomain))
            ?.value ?? "";

        if (/^[a-z0-9]{4,16}$/.test(magnetCookie)) {
          const enterUrl = request.nextUrl.clone();
          enterUrl.pathname = "/api/storefront/magnet-enter";
          enterUrl.search = "";
          enterUrl.searchParams.set("subdomain", hostResolution.subdomain);
          enterUrl.searchParams.set("code", magnetCookie);
          enterUrl.searchParams.set(
            "redirectTo",
            `${pathname}${request.nextUrl.search}`,
          );

          const enterResponse = NextResponse.redirect(enterUrl, 302);
          enterResponse.headers.set("Cache-Control", "no-store, max-age=0");
          return enterResponse;
        }
      }

      const gateUrl = request.nextUrl.clone();
      gateUrl.pathname = `/store/${hostResolution.subdomain}/gate`;
      gateUrl.search = "";

      const gateResponse = NextResponse.rewrite(gateUrl);
      gateResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
      return gateResponse;
    }
  }

  const rewrittenPath = getInternalPathFromResolution(hostResolution, pathname);
  const url = request.nextUrl.clone();
  url.pathname = rewrittenPath;

  const response = NextResponse.rewrite(url);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: "/:path*",
};
