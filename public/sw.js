// ReservaLab PWA service worker with Web Push support.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Pass-through; browser handles navigation.
});

self.addEventListener("push", (event) => {
  let payload = { title: "Nova reserva", body: "Você recebeu uma nova reserva.", url: "/" };
  try {
    if (event.data) {
      const data = event.data.json();
      payload = { ...payload, ...data };
    }
  } catch {
    try {
      const text = event.data && event.data.text();
      if (text) payload.body = text;
    } catch { /* noop */ }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.tag || "reservalab-reserva",
      renotify: true,
      data: { url: payload.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        try {
          const u = new URL(client.url);
          if (u.pathname.startsWith(targetUrl.split("?")[0])) {
            return client.focus();
          }
        } catch { /* noop */ }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
