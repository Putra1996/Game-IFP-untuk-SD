# 🎯 KUIS FAMILY 100 — Edisi Kelas

Papan jawaban survei bergaya acara TV legendaris untuk **IFP / layar sentuh / proyektor kelas**.
Guru menjadi pembaca survei; dua tim bertanding memperebutkan **pot poin**, lengkap **3 strike** dan momen **MENCURI** — plus **mode kamera AR** (tunjuk petak jawaban, dideteksi AI).

Satu file `index.html` — tanpa install.

---

## 🚀 Cara Menjalankan

1. Salin `index.html` ke laptop/IFP.
2. Buka dengan **Google Chrome / Microsoft Edge** → layar penuh ⛶.
3. **🎮 MULAI BERMAIN** → isi nama 2 tim → pilih tim giliran pertama 🪙.

## 🎮 Aturan Main

1. **🎤 Guru membaca survei** — siswa menjawab **lisan**.
2. Jawaban ada di papan → **ketuk petaknya** (atau **tunjuk dengan gesture**, tahan 1 detik) → poin masuk **POT**.
3. Jawaban tidak ada di papan → tekan **❌ STRIKE!** (ada tombol **↩ Batalkan** kalau salah tekan).
4. **3 strike = ⚠ KESEMPATAN MENCURI** untuk tim lawan: 1 tebakan. Kena papan → **seluruh pot dicuri**; meleset → pot tetap milik tim pertama.
5. Papan habis → ronde berikutnya (giliran awan bergantian otomatis). Skor terbesar di akhir menang! 🏆

## ✏️ Soal Guru (Survei Kustom)

Satu pertanyaan per baris, jawaban + poin dipisah titik dua:
```
Pertanyaan | Jawaban1:35 | Jawaban2:25 | Jawaban3:20 | Jawaban4:20
Makanan favorit siswa? | Mie instan:40 | Ayam goreng:30 | Bakso:20 | Sate:10
```
- Tanpa poin? **Dibagi rata otomatis** dari 100.
- Maksimal 8 jawaban, minimal 2. Pemisah `;` juga bisa.
- Pilih sumber soal: **📚 Bawaan** (24 survei siap pakai, semua berjumlah 100) • **✏️ Soal Guru** • **🎲 Campur**.

## 🤖 Dua Cara Menjawab

- **Kamera AI (AR)**: layar jadi cermin kelas; siswa **menunjuk petak jawaban** dengan telunjuk, tahan ±1 detik.
- **Sentuh/Mouse**: ketuk langsung petaknya (host/guru yang mengetuk).

## 🏆 Papan Juara

5 pertandingan terbaik tersimpan otomatis (pemenang, skor) — tampil di akhir & dari menu.

## ❓ Penyelesaian Masalah

| Masalah | Solusi |
|---|---|
| Kamera tidak aktif | Izinkan kamera di Chrome; gunakan Chrome/Edge terbaru |
| "Memuat AI…" lama | Butuh internet saat pertama kali; setelahnya ter-cache |
| Tangan tak terdeteksi | Dekati kamera, tunjuk 1 telunjuk, cahaya cukup |

---

Dibuat untuk kelas yang seru — "Survei berkata…" 🎯

---

## 🩹 v1.1 (01-10-2026) — Perbaikan Papan Jawaban
Bug: papan jawaban tidak tampil di layar permainan (petak tertutup memakai kelas `hidden` yang
bertabrakan dengan utility global `.hidden{display:none!important}`), dan papan juara di layar
hasil ikut menimpa papan permainan karena sama-sama memakai id `board`. Fix: kelas petak → `down`,
papan juara → `#board-res`. Audit tambahan: jsdom 22 + Chrome E2E 10 + mode HP 3 = **35/35**.
