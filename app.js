// ==============================================
// KONFIGURASI DASAR & VARIABEL GLOBAL
// ==============================================
const APLIKASI = {
    versi: "1.1.7",
    nama: "Score Cekih",
    pembuat: "Sadewa Corp",
    defaultTarget: 1000,
    maxPerPuteran: 1000,
    localStorageKey: "score_cekih_data"
};

let appState = {
    halaman: "loading",
    tema: "gelap",
    ronde: 1,
    puteran: 0,
    targetKemenangan: APLIKASI.defaultTarget,
    pemain: [
        { id: "a", nama: "Pemain A", skor: 0, posisiSebelumnya: 1, bintang: 0, dibakar: 0, membakar: 0, tripleBakar: 0, skorTertinggi: 0, dapatTerbakar: false },
        { id: "b", nama: "Pemain B", skor: 0, posisiSebelumnya: 2, bintang: 0, dibakar: 0, membakar: 0, tripleBakar: 0, skorTertinggi: 0, dapatTerbakar: false },
        { id: "c", nama: "Pemain C", skor: 0, posisiSebelumnya: 3, bintang: 0, dibakar: 0, membakar: 0, tripleBakar: 0, skorTertinggi: 0, dapatTerbakar: false },
        { id: "d", nama: "Pemain D", skor: 0, posisiSebelumnya: 4, bintang: 0, dibakar: 0, membakar: 0, tripleBakar: 0, skorTertinggi: 0, dapatTerbakar: false }
    ],
    riwayat: [],
    arsipPemain: {},
    cuplikanSebelumnya: [],
    antreanSuara: [],
    sedangBerbicara: false,
    sedangProses: false
};

// ==============================================
// INISIALISASI AWAL
// ==============================================
window.addEventListener("load", () => {
    muatDataDariPenyimpanan();
    tampilkanLayarMuat();
    inisialisasiElemenAntarmuka();
    inisialisasiSuara();
    daftarkanPWA();
    setInterval(lanjutkanAntreanSuara, 100);
    setTimeout(() => selesaikanLayarMuat(), 1800);
});

// ==============================================
// PENYIMPANAN DATA
// ==============================================
function simpanDataKePenyimpanan() {
    try {
        const dataUntukDisimpan = {
            tema: appState.tema,
            ronde: appState.ronde,
            puteran: appState.puteran,
            targetKemenangan: appState.targetKemenangan,
            pemain: appState.pemain.map(p => ({ ...p })),
            riwayat: appState.riwayat.map(r => ({ ...r })),
            arsipPemain: JSON.parse(JSON.stringify(appState.arsipPemain))
        };
        localStorage.setItem(APLIKASI.localStorageKey, JSON.stringify(dataUntukDisimpan));
    } catch (kesalahan) {
        console.error("Gagal menyimpan data:", kesalahan);
    }
}

function muatDataDariPenyimpanan() {
    try {
        const dataTersimpan = localStorage.getItem(APLIKASI.localStorageKey);
        if (!dataTersimpan) return;

        const dataTerbaca = JSON.parse(dataTersimpan);
        if (dataTerbaca.tema) appState.tema = dataTerbaca.tema;
        if (dataTerbaca.ronde) appState.ronde = dataTerbaca.ronde;
        if (dataTerbaca.puteran) appState.puteran = dataTerbaca.puteran;
        if (dataTerbaca.targetKemenangan) appState.targetKemenangan = dataTerbaca.targetKemenangan;
        if (dataTerbaca.pemain) appState.pemain = dataTerbaca.pemain;
        if (dataTerbaca.riwayat) appState.riwayat = dataTerbaca.riwayat;
        if (dataTerbaca.arsipPemain) appState.arsipPemain = dataTerbaca.arsipPemain;

        terapkanTema();
    } catch (kesalahan) {
        console.error("Gagal memuat data:", kesalahan);
    }
}

function buatCuplikanPenuh() {
    return JSON.parse(JSON.stringify({
        ronde: appState.ronde,
        puteran: appState.puteran,
        pemain: appState.pemain,
        riwayat: appState.riwayat
    }));
}

function pulihkanDariCuplikan(cuplikan) {
    if (!cuplikan) return;
    appState.ronde = cuplikan.ronde;
    appState.puteran = cuplikan.puteran;
    appState.pemain = cuplikan.pemain;
    appState.riwayat = cuplikan.riwayat;
    perbaruiSemuaAntarmuka();
    simpanDataKePenyimpanan();
}

// ==============================================
// LAYAR MUAT AWAL
// ==============================================
function tampilkanLayarMuat() {
    const layarMuat = document.getElementById("loadingScreen");
    layarMuat.classList.add("active");
    let kemajuan = 0;
    const animasi = setInterval(() => {
        kemajuan += Math.random() * 12;
        if (kemajuan > 95) kemajuan = 95;
        document.getElementById("loadingBar").style.width = kemajuan + "%";
    }, 80);
    setTimeout(() => clearInterval(animasi), 1600);
}

function selesaikanLayarMuat() {
    document.getElementById("loadingBar").style.width = "100%";
    setTimeout(() => {
        const layarMuat = document.getElementById("loadingScreen");
        layarMuat.style.opacity = "0";
        setTimeout(() => {
            layarMuat.classList.remove("active");
            layarMuat.style.opacity = "";
            appState.halaman = "utama";
            tampilkanHalamanYangSesuai();
        }, 600);
    }, 300);
}

// ==============================================
// INISIALISASI ELEMEN & ACARA
// ==============================================
function inisialisasiElemenAntarmuka() {
    document.getElementById("btnTheme").addEventListener("click", gantiTema);
    document.getElementById("btnFullscreen").addEventListener("click", masukLayarPenuh);
    document.getElementById("btnScreenshot").addEventListener("click", ambilTangkapanLayar);
    document.getElementById("btnUndo").addEventListener("click", batalkanLangkahTerakhir);
    document.getElementById("btnResetGame").addEventListener("click", tampilkanKonfirmasiReset);
    document.getElementById("btnMulaiPermainan").addEventListener("click", mulaiPermainanBaru);
    document.getElementById("btnSimpanPuteran").addEventListener("click", simpanPuteranSkor);

    document.querySelectorAll(".tab-btn").forEach(tombol => {
        tombol.addEventListener("click", () => bukaTab(tombol.dataset.tab));
    });

    document.getElementById("popupBtn1").addEventListener("click", tutupPopup);
    document.getElementById("popupBtn2").addEventListener("click", tutupPopup);
}

function tampilkanHalamanYangSesuai() {
    const halamanPengaturan = document.getElementById("setupPage");
    const halamanPermainan = document.getElementById("gamePage");

    if (appState.puteran === 0 && appState.ronde === 1 && appState.pemain.every(p => p.nama.startsWith("Pemain "))) {
        halamanPengaturan.classList.add("active");
        halamanPermainan.classList.remove("active");
    } else {
        halamanPengaturan.classList.remove("active");
        halamanPermainan.classList.add("active");
        perbaruiSemuaAntarmuka();
    }
}

function mulaiPermainanBaru() {
    const namaA = document.getElementById("namaA").value.trim() || "Pemain A";
    const namaB = document.getElementById("namaB").value.trim() || "Pemain B";
    const namaC = document.getElementById("namaC").value.trim() || "Pemain C";
    const namaD = document.getElementById("namaD").value.trim() || "Pemain D";
    const target = parseInt(document.getElementById("targetMenang").value) || APLIKASI.defaultTarget;

    appState.pemain[0].nama = namaA;
    appState.pemain[1].nama = namaB;
    appState.pemain[2].nama = namaC;
    appState.pemain[3].nama = namaD;
    appState.targetKemenangan = target;
    appState.ronde = 1;
    appState.puteran = 0;

    catatKeArsipPemain();
    simpanDataKePenyimpanan();
    tampilkanHalamanYangSesuai();
}

function catatKeArsipPemain() {
    appState.pemain.forEach(pemain => {
        if (!appState.arsipPemain[pemain.nama]) {
            appState.arsipPemain[pemain.nama] = {
                nama: pemain.nama,
                bintang: 0,
                membakar: 0,
                dibakar: 0,
                tripleBakar: 0,
                skorTertinggi: 0
            };
        }
        const arsip = appState.arsipPemain[pemain.nama];
        if (pemain.bintang > arsip.bintang) arsip.bintang = pemain.bintang;
        if (pemain.membakar > arsip.membakar) arsip.membakar = pemain.membakar;
        if (pemain.dibakar > arsip.dibakar) arsip.dibakar = pemain.dibakar;
        if (pemain.tripleBakar > arsip.tripleBakar) arsip.tripleBakar = pemain.tripleBakar;
        if (pemain.skorTertinggi > arsip.skorTertinggi) arsip.skorTertinggi = pemain.skorTertinggi;
    });
}

// ==============================================
// MANAJEMEN SKOR & PUTERAN
// ==============================================
function simpanPuteranSkor() {
    if (appState.sedangProses) return;
    appState.sedangProses = true;

    const cuplikanSebelum = buatCuplikanPenuh();
    appState.cuplikanSebelumnya.push(cuplikanSebelum);
    if (appState.cuplikanSebelumnya.length > 20) appState.cuplikanSebelumnya.shift();

    const nilaiA = parseInt(document.getElementById("skorA").value) || 0;
    const nilaiB = parseInt(document.getElementById("skorB").value) || 0;
    const nilaiC = parseInt(document.getElementById("skorC").value) || 0;
    const nilaiD = parseInt(document.getElementById("skorD").value) || 0;

    const batasi = nilai => Math.max(-APLIKASI.maxPerPuteran, Math.min(APLIKASI.maxPerPuteran, nilai));
    const tambahan = [batasi(nilaiA), batasi(nilaiB), batasi(nilaiC), batasi(nilaiD)];

    simpanPosisiSebelumnya();

    appState.pemain.forEach((pemain, indeks) => {
        pemain.skor += tambahan[indeks];
        if (pemain.skor > pemain.skorTertinggi) pemain.skorTertinggi = pemain.skor;
    });

    appState.puteran++;
    tambahRiwayat(`📝 Puteran ${appState.puteran}: ${appState.pemain.map((p,i) => `${p.nama} +${tambahan[i]}`).join(", ")}`);

    // ✅ CEK BAKARAN SESUAI ATURAN BARU
    cekKandidatTerbakar();

    const pemenang = cekPemenangRonde();
    if (pemenang) {
        prosesKemenangan(pemenang);
        return;
    }

    urutkanPemain();
    perbaruiSemuaAntarmuka();
    simpanDataKePenyimpanan();

    jalankanUrutanSuaraSetelahPuteran();

    document.querySelectorAll(".input-point").forEach(input => input.value = "");
    appState.sedangProses = false;
}

function simpanPosisiSebelumnya() {
    const urutanSebelum = [...appState.pemain].sort((a,b) => b.skor - a.skor);
    urutanSebelum.forEach((pemain, indeks) => {
        const pemainAsli = appState.pemain.find(p => p.id === pemain.id);
        if (pemainAsli) pemainAsli.posisiSebelumnya = indeks + 1;
    });
}

function urutkanPemain() {
    appState.pemain.sort((a,b) => {
        if (b.skor !== a.skor) return b.skor - a.skor;
        return a.posisiSebelumnya - b.posisiSebelumnya;
    });
}

// ✅ FUNGSI INI YANG SUDAH DIPERBAIKI SESUAI MAUMU
function cekKandidatTerbakar() {
    // Awalnya semua tidak bisa dibakar
    appState.pemain.forEach(p => p.dapatTerbakar = false);

    for (let i = 0; i < appState.pemain.length; i++) {
        const pemainMaju = appState.pemain[i];

        // Kalau yang maju nilainya negatif/0, tidak bisa membakar siapa pun
        if (pemainMaju.skor <= 0) continue;

        const posisiSebelumnya = pemainMaju.posisiSebelumnya;
        const posisiSekarang = i + 1;

        // Kalau benar-benar maju posisinya
        if (posisiSekarang < posisiSebelumnya) {
            // Cari orang yang posisinya tadi di atas, sekarang di BAWAH, DAN NILAINYA POSITIF
            const yangBisaDibakar = appState.pemain.filter((p, indeks) => {
                return indeks > i                  // Sekarang ada di bawah
                    && p.posisiSebelumnya < posisiSebelumnya // Tadi ada di atas
                    && p.skor > 0;                // ✅ PENTING: HANYA YANG POSITIF SAJA
            });

            // Tandai mereka yang bisa dibakar
            yangBisaDibakar.forEach(p => p.dapatTerbakar = true);
        }
    }
}

function cekPemenangRonde() {
    return appState.pemain.find(p => p.skor >= appState.targetKemenangan);
}

function prosesKemenangan(pemenang) {
    antrekanSuara(`Selamat kepada ${pemenang.nama} mendapatkan bintang satu`);
    mainkanAudio("audioGod");

    setTimeout(() => {
        tambahAnimasiBintang();
        pemenang.bintang++;
        tambahRiwayat(`⭐ ${pemenang.nama} mendapatkan BINTANG ke-${pemenang.bintang}!`);

        setTimeout(() => {
            antrekanSuara(`Silakan bandar kocok kartunya`);
            catatKeArsipPemain();
            simpanDataKePenyimpanan();
            tampilkanKonfirmasiRondeBaru();
        }, 2500);
    }, 800);
}

function mulaiRondeBaru() {
    catatKeArsipPemain();
    simpanDataKePenyimpanan();

    appState.pemain.forEach(p => {
        p.skor = 0;
        p.posisiSebelumnya = 1;
        p.dapatTerbakar = false;
    });
    appState.ronde++;
    appState.puteran = 0;
    appState.cuplikanSebelumnya = [];

    perbaruiSemuaAntarmuka();
    simpanDataKePenyimpanan();
}

// ==============================================
// ✅ SISTEM BAKARAN SESUAI SEMUA ATURAN
// ==============================================
function tampilkanPopupPilihPelaku(idKorban) {
    const korban = appState.pemain.find(p => p.id === idKorban);
    // Cek ulang: tidak bisa dibakar kalau nilainya tidak positif
    if (!korban || !korban.dapatTerbakar || korban.skor <= 0) {
        tampilkanPesanPeringatan("❌ Tidak bisa dibakar! Hanya pemain dengan nilai positif yang bisa dibakar.");
        return;
    }

    const pilihanPelaku = appState.pemain.filter(p => p.id !== idKorban);
    const opsiHtml = pilihanPelaku.map(p => `<option value="${p.id}">${p.nama}</option>`).join("");

    tampilkanPopup(`
        <h3>🔥 Siapa yang membakar?</h3>
        <p>Korban: <strong>${korban.nama} (Nilai: ${formatAngka(korban.skor)})</strong></p>
        <select id="pilihPelaku" class="input-text">${opsiHtml}</select>
    `, () => {
        const idPelaku = document.getElementById("pilihPelaku").value;
        const pelaku = appState.pemain.find(p => p.id === idPelaku);
        prosesBakaran(pelaku, korban);
    });
}

function prosesBakaran(pelaku, korban) {
    if (appState.sedangProses) return;
    appState.sedangProses = true;

    const cuplikanSebelum = buatCuplikanPenuh();
    appState.cuplikanSebelumnya.push(cuplikanSebelum);

    const nilaiAwalKorban = korban.skor; // Pasti POSITIF di sini

    pelaku.membakar++;
    korban.dibakar++;

    const jumlahYangBisaDibakar = appState.pemain.filter(p => p.dapatTerbakar).length;
    if (jumlahYangBisaDibakar >= 3) {
        pelaku.tripleBakar++;
        antrekanSuara("Triple Burn");
        tambahRiwayat(`💣 TRIPLE BURN - ${pelaku.nama} membakar 3 pemain sekaligus!`);
    }

    antrekanSuara(`${pelaku.nama} membakar ${korban.nama}`);

    setTimeout(() => {
        // ✅ Nilai awal pasti positif, jadi SUARA BERBUNYI
        mainkanAudio("audioNol");
        tambahAnimasiApi();

        setTimeout(() => {
            // ✅ NILAINYA LANGSUNG JADI 0
            korban.skor = 0;
            korban.dapatTerbakar = false;
            tambahRiwayat(`🔥 ${pelaku.nama} membakar ${korban.nama}! Nilai dikembalikan ke 0`);

            urutkanPemain();
            perbaruiSemuaAntarmuka();
            catatKeArsipPemain();
            simpanDataKePenyimpanan();
            appState.sedangProses = false;
        }, 1200);
    }, 800);
}

// ==============================================
// PERBARUI ANTARMUKA
// ==============================================
function perbaruiSemuaAntarmuka() {
    document.getElementById("rondeInfo").textContent = appState.ronde;
    document.getElementById("puteranInfo").textContent = appState.puteran;
    document.getElementById("targetInfo").textContent = appState.targetKemenangan;
    document.getElementById("btnUndo").disabled = appState.cuplikanSebelumnya.length === 0;

    perbaruiKartuPemain();
    perbaruiNamaDiKolomInput();
    perbaruiTabRanking();
    perbaruiTabRiwayat();
    perbaruiTabStatistik();
    perbaruiTabPencapaian();
    perbaruiTabArsip();
}

function perbaruiKartuPemain() {
    const wadah = document.getElementById("pemainContainer");
    wadah.innerHTML = "";

    appState.pemain.forEach(pemain => {
        const kelasNegatif = pemain.skor < 0 ? "negatif" : "";
        // ✅ Tombol bakar mati otomatis kalau nilainya <= 0
        const kelasBakar = (pemain.dapatTerbakar && pemain.skor > 0) ? "aktif" : "mati";
        const teksTombol = pemain.skor <= 0 ? "Nilai minus/0" : (pemain.dapatTerbakar ? "🔥 BAKAR SEKARANG" : "Belum bisa dibakar");
        const teksBintang = pemain.bintang > 0 ? `<span>⭐ ${pemain.bintang}</span>` : "Belum ada";

        const kartu = document.createElement("div");
        kartu.className = `player-card ${kelasNegatif}`;
        kartu.innerHTML = `
            <div class="player-header">
                <h3 class="nama-pemain" data-id="${pemain.id}">${pemain.nama}</h3>
                <button class="btn-edit-nama" data-id="${pemain.id}">✏️</button>
            </div>
            <div class="skor-container">
                <span class="skor-total ${kelasNegatif}">${formatAngka(pemain.skor)}</span>
            </div>
            <div class="info-bintang">
                Bintang: ${teksBintang}
            </div>
            <button class="btn-bakar ${kelasBakar}" data-id="${pemain.id}" ${kelasBakar === "mati" ? "disabled" : ""}>
                ${teksTombol}
            </button>
        `;
        wadah.appendChild(kartu);
    });

    document.querySelectorAll(".btn-edit-nama").forEach(tombol => {
        tombol.addEventListener("click", () => tampilkanEditNama(tombol.dataset.id));
    });
    document.querySelectorAll(".btn-bakar").forEach(tombol => {
        tombol.addEventListener("click", () => tampilkanPopupPilihPelaku(tombol.dataset.id));
    });
}

function perbaruiNamaDiKolomInput() {
    document.getElementById("labelSkorA").textContent = appState.pemain[0].nama;
    document.getElementById("labelSkorB").textContent = appState.pemain[1].nama;
    document.getElementById("labelSkorC").textContent = appState.pemain[2].nama;
    document.getElementById("labelSkorD").textContent = appState.pemain[3].nama;
}

function tampilkanEditNama(idPemain) {
    const pemain = appState.pemain.find(p => p.id === idPemain);
    if (!pemain) return;

    tampilkanPopup(`
        <h3>✏️ Ubah Nama Pemain</h3>
        <input type="text" id="inputNamaBaru" class="input-text" value="${pemain.nama}" maxlength="20">
    `, () => {
        const namaBaru = document.getElementById("inputNamaBaru").value.trim();
        if (namaBaru && namaBaru !== pemain.nama) {
            if (appState.arsipPemain[pemain.nama]) {
                appState.arsipPemain[namaBaru] = appState.arsipPemain[pemain.nama];
                delete appState.arsipPemain[pemain.nama];
            }
            pemain.nama = namaBaru;
            catatKeArsipPemain();
            perbaruiSemuaAntarmuka();
            simpanDataKePenyimpanan();
        }
    });
}

function tambahRiwayat(teks) {
    appState.riwayat.unshift({ waktu: new Date().toLocaleTimeString(), teks: teks });
    if (appState.riwayat.length > 100) appState.riwayat.pop();
}

// ==============================================
// SISTEM SUARA & BANTUAN LAINNYA
// ==============================================
function inisialisasiSuara() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
}

function antrekanSuara(teks) {
    appState.antreanSuara.push(teks);
}

function lanjutkanAntreanSuara() {
    if (appState.sedangBerbicara || appState.antreanSuara.length === 0 || !window.speechSynthesis) return;

    const teks = appState.antreanSuara.shift();
    const ucapan = new SpeechSynthesisUtterance(teks);
    ucapan.lang = "id-ID";
    ucapan.rate = 1;
    ucapan.pitch = 1;

    ucapan.onstart = () => appState.sedangBerbicara = true;
    ucapan.onend = ucapan.onerror = () => {
        appState.sedangBerbicara = false;
    };

    window.speechSynthesis.speak(ucapan);
}

function jalankanUrutanSuaraSetelahPuteran() {
    const pemainTerbawah = cariPemainPosisiTerbawah();
    if (pemainTerbawah) {
        antrekanSuara(`Giliran ${pemainTerbawah.nama} kocok kartu`);
    }
}

function cariPemainPosisiTerbawah() {
    return [...appState.pemain].sort((a,b) => a.skor - b.skor)[0];
}

function mainkanAudio(id) {
    const audio = document.getElementById(id);
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(err => console.log("Gagal memutar suara:", err));
    }
}

function tambahAnimasiApi() {
    const kanvas = document.getElementById("fireCanvas");
    kanvas.classList.add("aktif");
    setTimeout(() => kanvas.classList.remove("aktif"), 1200);
}

function tambahAnimasiBintang() {
    const kanvas = document.getElementById("starCanvas");
    kanvas.classList.add("aktif");
    setTimeout(() => kanvas.classList.remove("aktif"), 2500);
}

function formatAngka(angka) {
    return angka < 0 ? `${angka}` : `+${angka}`;
}

function batalkanLangkahTerakhir() {
    if (appState.cuplikanSebelumnya.length === 0) return;
    const cuplikanTerakhir = appState.cuplikanSebelumnya.pop();
    pulihkanDariCuplikan(cuplikanTerakhir);
    tambahRiwayat("↩️ Membatalkan langkah terakhir");
}

function tampilkanKonfirmasiReset() {
    tampilkanPopup(`
        <h3>🗑️ Reset Permainan?</h3>
        <p>Permainan akan dimulai ulang, tapi data bintang & riwayat tetap tersimpan.</p>
    `, () => {
        const arsipLama = JSON.parse(JSON.stringify(appState.arsipPemain));
        const temaLama = appState.tema;

        appState = {
            halaman: "utama",
            tema: temaLama,
            ronde: 1,
            puteran: 0,
            targetKemenangan: APLIKASI.defaultTarget,
            pemain: [
                { id: "a", nama: "Pemain A", skor: 0, posisiSebelumnya: 1, bintang: 0, dibakar: 0, membakar: 0, tripleBakar: 0, skorTertinggi: 0, dapatTerbakar: false },
                { id: "b", nama: "Pemain B", skor: 0, posisiSebelumnya: 2, bintang: 0, dibakar: 0, membakar: 0, tripleBakar: 0, skorTertinggi: 0, dapatTerbakar: false },
                { id: "c", nama: "Pemain C", skor: 0, posisiSebelumnya: 3, bintang: 0, dibakar: 0, membakar: 0, tripleBakar: 0, skorTertinggi: 0, dapatTerbakar: false },
                { id: "d", nama: "Pemain D", skor: 0, posisiSebelumnya: 4, bintang: 0, dibakar: 0, membakar: 0, tripleBakar: 0, skorTertinggi: 0, dapatTerbakar: false }
            ],
            riwayat: [],
            arsipPemain: arsipLama,
            cuplikanSebelumnya: [],
            antreanSuara: [],
            sedangBerbicara: false,
            sedangProses: false
        };

        simpanDataKePenyimpanan();
        tampilkanHalamanYangSesuai();
        tutupPopup();
    });
}

function tampilkanKonfirmasiRondeBaru() {
    tampilkanPopup(`
        <h3>🏁 Ronde Selesai!</h3>
        <p>Ingin memulai ronde berikutnya?</p>
    `, () => {
        mulaiRondeBaru();
        tutupPopup();
    });
}

function tampilkanPesanPeringatan(teks) {
    tampilkanPopup(`<p style="text-align:center; font-size:16px;">${teks}</p>`, () => {});
}

function tampilkanPopup(konten, fungsiOke) {
    const wadah = document.getElementById("popupOverlay");
    const isi = document.getElementById("popupContent");
    const tombolOke = document.getElementById("popupBtn2");

    isi.innerHTML = konten;
    wadah.classList.add("aktif");

    // Hapus pendengar lama agar tidak menumpuk
    const pendengarBaru = () => {
        tutupPopup();
        if (typeof fungsiOke === "function") fungsiOke();
        tombolOke.removeEventListener("click", pendengarBaru);
    };

    tombolOke.addEventListener("click", pendengarBaru);
}

function tutupPopup() {
    document.getElementById("popupOverlay").classList.remove("aktif");
}

function gantiTema() {
    appState.tema = appState.tema === "gelap" ? "terang" : "gelap";
    terapkanTema();
    simpanDataKePenyimpanan();
}

function terapkanTema() {
    document.body.classList.toggle("tema-terang", appState.tema === "terang");
    const tombol = document.getElementById("btnTheme");
    tombol.textContent = appState.tema === "gelap" ? "☀️" : "🌙";
    tombol.title = appState.tema === "gelap" ? "Ganti ke tema terang" : "Ganti ke tema gelap";
}

function masukLayarPenuh() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log("Tidak bisa masuk layar penuh:", err));
    } else {
        document.exitFullscreen().catch(err => console.log("Tidak bisa keluar layar penuh:", err));
    }
}

function ambilTangkapanLayar() {
    tampilkanPesanPeringatan("📸 Fitur tangkapan layar sedang dalam pengembangan!");
}

function bukaTab(namaTab) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("aktif"));
    document.querySelectorAll(".tab-page").forEach(page => page.classList.remove("aktif"));

    document.querySelector(`.tab-btn[data-tab="${namaTab}"]`).classList.add("aktif");
    document.getElementById(`tab${namaTab.charAt(0).toUpperCase() + namaTab.slice(1)}`).classList.add("aktif");
}

function perbaruiTabRanking() {
    const wadah = document.getElementById("rankingList");
    const urutan = [...appState.pemain].sort((a,b) => b.skor - a.skor);
    wadah.innerHTML = urutan.map((p, i) => `
        <div class="list-item ${i === 0 ? 'juara' : ''}">
            <span class="peringkat">${i+1}</span>
            <span class="nama">${p.nama}</span>
            <span class="nilai ${p.skor < 0 ? 'negatif' : ''}">${formatAngka(p.skor)}</span>
        </div>
    `).join("");
}

function perbaruiTabRiwayat() {
    const wadah = document.getElementById("historyList");
    wadah.innerHTML = appState.riwayat.map(r => `
        <div class="list-item riwayat">
            <span class="waktu">${r.waktu}</span>
            <span class="teks">${r.teks}</span>
        </div>
    `).join("");
}

function perbaruiTabStatistik() {
    const wadah = document.getElementById("statistikList");
    wadah.innerHTML = appState.pemain.map(p => `
        <div class="statistik-kartu">
            <h4>${p.nama}</h4>
            <p>⭐ Bintang: ${p.bintang}</p>
            <p>🔥 Berhasil membakar: ${p.membakar} kali</p>
            <p>💀 Pernah dibakar: ${p.dibakar} kali</p>
            <p>💣 Triple bakar: ${p.tripleBakar} kali</p>
            <p>📈 Nilai tertinggi: ${formatAngka(p.skorTertinggi)}</p>
        </div>
    `).join("");
}

function perbaruiTabPencapaian() {
    const wadah = document.getElementById("achievementList");
    const semuaPemain = Object.values(appState.arsipPemain);
    wadah.innerHTML = semuaPemain.map(p => `
        <div class="statistik-kartu">
            <h4>🏆 ${p.nama}</h4>
            <p>⭐ Total bintang: ${p.bintang}</p>
            <p>🔥 Total membakar: ${p.membakar}</p>
            <p>💣 Triple bakar terbanyak: ${p.tripleBakar}</p>
            <p>📈 Rekor nilai: ${formatAngka(p.skorTertinggi)}</p>
        </div>
    `).join("") || "<p>Belum ada data pencapaian</p>";
}

function perbaruiTabArsip() {
    perbaruiTabPencapaian();
}

function daftarkanPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js').catch(err => console.log("Pendaftaran PWA gagal:", err));
        });
    }
}
