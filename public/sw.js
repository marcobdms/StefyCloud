// Service Worker para Stefany Cloud
// Maneja notificaciones push y caché básico

const CACHE_NAME = "stefany-cloud-v1";

// Instala el service worker
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Escucha notificaciones push del servidor
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = { title: "Stefany Cloud", body: "Tienes un recordatorio pendiente", url: "/reminders" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: { url: data.url },
      requireInteraction: false,
    })
  );
});

// Al tocar la notificación, abre la app en la ruta correcta
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/reminders";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const focused = clients.find((c) => c.focus);
      if (focused) {
        focused.focus();
        focused.navigate(url);
      } else {
        self.clients.openWindow(url);
      }
    })
  );
});
