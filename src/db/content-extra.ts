import type { NewLevel } from "./schema";
import type { LevelSeed } from "./content";

// ============================================================
// KONTEN LANJUTAN SQL QUEST — level 11+ (bab baru)
// ============================================================
// Bab:
//   A (11-20) : Fungsi String & NULL/COALESCE
//   B (21-30) : Fungsi Tanggal & Waktu
//   C (31-40) : CASE & Logika Kondisi
//   D (41-50) : Subquery Lanjutan (EXISTS, ANY/ALL, correlated)
//   E (51-60) : UNION, INTERSECT, EXCEPT
//   F (61-70) : Window Functions (ROW_NUMBER, RANK, ...)
//   G (71-80) : CTE (WITH) & View
//   H (81-90) : Self-Join, Trik Lanjutan, Boss per Bab
//   I (91-100): Tantangan Akhir & Ulasan Total
//
// Setiap level membawa concept + explanation (materi) yang tampil sebelum soal.

export type LevelSeed2 = {
  level: NewLevel & { concept?: string | null; explanation?: string | null };
  exercises: {
    title: string;
    prompt: string;
    hint: string;
    datasetSql: string;
    starterSql: string;
    solutionSql: string;
  }[];
};

// ------------------------------------------------------------
// Dataset sekolah yang lebih kaya untuk level lanjutan
// ------------------------------------------------------------
export const DATASET_SCHOOL = `
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date DATE NOT NULL,
  email TEXT,
  class_name TEXT NOT NULL,
  gpa NUMERIC(3,2) NOT NULL
);

CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE exam_scores (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id),
  subject_id INT NOT NULL REFERENCES subjects(id),
  score NUMERIC(5,2) NOT NULL,
  exam_date DATE NOT NULL
);

INSERT INTO students (id, name, gender, birth_date, email, class_name, gpa) VALUES
  (1, 'Budi Santoso', 'L', '2009-04-12', 'budi.santoso@mail.com', '7A', 3.75),
  (2, 'Siti Rahayu', 'P', '2008-11-03', 'siti.rahayu@mail.com', '8B', 3.50),
  (3, 'Agus Wijaya', 'L', '2010-01-25', NULL, '7A', 2.90),
  (4, 'Dewi Lestari', 'P', '2009-07-19', 'dewi.lestari@mail.com', '7B', 3.85),
  (5, 'Rizky Pratama', 'L', '2008-05-30', 'rizky.pratama@mail.com', '8A', 3.10),
  (6, 'Maya Anggraini', 'P', '2010-09-14', NULL, '7A', 2.75),
  (7, 'Andi Kurniawan', 'L', '2009-12-08', 'andi.kurniawan@mail.com', '7B', 3.40),
  (8, 'Putri Handayani', 'P', '2008-02-21', 'putri.handayani@mail.com', '8A', 3.60),
  (9, 'Bayu Nugroho', 'L', '2010-06-05', 'bayu.nugroho@mail.com', '7B', 3.95),
  (10, 'Rina Wulandari', 'P', '2009-03-17', 'rina.wulandari@mail.com', '7A', 3.30);

INSERT INTO subjects (code, title, category) VALUES
  ('MTK', 'Matematika', 'Eksak'),
  ('BIN', 'Bahasa Indonesia', 'Bahasa'),
  ('BIG', 'Bahasa Inggris', 'Bahasa'),
  ('IPA', 'Ilmu Pengetahuan Alam', 'Eksak'),
  ('IPS', 'Ilmu Pengetahuan Sosial', 'Sosial');

INSERT INTO exam_scores (student_id, subject_id, score, exam_date) VALUES
  (1, 1, 90.00, '2024-03-10'),
  (1, 2, 85.00, '2024-03-12'),
  (2, 1, 78.00, '2024-03-10'),
  (2, 3, 88.00, '2024-03-14'),
  (3, 1, 65.00, '2024-03-10'),
  (4, 2, 92.00, '2024-03-12'),
  (4, 4, 95.00, '2024-03-15'),
  (5, 1, 70.00, '2024-03-10'),
  (5, 5, 80.00, '2024-03-16'),
  (6, 3, 60.00, '2024-03-14'),
  (7, 1, 82.00, '2024-03-10'),
  (7, 4, 75.00, '2024-03-15'),
  (8, 2, 87.00, '2024-03-12'),
  (8, 3, 90.00, '2024-03-14'),
  (9, 1, 96.00, '2024-03-10'),
  (9, 5, 85.00, '2024-03-16'),
  (10, 1, 72.00, '2024-03-10'),
  (10, 2, 79.00, '2024-03-12');
`;

// ============================================================
// BAB A — FUNGSI STRING & NULL (level 11-20)
// ============================================================
export const extraLevelsA: LevelSeed2[] = [
  {
    level: {
      slug: "fungsi-string-upper",
      title: "Level 11 — UPPER & LOWER",
      description: "Ubah teks jadi huruf besar/kecil dengan fungsi UPPER dan LOWER.",
      orderIndex: 11,
      concept: "UPPER & LOWER",
      explanation:
        "Fungsi string mengubah isi teks.\n• UPPER(teks) → semua huruf BESAR. Contoh: UPPER('budi') = 'BUDI'\n• LOWER(teks) → semua huruf kecil. Contoh: LOWER('BUDI') = 'budi'\n\nTeks asli di tabel TIDAK berubah — hasil fungsi hanya tampil di query.\nCoba: SELECT UPPER(name) FROM students;",
    },
    exercises: [
      {
        title: "Nama Huruf Besar",
        prompt: "Tampilkan name setiap siswa dalam huruf besar semua.",
        hint: "SELECT UPPER(name) FROM students;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students;",
        solutionSql: "SELECT UPPER(name) FROM students;",
      },
      {
        title: "Nama Huruf Kecil",
        prompt: "Tampilkan name setiap siswa dalam huruf kecil semua.",
        hint: "Gunakan LOWER(name).",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students;",
        solutionSql: "SELECT LOWER(name) FROM students;",
      },
      {
        title: "Email Huruf Besar",
        prompt: "Tampilkan email semua siswa dalam huruf besar.",
        hint: "SELECT UPPER(email) FROM students;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT email FROM students;",
        solutionSql: "SELECT UPPER(email) FROM students;",
      },
      {
        title: "Gabung UPPER + Alias",
        prompt: "Tampilkan UPPER(name) dengan nama kolom hasil 'nama_besar'.",
        hint: "Alias dengan AS: SELECT UPPER(name) AS nama_besar FROM students;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT UPPER(name) FROM students;",
        solutionSql: "SELECT UPPER(name) AS nama_besar FROM students;",
      },
    ],
  },
  {
    level: {
      slug: "fungsi-string-length",
      title: "Level 12 — LENGTH",
      description: "Hitung panjang teks dengan LENGTH.",
      orderIndex: 12,
      concept: "LENGTH",
      explanation:
        "LENGTH(teks) mengembalikan jumlah karakter dalam teks.\nContoh: LENGTH('SQL') = 3\n\nKegunaan: cari tahu nama terpanjang, validasi panjang email, dll.\nCoba: SELECT name, LENGTH(name) FROM students;",
    },
    exercises: [
      {
        title: "Panjang Nama",
        prompt: "Tampilkan name dan panjang nama (dalam karakter) setiap siswa.",
        hint: "SELECT name, LENGTH(name) FROM students;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students;",
        solutionSql: "SELECT name, LENGTH(name) FROM students;",
      },
      {
        title: "Nama Terpanjang",
        prompt: "Tampilkan name siswa yang namanya paling panjang (pakai subquery MAX).",
        hint: "WHERE LENGTH(name) = (SELECT MAX(LENGTH(name)) FROM students)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students;",
        solutionSql:
          "SELECT name FROM students WHERE LENGTH(name) = (SELECT MAX(LENGTH(name)) FROM students);",
      },
      {
        title: "Filter Panjang Email",
        prompt: "Tampilkan email yang panjangnya lebih dari 15 karakter.",
        hint: "WHERE LENGTH(email) > 15 — email NULL otomatis tidak cocok.",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT email FROM students;",
        solutionSql: "SELECT email FROM students WHERE LENGTH(email) > 15;",
      },
    ],
  },
  {
    level: {
      slug: "fungsi-string-substring",
      title: "Level 13 — SUBSTRING",
      description: "Ambil potongan teks dengan SUBSTRING.",
      orderIndex: 13,
      concept: "SUBSTRING",
      explanation:
        "SUBSTRING(teks, mulai, panjang) mengambil potongan teks.\nContoh: SUBSTRING('Budi Santoso', 1, 4) = 'Budi' (mulai karakter ke-1, ambil 4).\n\nKarakter dihitung mulai dari 1 (bukan 0).\nCoba: SELECT name, SUBSTRING(name, 1, 4) FROM students;",
    },
    exercises: [
      {
        title: "Ambil 3 Huruf Pertama",
        prompt: "Tampilkan name dan 3 huruf pertama dari name setiap siswa.",
        hint: "SUBSTRING(name, 1, 3)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students;",
        solutionSql: "SELECT name, SUBSTRING(name, 1, 3) FROM students;",
      },
      {
        title: "Awalan Kode Kelas",
        prompt: "Tampilkan name dan 1 huruf pertama class_name (ambil dari posisi 1 sepanjang 1).",
        hint: "SUBSTRING(class_name, 1, 1)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, class_name FROM students;",
        solutionSql: "SELECT name, SUBSTRING(class_name, 1, 1) FROM students;",
      },
      {
        title: "Filter 3 Huruf Terakhir",
        prompt: "Tampilkan email yang 10 huruf pertamanya adalah 'budi.santo'.",
        hint: "WHERE SUBSTRING(email, 1, 10) = 'budi.santo'",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT email FROM students;",
        solutionSql: "SELECT email FROM students WHERE SUBSTRING(email, 1, 10) = 'budi.santo';",
      },
    ],
  },
  {
    level: {
      slug: "fungsi-string-concat",
      title: "Level 14 — CONCAT & ||",
      description: "Sambungkan teks dengan CONCAT atau operator ||.",
      orderIndex: 14,
      concept: "CONCAT",
      explanation:
        "Menggabungkan dua teks atau lebih jadi satu.\nCara 1: CONCAT('a', 'b') = 'ab'\nCara 2 (PostgreSQL): 'a' || 'b' = 'ab'\n\nBisa juga menggabungkan kolom: CONCAT(name, ' kelas ', class_name).\nCoba: SELECT CONCAT(name, ' - ', class_name) FROM students;",
    },
    exercises: [
      {
        title: "Nama + Kelas",
        prompt: "Tampilkan gabungan name dan class_name dengan format: 'Nama - Kelas'.",
        hint: "CONCAT(name, ' - ', class_name)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, class_name FROM students;",
        solutionSql: "SELECT CONCAT(name, ' - ', class_name) FROM students;",
      },
      {
        title: "Sapa Siswa",
        prompt: "Tampilkan teks sapaan 'Halo, [name]!' untuk tiap siswa.",
        hint: "CONCAT('Halo, ', name, '!')",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students;",
        solutionSql: "SELECT CONCAT('Halo, ', name, '!') FROM students;",
      },
      {
        title: "Pakai Operator ||",
        prompt: "Tampilkan gabungan name dan gpa dengan || , format 'name: gpa'.",
        hint: "name || ': ' || gpa",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: "SELECT name || ': ' || gpa FROM students;",
      },
    ],
  },
  {
    level: {
      slug: "null-coalesce",
      title: "Level 15 — NULL & COALESCE",
      description: "Apa itu NULL dan bagaimana mengganti NULL dengan nilai lain (COALESCE).",
      orderIndex: 15,
      concept: "COALESCE",
      explanation:
        "NULL artinya 'tidak ada data' — bukan 0, bukan teks kosong.\n\nCOALESCE(nilai1, nilai2, ...) mengambil nilai PERTAMA yang bukan NULL.\nContoh: COALESCE(email, 'tidak punya email') → kalau email NULL, ganti jadi teks itu.\n\nCoba: SELECT name, COALESCE(email, '-') FROM students;",
    },
    exercises: [
      {
        title: "Ganti Email NULL",
        prompt: "Tampilkan name dan email; email yang NULL diganti teks 'tidak ada'.",
        hint: "COALESCE(email, 'tidak ada')",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, email FROM students;",
        solutionSql: "SELECT name, COALESCE(email, 'tidak ada') FROM students;",
      },
      {
        title: "Cari Siswa Tanpa Email",
        prompt: "Tampilkan name siswa yang email-nya NULL.",
        hint: "WHERE email IS NULL — bukan email = NULL!",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, email FROM students;",
        solutionSql: "SELECT name FROM students WHERE email IS NULL;",
      },
      {
        title: "COALESCE dengan Angka",
        prompt: "Tampilkan name dan gpa; kalau gpa NULL ganti jadi 0. (tidak ada yang NULL di data, tapi latihan sintaks)",
        hint: "COALESCE(gpa, 0)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: "SELECT name, COALESCE(gpa, 0) FROM students;",
      },
    ],
  },
  {
    level: {
      slug: "boss-1",
      title: "Level 16 — BOSS: Ujian Fungsi String",
      description: "Gabungkan semua fungsi string untuk memecahkan tantangan.",
      orderIndex: 16,
      concept: "Ulasan Fungsi String",
      explanation:
        "Ini level BOSS! Tantangan menggabungkan UPPER/LOWER, LENGTH, SUBSTRING, CONCAT, dan COALESCE.\nIngat:\n• UPPER/LOWER mengubah huruf\n• LENGTH menghitung panjang\n• SUBSTRING memotong\n• CONCAT / || menggabung\n• COALESCE mengganti NULL\n\nBaca soal pelan-pelan dan susun langkahnya!",
    },
    exercises: [
      {
        title: "Nama & Panjang (Boss)",
        prompt: "Tampilkan UPPER(name) dengan alias nama_besar, dan LENGTH(name) dengan alias panjang.",
        hint: "SELECT UPPER(name) AS nama_besar, LENGTH(name) AS panjang FROM students;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students;",
        solutionSql: "SELECT UPPER(name) AS nama_besar, LENGTH(name) AS panjang FROM students;",
      },
      {
        title: "Inisial Nama (Boss)",
        prompt: "Tampilkan name dan 2 huruf pertama name (alias inisial) untuk siswa kelas 7A.",
        hint: "SUBSTRING(name,1,2) + WHERE class_name='7A'",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students;",
        solutionSql:
          "SELECT name, SUBSTRING(name, 1, 2) AS inisial FROM students WHERE class_name = '7A';",
      },
      {
        title: "Profil Singkat (Boss)",
        prompt: "Tampilkan satu kolom berisi CONCAT(name, ' (', UPPER(class_name), ')') untuk semua siswa.",
        hint: "CONCAT(name, ' (', UPPER(class_name), ')')",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, class_name FROM students;",
        solutionSql:
          "SELECT CONCAT(name, ' (', UPPER(class_name), ')') FROM students;",
      },
      {
        title: "Email Aman (Boss)",
        prompt: "Tampilkan name dan email; email NULL diganti LOWER(name) + '@mail.com'.",
        hint: "COALESCE(email, CONCAT(LOWER(name), '@mail.com'))",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, email FROM students;",
        solutionSql:
          "SELECT name, COALESCE(email, CONCAT(LOWER(name), '@mail.com')) FROM students;",
      },
    ],
  },
];
