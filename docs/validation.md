# Flow Validasi Soal — Panduan Developer

Dokumentasi teknis tentang bagaimana query siswa divalidasi di SQL Quest,
termasuk audit bug yang pernah ditemui dan pola aman untuk menulis soal baru.

---

## Flow end-to-end

```
Siswa klik "Jalankan"
  ↓
SqlRunner (client component)
  ├─ createRunner(datasetSql)          ← buat sandbox PGlite, muat dataset
  ├─ runner.run(userSql)               ← eksekusi query siswa
  ├─ runner.run(solutionSql)           ← eksekusi query solusi
  ├─ compareResults(user, solution, ordered) ← bandingkan dua hasil
  └─ recordProgress(exerciseId, attempts, durationMs) ← simpan ke server
        ↓
POST /api/progress
  ├─ cek login (SESSION_COOKIE)
  ├─ insert/update progress (per-user per-exercise)
  └─ simpan durasi terkecil (best time untuk leaderboard)
```

File terkait:
- `src/lib/pglite-runner.ts` — `createRunner`, `compareResults`
- `src/components/SqlRunner.tsx` — UI, timer, dispatch event
- `src/app/api/progress/route.ts` — persist progress + durasi

---

## Bagaimana `compareResults` bekerja

Ada dua mode perbandingan (di `pglite-runner.ts`):

### 1. Multiset (default, `ordered=false`)
Baris dianggap himpunan tak berurutan — urutan baris diabaikan.

```
user:     A, B, C
solution: C, A, B  →  benar ✓ (isi sama, urutan beda)
```

Kolom: perbandingan normalizeCell men-sort tiap baris duluan —
jadi `SELECT name, gpa` dan `SELECT gpa, name` tetap cocok.

### 2. Ordered (`ordered=true`)
Baris dibanding persis berurutan (baris 1 ↔ baris 1, dst).

```
user:     A, B, C
solution: A, B, C  →  benar ✓
user:     C, B, A  →  salah ✗
```

Mode ini dipicu otomatis kalau `solutionSql` mengandung `ORDER BY`.

### Deteksi ORDER BY
Di `SqlRunner.tsx`, sebelum membandingkan:
```ts
const orderSensitive = /order\s+by/i.test(solutionSql);
const ok = compareResults(userResult, solutionOutcome.result, orderSensitive);
```

### Normalisasi sel (`normalizeCell`)
| Tipe nilai | Normalisasi |
|---|---|
| null / undefined | `"NULL"` |
| Date | ISO string |
| number | `Number(toFixed(6)).toString()` — desimal konsisten (3.50 = 3.5) |
| object | `JSON.stringify()` |
| lainnya | `String()` |

---

## Audit ORDER BY — Bug yang ditemukan & diperbaik

### Bug lama (sudah diperbaik)
Perbandingan selalu multiset → `ORDER BY gpa ASC` vs `ORDER BY gpa DESC`
dianggap benar karena isi barisnya sama, meski urutan beda.

### Fix
Tambah parameter `ordered` ke `compareResults`:
- `ordered = false` → baris sebagai multiset (urutan diabaikan).
- `ordered = true` → baris dibanding persis berurutan.
- Flag dideteksi otomatis dari `solutionSql`: kalau mengandung `ORDER BY` → `ordered = true`.

### Risiko residual
Kalau `solutionSql` mengandung `ORDER BY` **yang hanya untuk deterministik** (padahal prompt tidak meminta urutan), validasi bisa menolak jawaban benar tanpa ORDER BY.

**Solusi**: patuhi konvensi konten (lihat panduan menulis soal).
Audit seluruh konten dilakukan 2025-09 — semua `ORDER BY` di solution cocok
dengan prompt yang memang minta urutan → tidak ada false negative.

---

## Pola aman menulis soal baru

### Prinsip: `solutionSql` hanya boleh punya `ORDER BY` kalau prompt memang minta urutan

```
✓  prompt: "urut dari IPK tertinggi"
   → solution: ORDER BY gpa DESC

✗  prompt: "tampilkan semua siswa"
   → solution: ORDER BY name   ← ini hanya untuk deterministik!
     siswa yang tidak ORDER BY bisa dianggap salah
```

### Jangan pakai `LIMIT` tanpa `ORDER BY`
```
✗  solution: SELECT ... FROM students LIMIT 3;
   Hasil non-deterministik — tiap PGlite session bisa beda.

✓  solution: SELECT ... FROM students ORDER BY gpa DESC LIMIT 3;
```

### Perbandingan kolom: nama kolom diabaikan, jumlah & posisi dipakai
- `SELECT name, gpa` vs `SELECT gpa, name` → cocok karena baris di-sort per cell sebelum banding.
- Jumlah kolom beda → langsung salah.
- Header/alias TIDAK dibandingkan — hanya isi baris.

### NULL
`NULL` di-display sebagai string `"NULL"` (bukan string kosong). Pastikan soal yang berurusan dengan NULL sadar perbandingan ini.

### Dataset tersedia untuk soal baru
| Konstanta | Isi tabel | Level |
|---|---|---|
| `DATASET_STUDENTS` | `students` (1 tabel) | 1-2 |
| `DATASET_FULL` | `students`, `courses`, `enrollments` | 3 |
| `DATASET_SCHOOL` | `students`, `subjects`, `exam_scores` | 11+ / generator |

`content-gen.ts` pakai generator pattern: setiap topik menghasilkan soal-variasi berparameter (kelas, subjek, dst.) deterministik dari seed index.

---

## Checklist menambah level/soal baru

1. Tambah `LevelSeed` di file konten (`content.ts`/`content-extra.ts`), atau
   topik baru di `content-gen.ts`.
2. Pastikan `solutionSql` valid PostgreSQL — tes manual dulu di PGlite.
3. Pastikan `starterSql` valid (supaya tombol Reset tidak error).
4. Jalankan `npm run db:setup` (reset ulang semua level — idempoten).
5. Jalankan `npm run db:verify` — semua `solutionSql` dan `starterSql` harus
   sukses di PGlite.
6. Jalankan `npm run dev` → tes manual di browser:
   - Jalankan solusi benar → harus dianggap benar.
   - Jalankan solusi salah (urutan beda / kolom beda) → harus ditolak.
7. Pastikan `datasetSql` tabel yang dipakai cocok (panel skema di halaman latihan
   menunjukkan tabel & kolom otomatis).

---

## Debugging validasi bermasalah

- **Jawaban benar tapi ditolak (false negative)**: kemungkinan `ORDER BY` di
  `solutionSql` tanpa diminta prompt → hapus ORDER BY dari solusi.
- **Jawaban salah tapi lolos (false positive)**: kemungkinan ada ORDER BY yang
  seharusnya diminta tapi tidak ada di prompt → tambah "urutkan..." ke prompt.
- **Kolom beda → dianggap salah**: normal — perbandingan banding kolom count.
  Pastikan prompt menginstruksikan kolom yang tepat.
- **Numeric beda presisi**: `3.75` vs `3.750` → aman, normalizeCell normalizes.
