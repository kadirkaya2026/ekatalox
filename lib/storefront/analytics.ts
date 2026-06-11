type StorefrontAnalyticsEvent = "visit" | "product_view" | "cart_add" | "search";

const VISITOR_KEY_PREFIX = "ekatalox_visitor_";
const SESSION_TRACK_PREFIX = "ekatalox_analytics_session_";

function getVisitorKey(tenantId: string) {
  const storageKey = `${VISITOR_KEY_PREFIX}${tenantId}`;
  const existing = window.localStorage.getItem(storageKey);

  if (existing) {
    return existing;
  }

  const visitorKey = crypto.randomUUID();
  window.localStorage.setItem(storageKey, visitorKey);
  return visitorKey;
}

function shouldTrackSessionEvent(tenantId: string, eventKey: string) {
  const storageKey = `${SESSION_TRACK_PREFIX}${tenantId}_${eventKey}`;

  if (window.sessionStorage.getItem(storageKey)) {
    return false;
  }

  window.sessionStorage.setItem(storageKey, "1");
  return true;
}

function sendAnalyticsTo(url: string, payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

function sendAnalytics(payload: {
  subdomain: string;
  event: StorefrontAnalyticsEvent;
  productId?: string;
  visitorKey?: string;
  query?: string;
  resultCount?: number;
}) {
  sendAnalyticsTo("/api/storefront/analytics", payload);
}

export function trackStorefrontVisit(tenantId: string, subdomain: string) {
  if (!shouldTrackSessionEvent(tenantId, "visit")) {
    return;
  }

  sendAnalytics({
    subdomain,
    event: "visit",
    visitorKey: getVisitorKey(tenantId),
  });
}

const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Start a presence heartbeat for the open storefront tab. Pings on mount and
 * every 30s while the tab is visible, so reports can show who is online now.
 * Returns a cleanup function for React effect teardown.
 */
export function startStorefrontHeartbeat(tenantId: string, subdomain: string) {
  const visitorKey = getVisitorKey(tenantId);

  const sendHeartbeat = () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }

    sendAnalyticsTo("/api/storefront/presence", { subdomain, visitorKey });
  };

  sendHeartbeat();
  const intervalId = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
  document.addEventListener("visibilitychange", sendHeartbeat);

  return () => {
    window.clearInterval(intervalId);
    document.removeEventListener("visibilitychange", sendHeartbeat);
  };
}

export function trackStorefrontProductView(
  tenantId: string,
  subdomain: string,
  productId: string,
) {
  if (!shouldTrackSessionEvent(tenantId, `view:${productId}`)) {
    return;
  }

  sendAnalytics({
    subdomain,
    event: "product_view",
    productId,
    visitorKey: getVisitorKey(tenantId),
  });
}

export function trackStorefrontCartAdd(subdomain: string, productId: string) {
  sendAnalytics({
    subdomain,
    event: "cart_add",
    productId,
  });
}

export function trackStorefrontSearch(
  tenantId: string,
  subdomain: string,
  params: { query: string; resultCount: number },
) {
  const normalized = params.query.trim().toLocaleLowerCase("tr-TR");

  if (normalized.length < 2) {
    return;
  }

  if (!shouldTrackSessionEvent(tenantId, `search:${normalized}`)) {
    return;
  }

  sendAnalytics({
    subdomain,
    event: "search",
    query: normalized,
    resultCount: params.resultCount,
  });
}
