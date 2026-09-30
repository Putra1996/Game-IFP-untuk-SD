# AUDIT MENDELAN — ABSENSI WAJAH CERDAS v1.0

Tanggal: 30-09-2026 · Auditor: otomatis (jsdom + Puppeteer/Chrome headless + verifikasi visual)

## 1. Metodologi
- **Suite jsdom** (`/tmp/smoke/aw-audit.js`): unit (Euclid, matcher, CSV, tanggal, persentase),
  CRUD kelas/siswa lewat UI nyata (klik modal), guard, sesi (manual + auto-match + duplikat +
  downgrade-guard), rekap, CSV, XSS, ketahanan (no-throw tanpa sesi).
- **Chrome E2E** (`/tmp/smoke/aw-e2e.js`): kamera palsu, `http://127.0.0.1:8099`, viewport 1280×720,
  pendengar `pageerror`/`console.error`. **Model AI asli face-api.js dimuat dari CDN** (bukan mock!),
  lalu loop deteksi dibekukan untuk injeksi hasil deteksi deterministik (descriptor sintetis 128-d
  + derau ≤0.005 → cocok; seed beda → asing). Benchmark rAF 4 detik; uji persistensi via reload nyata.
- **Verifikasi visual** 4 tangkapan layar.

## 2. Hasil Akhir
| Suite | Hasil |
|---|---|
| jsdom | **68/68 LULUS** |
| Chrome E2E | **31/31 LULUS** |
| Page error / console error | **0** |
| Benchmark FPS | **60 FPS** (≥45) |
| Total | **99/99** |

Bukti E2E kunci: **pengenalan wajah nyata end-to-end** — model CDN termuat ("🤖 AI aktif"),
injeksi 2 wajah → 1 cocok ("✓ Budi Santoso", kotak hijau) + 1 asing ("? Tidak dikenal", kotak
oranye), otomatis Hadir 1/3, deteksi ulang tidak mendobel, override manual Izin dipertahankan,
rekap 1/0/0/0 + 2 tanpa catatan + 33%, CSV benar (kutip + header), **reload → data tetap ada**.

## 3. Temuan & Perbaikan
**Bug aplikasi nyata: 2**
1. **Kelas eksplisit hilang** — daftar kelas diturunkan dari `students.map(s=>cls)` sehingga kelas
   yang dibuat ("Kelas Baru") menghilang begitu belum/kosong berisi siswa, dan modal siswa kehilangan
   opsinya. **Perbaikan**: daftar kelas eksplisit `aw_classes_v1` (`getClasses` = union tersimpan ∪
   tersirat), `registerClass()` saat buat kelas/kelas-baru-di-modal, hapus kelas membersihkan daftar.
2. **Edit siswa bisa gagal senyap** — dropdown kelas memakai daftar tanpa kelas siswa itu sendiri
   (kelas tersirat kosong) → `select.value` tidak cocok → tersimpan kelas string kosong.
   **Perbaikan**: opsi kelas siswa selalu disertakan (`[s.cls, ...getClasses()]` unik) + guard
   "Pilih kelas dulu!" bila tetap kosong.

Perbaikan kecil lain: default kelas pertama di layar setup (tombol MULAI aktif setelah ada data);
`</style></head>` tertinggal saat perakitan (terdeteksi jsdom "Could not parse CSS" — seluruh body
gagal render; tambah penutup di 02_style.css).

**Koreksi harness uji (bukan bug aplikasi):**
- Kebingungan premis: setelah "Semua Hadir", asersi duplikat/asing harus menghitung 2 catatan
  (Budi+Siti) — bukan 1; pindahkan urutan injection setelah Reset agar bersih.
- Regex CSV: semua sel teks **selalu di-kutip** (`"Budi Santoso",Hadir`) → pola tanpa kutip tak pernah cocok.
- Asersi XSS rekap: cek `<img` pada innerHTML (bukan `onerror` — ter-escape jadi `""` oleh CSV writer,
  dan di DOM aman karena memakai `textContent`).
- `#csv-view` (textarea) menormalisasi CRLF→LF → split pakai `\n`.
- `CFG` bukan global window (hanya lewat `window.__AW.CFG`); ekspor hook `getStudents/getRekap/...`
  ditambah bertahap; `renderData()` harus dipanggil ulang setelah `setDesc` agar badge ter-render.
- jsdom awal: file uji pertama punya syntax error escape bertingkat → ditulis ulang dengan template literal.

## 4. Matriks Cakupan
| Fitur | jsdom | E2E | Visual |
|---|---|---|---|
| Beranda + bantuan | ✓ | ✓ | ✓ (01) |
| Kelas: buat (eksplisit), hapus (bersihkan siswa), chip aktif | ✓ | ✓ | ✓ (02) |
| Siswa: tambah (incl. kelas baru), edit, hapus, guard kosong | ✓ | ✓ | ✓ (02) |
| setDesc validasi 128 & metadata "data wajah ✓" | ✓ | ✓ | ✓ (02) |
| Setup: default kelas, mode kamera/manual, note wajah, guard | ✓ | ✓ | — |
| Sesi: panel 3 siswa, hitung, progress, judul tanggal | ✓ | ✓ | ✓ (03) |
| Auto-match → Hadir + kotak hijau bernama; asing → oranye | ✓ | ✓ (AI nyata) | ✓ (03) |
| Dobel deteksi tidak dobel; status tak diturunkan + toast | ✓ | ✓ | — |
| Manual H/I/S/A in-place; Semua Hadir; Reset (bersih rekap) | ✓ | ✓ | — |
| Rekap: ringkasan 6 kotak, badge+jam, chip tanggal, hapus tanggal | ✓ | ✓ | ✓ (04) |
| CSV: header, kutipan aman, Tidak Tercatat, lihat & unduh | ✓ | ✓ | — |
| Persistensi localStorage | ✓ | ✓ (reload) | — |
| XSS nama siswa (scan/kotak/rekap/CSV) | ✓ | — | — |
| Ketahanan: finish tanpa sesi no-throw; keluar menghentikan sesi | ✓ | — | — |
| Page error / console bersih; FPS | ✓ | ✓ | — |

## 5. Keterbatasan Diketahui
- Akurasi bergantung pencahayaan & sudut; satu foto enroll = ambang 0.5 standar (bisa tambah foto
  dari sudut berbeda di perkembangan selanjutnya).
- Model ~7 MB diunduh sekali dari CDN (ter-cache); tanpa internet setelahnya tetap jalan.
- Kamera butuh konteks aman (`http://` lokal / `https://`) — `file://` diblokir browser; panel
  manual selalu tersedia sebagai fallback penuh.
- localStorage ±5 MB: ribuan siswa pun aman (descriptor 128 float ≈ 2–3 KB/siswa; rekap kecil).
