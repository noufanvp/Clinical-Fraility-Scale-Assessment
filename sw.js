// Service Worker for Clinical Frailty Scale Survey App
const CACHE_NAME = "cfs-survey-v1.0.0";
const CACHE_URLS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "https://unpkg.com/idb@7/build/umd.js",
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching files");
        return cache.addAll(CACHE_URLS);
      })
      .catch((err) => console.log("Service Worker: Cache failed", err))
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker: Clearing old cache");
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return (
        response ||
        fetch(event.request)
          .then((fetchResponse) => {
            // Clone the response before caching
            const responseClone = fetchResponse.clone();

            // Cache successful responses
            if (fetchResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }

            return fetchResponse;
          })
          .catch((err) => {
            console.log("Service Worker: Fetch failed", err);

            // Return a custom offline page if available
            if (event.request.destination === "document") {
              return caches.match("./index.html");
            }
          })
      );
    })
  );
});

// Background sync for future data synchronization
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered");

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Add your sync logic here if needed
      Promise.resolve()
    );
  }
});

// Push notifications (for future use)
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push event received");

  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body || "New notification from CFS Survey",
      icon: "./icons/icon-192.png",
      badge: "./icons/icon-192.png",
      vibrate: [100, 50, 100],
      data: data.url || "./",
      actions: [
        {
          action: "open",
          title: "Open App",
          icon: "./icons/icon-192.png",
        },
        {
          action: "close",
          title: "Close",
          icon: "./icons/icon-192.png",
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "CFS Survey", options)
    );
  }
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "open" || !event.action) {
    event.waitUntil(clients.openWindow(event.notification.data || "./"));
  }
});
