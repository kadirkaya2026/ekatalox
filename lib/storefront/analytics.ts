type StorefrontAnalyticsEvent = "visit" | "product_view" | "cart_add";

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

function sendAnalytics(payload: {
  subdomain: string;
  event: StorefrontAnalyticsEvent;
  productId?: string;
  visitorKey?: string;
}) {
  const body = JSON.stringify(payload);
  const url = "/api/storefront/analytics";

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
