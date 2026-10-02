// Service worker Siap Nanjak: membuat aplikasi tetap bisa dibuka tanpa internet.
// Naikkan nomor versi ini setiap kali index.html diubah.
const CACHE = "siap-nanjak-v17";
const LOCAL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./privacy.html"];
const REMOTE = [
  "https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(LOCAL);
    await Promise.allSettled(REMOTE.map(async u => c.put(u, await fetch(u, { mode: "no-cors" }))));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Halaman utama: ambil versi terbaru dulu, pakai simpanan kalau offline.
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        const c = await caches.open(CACHE); c.put("./index.html", res.clone());
        return res;
      } catch (err) {
        return (await caches.match("./index.html")) || (await caches.match("./"));
      }
    })());
    return;
  }
  // File lain (ikon, pustaka QR, huruf): pakai simpanan dulu, lalu simpan yang baru.
  e.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === "opaque")) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
      return res;
    } catch (err) { return hit || Response.error(); }
  })());
});
