# AUDIT MENDELAN — CLASH OF CHAMPIONS v1.0

Tanggal: 30-09-2026 · Auditor: otomatis (jsdom + Puppeteer/Chrome headless + verifikasi visual)

## 1. Metodologi
- **Suite jsdom** (`/tmp/smoke/cc-audit.js`): unit generator/bank/papan, alur setup, mekanik pertarungan
  (serang, counter, ultimate, K.O., timeout, best-of-N), guard, restart, XSS. Setiap window baru,
  tunggu 300 ms pasca-konstruksi; penunggu berbasis **fase** (bukan sleep kaku).
- **Chrome E2E** (`/tmp/smoke/cc-e2e.js`): kamera palsu (`--use-fake-device-for-media-stream`),
  disajikan via `http://127.0.0.1:8099`, viewport 1280×720, mendengarkan `pageerror` & `console.error`.
  Dwell AR disintesis dengan 21 landmark di sekitar ujung telunjuk (cermin-matematika tervalidasi),
  `CAM.busy=true` selama injeksi.
- **Benchmark**: rAF 4 detik pada fase pertanyaan.
- **Verifikasi visual**: 5 tangkapan layar diperiksa manusia (bukan hanya asersi).

## 2. Hasil Akhir
| Suite | Hasil |
|---|---|
| jsdom | **57/57 LULUS** |
| Chrome E2E | **33/33 LULUS** |
| Page error / console error | **0** |
| Benchmark FPS | **60 FPS** (≥45) |
| Total | **90/90** |

Bukti E2E kunci: tap benar → `resolve` → dmg **23** (16–24 ✓); salah → **serangan balik 10** + giliran pindah ✓;
dwell sintetis ~1 dtk → opsi **terkunci otomatis** (`locked=true`, fase lanjut `attacking`, bar progres terisi
saat sampel tengah) ✓; kursor jari tampil ✓; K.O. → layar hasil ✓; kamera berhenti otomatis ✓;
restart menjaga nama ✓. jsdom trace engine: 24+24+**30 (ULTIMATE)**+24 = K.O. tepat 100 HP; timeout tanpa
counter ✓; best-of-3 (2 menang ronde) → juara ✓; XSS soal & nama aman (textContent) ✓.

## 3. Temuan & Perbaikan
**Bug aplikasi nyata: 1**
1. **`wins-hint` tidak ikut berubah** saat segmen target kemenangan diklik (teks statis "2").
   Diperbaiki: callback `seg-wins` kini memanggil `updHint()` (setter `v=>{cfg.wins=v;updHint();}`). Terverifikasi ulang ✓.

**Perbaikan saat perakitan (sebelum uji):** sisa pola lama di `bindButtons` (array selector ber-escape ganda
`'\\#in-t1'` + `sel.replace('\\\\','')` → tidak pernah cocok; `select()`-on-focus mati) dan satu baris mati
`const at=$$('#f'+atk);` — dibersihkan lewat patch Python, terdeteksi oleh pemeriksaan silang ID→selector.

**Koreksi harness uji (bukan bug aplikasi), untuk arsip:**
- Penunggu fase kaku (`sleep(850/1750)`) kalah cepat dari rantai animasi kunci 0,7 dtk + serang 0,9 dtk →
  diganti `waitPhase` berbasis polling fase; trace `dmg=24/24/30/24` membuktikan engine benar sejak awal.
- Loop ULTIMATE menghitung hit ekstra setelah `choose` kedua menyusul `ask` baru (kelebihan 1 hit, combo 4)
  → perlu jeda antar-hit & tunggu fase `attacking` dulu.
- Uji timeout menunggu "fase `ask`" yang **sudah** `ask` (true instan) → diganti menunggu **perubahan giliran**.
- Loop best-of-3 guard 40 iterasi tidak cukup untuk KO 1,5 dtk + modal + ronde baru (±4,2 dtk) → 250.
- Premis salah: uji menganggap "Garuda" pasti juara, padahal loop menjawab benar untuk **tim yang giliran**
  (dua tim sama-sama "pintar") → asersi diganti konsistensi `SANG JUARA` + nama pemenang.
- E2E: `atkNow` direferensikan di dalam `page.evaluate` (konteks browser) → `ReferenceError`; wajib
  pass-argumen `evaluate(fn, arg)` (pelajaran berulang, 2× fatal di sesi ini sebelum diperbaiki).
- E2E: sampel `locked`/kursor diambil **setelah** interval dwell selesai (sudah lewat) → sampel mid-dwell.
- E2E: lupa `CFG.wins=1` di segmen kamera → KO hanya membuka modal ronde (5 kegagalan kaskade).

## 4. Matriks Cakupan
| Fitur | jsdom | E2E | Visual |
|---|---|---|---|
| Beranda + modal bantuan | ✓ | ✓ | ✓ (01) |
| Setup: nama, 6 champion ×2, tukar, bentrok terjaga, label | ✓ | ✓ | ✓ (02) |
| Segmen kategori/tingkat/waktu/input + hint kemenangan | ✓ | — | — |
| Guard bank guru kosong; simpan & pakai soal guru | ✓ | — | — |
| Alur FIGHT → pertanyaan → kunci → serangan 16–24 | ✓ | ✓ | ✓ (03) |
| Combo & ULTIMATE 30 | ✓ (24/24/30/24) | ✓ (indikator) | — |
| Salah → counter 10 + pindah giliran; combo reset | ✓ | ✓ | — |
| Timeout → tanpa counter, pindah giliran | ✓ | — | — |
| K.O. → menang ronde → modal ronde → juara (best-of-N) | ✓ | ✓ | ✓ (05) |
| Aula Sang Juara (urut, top-5, persist) | ✓ | ✓ | ✓ |
| Kamera AI: aktif, camtag, video stream, dwell→jawab, kursor, berhenti | — | ✓ | ✓ (04) |
| Restart (nama terjaga) & menu dari tengah game | ✓ | ✓ | — |
| XSS (soal & nama tim) | ✓ | — | — |
| Page error / console bersih | ✓ | ✓ | — |

## 5. Keterbatasan Diketahui
- MediaPipe Hands & font Fredoka dimuat dari CDN → butuh internet saat pertama; ada fallback font & toast
  bila kamera/AI gagal (otomatis menyarankan mode Sentuh).
- Kamera tidak jalan di `file://` atau browser tanpa `getUserMedia` — mode Sentuh selalu tersedia.
- Suara memakai WebAudio (tanpa aset eksternal); pemutaran pertama butuh interaksi pengguna (kebijakan browser).
