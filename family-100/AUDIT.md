# 🔍 LAPORAN AUDIT MENDELAN — Kuis Family 100 v1.0

**Tanggal:** 30 September 2026 • **File:** `family-100/index.html` (~52 KB, 1 file mandiri)

---

## 1. Ringkasan Eksekutif

| Pengujian | Hasil |
|---|---|
| Tes fungsional jsdom (unit + integrasi + keamanan) | ✅ **55/55 lulus** |
| Tes E2E Chrome headless asli (kamera AI nyata + gesture + sentuh + klik fisik) | ✅ **30/30 lulus, 0 error halaman** |
| Integritas bank soal (24 survei) | ✅ Semua total poin = 100, ≥4 jawaban, poin positif |
| Parser soal guru (6 format berbeda) | ✅ Semua lulus |
| Keamanan XSS (soal, jawaban, nama tim, papan juara) | ✅ Aman |
| Performa (Chrome asli) | ✅ **61 FPS** |
| Verifikasi visual | ✅ Strike big-X, banner MENCURI, papan, pot — semua sesuai desain |

**Kesimpulan: LAYAK PRODUKSI.** Audit menemukan **5 bug nyata** (2 kritis) — semuanya diperbaiki & diverifikasi ulang (§3).

## 2. Fitur yang Diaudit & Lulus

**Mekanik:** modal pilihan giliran pertama 🪙 • giliran awan **bergantian otomatis** tiap ronde (terverifikasi R1=Tim1 → R2=Tim2) • reveal → poin masuk POT + burst konfeti + angka melayang • reveal dobel diabaikan • strike (maks 3) + buzzer + overlay big-X • **fase MENCURI**: banner berdenyut dengan nama lawan, reveal non-steal diblokir, kena papan = pot dicuri, meleset (`missSteal`) = pot tetap milik tim pertama • papan habis → ronde selesai • skor akhir → layar hasil (win/lose/seri) + **papan juara top-5** persisten • tombol **↩ Batalkan** (undo reveal & strike, bahkan keluar dari fase steal kembali ke play) • keluar ke menu membersihkan banner/steal • guard soal guru kosong.

**Kamera AR:** izin otomatis → stream 1280×720 → MediaPipe "AI aktif" • dwell jam-dinding **1.017–1.120 ms** pada petak • deteksi dalam-kotak (anti salah petak) • kursor titik emas • kamera mati otomatis di layar hasil.

**Parser guru:** `Jawaban:Poin` ✓ • tanpa poin → dibagi rata dari 100 (33,33,33) ✓ • campuran ✓ • `;` ✓ • <2 jawaban ditolak ✓ • maks 8 jawaban ✓ • poin clamp 1–100 ✓.

**Keamanan:** injeksi `onerror` via soal/jawaban/nama tim/papan juara semuanya dirender sebagai teks, tanpa eksekusi.

## 3. Bug Nyata: Ditemukan → Diperbaiki → Diverifikasi

| # | Tingkat | Bug | Akar | Perbaikan | Verifikasi |
|---|---|---|---|---|---|
| 1 | 🔴 **Kritis** | **Papan soal guru menghasilkan POT `NaN`** — pemenang jadi kacau (Rajawali menang dengan 0) | `pickSurvey` mengasumsikan semua bank berformat `['teks',poin]`, padahal bank guru berformat objek `{t,p}` → `undefined` | Normalisasi dua format di `pickSurvey` | jsdom+dbg: skor guru 100 ✓ |
| 2 | 🔴 **Kritis** | **Reveal saat fase MENCURI tidak diblokir** & pencurian tak pernah selesai ronde | `S.steal` tidak pernah di-set `true` (hanya fase yang berganti) | `S.steal=true` saat 3 strike | jsdom: reveal non-steal diblokir ✓; E2E: steal berhasil → skor pindah ✓ |
| 3 | 🟡 Sedang | **Ketukan multipoint hilang** — dua petak dibuka hampir bersamaan, yang kedua tak tercatat | `renderBoard()` membangun ulang seluruh papan per reveal → elemen yang dirujuk pointer kedua sudah terlepas dari DOM | Pembaruan **in-place** per petak; rebuild penuh hanya saat soal baru | E2E: reveal beruntun & multipoint terhitung semua ✓ |
| 4 | 🟡 Sedang | Guard soal guru tidak ada / memakai field salah | `startGame` mengecek `cfg.category` (tak pernah ada di game ini) | Guard `cfg.source==='guru' && !GURU_FAM.length` | jsdom: toast "kosong" + tetap di setup ✓ |
| 5 | 🟢 Kecil | Ketikan nama menempel ke default ("Tim 1Kelas 5A") | Input terisi nilai lama tanpa seleksi | `select()` otomatis saat fokus | E2E: nama tampil bersih ✓ |

Rincian proses audit: 12 kegagalan awal → 5 bug aplikasi (di atas) + 7 salah premis skrip uji (diidentifikasi lewat debug instrumentasi, bukan diubah di aplikasi).

## 4. Cakupan Asersi (85 otomatis)

- **Unit (14):** integritas bank (poin=100), parser 6 format, pickSurvey 60×, reset bank habis, papan juara urut.
- **Integrasi (41):** alur 2 ronde lengkap (giliran, reveal, undo reveal/strike, 3 strike → steal sukses/gagal, papan habis, hasil, juara), guard guru, XSS 4 titik, menu dari tengah game, suffix nama sama, semua segmen.
- **E2E Chrome (30):** render+font, kamera AI asli, **gesture buka 2 petak (±1,0–1,1 dtk)**, strike & big-X, fase steal + banner, steal sukses via sentuh, ronde 2 (undo, sentuh multipoint), papan habis → hasil, juara, kamera mati, restart, FPS 61.

## 5. Batasan Diketahui & Rekomendasi

- Peran "menjawab lisan" = host-driven: keakuratan mencatat jawaban bergantung guru (sesuai konsep aslinya).
- Internet perlu saat pertama memuat modul AI; mode sentuh offline penuh.
- Rekomendasi: timer per tebakan mencuri (10 dtk), suara "applause" papan habis, mode 3 tim, ekspor skor kelas.

**Status akhir: 85/85 asersi LULUS • 0 error halaman • 61 FPS • LAYAK PRODUKSI** ✅
