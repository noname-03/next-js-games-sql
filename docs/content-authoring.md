# Panduan Menambah Level & Soal

Panduan singkat untuk menambah konten baru ke SQL Quest. Baca juga
`validation.md` untuk detail teknis validasi.

---

## Struktur konten

Konten ada di tiga file:
- `src/db/content.ts` — level dasar (1-10) + dataset
- `src/db/content-extra.ts` — level lanjutan manual (11-44, dst) + dataset sekolah
- `src/db/content-gen.ts` — generator level latihan terstruktur (topik × putaran)

Tipe utama:
```ts
type LevelSeed = {
  level: {
    slug: string;          // unik, URL-friendly
    title: string;
    description: string;
    orderIndex: number;    // urutan global level (1,2,3...)
    concept?: string;      // istilah baru (ditampilkan di kartu "Materi")
    explanation?: string;  // penjelasan sebelum soal (wajib kalau ada istilah baru)
  };
  exercises: SeedExercise[];
};

type SeedExercise = {
  title: string;
  prompt: string;     // instruksi untuk siswa
  hint: string;       // petunjuk (tombol "Lihat Hint")
  datasetSql: string; // CREATE TABLE + INSERT → PGlite sandbox
  starterSql: string; // query awal di editor (siswa edit ini)
  solutionSql: string;// query jawaban benar (divalidasi otomatis)
};
```

---

## Dataset yang tersedia

| Konstanta (di content.ts/content-extra.ts) | Tabel | Cocok untuk |
|---|---|---|
| `DATASET_STUDENTS` | `students` (8 baris: id,name,major,gpa,enrolled_at) | Level 1-2: SELECT, WHERE, ORDER |
| `DATASET_FULL` | `students` + `courses` + `enrollments` | Level 3: JOIN, LEFT JOIN, SUBQUERY |
| `DATASET_SCHOOL` | `students` + `subjects` + `exam_scores` (10 siswa, data lebih kaya, email, gender, birth_date) | Level 11+ / generator: fungsi string, tanggal, CASE |

Dataset baru ditambahkan sebagai konstanta `const DATASET_... = \`...\`;` di file konten.

---

## Langkah menambah level

### Manual (content-extra.ts)
1. Tambah `LevelSeed` baru di array `extraLevelsA/B/C/...`.
2. Isi `level.concept` + `level.explanation` (wajib ada konsep baru!).
3. Buat 3-5 exercises dengan `datasetSql` yang benar.
4. Tambah variabel export `extraLevelsX` ke `seed.ts` (di `allSeeds`).
5. Jalankan `npm run db:setup` lalu `npm run db:verify`.

### Generator (content-gen.ts)
- Tiap topik adalah `BankTopic`: fungsi `build(n)` menghasilkan exercises
  dengan variasi berparameter dari `n`.
- Variasi disuplai oleh konstanta (`CLASSES`, `SUBJECTS`, `GPA_HI`, dsb.).
- Generator memakai `DATASET_SCHOOL` untuk semua level latihan.
- Penting: `solutionSql` di generator HARUS valid — generator deterministik,
  jalankan `db:verify` setelah ubah topik apa pun.

---

## Praktik penulisan soal

### Konsep baru → materi dulu
Kalau soal memakai istilah baru (DISTINCT, JOIN, SUBQUERY, dll), BUBUHKAN
penjelasan di `level.concept` dan `level.explanation`. UI menampilkan kartu
materi **sebelum** soal pertama level itu.

### `prompt` yang bagus
- Tulis instruksi jelas dalam bahasa Indonesia sehari-hari.
- Sebut nama kolom/tabel secara eksplisit.
- Contoh bagus: "Tampilkan name dan gpa semua mahasiswa yang berasal dari
  jurusan 'Informatika', urut dari IPK tertinggi."
- Contoh buruk: "Coba WHERE + ORDER BY." (terlalu samar)

### `hint`
- Tulis satu contoh SQL benar atau sebagian (bukan solusi utuh penuh).
- Boleh: potongan syntax, nama kolom, pola WHERE, dsb.

### `starterSql` — WAJIB valid
- Starter selalu query SQL valid yang bisa dijalankan PostgreSQL.
- Idealnya hasilnya beda dari solusi supaya siswa mengedit (bukan langsung submit).
- Jika ORDER BY di solution diminta prompt, starter bisa tanpa ORDER BY.

### `solutionSql` — WAJIB valid & cek ORDER BY
- Solution adalah jawaban ideal — satu query, non-DML (SELECT).
- **Jangan tambah ORDER BY kecuali prompt meminta urutan** — kalau hanya
  untuk deterministik, jadikan bagian prompt ("... urutkan dari ...").
- Jangan pakai LIMIT tanpa ORDER BY.
- Jalankan `npm run db:verify` untuk cek semua solution.

---

## Checklist sebelum commit

- [ ] `npm run db:setup` sukses (level baru ter-insert tanpa error)
- [ ] `npm run db:verify` lolos (SEMUA solusi valid, starter tidak error)
- [ ] `npm run build` lolos
- [ ] Tes manual: jalankan query benar → dianggap benar
- [ ] Tes manual: jalankan query salah (urutan beda / isi beda) → ditolak
- [ ] Buka panel skema → tabel & kolom yang dipakai terlihat benar
- [ ] Kalau ada istilah baru: kartu materi tampil sebelum soal pertama
