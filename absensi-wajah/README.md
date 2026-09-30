# 📷 ABSENSI WAJAH CERDAS — Edisi Kelas

Aplikasi **absensi kelas otomatis dengan pengenalan wajah AI** untuk papan interaktif (IFP) /
layar sentuh — bagian terakhir dari seri: Gesture Battle → Billionaire → Family 100 →
Clash of Champions → **Absensi Wajah Cerdas**.

Arahkan kamera ke siswa → wajah dikenali → **otomatis tercatat HADIR** (kotak hijau + nama).
Tanpa kamera pun tetap bisa: panel manual H/I/S/A untuk setiap siswa. Rekap tersimpan per
tanggal, lengkap dengan persentase kehadiran dan **ekspor CSV** (Excel/Google Sheets).

## Alur Pakai
1. **👥 Data Siswa** — buat kelas (5A, 6B, …), tambahkan siswa + **foto wajah**
   (opsional tapi disarankan; wajah dianalisis jadi *descriptor* 128 angka, foto asli TIDAK disimpan utuh).
2. **📷 Mulai Absensi** — pilih kelas & mode:
   - 🤖 **Kamera AI** — deteksi banyak wajah sekaligus; dikenali = kotak hijau bernama + otomatis Hadir;
     tidak dikenal = kotak oranye "? Tidak dikenal".
   - 👆 **Manual** — tap huruf **H / I / S / A** di panel kanan (Hadir/Izin/Sakit/Alpa).
3. Tombol bantu: **✅ Semua Hadir**, **↺ Reset** (bersihkan sesi hari ini), **📥 Selesai** (simpan → rekap).
4. **📅 Rekap Absensi** — riwayat per tanggal, ringkasan H/I/S/A + % hadir, status & jam per siswa,
   **Unduh/Lihat CSV**, hapus tanggal.

## Cara Kerja AI
- **face-api.js** (@vladmandic build): TinyFaceDetector + Landmark68 + FaceRecognitionNet
  (~7 MB, diunduh **sekali** lalu ter-cache browser).
- Foto siswa → **descriptor 128-dimensi**; saat scan, wajah kamera dicocokkan dengan
  **jarak Euclid**; cocok bila jarak < **0.50** (ambang standar face-api).
- Kamera cermin fullscreen, kotak wajah mengikuti geometri *cover* + pencerminan.
- Gagal muat model / kamera ditolak → aplikasi **tetap berfungsi penuh** lewat panel manual.

## Privasi
- Semua data (daftar siswa, descriptor wajah, rekap) disimpan **lokal di perangkat**
  (localStorage) — tidak dikirim ke server mana pun. Yang disimpan bukan foto, melainkan
  vektor angka hasil AI yang tidak bisa "dibalik" jadi wajah.

## Fitur Lain
- Multi-kelas; kelas eksplisit tetap ada walau belum berisi siswa.
- Persentase kehadiran per siswa di Data Siswa (dari semua tanggal tercatat).
- Guard lengkap: nama/kelas kosong, kelas tanpa siswa, deteksi dobal (status tidak pernah diturunkan).
- Suara WebAudio (klik, hadir, fanfare, sedih), confetti saat sesi disimpan/semua hadir.
- Layar penuh, toast, modal konfirmasi untuk aksi destruktif.
- UI bahasa Indonesia, tombol besar ramah sentuhan (IFP).

## Menjalankan
Buka `index.html` di Chrome/Edge. Untuk kamera, sajikan via `http://` (mis. `python3 -m http.server`)
— `file://` umumnya memblokir `getUserMedia`. Internet dibutuhkan saat pertama memuat model AI.

## Berkas
- `index.html` — aplikasi lengkap (satu berkas).
- `parts/01…05` — sumber terpisah (head, style, body, data, app).
- `audit/01…04.png` — bukti E2E (beranda, data siswa, scan wajah, rekap).
- `AUDIT.md` — laporan audit mendalam (68 asersi jsdom + 31 asersi Chrome E2E).
