# 🔍 LAPORAN AUDIT MENDELAN — Who Wants to Be a Billionaire? v1.0

**Tanggal:** 30 September 2026 • **File:** `kuis-miliaran/index.html` (~58 KB, 1 file mandiri)

---

## 1. Ringkasan Eksekutif

| Pengujian | Hasil |
|---|---|
| Tes fungsional jsdom (unit + integrasi + keamanan) | ✅ **75/75 lulus** |
| Tes E2E Chrome headless asli (kamera AI nyata + gesture + sentuh) | ✅ **26/26 lulus, 0 error halaman** |
| Generator & bank soal (2.000× matematika, pemetaan kesulitan 75×, indeks jawaban 100×) | ✅ Valid |
| Keamanan XSS (nama, soal guru, papan juara) | ✅ Aman |
| Performa (Chrome asli 1280×720) | ✅ **61 FPS**, memori ~10 MB |
| Verifikasi visual (screenshot) | ✅ Tema mewah, tangga, modal audiens, papan juara — semua sesuai desain |

**Kesimpulan: LAYAK PRODUKSI.** Audit menemukan **3 bug nyata** (2 kritis) — semuanya sudah diperbaiki & diverifikasi ulang (§4).

## 2. Fitur yang Diaudit & Lulus

**Mekanik inti:** tangga 15 tingkat monotonic + jackpot Rp 1 miliar ✓ • batas aman Lv 5/Lv 10 (dengan matriks `safePrize` lengkap: 4 benar→0, 5–9→10rb, 10–14→100rb) ✓ • kesulitan otomatis Lv1–5 mudah / 6–10 sedang / 11–15 sulit, terverifikasi soal benar-benar diambil dari bank tingkat yang sesuai (75×) ✓ • timer + habis waktu = gugur ✓ • drama kunci jawaban 1,6 detik (klik saat suspense diabaikan, timer berhenti) ✓.

**Bantuan:** 50:50 (tepat 2 salah dihapus, benar dijamin hidup, sekali pakai) ✓ • menunjuk/klik opsi terhapus diabaikan ✓ • audiens (total selalu 100%, jawaban benar porsi terbesar, keyakinan naik di soal mudah) ✓ • telepon (akurasi 90/78/60% sesuai tingkat) ✓ • ganti soal ✓ • semua tombol terkunci setelah dipakai ✓.

**Alur:** menang bertahap + hadiah ter-update ✓ • salah → hadiah jatuh ke **batas aman** ✓ • walk away dengan konfirmasi (batal/lanjut) ✓ • jackpot + hujan konfeti ✓ • timeout ✓ • papan juara top-5 urut & persisten ✓ • restart penuh ✓ • pause/lanjut dengan sisa waktu ✓ • Escape = jeda ✓.

**Kamera AR:** izin otomatis → stream 1280×720 → MediaPipe "AI aktif" ✓ • kamera fullscreen + overlay canvas ukuran layar ✓ • dwell jam-dinding **1.222–1.227 ms** ✓ • deteksi dalam-kotak pil (anti salah-kunci antar baris) ✓ • kursor titik emas ✓ • kamera mati otomatis saat game over ✓.

## 3. Temuan Review Statis (diperbaiki sebelum pengujian)

1. Kesalahan sintaks template string pada filter server (`—→` di dalam literal) — diperbaiki.
2. Bug HTTP server uji: `var f` ter-deklarasi setelah pemakaian — diperbaiki.
3. `pointing` tak pernah `false` untuk pointer lama — diperbaiki (direset tiap frame).

## 4. Bug Nyata dari Pengujian (ditemukan → diperbaiki → diverifikasi)

| # | Tingkat | Bug | Akar Masalah | Perbaikan | Verifikasi |
|---|---|---|---|---|---|
| 1 | 🔴 **Kritis** | **Restart tak pernah mulai** — game kedua macet selamanya | `startGame()` lupa mengembalikan `S.phase`; setelah `'over'`, `askQuestion()` menolak jalan | `S.phase='count'` di awal `startGame()` | E2E: "RESTART BERFUNGSI" ✓ |
| 2 | 🔴 **Kritis** | **Hadiah kalah salah aturan** — salah jawab di Lv 6 memberi Rp 50.000 (harusnya jatuh ke batas aman Rp 10.000) | `finishResult` selalu pakai hadiah terakhir diraih | Kalah → `safePrize(S.won)`; jackpot/walk-away tetap hadiah tercapai | jsdom: matriks 4/5/9/10/14 benar ✓ + E2E salah di Lv3→Rp 0 ✓ |
| 3 | 🟡 Sedang | **Dwell "menembus" ke pil baris lain** — menunjuk dekat opsi terhapus 50:50 malah mengunci opsi baris bawah | Radius deteksi = setengah diagonal pil yang lebar → lingkarannya saling tumpang tindih antar baris | Deteksi dalam-kotak (rect) + margin 18px, pilih terdekat dari pusat | E2E: dwell 1,8 dtk pada opsi terhapus → DIABAIKAN ✓ |
| 4 | 🟢 Kecil | Nama yang sedang diketik tertimpa kosong saat kembali ke setup | `openSetup()` selalu menimpa input dari cfg | Tidak menimpa bila input sudah berisi | E2E: nama "Sinta" terjaga ✓ |

## 5. Cakupan Asersi (101 otomatis)

- **Unit (18):** struktur tangga, batas aman, format rupiah, diffOf, genMath 2.000×, makeOpts, pemetaan bank kesulitan 75×, indeks jawaban 100×, parser guru, papan juara urut.
- **Integrasi (57):** alur lengkap setup→countdown→15-level (benar beruntun, salah di luar/dalam batas aman, walk away + batal, jackpot, timeout), 4 bantuan mendalam, guard guru kosong, XSS (3 titik injeksi), stress modal, semua segmen pengaturan.
- **E2E Chrome (26):** render+font, kamera AI asli, gesture dwell (2× jawab benar dengan tangan), opsi terhapus diabaikan, sentuh pointerdown, salah→hasil, papan juara, **regresi restart**, walk away hadiah, FPS.

## 6. Batasan Diketahui & Rekomendasi

- Internet perlu saat pertama memuat modul AI (mode sentuh offline penuh).
- Papan juara tersimpan per-browser/IFP (belum lintas perangkat).
- Rekomendasi lanjutan: musik latar loop per level, mode 2 kelas berkompetisi, ekspor rekap juara untuk penilaian.

**Status akhir: 101/101 asersi LULUS • 0 error halaman • 61 FPS • LAYAK PRODUKSI** ✅
