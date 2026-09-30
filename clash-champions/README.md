# ⚔️ CLASH OF CHAMPIONS — Edisi Kelas

Game kuis duel tim **1 lawan 1** untuk kelas interaktif (IFP / layar sentuh), bagian dari seri
game edukasi: Gesture Battle → Billionaire → Family 100 → **Clash of Champions**.

Dua tim memilih **champion**, lalu bertarung lewat soal: **jawaban benar = serangan**
(makin cepat menjawab, makin besar damage), **jawaban salah = lawan menyerang balik**,
**combo 3× benar = ULTIMATE**, **HP habis = K.O.** Tim yang pertama meraih cukup kemenangan
ronde menjadi **SANG JUARA** dan masuk 🏆 **Aula Sang Juara**.

## Cara Main
1. 🎮 **Mulai Pertarungan** → isi nama tim, pilih champion (boleh sama dengan lawan).
2. Atur: 🎲 kategori soal, 📈 tingkat awal, 🏆 target kemenangan ronde (1 / 2 dari 3 / 3 dari 5),
   ⏱ waktu per soal, 🤖 mode input (Kamera AI / Sentuh).
3. Tim yang giliran menjawab:
   - ✅ **Benar** → serangan **16–24 dmg** (bonus kecepatan; sisa waktu banyak = makin sakit).
   - ❌ **Salah** → **serangan balik 10 dmg** dari lawan, giliran pindah.
   - ⏰ **Waktu habis** → giliran pindah (tanpa serangan balik).
   - ⚡ **3× benar beruntun** → **ULTIMATE 30 dmg** + gempa layar.
4. HP lawan 0 = **K.O.** → menang ronde. Ronde baru: HP kembali 100, giliran ronde diserahkan ke lawan.

## Champion (pilih 1 dari 6 per tim)
| Champion | Elemen | Gaya |
|---|---|---|
| 🔥 Phoenix | Api | Naluri api yang membara |
| 🌊 Kraken | Air | Gelombang yang menghantam |
| 🪨 Golem | Batu | Pertahanan gunung batu |
| 🌪 Zephyr | Angin | Angin kilat tak terlihat |
| ⚡ Volt | Listrik | Petir yang menyambar |
| 🌿 Flora | Tumbuhan | Tumbuhan yang merambat |

## Kategori Soal
- 📚 **Umum** — 3 tingkat (mudah/sedang/sulit), otomatis mengikuti kemajuan ronde (R1–2 mudah, R3–4 sedang, R5+ sulit).
- 🔢 **Matematika** — generator soal tak terbatas, opsi selalu unik.
- ✏️ **Soal Guru** — bank soal kustom, format `Pertanyaan | Jawaban Benar | Salah | Salah | Salah`
  (satu soal per baris). **Berbagi bank** dengan Gesture Battle, Billionaire & Family 100.
- 🎲 **Campuran** — 40% matematika + 60% bank umum/guru, tanpa soal berulang sampai bank habis.

## Mode Kamera AI (AR)
Fullscreen kamera cermin + **titik ujung telunjuk** dari MediaPipe Hands: tunjuk pilihan serangan,
**tahan ±1 detik** (dwell) → otomatis terjawab, ada bar progres di kartu opsi. Butuh Chrome/Edge,
izin kamera, dan internet saat pertama memuat model AI. Jika kamera gagal → otomatis saran ke mode
**👆 Sentuh** (sentuh/mouse langsung).

## Fitur
- Ring timer SVG per soal (merah + bunyi tik di 5 detik terakhir).
- Animasi serangan, hit-shake, floating damage, burst partikel, splash **FIGHT! / ULTIMATE! / K.O!**
- Efek suara lengkap (klik, kunci, hit, ultimate, serangan balik, salah, tick, K.O., fanfare) + tombol bisu.
- Layar penuh, toast, modal bantuan & soal guru.
- 🏆 **Aula Sang Juara** — papan 5 terbaik (disimpan lokal, kriteria: kemenangan lalu ronde).

## Menjalankan
Buka `index.html` di Chrome/Edge. Untuk mode kamera, layani via `http://` (mis. `python3 -m http.server`)
atau beri izin kamera saat browser memintanya — `file://` umumnya memblokir kamera.

## Berkas
- `index.html` — game lengkap (satu berkas, siap dipakai).
- `parts/01…05` — sumber terpisah (head, style, body, data, app) untuk pengembangan.
- `audit/01…05.png` — bukti E2E (beranda, setup, FIGHT, AR dwell, hasil juara).
- `AUDIT.md` — laporan audit mendalam (57 asersi jsdom + 33 asersi Chrome E2E).
