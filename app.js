// ==============================================
// KONFIGURASI DASAR & VARIABEL GLOBAL
// ==============================================
const APLIKASI = {
    versi: "1.1.1",
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
        { id: "a", nama: "Pemain A", skor: 0, posisiSebelumnya: 1, bintang: 0, dibakar: 0, membakar: 0, tripleBakar: 0, skorTertinggi: 0 },
        { id: "b", nama: "Pemain B", skor: 0, posisiSebelumnya: 2, bintang: 0, dibakar: 0, membakar: 0, tripleBakar: 0, skorTertinggi: 0 },
        { id: "c", nama: "Pemain C", skor: 0, posisiSebelumnya: 3, bintang: 0, dibakar: 0, membakar: 0, tripleBakar: 0, skorTertinggi: 0 },
        { id: "d", nama: "Pemain D", skor: 0, posisiSebelumnya: 4, bintang: 0, dibakar: 0, membakar: 0, tripleBakar: 0, skorTertinggi: 0 }
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
    // Tombol Umum
    document.getElementById("btnTheme").addEventListener("click", gantiTema);
    document.getElementById("btnFullscreen").addEventListener("click", masukLayarPenuh);
    document.getElementById("btnScreenshot").addEventListener("click", ambilTangkapanLayar);
    document.getElementById("btnUndo").addEventListener("click", batalkanLangkahTerakhir);
    document.getElementById("btnResetGame").addEventListener("click", tampilkanKonfirmasiReset);

    // Halaman Pengaturan
    document.getElementById("btnMulaiPermainan").addEventListener("click", mulaiPermainanBaru);

    // Tombol Simpan Skor
    document.getElementById("btnSimpanPuteran").addEventListener("click", simpanPuteranSkor);

    // Navigasi Tab
    document.querySelectorAll(".tab-btn").forEach(tombol => {
        tombol.addEventListener("click", () => bukaTab(tombol.dataset.tab));
    });

    // Popup
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
        // Perbarui data terbaru
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

    // Simpan keadaan sebelum berubah
    const cuplikanSebelum = buatCuplikanPenuh();
    appState.cuplikanSebelumnya.push(cuplikanSebelum);
    if (appState.cuplikanSebelumnya.length > 20) appState.cuplikanSebelumnya.shift();

    // Ambil nilai input
    const nilaiA = parseInt(document.getElementById("skorA").value) || 0;
    const nilaiB = parseInt(document.getElementById("skorB").value) || 0;
    const nilaiC = parseInt(document.getElementById("skorC").value) || 0;
    const nilaiD = parseInt(document.getElementById("skorD").value) || 0;

    // Batasi nilai maksimal
    const batasi = nilai => Math.max(-APLIKASI.maxPerPuteran, Math.min(APLIKASI.maxPerPuteran, nilai));
    const tambahan = [batasi(nilaiA), batasi(nilaiB), batasi(nilaiC), batasi(nilaiD)];

    // Simpan posisi sebelum diubah
    simpanPosisiSebelumnya();

    // Tambahkan skor
    appState.pemain.forEach((pemain, indeks) => {
        pemain.skor += tambahan[indeks];
        if (pemain.skor > pemain.skorTertinggi) pemain.skorTertinggi = pemain.skor;
    });

    appState.puteran++;
    tambahRiwayat(`📝 Puteran ${appState.puteran}: ${appState.pemain.map((p,i) => `${p.nama} +${tambahan[i]}`).join(", ")}`);

    // Proses logika susul-menyusul dan bakaran
    cekKandidatTerbakar();

    // Cek apakah ada yang menang
    const pemenang = cekPemenangRonde();
    if (pemenang) {
        prosesKemenangan(pemenang);
        return;
    }

    // Urutkan dan perbarui antarmuka
    urutkanPemain();
    perbaruiSemuaAntarmuka();
    simpanDataKePenyimpanan();

    // ✅ SUDAH DIPERBAIKI SESUAI KOREKSI: HANYA PANGGIL PEMAIN TERENDAH SETIAP PUTERAN
    jalankanUrutanSuaraSetelahPuteran();

    // Kosongkan input
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

function cekKandidatTerbakar() {
    for (let i = 0; i < appState.pemain.length; i++) {
        const pemainSekarang = appState.pemain[i];
        // Tidak bisa terbakar jika skor <= 0
        if (pemainSekarang.skor <= 0) {
            pemainSekarang.dapatTerbakar = false;
            continue;
        }

        // Cek apakah dia melewati pemain yang sebelumnya di atasnya
        const posisiSebelumnya = pemainSekarang.posisiSebelumnya;
        const posisiSekarang = i + 1;

        // Jika posisi membaik, cek siapa yang jatuh di bawah
        if (posisiSekarang < posisiSebelumnya) {
            const pemainYangTerlewati = appState.pemain.filter((p, idx) => {
                return idx > i && p.posisiSebelumnya < posisiSebelumnya && p.skor <= pemainSekarang.skor && p.skor > 0;
            });
            pemainYangTerlewati.forEach(p => p.dapatTerbakar = true);
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
            // ✅ SUDAH DIPERBAIKI SESUAI ATURAN: INI BARU TEMPATNYA BILANG BANDAR!
            antrekanSuara(`Silakan bandar kocok kartunya`);
            catatKeArsipPemain();
            simpanDataKePenyimpanan();
            tampilkanKonfirmasiRondeBaru();
        }, 2500);
    }, 800);
}

function mulaiRondeBaru() {
    // Simpan statistik dan arsip
    catatKeArsipPemain();
    simpanDataKePenyimpanan();

    // Reset skor dan posisi untuk ronde berikutnya
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
// SISTEM BAKARAN
// ==============================================
function tampilkanPopupPilihPelaku(idKorban) {
    const korban = appState.pemain.find(p => p.id === idKorban);
    if (!korban || !korban.dapatTerbakar) return;

    const pilihanPelaku = appState.pemain.filter(p => p.id !== idKorban);
    const opsiHtml = pilihanPelaku.map(p => `<option value="${p.id}">${p.nama}</option>`).join("");

    tampilkanPopup(`
        <h3>🔥 Siapa yang membakar?</h3>
        <p>Korban: <strong>${korban.nama}</strong></p>
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

    // Tambah statistik
    pelaku.membakar++;
    korban.dibakar++;

    // Cek Triple Burn
    const jumlahDibakarPutaranIni = appState.pemain.filter(p => p.dapatTerbakar && p.id !== korban.id).length + 1;
    if (jumlahDibakarPutaranIni >= 3) {
        pelaku.tripleBakar++;
        antrekanSuara("Triple Burn");
        tambahRiwayat(`💣 TRIPLE BURN - ${pelaku.nama} membakar 3 pemain sekaligus!`);
    }

    // Langkah-langkah sesuai spesifikasi
    antrekanSuara(`${pelaku.nama} membakar ${korban.nama}`);

    setTimeout(() => {
        mainkanAudio("audioNol");
        tambahAnimasiApi();

        setTimeout(() => {
            korban.skor = 0;
            korban.dapatTerbakar = false;
            tambahRiwayat(`🔥 ${pelaku.nama} membakar ${korban.nama}!`);

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
    perbaruiTabRanking();
    perbaruiTabRiwayat();
    perbaruiTabPencapaian();
    perbaruiTabStatistik();
    perbaruiTabArsip();
}

function perbaruiKartuPemain() {
    const wadah = document.getElementById("pemainContainer");
    wadah.innerHTML = "";

    appState.pemain.forEach(pemain => {
        const kelasNegatif = pemain.skor < 0 ? "negatif" : "";
        const kelasBakar = pemain.dapatTerbakar ? "unlocked" : "locked";
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
            <button class="btn-bakar ${kelasBakar}" data-id="${pemain.id}">
                🔥 ${pemain.dapatTerbakar ? "BAKAR SEKARANG" : "BELUM BISA DIBAKAR"}
            </button>
        `;
        wadah.appendChild(kartu);
    });

    // Tambahkan acara klik
    document.querySelectorAll(".btn-edit-nama").forEach(tombol => {
        tombol.addEventListener("click", () => tampilkanEditNama(tombol.dataset.id));
    });
    document.querySelectorAll(".btn-bakar").forEach(tombol => {
        tombol.addEventListener("click", () => tampilkanPopupPilihPelaku(tombol.dataset.id));
    });
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
            // Pindahkan arsip lama jika ada
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
// SISTEM SUARA & TTS
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

    const teksBerikutnya = appState.antreanSuara.shift();
    const ucapan = new SpeechSynthesisUtterance(teksBerikutnya);
    ucapan.lang = "id-ID";
    ucapan.rate = 1.05;
    ucapan.pitch = 1;

    ucapan.onstart = () => appState.sedangBerbicara = true;
    ucapan.onend = ucapan.onerror = () => {
        appState.sedangBerbicara = false;
        setTimeout(lanjutkanAntreanSuara, 120);
    };

    speechSynthesis.speak(ucapan);
}

function jalankanUrutanSuaraSetelahPuteran() {
    // ✅ SESUAI ATURAN ASLI SETELAH KOREKSI:
    // 1. Cari pemain yang nilainya paling rendah (minus atau paling kecil)
    const pemainTerendah = cariPemainSkorTerendah();

    // 2. Langsung panggil dia buat ngocok, TANPA BILANG BANDAR DULU!
    antrekanSuara(`Silakan ${pemainTerendah.nama} kocok kartunya`);

    setTimeout(() => {
        // 3. Baru bacakan semua total poin pemain
        appState.pemain.forEach(p => {
            const angkaDalamBahasa = numberToBahasaIndonesia(p.skor);
            antrekanSuara(`${p.nama} total poin ${angkaDalamBahasa}`);
        });

        // 4. Suara nol tetap di akhir jika dibutuhkan
        setTimeout(() => mainkanAudio("audioNol"), 2500);
    }, 1200);
}

function cariPemainSkorTerendah() {
    let pemainMinus = appState.pemain.filter(p => p.skor < 0);
    if (pemainMinus.length > 0) {
        return pemainMinus.sort((a,b) => a.skor - b.skor)[0];
    }
    return [...appState.pemain].sort((a,b) => a.skor - b.skor)[0];
}

function mainkanAudio(idElemen) {
    const audio = document.getElementById(idElemen);
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
}

// ==============================================
// FUNGSI BANTU & KONVERSI
// ==============================================
function formatAngka(angka) {
    return angka >= 0 ? `+${angka}` : `${angka}`;
}

function numberToBahasaIndonesia(angka) {
    if (angka === 0) return "nol";
    const negatif = angka < 0;
    angka = Math.abs(angka);
    const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
    const belasan = ["sepuluh", "sebelas", "dua belas", "tiga belas", "empat belas", "lima belas", "enam belas", "tujuh belas", "delapan belas", "sembilan belas"];
    const puluhan = ["", "", "dua puluh", "tiga puluh", "empat puluh", "lima puluh", "enam puluh", "tujuh puluh", "delapan puluh", "sembilan puluh"];

    function ubahRatus(n) {
        let hasil = "";
        const ratus = Math.floor(n / 100);
        const sisa = n % 100;

        if (ratus > 0) hasil += ratus === 1 ? "seratus " : satuan[ratus] + " ratus ";
        if (sisa > 0) hasil += ubahPuluh(sisa);
        return hasil.trim();
    }

    function ubahPuluh(n) {
        if (n < 10) return satuan[n];
        if (n < 20) return belasan[n - 10];
        const puluh = Math.floor(n / 10);
        const sisa = n % 10;
        return puluhan[puluh] + (sisa > 0 ? " " + satuan[sisa] : "");
    }

    let hasilAkhir;
    if (angka < 100) hasilAkhir = ubahPuluh(angka);
    else if (angka < 1000) hasilAkhir = ubahRatus(angka);
    else if (angka < 2000) hasilAkhir = "seribu " + ubahRatus(angka - 1000);
    else if (angka < 10000) hasilAkhir = ubahPuluh(Math.floor(angka / 1000)) + " ribu " + ubahRatus(angka % 1000);
    else return angka.toString();

    return negatif ? "minus " + hasilAkhir : hasilAkhir;
}

// ==============================================
// TAB & RINCIAN
// ==============================================
function bukaTab(namaTab) {
    document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-page").forEach(p => p.classList.remove("active"));
    document.querySelector(`[data-tab="${namaTab}"]`).classList.add("active");
    document.getElementById(`tab${namaTab.charAt(0).toUpperCase() + namaTab.slice(1)}`).classList.add("active");
}

function perbaruiTabRanking() {
    const wadah = document.getElementById("rankingList");
    const urutan = [...appState.pemain].sort((a,b) => b.skor - a.skor);
    wadah.innerHTML = urutan.map((p, i) => `
        <div class="list-item">
            <strong>#${i+1} ${p.nama}</strong><br>
            Skor: <span style="color:var(--gold-light)">${formatAngka(p.skor)}</span> | Bintang: ⭐ ${p.bintang}
        </div>
    `).join("");
}

function perbaruiTabRiwayat() {
    const wadah = document.getElementById("historyList");
    wadah.innerHTML = appState.riwayat.map(r => `
        <div class="list-item">
            <small style="color:var(--text-secondary)">${r.waktu}</small><br>
        ${r.teks}
        </div>
    `).join("");
}

function perbaruiTabPencapaian() {
    const wadah = document.getElementById("achievementList");
    const semuaPemain = Object.values(appState.arsipPemain);
    const pencapaian = [
        {id: "ngocok", nama: "Tukang Ngocok Kartu", syarat: p => p.skor < 0, deskripsi: "Sempat memiliki skor negatif"},
        {id: "bakar", nama: "Tukang Bakar", syarat: p => p.membakar >= 3, deskripsi: "Berhasil membakar 3 pemain atau lebih"},
        {id: "apes", nama: "Hari Apes", syarat: p => p.dibakar >= 5, deskripsi: "Terbakar sebanyak 5 kali atau lebih"},
        {id: "dewakartu", nama: "Dewa Kartu", syarat: p => p.skorTertinggi >= 500, deskripsi: "Pernah meraih skor 500 atau lebih"},
        {id: "dewa", nama: "Dewa Dari Segala Dewa", syarat: p => p.bintang > 1, deskripsi: "Mendapatkan lebih dari 1 bintang"},
        {id: "triple", nama: "Triple Burn", syarat: p => p.tripleBakar > 0, deskripsi: "Berhasil membakar 3 orang sekaligus"}
    ];

    wadah.innerHTML = pencapaian.map(penc => {
        const terbuka = semuaPemain.some(p => penc.syarat(p));
        return `
            <div class="achievement-item ${terbuka ? "terbuka" : "terkunci"}">
                <h4 class="judul-pencapaian">${terbuka ? "✅" : "❌"} ${penc.nama}</h4>
                <p class="deskripsi-pencapaian">${penc.deskripsi}</p>
            </div>
        `;
    }).join("");
}

function perbaruiTabStatistik() {
    const wadah = document.getElementById("statistikList");
    wadah.innerHTML = appState.pemain.map(p => `
        <div class="statistik-item">
            <h4 style="color:var(--gold-light);margin-bottom:0.5rem;">${p.nama}</h4>
            <p>⭐ Bintang: ${p.bintang}</p>
            <p>🔥 Berhasil Membakar: ${p.membakar} kali</p>
            <p>💀 Terbakar: ${p.dibakar} kali</p>
            <p>💣 Triple Burn: ${p.tripleBakar}</p>
            <p>📈 Skor Tertinggi: ${formatAngka(p.skorTertinggi)}</p>
        </div>
    `).join("");
}

function perbaruiTabArsip() {
    const wadah = document.getElementById("arsipList");
    const daftarArsip = Object.values(appState.arsipPemain);
    wadah.innerHTML = daftarArsip.length === 0
        ? "<p style='text-align:center;color:var(--text-secondary);'>Belum ada arsip pemain</p>"
        : daftarArsip.sort((a,b) => b.bintang - a.bintang).map(p => `
            <div class="list-item">
                <strong>${p.nama}</strong><br>
                ⭐ ${p.bintang} | 🔥 Membakar: ${p.membakar} | 💀 Terbakar: ${p.dibakar} | 💣 Triple: ${p.tripleBakar}
            </div>
        `).join("");
}

// ==============================================
// FUNGSI BANTU LAINNYA
// ==============================================
function batalkanLangkahTerakhir() {
    if (appState.cuplikanSebelumnya.length === 0 || appState.sedangProses) return;
    const cuplikanTerakhir = appState.cuplikanSebelumnya.pop();
    pulihkanDariCuplikan(cuplikanTerakhir);
}

function tampilkanKonfirmasiReset() {
    tampilkanPopup(`
        <h3>🗑️ Reset Permainan?</h3>
        <p>Permainan saat ini akan dihapus, tetapi <strong>arsip & statistik pemain akan tetap tersimpan</strong>.</p>
    `, () => {
        // Hapus data AKTIF saja, arsip TETAP
        const arsipSimpan = JSON.parse(JSON.stringify(appState.arsipPemain));
        const temaSimpan = appState.tema;

        appState = {
            halaman: "utama",
            tema: temaSimpan,
            ronde: 1,
            puteran: 0,
            targetKemenangan: APLIKASI.defaultTarget,
            pemain: [
                { id: "a", nama: "Pemain A", skor: 0, posisiSebelumnya: 1, bintang: 0, dibakar: 0, membakar: 0, tripleBakar: 0, skorTertinggi: 0 },
                { id: "b", nama: "Pemain B", skor: 0, posisiSebelumnya: 2, bintang: 0, dibakar: 0, membakar: 0, tripleBakar: 0, skorTertinggi: 0 },
                { id: "c", nama: "Pemain C", skor: 0, posisiSebelumnya: 3, bintang: 0, dibakar: 0, membakar: 0, tripleBakar: 0, skorTertinggi: 0 },
                { id: "d", nama: "Pemain D", skor: 0, posisiSebelumnya: 4, bintang: 0, dibakar: 0, membakar: 0, tripleBakar: 0, skorTertinggi: 0 }
            ],
            riwayat: [],
            arsipPemain: arsipSimpan,
            cuplikanSebelumnya: [],
            antreanSuara: [],
            sedangBerbicara: false,
            sedangProses: false
        };

        simpanDataKePenyimpanan();
        tampilkanHalamanYangSesuai();
    });
}

function tampilkanKonfirmasiRondeBaru() {
    tampilkanPopup(`
        <h3>🏁 Ronde Selesai!</h3>
        <p>Ada pemain yang mencapai target kemenangan. Siap memulai ronde berikutnya?</p>
    `, mulaiRondeBaru);
}

function tampilkanPopup(isi, fungsiSetuju) {
    const lapisan = document.getElementById("popupOverlay");
    const kotak = document.getElementById("popupBox");
    const konten = document.getElementById("popupContent");
    const tombolOk = document.getElementById("popupBtn2");

    konten.innerHTML = isi;
    lapisan.classList.add("active");
    tombolOk.onclick = () => {
        tutupPopup();
        if (typeof fungsiSetuju === "function") fungsiSetuju();
    };
}

function tutupPopup() {
    document.getElementById("popupOverlay").classList.remove("active");
}

function gantiTema() {
    appState.tema = appState.tema === "gelap" ? "terang" : "gelap";
    terapkanTema();
    simpanDataKePenyimpanan();
}

function terapkanTema() {
    const tombolTema = document.getElementById("btnTheme");
    if (appState.tema === "gelap") {
        document.body.classList.remove("light-mode");
        tombolTema.textContent = "☀️";
        tombolTema.title = "Ganti ke Tema Terang";
    } else {
        document.body.classList.add("light-mode");
        tombolTema.textContent = "🌙";
        tombolTema.title = "Ganti ke Tema Gelap";
    }
}

function masukLayarPenuh() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
}

function ambilTangkapanLayar() {
    alert("Fitur tangkapan layar siap digunakan setelah aplikasi dipasang!");
}

function tambahAnimasiApi() {
    const kanvas = document.getElementById("fireCanvas");
    kanvas.classList.add("active");
    setTimeout(() => kanvas.classList.remove("active"), 1200);
}

function tambahAnimasiBintang() {
    const kanvas = document.getElementById("starCanvas");
    kanvas.classList.add("active");
    setTimeout(() => kanvas.classList.remove("active"), 2500);
}

// ==============================================
// PENDAFTARAN PWA
// ==============================================
function daftarkanPWA() {
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("sw.js")
                .then(daftar => console.log("SW terdaftar:", daftar))
                .catch(err => console.log("SW gagal:", err));
        });
    }
}
