# 🎓 HUB APLIKASI KELAS CERDAS

Halaman induk (**satu berkas `index.html`, murni HTML+CSS tanpa JavaScript**) yang menautkan
kelima aplikasi pembelajaran interaktif untuk papan sentuh (IFP):

| # | Aplikasi | Folder | Versi | Audit |
|---|---|---|---|---|
| 1 | 🥊 Game Gesture Battle | `gesture-battle/` | v1.2 | 116/116 |
| 2 | 💰 Who Wants to Be a Billionaire? | `kuis-miliaran/` | v1.0 | 101/101 |
| 3 | 🪑 Kuis Family 100 | `family-100/` | v1.0 | 85/85 |
| 4 | ⚔️ Clash of Champions | `clash-champions/` | v1.0 | 90/90 |
| 5 | 📷 Absensi Wajah Cerdas | `absensi-wajah/` | v2.0 | 125/125 |
| 6 | 🫧 Gesture Battle PRO | `gesture-battle-pro/` | v1.0 | 47/47 |
| 7 | 🅰️ Kuis A/B Benar-Salah | `benar-salah/` | v1.0 | 42/42 |
| | | | **Total** | **606/606** |

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
jawab dengan gestur tangan via kamera AI — audit 29 jsdom + 13 Chrome E2E = **42/42**) dan
**📷 Absensi Wajah v2.0** (3 tab permanen, strip "✔ … — HADIR!", finalisasi kosong→Alpa,
legend H/I/S/A — tambahan 15 jsdom + 11 Chrome E2E = **26/26** di atas 99 audit v1).
Grand total: **606 asersi**.

