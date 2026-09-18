// Sipariş durumu bildirimleri için servis worker. Yalnız push alır ve
// bildirime tıklanınca takip sayfasını açar; sayfa önbellekleme yapmaz.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const title = data.title || "Sipariş güncellendi";
  const options = {
    body: data.body || "",
    icon: data.icon || "/favicon.ico",
    badge: data.icon || "/favicon.ico",
    tag: data.tag || "order",
    renotify: true,
    // image: Android Chrome'da bildirimde büyük görsel (ürün fotoğrafı);
    // iOS ve masaüstü çoğunlukla yok sayar. vibrate yalnız Android.
    image: data.image || undefined,
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
