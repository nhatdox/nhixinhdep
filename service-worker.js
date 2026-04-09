const APP_VERSION = "20260405";
const CACHE_NAME = `nhatdo-love-${APP_VERSION}`;
const CORE_ASSETS = [
    "./",
    "./index.html",
    "./manifest.webmanifest",
    `./manifest.webmanifest?v=${APP_VERSION}`,
    "./assets/css/style.css",
    `./assets/css/style.css?v=${APP_VERSION}`,
    "./assets/js/main.js",
    `./assets/js/main.js?v=${APP_VERSION}`,
    "./assets/data/notes.json",
    "./assets/icons/app-icon.svg"
];
const NETWORK_FIRST_EXTENSIONS = [".html", ".css", ".js", ".json", ".webmanifest"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener("message", (event) => {
    if (event.data?.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) return;
    const isNetworkFirstRequest =
        event.request.mode === "navigate" ||
        NETWORK_FIRST_EXTENSIONS.some((ext) => requestUrl.pathname.endsWith(ext));

    if (isNetworkFirstRequest) {
        event.respondWith(
            fetch(event.request, { cache: "no-store" })
                .then((response) => {
                    if (response.ok) {
                        const clonedResponse = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
                    }
                    return response;
                })
                .catch(() =>
                    caches.match(event.request).then((cachedResponse) => {
                        if (cachedResponse) return cachedResponse;
                        if (event.request.mode === "navigate") {
                            return caches.match("./index.html");
                        }
                        return Response.error();
                    })
                )
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then((response) => {
                if (response.ok) {
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
                }
                return response;
            });
        })
    );
});
