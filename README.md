# 🎓 HUB APLIKASI KELAS CERDAS

Halaman induk (**satu berkas `index.html`, murni HTML+CSS tanpa JavaScript**) yang menautkan
kelima aplikasi pembelajaran interaktif untuk papan sentuh (IFP):

| # | Aplikasi | Folder | Versi | Audit |
|---|---|---|---|---|
| 1 | 🥊 Game Gesture Battle | `gesture-battle/` | v1.2 | 116/116 |
| 2 | 💰 Who Wants to Be a Billionaire? | `kuis-miliaran/` | v1.0 | 101/101 |
| 3 | 🪑 Kuis Family 100 | `family-100/` | v1.0 | 85/85 |
| 4 | ⚔️ Clash of Champions | `clash-champions/` | v1.0 | 90/90 |
| 5 | 📷 Absensi Wajah Cerdas | `absensi-wajah/` | v3.0 | 163/163 |
| 6 | 🫧 Gesture Battle PRO | `gesture-battle-pro/` | v1.1 | 47/47 +38 (r4) |
| 7 | 🅰️ Kuis A/B Benar-Salah | `benar-salah/` | v2.1 | 79/79 |
| | | | **Total** | **686/686** |

## Menjalankan
```bash
cd <folder-induk-semua-aplikasi>
python3 -m http.server 8000
# buka http://localhost:8000  → klik kartu aplikasi
```
Kamera (Gesture Battle, Absensi Wajah, mode AR kuis) butuh Chrome/Edge + izin kamera;
internet hanya untuk memuat model AI & font saat pertama kali.

## Desain
- Kartu besar ramah sentuh (grid `auto-fit`, min 42vmin), aksen warna berbeda per aplikasi.
- Nol JavaScript & nol gambar eksternal → mustahil error runtime, aman dibuka offline.
- Jalur tautan relatif murni (`folder/index.html`) → portabel dipindah/di-zip bersama folder aplikasi.
- Badge total asersi **selalu konsisten** dengan badge per-kartu dan berkas `AUDIT.md` tiap aplikasi
  (divalidasi otomatis saat audit).

## Berkas
- `index.html` — hub (halaman ini).
- `audit/01-hub.png` — bukti E2E hub.
- `AUDIT.md` — laporan audit mendalam hub (23 asersi jsdom + 17 asersi Chrome E2E).
- `README.md`/`AUDIT.md` di tiap folder aplikasi — dokumentasi & audit masing-masing.

## Re-Audit Regresi (30-09-2026)
Seluruh paket diaudit ulang dengan suite baru: **168/168 asersi LULUS** (153 jsdom + 15 Chrome E2E)
— 0 bug aplikasi baru, 0 page error. Rincian: lihat `AUDIT.md` (bagian Re-Audit).
Grand total audit: **659 asersi** (491 audit awal + 168 re-audit).

## Putaran 7: Kuis A/B + Absensi v2.0 (30-09-2026)
Aplikasi baru **🅰️ Kuis A/B Benar-Salah** (`benar-salah/`, replika game viral: dua zona A/B,
jawab dengan gestur tangan via kamera AI — v1 42/42, lalu **direvisi total v2.0** persis video
referensi: gerbang password, pilihan ganda A/B, wash hijau/merah, jawaban otomatis saat timer
habis — audit tambahan 37 jsdom + 17 Chrome E2E = **54/54**) dan
**📷 Absensi Wajah v2.0** (3 tab permanen, strip "✔ … — HADIR!", finalisasi kosong→Alpa,
legend H/I/S/A — tambahan 15 jsdom + 11 Chrome E2E = **26/26** di atas 99 audit v1).
Grand total: **618 asersi**.

## Putaran 8: UI ala video "mba lulu" + animasi gestur (30-09-2026)
**📷 Absensi Wajah v3.0** — antarmuka dibangun ulang persis video: tema terang, header tetap
"📘 Absensi Wajah Cerdas", 3 tab (✎ Pendaftaran Siswa • 🗓 Mode Absensi • 📊 Log Kehadiran),
Mode Absensi = panel **Kamera** (kartu kamera + garis pindai + welcome "Selamat Datang, NAMA!")
berdampingan dgn panel **Absensi Hari Ini** (token status + jam per siswa). Wajah dikenali →
strip hijau **"Terdeteksi: NAMA (KELAS) — HADIR!"** + **nama disebutkan suara (TTS id-ID,
bisa dimatikan)**. Unduhan: CSV harian + **Excel daftar hadir bulanan (.xls) SEMUA kelas
sekaligus** — 1 lembar per kelas, kolom tanggal ✓/S/I/A, JML H/S/I/A, garis pemisah minggu,
"BULAN EFEKTIF" — persis pola Excel Kelas VII-A di video. Audit tambahan: **26 jsdom + 12
Chrome E2E = 38** (total kartu 163).

**🅰️ Kuis A/B v2.1** — animasi gerakan tangan ala video: kursor 👆 mengambang mengikuti tangan
(dgn jejak memudar + cincin denyut), **jawaban A/B meluncur turun dari atas ke kotak sudut**
(⚡ kecepatan diatur: Santai 4 dtk / Sedang 2,4 dtk / Cepat 1,2 dtk — siswa mengikuti dgn
tangan → aktif bergerak), efek **cincin kena** saat target tercapai. Audit tambahan: **16+9
jsdom + 13 Chrome E2E = 25** baru di luar regresi (total kartu 79).
Grand total: **686 asersi**.


## Perbaikan Bug + Audit Gesture Battle PRO (01-10-2026)
Laporan pengguna: pil setup GBP tampil kosong & tak bisa dipilih. Akar: `renderSegs()` mengirim
`{v,l}` sementara `seg()` membaca `o.value`/`o.label` → pil tanpa label & tanpa aksi klik.
**Diperbaiki (4 pil) → v1.1.** Audit tambahan: jsdom `audit/gbp.js` **22/22** (pil setup, gameplay
duel benar/salah/beku, soal guru kosong & terisi, solo), Chrome E2E `audit/e2e-gbp.js` **11/11**
(klik pil di Chrome, kamera fake "AI aktif", pop pointerdown, 10 ronde → hasil, main lagi, FPS 61,
0 page error), mode HP `mobile.js` bertambah 5 → **24/24**. Total baru **38/38**; kumulatif GBP
**47+38 = 85 asersi**. Screenshot setup & permainan terverifikasi visual (pil berlabel jelas,
skor dua tim, timer, gelembung ring tim).
