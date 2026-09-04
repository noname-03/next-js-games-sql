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

// ============================================================
// BAB D — SUBQUERY LANJUTAN (level 27-32)
// ============================================================
export const extraLevelsD: LevelSeed2[] = [
  {
    level: {
      slug: "subquery-from",
      title: "Level 27 — Subquery di FROM",
      description: "Gunakan hasil query sebagai 'tabel sementara' di FROM.",
      orderIndex: 27,
      concept: "Subquery di FROM",
      explanation:
        "Hasil SELECT bisa dipakai seperti tabel di dalam FROM, lalu diberi alias:\n\nSELECT * FROM (SELECT name, gpa FROM students) AS daftar;\n\nKita bisa langsung query hasilnya lagi — misal hitung rata-rata dari hasil.\n\nCoba: SELECT AVG(gpa) FROM (SELECT gpa FROM students WHERE class_name='7A') AS k7a;",
    },
    exercises: [
      {
        title: "Tabel Sementara",
        prompt: "Ambil name & gpa siswa kelas 7A lewat subquery di FROM (alias k7a), lalu tampilkan semua.",
        hint: "SELECT * FROM (SELECT name, gpa FROM students WHERE class_name='7A') AS k7a;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql:
          "SELECT * FROM (SELECT name, gpa FROM students WHERE class_name = '7A') AS k7a;",
      },
      {
        title: "Rata-rata dari Subquery",
        prompt: "Hitung rata-rata gpa dari subquery berisi gpa siswa kelas 7.",
        hint: "SELECT AVG(gpa) FROM (SELECT gpa FROM students WHERE class_name LIKE '7%') AS k7;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT AVG(gpa) FROM students;",
        solutionSql:
          "SELECT AVG(gpa) FROM (SELECT gpa FROM students WHERE class_name LIKE '7%') AS k7;",
      },
    ],
  },
  {
    level: {
      slug: "subquery-exists",
      title: "Level 28 — EXISTS",
      description: "Cek 'apakah ada baris yang memenuhi kondisi' dengan EXISTS.",
      orderIndex: 28,
      concept: "EXISTS",
      explanation:
        "EXISTS(kueri) bernilai TRUE kalau kueri menghasilkan minimal 1 baris.\nBiasanya dipakai dengan subquery berkorelasi (subquery yang melihat baris luar).\n\nContoh — siswa yang pernah ujian:\nSELECT name FROM students s\nWHERE EXISTS (\n  SELECT 1 FROM exam_scores e WHERE e.student_id = s.id\n);\n\n'SELECT 1' cuma isi — yang penting barisnya ada.",
    },
    exercises: [
      {
        title: "Siswa yang Pernah Ujian",
        prompt: "Tampilkan name siswa yang pernah punya nilai ujian (ada di exam_scores) pakai EXISTS.",
        hint: "WHERE EXISTS (SELECT 1 FROM exam_scores e WHERE e.student_id = s.id)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students s;",
        solutionSql:
          "SELECT name FROM students s WHERE EXISTS (SELECT 1 FROM exam_scores e WHERE e.student_id = s.id);",
      },
      {
        title: "Siswa Tanpa Ujian",
        prompt: "Tampilkan name siswa yang BELUM pernah ujian (pakai NOT EXISTS).",
        hint: "WHERE NOT EXISTS (SELECT 1 FROM exam_scores e WHERE e.student_id = s.id)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students s;",
        solutionSql:
          "SELECT name FROM students s WHERE NOT EXISTS (SELECT 1 FROM exam_scores e WHERE e.student_id = s.id);",
      },
    ],
  },
  {
    level: {
      slug: "subquery-correlated",
      title: "Level 29 — Subquery Berkorelasi",
      description: "Subquery yang membandingkan tiap baris luar (per baris).",
      orderIndex: 29,
      concept: "Subquery Berkorelasi",
      explanation:
        "Subquery berkorelasi dijalankan ULANG untuk tiap baris tabel luar — subquery memakai kolom dari baris luar.\n\nContoh: siswa yang gpa-nya di atas rata-rata kelasnya sendiri:\nSELECT name, gpa FROM students s\nWHERE gpa > (SELECT AVG(gpa) FROM students s2 WHERE s2.class_name = s.class_name);\n\nUntuk tiap siswa, subquery menghitung rata-rata kelas siswa itu.",
    },
    exercises: [
      {
        title: "Di Atas Rata-rata Kelas",
        prompt: "Tampilkan name siswa yang gpa-nya di atas rata-rata kelasnya sendiri.",
        hint: "WHERE gpa > (SELECT AVG(gpa) FROM students s2 WHERE s2.class_name = s.class_name)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, gpa, class_name FROM students s;",
        solutionSql:
          "SELECT name FROM students s WHERE gpa > (SELECT AVG(gpa) FROM students s2 WHERE s2.class_name = s.class_name);",
      },
    ],
  },
  {
    level: {
      slug: "boss-subquery",
      title: "Level 30 — BOSS: Subquery",
      description: "Tantangan subquery: FROM, EXISTS, correlated.",
      orderIndex: 30,
      concept: "Ulasan Subquery",
      explanation:
        "Review subquery:\n• Di WHERE: gpa > (SELECT AVG(gpa) ...)\n• Di FROM: FROM (SELECT ...) AS alias\n• EXISTS / NOT EXISTS cek keberadaan\n• Berkorelasi: subquery lihat baris luar\n\nSemangat, ini boss terakhir bab subquery!",
    },
    exercises: [
      {
        title: "Nilai di Atas Rata-rata (Boss)",
        prompt: "Tampilkan student_id dan score dari exam_scores yang score-nya di atas rata-rata semua score.",
        hint: "WHERE score > (SELECT AVG(score) FROM exam_scores)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT student_id, score FROM exam_scores;",
        solutionSql:
          "SELECT student_id, score FROM exam_scores WHERE score > (SELECT AVG(score) FROM exam_scores);",
      },
      {
        title: "Siswa Nilai 90+ (Boss)",
        prompt: "Tampilkan name siswa yang pernah mendapat score >= 90 (pakai subquery IN atau EXISTS).",
        hint: "WHERE EXISTS (SELECT 1 FROM exam_scores e WHERE e.student_id = s.id AND e.score >= 90)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students s;",
        solutionSql:
          "SELECT name FROM students s WHERE EXISTS (SELECT 1 FROM exam_scores e WHERE e.student_id = s.id AND e.score >= 90);",
      },
      {
        title: "Terbaik per Mapel (Boss)",
        prompt: "Tampilkan subject_id dan score tertinggi tiap mata pelajaran (pakai GROUP BY + MAX).",
        hint: "SELECT subject_id, MAX(score) FROM exam_scores GROUP BY subject_id;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT subject_id, score FROM exam_scores;",
        solutionSql:
          "SELECT subject_id, MAX(score) FROM exam_scores GROUP BY subject_id;",
      },
    ],
  },
  {
    level: {
      slug: "union-intersect",
      title: "Level 31 — UNION & INTERSECT",
      description: "Gabungkan hasil dua query: UNION (gabung) & INTERSECT (irisan).",
      orderIndex: 31,
      concept: "UNION & INTERSECT",
      explanation:
        "UNION menggabungkan hasil dua query (duplikat dibuang).\nINTERSECT mengambil baris yang ada di KEDUA query.\nSyarat: jumlah & tipe kolom harus sama.\n\nContoh:\nSELECT class_name FROM students WHERE gpa >= 3.5\nUNION\nSELECT class_name FROM students WHERE gender = 'L';\n\nCoba: SELECT name FROM students WHERE class_name='7A' INTERSECT SELECT name FROM students WHERE gpa >= 3.5;",
    },
    exercises: [
      {
        title: "Gabung Dua Kelas",
        prompt: "Tampilkan gabungan class_name siswa 7A dan siswa 7B (UNION, tanpa duplikat).",
        hint: "SELECT class_name FROM students WHERE class_name='7A' UNION SELECT class_name FROM students WHERE class_name='7B';",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT class_name FROM students;",
        solutionSql:
          "SELECT class_name FROM students WHERE class_name = '7A' UNION SELECT class_name FROM students WHERE class_name = '7B';",
      },
      {
        title: "Irisan Pintar & Kelas 7",
        prompt: "Nama siswa yang ada di kelas 7A DAN gpa-nya >= 3.5 — pakai INTERSECT.",
        hint: "SELECT name FROM students WHERE class_name='7A' INTERSECT SELECT name FROM students WHERE gpa >= 3.5;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students;",
        solutionSql:
          "SELECT name FROM students WHERE class_name = '7A' INTERSECT SELECT name FROM students WHERE gpa >= 3.5;",
      },
    ],
  },
  {
    level: {
      slug: "except-boss",
      title: "Level 32 — EXCEPT & BOSS Set",
      description: "EXCEPT (selisih) + tantangan gabungan set operasi.",
      orderIndex: 32,
      concept: "EXCEPT",
      explanation:
        "EXCEPT mengambil baris dari query pertama yang TIDAK ada di query kedua.\n\nContoh: siswa kelas 7A yang TIDAK termasuk gpa>=3.5:\nSELECT name FROM students WHERE class_name='7A'\nEXCEPT\nSELECT name FROM students WHERE gpa >= 3.5;\n\nUNION = gabung, INTERSECT = irisan, EXCEPT = selisih.",
    },
    exercises: [
      {
        title: "Kelas 7A yang Tidak Pintar",
        prompt: "Nama siswa kelas 7A yang TIDAK termasuk siswa gpa >= 3.5 (EXCEPT).",
        hint: "SELECT name FROM students WHERE class_name='7A' EXCEPT SELECT name FROM students WHERE gpa >= 3.5;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students WHERE class_name = '7A';",
        solutionSql:
          "SELECT name FROM students WHERE class_name = '7A' EXCEPT SELECT name FROM students WHERE gpa >= 3.5;",
      },
    ],
  },
];

// ============================================================
// BAB E — WINDOW FUNCTIONS (level 33-38)
// ============================================================
export const extraLevelsE: LevelSeed2[] = [
  {
    level: {
      slug: "window-row-number",
      title: "Level 33 — ROW_NUMBER (Nomor Urut)",
      description: "Beri nomor urut tiap baris dengan ROW_NUMBER.",
      orderIndex: 33,
      concept: "ROW_NUMBER",
      explanation:
        "ROW_NUMBER() memberi nomor urut 1,2,3,... pada tiap baris dalam 'jendela' (window).\n\nBentuk:\nROW_NUMBER() OVER (ORDER BY kolom)\n\nContoh — urutkan siswa dari gpa tertinggi lalu beri nomor:\nSELECT name, gpa,\n  ROW_NUMBER() OVER (ORDER BY gpa DESC) AS peringkat\nFROM students;\n\nBerbeda dari LIMIT: SEMUA baris tetap muncul, hanya diberi nomor.",
    },
    exercises: [
      {
        title: "Nomori Semua Siswa",
        prompt: "Tampilkan name, gpa, dan ROW_NUMBER() urut gpa tertinggi dulu (alias peringkat).",
        hint: "ROW_NUMBER() OVER (ORDER BY gpa DESC)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql:
          "SELECT name, gpa, ROW_NUMBER() OVER (ORDER BY gpa DESC) AS peringkat FROM students;",
      },
      {
        title: "Peringkat per Kelas",
        prompt: "Tampilkan name, class_name, gpa, dan ROW_NUMBER() per kelas (PARTITION BY class_name) urut gpa DESC.",
        hint: "ROW_NUMBER() OVER (PARTITION BY class_name ORDER BY gpa DESC)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, class_name, gpa FROM students;",
        solutionSql:
          "SELECT name, class_name, gpa, ROW_NUMBER() OVER (PARTITION BY class_name ORDER BY gpa DESC) FROM students;",
      },
    ],
  },
  {
    level: {
      slug: "window-rank",
      title: "Level 34 — RANK & DENSE_RANK",
      description: "Peringkat dengan nilai sama (RANK) vs nomor urut (ROW_NUMBER).",
      orderIndex: 34,
      concept: "RANK",
      explanation:
        "RANK() mirip ROW_NUMBER tapi nilai yang SAMA mendapat peringkat sama, lalu nomor berikutnya 'melompat'.\nContoh nilai 90,90,80 → RANK: 1,1,3.\nDENSE_RANK: 1,1,2 (tanpa lompat).\n\nCoba:\nSELECT score, RANK() OVER (ORDER BY score DESC),\n  DENSE_RANK() OVER (ORDER BY score DESC)\nFROM exam_scores;",
    },
    exercises: [
      {
        title: "Rank Nilai Ujian",
        prompt: "Tampilkan student_id, score, dan RANK() urut score DESC dari exam_scores.",
        hint: "RANK() OVER (ORDER BY score DESC)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT student_id, score FROM exam_scores;",
        solutionSql:
          "SELECT student_id, score, RANK() OVER (ORDER BY score DESC) FROM exam_scores;",
      },
      {
        title: "Dense Rank",
        prompt: "Tampilkan subject_id, score, dan DENSE_RANK() per subject (PARTITION BY subject_id) urut score DESC.",
        hint: "DENSE_RANK() OVER (PARTITION BY subject_id ORDER BY score DESC)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT subject_id, score FROM exam_scores;",
        solutionSql:
          "SELECT subject_id, score, DENSE_RANK() OVER (PARTITION BY subject_id ORDER BY score DESC) FROM exam_scores;",
      },
    ],
  },
  {
    level: {
      slug: "window-sum-avg",
      title: "Level 35 — Window SUM & AVG (Total Berjalan)",
      description: "Hitung total/rata-rata berjalan dengan SUM/AVG + OVER.",
      orderIndex: 35,
      concept: "Window SUM/AVG",
      explanation:
        "Agregat biasa (SUM/AVG) dengan OVER menghitung per baris tanpa menggabungkan baris.\n\nSUM(score) OVER (ORDER BY exam_date) = total kumulatif sampai baris itu.\nAVG(score) OVER (PARTITION BY subject_id) = rata-rata per mapel, diulang di tiap baris mapel itu.\n\nCoba:\nSELECT exam_date, score, SUM(score) OVER (ORDER BY exam_date)\nFROM exam_scores;",
    },
    exercises: [
      {
        title: "Total Kumulatif",
        prompt: "Tampilkan exam_date, score, dan SUM(score) OVER (ORDER BY exam_date) sebagai total_berjalan.",
        hint: "SUM(score) OVER (ORDER BY exam_date)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT exam_date, score FROM exam_scores;",
        solutionSql:
          "SELECT exam_date, score, SUM(score) OVER (ORDER BY exam_date) AS total_berjalan FROM exam_scores;",
      },
      {
        title: "Rata-rata per Mapel",
        prompt: "Tampilkan student_id, subject_id, score, dan AVG(score) OVER (PARTITION BY subject_id).",
        hint: "AVG(score) OVER (PARTITION BY subject_id)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT student_id, subject_id, score FROM exam_scores;",
        solutionSql:
          "SELECT student_id, subject_id, score, AVG(score) OVER (PARTITION BY subject_id) FROM exam_scores;",
      },
    ],
  },
  {
    level: {
      slug: "window-lag",
      title: "Level 36 — LAG & LEAD",
      description: "Lihat nilai baris sebelumnya (LAG) atau berikutnya (LEAD).",
      orderIndex: 36,
      concept: "LAG & LEAD",
      explanation:
        "LAG(kolom) mengambil nilai dari baris SEBELUMNYA dalam urutan.\nLEAD(kolom) mengambil nilai baris BERIKUTNYA.\n\nContoh — bandingkan score dengan ujian sebelumnya:\nSELECT exam_date, score,\n  LAG(score) OVER (ORDER BY exam_date) AS score_sebelumnya\nFROM exam_scores;\n\nBaris pertama LAG-nya NULL (tidak ada sebelumnya).",
    },
    exercises: [
      {
        title: "Score Sebelumnya",
        prompt: "Tampilkan exam_date, score, dan LAG(score) OVER (ORDER BY exam_date) dari exam_scores.",
        hint: "LAG(score) OVER (ORDER BY exam_date)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT exam_date, score FROM exam_scores;",
        solutionSql:
          "SELECT exam_date, score, LAG(score) OVER (ORDER BY exam_date) FROM exam_scores;",
      },
    ],
  },
  {
    level: {
      slug: "window-boss",
      title: "Level 37 — BOSS: Window Functions",
      description: "Tantangan menggabungkan window functions.",
      orderIndex: 37,
      concept: "Ulasan Window Functions",
      explanation:
        "Window functions = hitung per baris tanpa menggabungkan:\n• ROW_NUMBER() OVER (ORDER BY ...)\n• RANK() / DENSE_RANK()\n• PARTITION BY untuk kelompok\n• SUM/AVG OVER untuk total/rata-rata berjalan\n• LAG/LEAD lihat baris tetangga\n\nCoba kombinasi di soal!",
    },
    exercises: [
      {
        title: "Top 3 per Mapel (Boss)",
        prompt: "Tampilkan student_id, subject_id, score dari 3 nilai tertinggi tiap subject (pakai subquery + ROW_NUMBER).",
        hint: "SELECT * FROM (SELECT student_id, subject_id, score, ROW_NUMBER() OVER (PARTITION BY subject_id ORDER BY score DESC) rn FROM exam_scores) t WHERE rn <= 3;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT student_id, subject_id, score FROM exam_scores;",
        solutionSql:
          "SELECT student_id, subject_id, score FROM (SELECT student_id, subject_id, score, ROW_NUMBER() OVER (PARTITION BY subject_id ORDER BY score DESC) AS rn FROM exam_scores) t WHERE rn <= 3;",
      },
      {
        title: "Rata-rata & Selisih (Boss)",
        prompt: "Tampilkan student_id, score, AVG(score) OVER () sebagai rata_semua, dan score - rata_semua sebagai selisih.",
        hint: "AVG(score) OVER () — tanpa PARTITION = seluruh tabel",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT student_id, score FROM exam_scores;",
        solutionSql:
          "SELECT student_id, score, AVG(score) OVER () AS rata_semua, score - AVG(score) OVER () AS selisih FROM exam_scores;",
      },
    ],
  },
];

// ============================================================
// BAB F — FUNGSI MATEMATIKA (level 38-42)
// ============================================================
export const extraLevelsF: LevelSeed2[] = [
  {
    level: {
      slug: "math-round",
      title: "Level 38 — ROUND & Pembulatan",
      description: "Bulatkan angka dengan ROUND, CEIL, dan FLOOR.",
      orderIndex: 38,
      concept: "ROUND/CEIL/FLOOR",
      explanation:
        "• ROUND(angka, desimal) → bulatkan ke desimal tertentu. ROUND(3.75, 1) = 3.8\n• CEIL(angka) → bulatkan ke ATAS. CEIL(3.2) = 4\n• FLOOR(angka) → bulatkan ke BAWAH. FLOOR(3.8) = 3\n\nContoh:\nSELECT ROUND(AVG(score), 2) FROM exam_scores;\n\nCoba: SELECT ROUND(gpa, 1), CEIL(gpa), FLOOR(gpa) FROM students;",
    },
    exercises: [
      {
        title: "Bulatkan GPA",
        prompt: "Tampilkan name, gpa, dan gpa dibulatkan 1 desimal (ROUND(gpa, 1)).",
        hint: "ROUND(gpa, 1)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: "SELECT name, gpa, ROUND(gpa, 1) FROM students;",
      },
      {
        title: "Ceil & Floor GPA",
        prompt: "Tampilkan name, CEIL(gpa), dan FLOOR(gpa).",
        hint: "CEIL(gpa), FLOOR(gpa)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: "SELECT name, CEIL(gpa), FLOOR(gpa) FROM students;",
      },
      {
        title: "Rata-rata 2 Desimal",
        prompt: "Tampilkan rata-rata score semua ujian dibulatkan 2 desimal.",
        hint: "SELECT ROUND(AVG(score), 2) FROM exam_scores;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT AVG(score) FROM exam_scores;",
        solutionSql: "SELECT ROUND(AVG(score), 2) FROM exam_scores;",
      },
    ],
  },
  {
    level: {
      slug: "math-abs-mod",
      title: "Level 39 — ABS & MOD",
      description: "Nilai mutlak (ABS) dan sisa bagi (MOD).",
      orderIndex: 39,
      concept: "ABS & MOD",
      explanation:
        "• ABS(angka) → nilai mutlak (hilangkan minus). ABS(-5) = 5\n• MOD(a, b) → sisa pembagian a oleh b. MOD(7, 2) = 1\n\nKegunaan MOD: cek bilangan genap/ganjil (MOD(id, 2) = 0 berarti genap), atau kelompokkan.\n\nCoba: SELECT id, MOD(id, 2) FROM students;",
    },
    exercises: [
      {
        title: "Sisa Bagi ID",
        prompt: "Tampilkan id dan MOD(id, 2) dari students (0=genap, 1=ganjil).",
        hint: "SELECT id, MOD(id, 2) FROM students;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT id FROM students;",
        solutionSql: "SELECT id, MOD(id, 2) FROM students;",
      },
      {
        title: "ID Genap",
        prompt: "Tampilkan name siswa dengan id genap (MOD(id, 2) = 0).",
        hint: "WHERE MOD(id, 2) = 0",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, id FROM students;",
        solutionSql: "SELECT name FROM students WHERE MOD(id, 2) = 0;",
      },
    ],
  },
  {
    level: {
      slug: "math-boss",
      title: "Level 40 — BOSS: Matematika & Agregasi",
      description: "Gabungkan fungsi matematika dengan agregasi.",
      orderIndex: 40,
      concept: "Ulasan Fungsi Matematika",
      explanation:
        "Review:\n• ROUND(x, n), CEIL(x), FLOOR(x)\n• ABS(x), MOD(a, b)\n• Bisa dikombinasikan dengan AVG/SUM/MAX\n\nContoh:\nSELECT ROUND(MAX(score), 2) ...\nBoleh juga: ROUND(AVG(score)::numeric, 2) untuk presisi.",
    },
    exercises: [
      {
        title: "Rata-rata per Mapel (Boss)",
        prompt: "Tampilkan subject_id dan rata-rata score per mapel, dibulatkan 2 desimal.",
        hint: "SELECT subject_id, ROUND(AVG(score), 2) FROM exam_scores GROUP BY subject_id;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT subject_id, score FROM exam_scores;",
        solutionSql:
          "SELECT subject_id, ROUND(AVG(score), 2) FROM exam_scores GROUP BY subject_id;",
      },
      {
        title: "Selisih dari Rata-rata (Boss)",
        prompt: "Tampilkan student_id, score, dan ABS(score - AVG(score) OVER ()) sebagai jarak_dari_rata.",
        hint: "ABS(score - AVG(score) OVER ())",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT student_id, score FROM exam_scores;",
        solutionSql:
          "SELECT student_id, score, ABS(score - AVG(score) OVER ()) AS jarak_dari_rata FROM exam_scores;",
      },
    ],
  },
];

// ============================================================
// BAB G — CTE (WITH) & SELF-JOIN (level 41-46)
// ============================================================
export const extraLevelsG: LevelSeed2[] = [
  {
    level: {
      slug: "cte-dasar",
      title: "Level 41 — CTE / WITH",
      description: "Buat 'tabel sementara' bernama di awal query dengan WITH.",
      orderIndex: 41,
      concept: "CTE (WITH)",
      explanation:
        "CTE (Common Table Expression) membuat tabel sementara bernama di awal query supaya mudah dibaca & dipakai ulang.\n\nBentuk:\nWITH nama AS (\n  SELECT ...\n)\nSELECT ... FROM nama;\n\nContoh:\nWITH siswa_pintar AS (\n  SELECT name, gpa FROM students WHERE gpa >= 3.5\n)\nSELECT * FROM siswa_pintar;\n\nCTE hanya hidup dalam satu query — beda dengan tabel beneran.",
    },
    exercises: [
      {
        title: "CTE Siswa Pintar",
        prompt: "Buat CTE siswa_pintar berisi name & gpa siswa gpa >= 3.5, lalu SELECT semua dari CTE itu.",
        hint: "WITH siswa_pintar AS (SELECT name, gpa FROM students WHERE gpa >= 3.5) SELECT * FROM siswa_pintar;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql:
          "WITH siswa_pintar AS (SELECT name, gpa FROM students WHERE gpa >= 3.5) SELECT * FROM siswa_pintar;",
      },
      {
        title: "CTE + Agregasi",
        prompt: "Buat CTE k7 berisi gpa siswa kelas 7, lalu hitung AVG(gpa) dari CTE tsb.",
        hint: "WITH k7 AS (SELECT gpa FROM students WHERE class_name LIKE '7%') SELECT AVG(gpa) FROM k7;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT AVG(gpa) FROM students;",
        solutionSql:
          "WITH k7 AS (SELECT gpa FROM students WHERE class_name LIKE '7%') SELECT AVG(gpa) FROM k7;",
      },
      {
        title: "Dua CTE",
        prompt: "Buat CTE laki (siswa L) dan perempuan (siswa P), lalu hitung jumlah keduanya dengan UNION ALL.",
        hint: "WITH laki AS (...), perempuan AS (...) SELECT 'L', COUNT(*) FROM laki UNION ALL SELECT 'P', COUNT(*) FROM perempuan;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT gender, COUNT(*) FROM students GROUP BY gender;",
        solutionSql:
          "WITH laki AS (SELECT * FROM students WHERE gender = 'L'), perempuan AS (SELECT * FROM students WHERE gender = 'P') SELECT 'L', COUNT(*) FROM laki UNION ALL SELECT 'P', COUNT(*) FROM perempuan;",
      },
    ],
  },
  {
    level: {
      slug: "cte-window",
      title: "Level 42 — CTE + Window (Bersih & Rapi)",
      description: "Gabungkan CTE dengan window function untuk query bertingkat yang rapi.",
      orderIndex: 42,
      concept: "CTE + Window",
      explanation:
        "Window function tidak bisa langsung dipakai di WHERE. Triknya: hitung di CTE, lalu filter di query luar.\n\nContoh ambil peringkat 1 tiap kelas:\nWITH berperingkat AS (\n  SELECT name, class_name, gpa,\n    ROW_NUMBER() OVER (PARTITION BY class_name ORDER BY gpa DESC) AS peringkat\n  FROM students\n)\nSELECT * FROM berperingkat WHERE peringkat = 1;\n\nIni pola sangat umum di dunia nyata!",
    },
    exercises: [
      {
        title: "Juara 1 per Kelas",
        prompt: "Pakai CTE berperingkat (ROW_NUMBER per kelas urut gpa DESC), tampilkan siswa peringkat 1 tiap kelas.",
        hint: "WITH berperingkat AS (...) SELECT name, class_name, gpa FROM berperingkat WHERE peringkat = 1;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, class_name, gpa FROM students;",
        solutionSql:
          "WITH berperingkat AS (SELECT name, class_name, gpa, ROW_NUMBER() OVER (PARTITION BY class_name ORDER BY gpa DESC) AS peringkat FROM students) SELECT name, class_name, gpa FROM berperingkat WHERE peringkat = 1;",
      },
      {
        title: "Di Atas Rata-rata Kelas via CTE",
        prompt: "CTE rata_kelas berisi rata-rata gpa per kelas; gabung dengan students untuk siswa di atas rata-rata kelasnya.",
        hint: "WITH rata_kelas AS (SELECT class_name, AVG(gpa) AS rata FROM students GROUP BY class_name) SELECT s.name FROM students s JOIN rata_kelas r ON s.class_name = r.class_name WHERE s.gpa > r.rata;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql:
          "WITH rata_kelas AS (SELECT class_name, AVG(gpa) AS rata FROM students GROUP BY class_name) SELECT s.name FROM students s JOIN rata_kelas r ON s.class_name = r.class_name WHERE s.gpa > r.rata;",
      },
    ],
  },
  {
    level: {
      slug: "self-join",
      title: "Level 43 — Self-Join",
      description: "Gabungkan tabel dengan dirinya sendiri untuk membandingkan baris.",
      orderIndex: 43,
      concept: "Self-Join",
      explanation:
        "Self-join = JOIN tabel dengan dirinya sendiri. Tiap 'salinan' diberi alias beda.\n\nKegunaan: bandingkan baris dalam tabel yang sama.\nContoh cari siswa yang gpa-nya lebih tinggi dari siswa lain di kelas yang sama:\nSELECT a.name, b.name AS dibanding_dengan\nFROM students a\nJOIN students b ON a.class_name = b.class_name\nWHERE a.gpa > b.gpa;\n\nPenting: selalu pakai alias (a & b) supaya tidak bingung.",
    },
    exercises: [
      {
        title: "Siswa di Atas Siswa Lain",
        prompt: "Tampilkan pasangan nama (a.name, b.name) di kelas sama di mana gpa a > gpa b.",
        hint: "FROM students a JOIN students b ON a.class_name = b.class_name WHERE a.gpa > b.gpa",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT a.name, b.name FROM students a JOIN students b ON a.class_name = b.class_name;",
        solutionSql:
          "SELECT a.name, b.name FROM students a JOIN students b ON a.class_name = b.class_name WHERE a.gpa > b.gpa;",
      },
    ],
  },
  {
    level: {
      slug: "review-join-lanjut",
      title: "Level 44 — Review: JOIN + CTE",
      description: "Latihan gabungan JOIN, CTE, dan agregasi.",
      orderIndex: 44,
      concept: "Review JOIN & CTE",
      explanation:
        "Gabungkan semua skill: JOIN tabel, CTE untuk merapikan, agregasi.\nContoh pola: CTE hitung jumlah ujian per siswa → JOIN ke students → tampilkan nama + jumlah.\n\nIngat urutan logika: WITH ... , SELECT ... JOIN ... GROUP BY ...",
    },
    exercises: [
      {
        title: "Jumlah Ujian per Siswa",
        prompt: "Tampilkan name dan jumlah ujian yang diambil tiap siswa (JOIN students & exam_scores + GROUP BY).",
        hint: "SELECT s.name, COUNT(e.id) FROM students s JOIN exam_scores e ON s.id = e.student_id GROUP BY s.name;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT s.name FROM students s;",
        solutionSql:
          "SELECT s.name, COUNT(e.id) FROM students s JOIN exam_scores e ON s.id = e.student_id GROUP BY s.name;",
      },
      {
        title: "Rata-rata per Siswa (via CTE)",
        prompt: "CTE rata_siswa (AVG score per student_id); gabung students; tampilkan name & rata 2 desimal.",
        hint: "WITH rata_siswa AS (SELECT student_id, AVG(score) AS rata FROM exam_scores GROUP BY student_id) SELECT s.name, ROUND(r.rata, 2) FROM students s JOIN rata_siswa r ON s.id = r.student_id;",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT s.name FROM students s;",
        solutionSql:
          "WITH rata_siswa AS (SELECT student_id, AVG(score) AS rata FROM exam_scores GROUP BY student_id) SELECT s.name, ROUND(r.rata, 2) FROM students s JOIN rata_siswa r ON s.id = r.student_id;",
      },
    ],
  },
];

// ============================================================
// BAB H — FUNGSI STRING LANJUTAN (level 101-106)
// ============================================================
export const extraLevelsH: LevelSeed2[] = [
  {
    level: {
      slug: "string-replace",
      title: "Level 101 — REPLACE",
      description: "Ganti bagian teks dengan REPLACE.",
      orderIndex: 101,
      concept: "REPLACE",
      explanation:
        "REPLACE(teks, cari, ganti) mengganti SEMUA kemunculan 'cari' dengan 'ganti'.\n\nContoh: REPLACE('a.b.c', '.', '-') = 'a-b-c'\nKegunaan: bersihkan data, ganti format.\n\nCoba: SELECT REPLACE(email, '@mail.com', '@school.com') FROM students;",
    },
    exercises: [
      {
        title: "Ganti Domain Email",
        prompt: "Tampilkan email dengan '@mail.com' diganti '@sekolah.com'.",
        hint: "REPLACE(email, '@mail.com', '@sekolah.com')",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT email FROM students;",
        solutionSql:
          "SELECT REPLACE(email, '@mail.com', '@sekolah.com') FROM students;",
      },
      {
        title: "Ganti Spasi dengan Garis",
        prompt: "Tampilkan name dengan spasi diganti '_' (garis bawah).",
        hint: "REPLACE(name, ' ', '_')",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students;",
        solutionSql: "SELECT REPLACE(name, ' ', '_') FROM students;",
      },
    ],
  },
  {
    level: {
      slug: "string-position",
      title: "Level 102 — POSITION & STRPOS",
      description: "Cari posisi teks di dalam teks dengan POSITION.",
      orderIndex: 102,
      concept: "POSITION",
      explanation:
        "POSITION('x' IN teks) atau STRPOS(teks, 'x') mengembalikan posisi (1 = awal) pertama kali 'x' muncul. 0 = tidak ditemukan.\n\nContoh: POSITION('@' IN 'budi@mail.com') = 5\n\nCoba: SELECT name, POSITION(' ' IN name) FROM students;",
    },
    exercises: [
      {
        title: "Posisi Spasi di Nama",
        prompt: "Tampilkan name dan posisi spasi pertama di name (0 bila tidak ada).",
        hint: "POSITION(' ' IN name)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students;",
        solutionSql: "SELECT name, POSITION(' ' IN name) FROM students;",
      },
      {
        title: "Posisi @ di Email",
        prompt: "Tampilkan email dan posisi karakter '@' di email.",
        hint: "POSITION('@' IN email)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT email FROM students;",
        solutionSql: "SELECT email, POSITION('@' IN email) FROM students;",
      },
    ],
  },
  {
    level: {
      slug: "string-trim",
      title: "Level 103 — TRIM & LEFT/RIGHT",
      description: "Bersihkan spasi (TRIM) dan ambil sisi kiri/kanan (LEFT/RIGHT).",
      orderIndex: 103,
      concept: "TRIM, LEFT, RIGHT",
      explanation:
        "• TRIM(teks) membuang spasi di awal & akhir.\n• LEFT(teks, n) mengambil n karakter dari kiri.\n• RIGHT(teks, n) mengambil n karakter dari kanan.\n\nContoh:\nLEFT('Budi Santoso', 4) = 'Budi'\nRIGHT('Budi Santoso', 6) = 'Santoso'\n\nCoba: SELECT name, LEFT(name, 4), RIGHT(name, 6) FROM students;",
    },
    exercises: [
      {
        title: "Nama Depan (LEFT)",
        prompt: "Tampilkan name dan 4 huruf pertama name (LEFT).",
        hint: "LEFT(name, 4)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students;",
        solutionSql: "SELECT name, LEFT(name, 4) FROM students;",
      },
      {
        title: "3 Huruf Terakhir",
        prompt: "Tampilkan name dan 3 huruf terakhir name (RIGHT).",
        hint: "RIGHT(name, 3)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students;",
        solutionSql: "SELECT name, RIGHT(name, 3) FROM students;",
      },
    ],
  },
  {
    level: {
      slug: "string-boss2",
      title: "Level 104 — BOSS: String Lanjutan",
      description: "Gabungkan REPLACE, POSITION, LEFT, TRIM.",
      orderIndex: 104,
      concept: "Ulasan String Lanjutan",
      explanation:
        "Review:\n• REPLACE(teks, cari, ganti)\n• POSITION('x' IN teks)\n• LEFT(teks, n), RIGHT(teks, n)\n• TRIM(teks)\n\nKombinasikan untuk memecahkan soal!",
    },
    exercises: [
      {
        title: "Username dari Email (Boss)",
        prompt: "Ambil bagian email sebelum '@' (pakai LEFT + POSITION) untuk tiap email.",
        hint: "LEFT(email, POSITION('@' IN email) - 1)",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT email FROM students;",
        solutionSql:
          "SELECT LEFT(email, POSITION('@' IN email) - 1) FROM students WHERE email IS NOT NULL;",
      },
      {
        title: "Nama Tanpa Spasi (Boss)",
        prompt: "Tampilkan name dan name dengan spasi diganti '-' (REPLACE).",
        hint: "REPLACE(name, ' ', '-')",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students;",
        solutionSql: "SELECT name, REPLACE(name, ' ', '-') FROM students;",
      },
      {
        title: "Inisial Nama (Boss)",
        prompt: "Tampilkan inisial: huruf pertama name + titik. (LEFT(name,1) || '.')",
        hint: "LEFT(name, 1) || '.'",
        datasetSql: DATASET_SCHOOL,
        starterSql: "SELECT name FROM students;",
        solutionSql: "SELECT name, LEFT(name, 1) || '.' AS inisial FROM students;",
      },
    ],
  },
];
