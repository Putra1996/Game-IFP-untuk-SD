# 🎮 GAME GESTURE BATTLE — Berbasis AI

Game pembelajaran interaktif untuk **IFP (Interactive Flat Panel) / layar sentuh / proyektor kelas**.
Siswa menunjuk jawaban dengan **jari telunjuk (dideteksi AI lewat kamera)** atau **langsung menekan layar**.
Belajar jadi lebih menyenangkan! ✨

---

## 🚀 Cara Menjalankan

1. Salin file `index.html` ke laptop/IFP (bisa pakai flashdisk — **cukup 1 file, tanpa install**).
2. Buka dengan **Google Chrome** atau **Microsoft Edge** (klik 2x file-nya).
3. Klik **⛶ Layar Penuh** (kanan atas).
4. Pilih mode game → atur nama, kategori, ronde → **🚀 MULAI GAME**.
5. Jika memakai Kamera AI, klik **"Izinkan"** saat browser meminta akses kamera.

> 💡 Butuh **internet hanya saat pertama kali memuat modul AI** (~beberapa detik). Setelah itu permainan berjalan offline.

## 🎮 Mode Permainan

| Mode | Cara Main |
|---|---|
| 🥊 **Duel 2 Pemain** | Dua siswa berlomba. Layar terbagi 2 arena: kiri = P1 (biru), kanan = P2 (merah). Jawab lebih cepat & benar untuk dapat poin! |
| 🎯 **Solo Challenge** | 1 pemain, latihan mandiri. Ada rating bintang ⭐⭐⭐ di akhir. |
| ✅❌ **Benar–Salah** | Pernyataan muncul, tunjuk/tekan **BENAR** atau **SALAH**. Bisa 1 atau 2 pemain. |

## 🤖 Cara Menjawab

- **Kamera AI (Mode AR)**: seluruh layar IFP menjadi cermin kelas 🪞 — siswa **menunjuk lingkaran jawaban yang melayang** dengan telunjuk, tahan ±1 detik sampai bar **penuh** → jawaban terkunci. Titik berwarna = ujung jari terdeteksi AI.
- **Sentuh/Mouse**: langsung ketuk/diklik lingkaran jawaban (paling cocok untuk IFP layar sentuh).
- 🏷️ Isi **Mata Pelajaran & Kelas** di pengaturan — akan tampil di banner soal (seperti "INFORMATIKA • KELAS 1").
- **Poin**: benar = 10 + bonus kecepatan (maks. 15). Benar 3× berturut-turut = bonus 🔥 +5.

## ✏️ Soal Guru (Buat Soal Sendiri)

Dari menu utama klik **✏️ Soal Guru**, isi dalam format:

**Kuis (4 pilihan)** — satu soal per baris:
```
Pertanyaan | Jawaban Benar | Salah 1 | Salah 2 | Salah 3
Ibu kota Indonesia? | Jakarta | Bandung | Surabaya | Medan
```

**Benar–Salah:**
```
Pernyataan | BENAR
Pernyataan | SALAH
```

Pisahkan juga bisa pakai titik-koma `;`. Soal tersimpan otomatis di browser (localStorage).
Lalu pilih kategori **✏️ Soal Guru** di pengaturan game.

## 📚 Kategori Soal Bawaan

- 🧮 **Matematika** — dibuat otomatis sesuai kelas: Kelas 1–2 (tambah/kurang), 3–4 (kali/bagi/campuran), 5–6 (bilangan besar, operasi campuran).
- 🌍 **Pengetahuan Umum** — 35+ soal IPA/IPS/Pancasila SD (termasuk soal lokal Jawa Tengah & Banyumas 😄).
- 🎲 **Campuran** — gabungan matematika + pengetahuan umum.

## 💡 Tips di Kelas (Kamera AI)

- Pencahayaan kelas cukup terang; hindari silau lampu di depan kamera.
- Latar belakang tidak perlu rapi — AI hanya melacak tangan.
- Siswa berdiri di kiri/kanan sesuai arena (kiri layar = P1).
- Latihan dulu 1 ronde agar siswa paham gerakan "menunjuk + menahan".
- Jika kamera bermasalah, game **otomatis tetap bisa dimainkan dengan sentuhan**.

## ❓ Penyelesaian Masalah

| Masalah | Solusi |
|---|---|
| Kamera tidak aktif | Cek izin kamera Chrome (ikon kamera di address bar), gunakan Chrome/Edge terbaru |
| "Memuat AI…" lama | Pastikan ada koneksi internet saat pertama kali |
| Tangan tidak terdeteksi | Dekati kamera, tunjuk dengan 1 jari telunjuk, cahaya cukup |
| Fullscreen tidak jalan | Buka file langsung di Chrome (bukan di dalam preview/aplikasi lain) |

---

Dibuat untuk pembelajaran aktif dengan IFP — Kolaborasi, Sportivitas, Prestasi! 🏆
