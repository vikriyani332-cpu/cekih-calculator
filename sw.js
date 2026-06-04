// ==============================================
// KONFIGURASI SERVICE WORKER
// ==============================================
const VERSI_CACHE = "score-cekih-v1.1.0";
const BERKAS_UNTUK_DI_CACHE = [
    "/",
    "/index.html",
    "/style.css",
    "/app.js",
    "/manifest.json",
    "/classic-192.png",
    "/classic-512.png",
    "/godofgambler.wav",
    "/dimulaidari0.wav"
];

// ==============================================
// PASANG & BUAT CACHE AWAL
// ==============================================
self.addEventListener("install", (peristiwa) => {
    peristiwa.waitUntil(
        caches.open(VERSI_CACHE)
            .then((cache) => {
                return cache.addAll(BERKAS_UNTUK_DI_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// ==============================================
// AKTIFKAN & HAPUS CACHE LAMA
// ==============================================
self.addEventListener("activate", (peristiwa) => {
    peristiwa.waitUntil(
        caches.keys()
            .then((semuaCache) => {
                return Promise.all(
                    semuaCache.filter((namaCache) => namaCache !== VERSI_CACHE)
                        .map((namaCacheLama) => caches.delete(namaCacheLama))
                );
            })
            .then(() => self.clients.claim())
    );
});

// ==============================================
// TANGANI PERMINTAAN ASET
// ==============================================
self.addEventListener("fetch", (peristiwa) => {
    // Hanya tangani permintaan yang menggunakan protokol HTTP/HTTPS
    if (!peristiwa.request.url.startsWith("http")) return;

    peristiwa.respondWith(
        caches.match(peristiwa.request)
            .then((resDariCache) => {
                if (resDariCache) {
                    // Kembalikan dari cache, lalu perbarui di latar belakang
                    const janjiPembaruan = fetch(peristiwa.request)
                        .then((resDariJaringan) => {
                            return caches.open(VERSI_CACHE)
                                .then((cache) => {
                                    cache.put(peristiwa.request, resDariJaringan.clone());
                                    return resDariJaringan;
                                });
                        })
                        .catch(() => resDariCache);
                    return resDariCache;
                }

                // Jika tidak ada di cache, ambil dari jaringan dan simpan
                return fetch(peristiwa.request)
                    .then((resDariJaringan) => {
                        // Simpan hanya jika permintaan berhasil
                        if (resDariJaringan && resDariJaringan.status === 200 && resDariJaringan.type === "basic") {
                            return caches.open(VERSI_CACHE)
                                .then((cache) => {
                                    cache.put(peristiwa.request, resDariJaringan.clone());
                                    return resDariJaringan;
                                });
                        }
                        return resDariJaringan;
                    })
                    .catch(() => {
                        // Jika jaringan mati dan halaman utama diminta, kembalikan halaman utama dari cache
                        if (peristiwa.request.mode === "navigate") {
                            return caches.match("/index.html");
                        }
                        return new Response("Tidak dapat memuat konten saat ini. Periksa koneksi internet Anda.");
                    });
            })
    );
});

// ==============================================
// TANGANI PESAN DARI APLIKASI
// ==============================================
self.addEventListener("message", (peristiwa) => {
    if (peristiwa.data && peristiwa.data.tipe === "HAPUS_CACHE") {
        peristiwa.waitUntil(
            caches.delete(VERSI_CACHE)
                .then(() => peristiwa.ports[0]?.postMessage({ berhasil: true }))
        );
    }
});
