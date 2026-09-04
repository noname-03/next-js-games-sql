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

// ============================================================
// BAB B — FUNGSI TANGGAL & WAKTU (level 17-21)
// ============================================================
export const extraLevelsB: LevelSeed2[] = [
  {
    level: {
      slug: "tanggal-extract",
      title: "Level 17 — EXTRACT (Ambil Bagian Tanggal)",
      description: "Ambil tahun, bulan, atau hari dari sebuah tanggal dengan EXTRACT.",
      orderIndex: 17,
      concept: "EXTRACT",
      explanation:
        "EXTRACT(bagian FROM tanggal) mengambil satu bagian dari tanggal.\nBagian yang bisa diambil: YEAR, MONTH, DAY, HOUR, dll.\n\nContoh: EXTRACT(YEAR FROM DATE '2024-03-10') = 2024\nEXTRACT(MONTH FROM birth_date) = bulan lahir siswa.\n\nCoba: SELECT name, EXTRACT(YEAR FROM birth_date) FROM students;",
    },
    exercises: [
      {
        title: "Tahun Lahir",
        prompt: "Tampilkan name dan tahun lahir (EXTRACT YEAR dari birth_date) setiap siswa.",
        hint: "EXTRACT(YEAR FROM birth_date)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, birth_date FROM students;",
        solutionSql: "SELECT name, EXTRACT(YEAR FROM birth_date) FROM students;",
      },
      {
        title: "Bulan Lahir",
        prompt: "Tampilkan name dan bulan lahir (angka 1-12) setiap siswa.",
        hint: "EXTRACT(MONTH FROM birth_date)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, birth_date FROM students;",
        solutionSql: "SELECT name, EXTRACT(MONTH FROM birth_date) FROM students;",
      },
      {
        title: "Filter Tahun Lahir",
        prompt: "Tampilkan name siswa yang lahir tahun 2009.",
        hint: "WHERE EXTRACT(YEAR FROM birth_date) = 2009",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, birth_date FROM students;",
        solutionSql:
          "SELECT name FROM students WHERE EXTRACT(YEAR FROM birth_date) = 2009;",
      },
      {
        title: "Tanggal Ujian per Tahun",
        prompt: "Tampilkan tahun ujian (dari exam_date) dan jumlah ujian tiap tahun, dari tabel exam_scores.",
        hint: "GROUP BY EXTRACT(YEAR FROM exam_date)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT exam_date FROM exam_scores;",
        solutionSql:
          "SELECT EXTRACT(YEAR FROM exam_date), COUNT(*) FROM exam_scores GROUP BY EXTRACT(YEAR FROM exam_date);",
      },
    ],
  },
  {
    level: {
      slug: "tanggal-age",
      title: "Level 18 — AGE (Umur)",
      description: "Hitung umur seseorang berdasarkan tanggal lahir dengan AGE.",
      orderIndex: 18,
      concept: "AGE",
      explanation:
        "AGE(tanggal_lahir) menghitung umur sejak tanggal lahir sampai hari ini.\nHasilnya interval seperti '15 years 4 mons 12 days'.\n\nAGE(tanggal_awal, tanggal_akhir) menghitung jarak dua tanggal.\nContoh: AGE(DATE '2010-01-25') → umur siswa itu sekarang.\n\nCoba: SELECT name, AGE(birth_date) FROM students;",
    },
    exercises: [
      {
        title: "Umur Siswa",
        prompt: "Tampilkan name dan umur (AGE dari birth_date) setiap siswa.",
        hint: "SELECT name, AGE(birth_date) FROM students;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, birth_date FROM students;",
        solutionSql: "SELECT name, AGE(birth_date) FROM students;",
      },
      {
        title: "Umur per Kelas",
        prompt: "Tampilkan class_name dan umur rata-rata siswa per kelas (pakai AVG(AGE(birth_date))).",
        hint: "GROUP BY class_name + AVG(AGE(birth_date))",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT class_name, birth_date FROM students;",
        solutionSql:
          "SELECT class_name, AVG(AGE(birth_date)) FROM students GROUP BY class_name;",
      },
    ],
  },
  {
    level: {
      slug: "tanggal-current",
      title: "Level 19 — CURRENT_DATE & Filter Tanggal",
      description: "Tanggal hari ini dengan CURRENT_DATE dan membandingkan tanggal.",
      orderIndex: 19,
      concept: "CURRENT_DATE",
      explanation:
        "CURRENT_DATE mengembalikan tanggal hari ini (sesuai server).\nBerguna untuk filter data 'sampai hari ini', '7 hari terakhir', dll.\n\nContoh: SELECT CURRENT_DATE; → 2024-xx-xx\nFilter: WHERE exam_date < CURRENT_DATE (ujian yang sudah lewat).\n\nUntuk mundur waktu: CURRENT_DATE - INTERVAL '7 days'.",
    },
    exercises: [
      {
        title: "Tampilkan Hari Ini",
        prompt: "Tampilkan CURRENT_DATE sebagai kolom 'hari_ini'.",
        hint: "SELECT CURRENT_DATE AS hari_ini;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT CURRENT_DATE;",
        solutionSql: "SELECT CURRENT_DATE AS hari_ini;",
      },
      {
        title: "Ujian 7 Hari Terakhir",
        prompt: "Tampilkan student_id dan exam_date dari ujian yang tanggalnya >= 7 hari sebelum hari ini.",
        hint: "WHERE exam_date >= CURRENT_DATE - INTERVAL '7 days'",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT student_id, exam_date FROM exam_scores;",
        solutionSql:
          "SELECT student_id, exam_date FROM exam_scores WHERE exam_date >= CURRENT_DATE - INTERVAL '7 days';",
      },
    ],
  },
  {
    level: {
      slug: "tanggal-boss",
      title: "Level 20 — BOSS: Fungsi Tanggal",
      description: "Tantangan menggabungkan EXTRACT, AGE, dan CURRENT_DATE.",
      orderIndex: 20,
      concept: "Ulasan Fungsi Tanggal",
      explanation:
        "Level BOSS tanggal! Ingat:\n• EXTRACT(YEAR/MONTH/DAY FROM tanggal) mengambil bagian\n• AGE(birth_date) menghitung umur\n• CURRENT_DATE = hari ini\n• INTERVAL 'N days' untuk maju/mundur\n\nSusun langkahnya pelan-pelan!",
    },
    exercises: [
      {
        title: "Umur dalam Tahun (Boss)",
        prompt: "Tampilkan name dan umur dalam TAHUN (pakai EXTRACT(YEAR FROM AGE(birth_date))) setiap siswa.",
        hint: "EXTRACT(YEAR FROM AGE(birth_date))",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, birth_date FROM students;",
        solutionSql:
          "SELECT name, EXTRACT(YEAR FROM AGE(birth_date)) FROM students;",
      },
      {
        title: "Siswa Lahir Bulan Ini (Boss)",
        prompt: "Tampilkan name siswa yang bulan lahirnya sama dengan bulan sekarang (EXTRACT(MONTH FROM CURRENT_DATE)).",
        hint: "WHERE EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, birth_date FROM students;",
        solutionSql:
          "SELECT name FROM students WHERE EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM CURRENT_DATE);",
      },
      {
        title: "Ujian Paling Baru (Boss)",
        prompt: "Tampilkan tanggal ujian terbaru di tabel exam_scores.",
        hint: "SELECT MAX(exam_date) FROM exam_scores;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT exam_date FROM exam_scores;",
        solutionSql: "SELECT MAX(exam_date) FROM exam_scores;",
      },
    ],
  },
];

// ============================================================
// BAB C — CASE & LOGIKA KONDISI (level 21-30)
// ============================================================
export const extraLevelsC: LevelSeed2[] = [
  {
    level: {
      slug: "case-dasar",
      title: "Level 21 — CASE (Logika Jika-Maka)",
      description: "Buat kolom baru berisi teks berdasarkan kondisi dengan CASE.",
      orderIndex: 21,
      concept: "CASE",
      explanation:
        "CASE seperti 'jika-maka' di SQL. Bentuknya:\n\nCASE\n  WHEN kondisi THEN hasil1\n  WHEN kondisi2 THEN hasil2\n  ELSE hasil_akhir\nEND\n\nContoh:\nCASE\n  WHEN gpa >= 3.5 THEN 'Sangat Bagus'\n  WHEN gpa >= 3.0 THEN 'Bagus'\n  ELSE 'Perlu Belajar'\nEND\n\nCoba: SELECT name, gpa,\n  CASE WHEN gpa >= 3.5 THEN 'Istimewa' ELSE 'Biasa' END\nFROM students;",
    },
    exercises: [
      {
        title: "Label IPK Sederhana",
        prompt: "Tampilkan name, gpa, dan kolom label: 'Tinggi' bila gpa >= 3.5, selain itu 'Rendah'.",
        hint: "CASE WHEN gpa >= 3.5 THEN 'Tinggi' ELSE 'Rendah' END",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql:
          "SELECT name, gpa, CASE WHEN gpa >= 3.5 THEN 'Tinggi' ELSE 'Rendah' END FROM students;",
      },
      {
        title: "Predikat 3 Tingkat",
        prompt: "Tampilkan name dan predikat: >=3.5 'A', >=3.0 'B', lainnya 'C'.",
        hint: "CASE WHEN gpa >= 3.5 THEN 'A' WHEN gpa >= 3.0 THEN 'B' ELSE 'C' END",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql:
          "SELECT name, CASE WHEN gpa >= 3.5 THEN 'A' WHEN gpa >= 3.0 THEN 'B' ELSE 'C' END FROM students;",
      },
      {
        title: "CASE + Alias",
        prompt: "Tampilkan name dan hasil CASE di atas dengan alias 'predikat'.",
        hint: "Tambahkan AS predikat setelah END.",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql:
          "SELECT name, CASE WHEN gpa >= 3.5 THEN 'A' WHEN gpa >= 3.0 THEN 'B' ELSE 'C' END AS predikat FROM students;",
      },
    ],
  },
  {
    level: {
      slug: "case-gender",
      title: "Level 22 — CASE untuk Teks Lain",
      description: "Ubah kode singkat (L/P) jadi teks panjang dengan CASE.",
      orderIndex: 22,
      concept: "CASE untuk Kode",
      explanation:
        "Sering data menyimpan kode singkat (L/P, Y/N). CASE dipakai mengubahnya jadi teks yang enak dibaca.\n\nCASE gender\n  WHEN 'L' THEN 'Laki-laki'\n  WHEN 'P' THEN 'Perempuan'\nEND\n\nBentuk WHEN kolom = nilai boleh disingkat jadi WHEN kolom …? Tidak — penulisan CASE kolom WHEN nilai hanya untuk perbandingan '='.\n\nCoba: SELECT name, CASE gender WHEN 'L' THEN 'Laki-laki' ELSE 'Perempuan' END FROM students;",
    },
    exercises: [
      {
        title: "Ubah Kode Gender",
        prompt: "Tampilkan name dan gender jadi 'Laki-laki'/'Perempuan' (gunakan CASE gender WHEN ...).",
        hint: "CASE gender WHEN 'L' THEN 'Laki-laki' WHEN 'P' THEN 'Perempuan' END",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, gender FROM students;",
        solutionSql:
          "SELECT name, CASE gender WHEN 'L' THEN 'Laki-laki' WHEN 'P' THEN 'Perempuan' END FROM students;",
      },
      {
        title: "Filter Hasil CASE",
        prompt: "Tampilkan name siswa yang predikatnya 'A' (gpa >= 3.5) — pakai CASE di WHERE? Tidak bisa langsung. Gunakan gpa >= 3.5 di WHERE.",
        hint: "WHERE gpa >= 3.5 (CASE hanya bisa di SELECT/ORDER BY, bukan WHERE)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: "SELECT name FROM students WHERE gpa >= 3.5;",
      },
    ],
  },
  {
    level: {
      slug: "case-orderby",
      title: "Level 23 — CASE di ORDER BY",
      description: "Urutkan data dengan aturan khusus memakai CASE di ORDER BY.",
      orderIndex: 23,
      concept: "CASE di ORDER BY",
      explanation:
        "CASE bisa dipakai di ORDER BY untuk membuat urutan khusus.\nContoh: urutkan kelas 7A dulu, baru 7B, lalu 8A:\n\nORDER BY CASE class_name\n  WHEN '7A' THEN 1\n  WHEN '7B' THEN 2\n  ELSE 3\nEND\n\nAngka kecil diurutkan lebih dulu.\n\nCoba: SELECT name, class_name FROM students ORDER BY CASE class_name WHEN '7A' THEN 1 ELSE 2 END;",
    },
    exercises: [
      {
        title: "Kelas 7A Dulu",
        prompt: "Tampilkan name & class_name, urutkan: kelas 7A paling dulu, lainnya menyusul.",
        hint: "ORDER BY CASE class_name WHEN '7A' THEN 1 ELSE 2 END",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, class_name FROM students;",
        solutionSql:
          "SELECT name, class_name FROM students ORDER BY CASE class_name WHEN '7A' THEN 1 ELSE 2 END;",
      },
      {
        title: "Prioritas Kelas",
        prompt: "Urutkan: 8A(1), 7A(2), 8B(3), lainnya(4). Tampilkan name & class_name.",
        hint: "CASE class_name WHEN '8A' THEN 1 WHEN '7A' THEN 2 WHEN '8B' THEN 3 ELSE 4 END",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, class_name FROM students;",
        solutionSql:
          "SELECT name, class_name FROM students ORDER BY CASE class_name WHEN '8A' THEN 1 WHEN '7A' THEN 2 WHEN '8B' THEN 3 ELSE 4 END;",
      },
    ],
  },
  {
    level: {
      slug: "case-boss",
      title: "Level 24 — BOSS: CASE",
      description: "Gabungkan CASE dengan agregasi dan fungsi lain.",
      orderIndex: 24,
      concept: "Ulasan CASE",
      explanation:
        "CASE sangat kuat digabung dengan agregasi. Trik: COUNT(CASE WHEN ... THEN 1 END) menghitung baris yang memenuhi kondisi saja.\n\nContoh hitung siswa laki-laki:\nSELECT COUNT(CASE WHEN gender = 'L' THEN 1 END) FROM students;\n\nCoba variasinya di soal!",
    },
    exercises: [
      {
        title: "Hitung Laki-laki (Boss)",
        prompt: "Hitung jumlah siswa laki-laki memakai COUNT(CASE WHEN gender='L' THEN 1 END).",
        hint: "SELECT COUNT(CASE WHEN gender = 'L' THEN 1 END) FROM students;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT COUNT(*) FROM students;",
        solutionSql:
          "SELECT COUNT(CASE WHEN gender = 'L' THEN 1 END) FROM students;",
      },
      {
        title: "Jumlah per Gender (Boss)",
        prompt: "Tampilkan gender dan jumlah siswa tiap gender (GROUP BY biasa).",
        hint: "SELECT gender, COUNT(*) FROM students GROUP BY gender;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT gender FROM students;",
        solutionSql: "SELECT gender, COUNT(*) FROM students GROUP BY gender;",
      },
      {
        title: "Rata-rata Bersyarat (Boss)",
        prompt: "Hitung rata-rata gpa khusus siswa perempuan memakai AVG(CASE WHEN gender='P' THEN gpa END).",
        hint: "AVG(CASE WHEN gender = 'P' THEN gpa END) — NULL diabaikan AVG.",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT AVG(gpa) FROM students;",
        solutionSql:
          "SELECT AVG(CASE WHEN gender = 'P' THEN gpa END) FROM students;",
      },
    ],
  },
  {
    level: {
      slug: "case-lanjutan",
      title: "Level 25 — CASE Bertingkat & NULLIF",
      description: "CASE dengan banyak kondisi dan fungsi NULLIF.",
      orderIndex: 25,
      concept: "NULLIF",
      explanation:
        "NULLIF(a, b) mengembalikan NULL kalau a = b, selain itu mengembalikan a.\nKegunaan: hindari pembagian dengan 0 → NULLIF(pembagi, 0).\n\nContoh: SELECT 10 / NULLIF(0, 0); → NULL (tidak error)\n\nCASE juga bisa dicek dengan AND/OR di dalam WHEN:\nWHEN gender = 'L' AND gpa >= 3.5 THEN 'Laki-laki Pintar'",
    },
    exercises: [
      {
        title: "Kategori Gabungan",
        prompt: "Labeli siswa: 'Laki-laki Pintar' bila L dan gpa>=3.5, 'Perempuan Pintar' bila P dan gpa>=3.5, lainnya 'Siswa'.",
        hint: "CASE WHEN gender='L' AND gpa>=3.5 THEN 'Laki-laki Pintar' WHEN gender='P' AND gpa>=3.5 THEN 'Perempuan Pintar' ELSE 'Siswa' END",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, gender, gpa FROM students;",
        solutionSql:
          "SELECT name, CASE WHEN gender = 'L' AND gpa >= 3.5 THEN 'Laki-laki Pintar' WHEN gender = 'P' AND gpa >= 3.5 THEN 'Perempuan Pintar' ELSE 'Siswa' END FROM students;",
      },
      {
        title: "Coba NULLIF",
        prompt: "Tampilkan hasil 100 / NULLIF(0, 0) sebagai kolom 'hasil' — harusnya NULL bukan error.",
        hint: "SELECT 100 / NULLIF(0, 0) AS hasil;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT 100 / 0 AS hasil;",
        solutionSql: "SELECT 100 / NULLIF(0, 0) AS hasil;",
      },
    ],
  },
  {
    level: {
      slug: "review-bab-c",
      title: "Level 26 — Ulasan CASE & Fungsi",
      description: "Latihan gabungan CASE, COALESCE, dan fungsi string.",
      orderIndex: 26,
      concept: "Review CASE & Fungsi",
      explanation:
        "Waktunya review! Bisa pakai:\n• CASE WHEN ... THEN ... ELSE ... END\n• COALESCE untuk NULL\n• UPPER/LOWER, LENGTH\n• CONCAT / ||\n\nTenang, baca soalnya baik-baik.",
    },
    exercises: [
      {
        title: "Email + Predikat",
        prompt: "Tampilkan name, email (NULL jadi 'no-email'), dan predikat A/B/C berdasarkan gpa.",
        hint: "COALESCE(email, 'no-email') + CASE gpa",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, email, gpa FROM students;",
        solutionSql:
          "SELECT name, COALESCE(email, 'no-email'), CASE WHEN gpa >= 3.5 THEN 'A' WHEN gpa >= 3.0 THEN 'B' ELSE 'C' END FROM students;",
      },
      {
        title: "Sapa + Kelas",
        prompt: "Tampilkan CONCAT('Halo ', UPPER(name)) dengan alias sapa untuk siswa kelas 8.",
        hint: "WHERE class_name LIKE '8%'",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, class_name FROM students;",
        solutionSql:
          "SELECT CONCAT('Halo ', UPPER(name)) AS sapa FROM students WHERE class_name LIKE '8%';",
      },
    ],
  },
];
