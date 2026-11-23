const CACHE_NAME = "neuro-toeic-pro-v22.5";
const CHAM_OFFLINE_CACHE = "cham-toeic-offline-v1";
const CHAM_JSON_CACHE = "cham-toeic-json-bank-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./tests/index.html",
  "./styles.css",
  "./styles/tokens.css?v=21.0",
  "./styles/base.css?v=21.0",
  "./styles/layout.css?v=21.0",
  "./styles/components.css?v=19.5",
  "./styles/cham-hub.css?v=21.0",
  "./styles/v21-remake.css?v=22.5",
  "./data.js?v=19.0",
  "./js/part7Data.js?v=19.0",
  "./js/part56Data.js?v=19.0",
  "./js/chamCatalog.js?v=22.0",
  "./js/testDifficultyData.js?v=22.0",
  "./js/toeicMaterialsData.js?v=19.3",
  "./data/cham_tests/test-au-vao-01.json",
  "./manifest.json",
  "./js/main.js?v=22.5",
  "./js/dashboardPractice.js?v=22.1",
  "./js/chamTestCenter.js?v=22.5",
  "./js/materialsCenter.js?v=22.1",
  "./js/toeicVocabData.js?v=19.0",
  "./js/toeicStrategyData.js?v=19.4",
  "./js/store.js",
  "./js/idb.js",
  "./js/audioEngine.js?v=19.5",
  "./js/voiceStudio.js",
  "./js/transcriptSync.js?v=19.4",
  "./js/examSimulator.js",
  "./js/vocabSrs.js?v=19.4",
  "./js/analytics.js?v=22.1",
  "./js/uiIcons.js",
  "./js/renderers.js?v=19.4",
  "./assets/icons/icon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable.png",
  "./media/img/ets2019_p1_t6_q1.png",
  "./media/img/ets2019_p1_t6_q2.png",
  "./media/img/ets2019_p1_t6_q3.png",
  "./media/img/ets2019_p1_t6_q4.png",
  "./media/img/ets2019_p1_t6_q5.png",
  "./media/img/ets2019_p1_t6_q6.png",
  "./media/img/ets2019_p1_t7_q1.png",
  "./media/img/ets2019_p1_t7_q2.png",
  "./media/img/ets2019_p1_t7_q3.png",
  "./media/img/ets2019_p1_t7_q4.png",
  "./media/img/ets2019_p1_t7_q5.png",
  "./media/img/ets2019_p1_t7_q6.png",
  "./media/img/ets2019_test6_q95_97.webp",
  "./media/img/ets2019_test6_q98_100.png",
  "./media/img/hackers3_test4_q95_97.jpg",
  "./media/img/hackers3_test4_q98_100.jpg",
  "./assets/fonts/inter-400-vn.woff2",
  "./assets/fonts/inter-400-latin-ext.woff2",
  "./assets/fonts/inter-400-latin.woff2",
  "./assets/fonts/inter-400i-vn.woff2",
  "./assets/fonts/inter-400i-latin-ext.woff2",
  "./assets/fonts/inter-400i-latin.woff2",
  "./assets/fonts/inter-500-vn.woff2",
  "./assets/fonts/inter-500-latin-ext.woff2",
  "./assets/fonts/inter-500-latin.woff2",
  "./assets/fonts/inter-600-vn.woff2",
  "./assets/fonts/inter-600-latin-ext.woff2",
  "./assets/fonts/inter-600-latin.woff2",
  "./assets/fonts/inter-700-vn.woff2",
  "./assets/fonts/inter-700-latin-ext.woff2",
  "./assets/fonts/inter-700-latin.woff2",
  "./assets/fonts/jetbrains-mono-500-vn.woff2",
  "./assets/fonts/jetbrains-mono-500-latin.woff2",
  "./assets/fonts/jetbrains-mono-700-vn.woff2",
  "./assets/fonts/jetbrains-mono-700-latin.woff2",
  "./assets/fonts/noto-sans-ipa-400.woff2",
  "./assets/fonts/noto-sans-ipa-500.woff2"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        APP_SHELL.map(async (entry) => {
          const absUrl = new URL(entry, self.location.href).href;
          const resp = await fetch(absUrl, { cache: "reload" });
          if (resp && resp.ok) {
            await cache.put(absUrl, resp);
          }
        })
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== CHAM_OFFLINE_CACHE && k !== CHAM_JSON_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function buildOfflineResponse(req, url) {
  const accept = req.headers.get("accept") || "";
  const isJson = url.pathname.endsWith(".json") || accept.includes("application/json");
  if (isJson) {
    return new Response(
      JSON.stringify({
        offline: true,
        error: "offline_not_cached",
        path: url.pathname,
        message: "Offline and not cached"
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          "X-SW-Offline": "1"
        }
      }
    );
  }
  if (req.mode === "navigate" || accept.includes("text/html")) {
    return new Response(
      "<!DOCTYPE html><html lang='vi'><head><meta charset='UTF-8'><title>Offline</title></head><body style='font-family:sans-serif;padding:32px;background:#e6f1fc;color:#0b2239;'><h2>Mất kết nối mạng</h2><p>Trang này chưa có trong bộ nhớ đệm Offline. Hãy kiểm tra kết nối mạng rồi tải lại trang.</p></body></html>",
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-SW-Offline": "1"
        }
      }
    );
  }
  return new Response("", {
    status: 503,
    statusText: "Service Unavailable",
    headers: {
      "Cache-Control": "no-store",
      "X-SW-Offline": "1"
    }
  });
}

async function matchAcrossAllCaches(urlHref) {
  const shellCache = await caches.open(CACHE_NAME);
  const fromShell = await shellCache.match(urlHref, { ignoreSearch: true });
  if (fromShell) return fromShell;

  const jsonCache = await caches.open(CHAM_JSON_CACHE);
  const fromJson = await jsonCache.match(urlHref, { ignoreSearch: true });
  if (fromJson) return fromJson;

  const chamCache = await caches.open(CHAM_OFFLINE_CACHE);
  const fromCham = await chamCache.match(urlHref, { ignoreSearch: true });
  if (fromCham) return fromCham;

  return null;
}

async function handleRangeRequest(request, cachedResponse) {
  const rangeHeader = request.headers.get("range");
  if (!rangeHeader) return cachedResponse;
  if (!cachedResponse || cachedResponse.type === "opaque" || !cachedResponse.ok) {
    return cachedResponse;
  }

  const buffer = await cachedResponse.arrayBuffer();
  const total = buffer.byteLength;
  const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
  if (!match) return cachedResponse;

  const start = Number(match[1]);
  const end = match[2] ? Math.min(Number(match[2]), total - 1) : total - 1;

  if (start >= total || start > end) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${total}` }
    });
  }

  const sliced = buffer.slice(start, end + 1);
  return new Response(sliced, {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type": cachedResponse.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Content-Length": String(sliced.byteLength),
      "Accept-Ranges": "bytes"
    }
  });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.cache === "only-if-cached" && req.mode !== "same-origin") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    if (
      url.hostname.includes("datwy.github.io") ||
      url.hostname.includes("chamtoeic.edu.vn") ||
      url.hostname.includes("storage.googleapis.com")
    ) {
      event.respondWith(
        caches.open(CHAM_OFFLINE_CACHE).then(async (cache) => {
          const cached = await cache.match(req.url);
          if (cached) {
            return req.headers.get("range") ? handleRangeRequest(req, cached) : cached;
          }
          try {
            return await fetch(req);
          } catch (_) {
            return buildOfflineResponse(req, url);
          }
        })
      );
    }
    return;
  }

  // Media files (local /media/ OR same-origin GitHub Pages media repos /cham-toeic-media-*): Cache-First with HTTP 206 Range support
  if (url.pathname.includes("/media/") || url.pathname.includes("/cham-toeic-media-")) {
    const targetCacheName = url.pathname.includes("/cham-toeic-media-") ? CHAM_OFFLINE_CACHE : CACHE_NAME;
    event.respondWith(
      caches.open(targetCacheName).then(async (cache) => {
        const cached = await cache.match(url.href, { ignoreSearch: true });
        if (cached) {
          return req.headers.get("range") ? handleRangeRequest(req, cached) : cached;
        }
        try {
          const networkResp = await fetch(new Request(url.href));
          if (networkResp && networkResp.status === 200) {
            try {
              await cache.put(url.href, networkResp.clone());
            } catch (_) {}
            return req.headers.get("range") ? handleRangeRequest(req, networkResp) : networkResp;
          }
          return networkResp;
        } catch (_) {
          return buildOfflineResponse(req, url);
        }
      })
    );
    return;
  }

  // Local ChamTOEIC Test JSON files: Network-First with persistent CHAM_JSON_CACHE fallback
  if (url.pathname.includes("/data/cham_tests/") && url.pathname.endsWith(".json")) {
    event.respondWith(
      caches.open(CHAM_JSON_CACHE).then(async (jsonCache) => {
        try {
          const fresh = await fetch(new Request(url.href, { cache: "no-store", credentials: "same-origin" }));
          if (fresh && fresh.status === 200) {
            try {
              await jsonCache.put(url.href, fresh.clone());
            } catch (_) {}
          }
          return fresh;
        } catch (_) {
          const cached = await matchAcrossAllCaches(url.href);
          if (cached) return cached;
          return buildOfflineResponse(req, url);
        }
      })
    );
    return;
  }

  // App Shell (HTML, CSS, JS, Fonts): Network-First with multi-cache offline fallback (never rejects!)
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const fetchTarget = req.mode === "navigate"
          ? req
          : new Request(url.href, { cache: "no-store", credentials: "same-origin" });
        const fresh = await fetch(fetchTarget);
        if (fresh && fresh.status === 200) {
          try {
            await cache.put(url.href, fresh.clone());
          } catch (_) {}
        }
        return fresh;
      } catch (_) {
        const cached = await matchAcrossAllCaches(url.href);
        if (cached) return cached;
        if (req.mode === "navigate") {
          const fallback = await cache.match(new URL("./index.html", self.location.href).href, { ignoreSearch: true });
          if (fallback) return fallback;
        }
        return buildOfflineResponse(req, url);
      }
    })
  );
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  const work = (async () => {
    const source = event.source;
    const cache = await caches.open(CACHE_NAME);

    if (data.type === "CACHE_CHAM_JSON_BANK" && Array.isArray(data.urls)) {
      const urls = Array.from(new Set(data.urls));
      const jsonCache = await caches.open(CHAM_JSON_CACHE);
      let cachedCount = 0;
      let nextIdx = 0;
      let consecutiveNetFails = 0;
      const concurrency = Math.min(3, Math.max(1, urls.length));
      const worker = async () => {
        while (nextIdx < urls.length && consecutiveNetFails < 2) {
          const relUrl = urls[nextIdx++];
          try {
            const absUrl = new URL(relUrl, self.location.href).href;
            const existing = await jsonCache.match(absUrl, { ignoreSearch: true });
            if (existing) {
              cachedCount++;
              consecutiveNetFails = 0;
            } else {
              const resp = await fetch(absUrl, { credentials: "same-origin" });
              if (resp && resp.status === 200) {
                try {
                  await jsonCache.put(absUrl, resp);
                  cachedCount++;
                } catch (_) {}
                consecutiveNetFails = 0;
              }
            }
          } catch (_) {
            consecutiveNetFails++;
          }
        }
      };
      await Promise.all(Array.from({ length: concurrency }, () => worker()));
      if (source) {
        source.postMessage({
          type: "CHAM_JSON_BANK_READY",
          cached: cachedCount,
          total: urls.length
        });
      }
      return;
    }

    if (data.type === "CACHE_MEDIA_LIST" && Array.isArray(data.urls)) {
      const urls = Array.from(new Set(data.urls));
      let done = 0;
      let saved = 0;
      let failed = 0;
      for (const relUrl of urls) {
        const absUrl = new URL(relUrl, self.location.href).href;
        let ok = false;
        try {
          const existing = await cache.match(absUrl);
          if (existing) {
            ok = true;
          } else {
            const resp = await fetch(absUrl);
            if (resp && resp.ok) {
              await cache.put(absUrl, resp);
              ok = true;
            }
          }
        } catch (_) {
          ok = false;
        }
        if (ok) saved++;
        else failed++;
        done++;
        if (source) {
          source.postMessage({ type: "CACHE_PROGRESS", done: saved, processed: done, failed, total: urls.length });
        }
      }
      if (source) {
        source.postMessage({ type: "CACHE_COMPLETE", total: saved, targetTotal: urls.length, failed });
      }
    }

    if (data.type === "GET_CACHE_STATUS") {
      const keys = await cache.keys();
      let mediaCached = 0;
      if (Array.isArray(data.urls) && data.urls.length > 0) {
        const keySet = new Set(keys.map((k) => k.url));
        const uniqueTargets = Array.from(new Set(data.urls.map((u) => new URL(u, self.location.href).href)));
        mediaCached = uniqueTargets.filter((u) => keySet.has(u)).length;
      } else {
        mediaCached = keys.filter((k) => k.url.includes("/media/")).length;
      }
      if (source) {
        source.postMessage({
          type: "CACHE_STATUS",
          totalCached: keys.length,
          mediaCached
        });
      }
    }

    if (data.type === "CLEAR_MEDIA_CACHE") {
      const keys = await cache.keys();
      await Promise.all(
        keys.filter((k) => k.url.includes("/media/")).map((k) => cache.delete(k))
      );
      if (source) {
        source.postMessage({ type: "CACHE_CLEARED" });
      }
    }
  })();

  if (typeof event.waitUntil === "function") {
    event.waitUntil(work);
  }
});
