import type { NewLevel } from "./schema";

// ============================================================
// KONTEN KURIKULUM SQL QUEST — 10 level
// ============================================================
// Level 1-6  : SELECT dasar → agregasi (dataset: 1 tabel `students`)
// Level 7-10 : JOIN, LEFT JOIN, agregasi JOIN, subquery (dataset: 3 tabel)
//
// Catatan: semua soal SELECT (hasil dibandingkan dengan solusi).
// Soal DML/DDL (INSERT/UPDATE/CREATE) sengaja belum dimasukkan — butuh
// validasi state DB yang berbeda (reset antar percobaan).

export type SeedExercise = {
  title: string;
  prompt: string;
  hint: string;
  datasetSql: string;
  starterSql: string;
  solutionSql: string;
};

export type LevelSeed = {
  level: NewLevel;
  exercises: SeedExercise[];
};

export const DATASET_STUDENTS = `
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  major TEXT NOT NULL,
  gpa NUMERIC(3,2) NOT NULL,
  enrolled_at DATE NOT NULL
);

INSERT INTO students (name, major, gpa, enrolled_at) VALUES
  ('Budi Santoso', 'Informatika', 3.75, '2022-08-15'),
  ('Siti Rahayu', 'Sistem Informasi', 3.50, '2021-08-10'),
  ('Agus Wijaya', 'Informatika', 2.90, '2023-02-01'),
  ('Dewi Lestari', 'Teknik Elektro', 3.85, '2020-08-20'),
  ('Rizky Pratama', 'Informatika', 3.10, '2022-08-15'),
  ('Maya Anggraini', 'Sistem Informasi', 2.75, '2023-02-01'),
  ('Andi Kurniawan', 'Teknik Elektro', 3.40, '2021-08-10'),
  ('Putri Handayani', 'Informatika', 3.60, '2020-08-20');
`;

export const DATASET_FULL = `
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  major TEXT NOT NULL,
  gpa NUMERIC(3,2) NOT NULL,
  enrolled_at DATE NOT NULL
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  title TEXT NOT NULL
);

CREATE TABLE enrollments (
  student_id INT NOT NULL REFERENCES students(id),
  course_id INT NOT NULL REFERENCES courses(id),
  semester TEXT NOT NULL,
  PRIMARY KEY (student_id, course_id)
);

INSERT INTO students (id, name, major, gpa, enrolled_at) VALUES
  (1, 'Budi Santoso', 'Informatika', 3.75, '2022-08-15'),
  (2, 'Siti Rahayu', 'Sistem Informasi', 3.50, '2021-08-10'),
  (3, 'Agus Wijaya', 'Informatika', 2.90, '2023-02-01'),
  (4, 'Dewi Lestari', 'Teknik Elektro', 3.85, '2020-08-20'),
  (5, 'Rizky Pratama', 'Informatika', 3.10, '2022-08-15'),
  (6, 'Maya Anggraini', 'Sistem Informasi', 2.75, '2023-02-01'),
  (7, 'Andi Kurniawan', 'Teknik Elektro', 3.40, '2021-08-10'),
  (8, 'Putri Handayani', 'Informatika', 3.60, '2020-08-20');

INSERT INTO courses (code, title) VALUES
  ('IF-101', 'Algoritma Pemrograman'),
  ('IF-203', 'Basis Data'),
  ('SI-110', 'Analisis Proses Bisnis'),
  ('EL-220', 'Rangkaian Listrik'),
  ('IF-305', 'Kecerdasan Buatan');

INSERT INTO enrollments (student_id, course_id, semester) VALUES
  (1, 1, 'Ganjil 2023'),
  (1, 2, 'Ganjil 2024'),
  (2, 2, 'Ganjil 2024'),
  (2, 3, 'Ganjil 2024'),
  (3, 1, 'Ganjil 2024'),
  (4, 4, 'Ganjil 2023'),
  (5, 1, 'Ganjil 2023'),
  (5, 5, 'Ganjil 2024'),
  (7, 4, 'Ganjil 2024'),
  (8, 1, 'Ganjil 2024'),
  (8, 2, 'Ganjil 2024');
`;

export const levelSeeds: LevelSeed[] = [
  // ============ LEVEL 1 — SELECT DASAR ============
  {
    level: {
      slug: "select-dasar",
      title: "Level 1 — SELECT Dasar",
      description: "Mulai petualangan: SELECT semua kolom, kolom tertentu, dan mengenal struktur tabel students.",
      orderIndex: 1,
    },
    exercises: [
      {
        title: "Pilih Semua Mahasiswa",
        prompt: "Tampilkan semua kolom dari tabel students menggunakan SELECT *.",
        hint: "Query paling sederhana: SELECT * FROM students;",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT * FROM students;",
        solutionSql: "SELECT * FROM students;",
      },
      {
        title: "Ambil Kolom Tertentu",
        prompt: "Tampilkan hanya kolom name dan major dari tabel students.",
        hint: "Sebutkan nama kolom setelah SELECT, dipisah koma: SELECT name, major FROM students;",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, major FROM students;",
        solutionSql: "SELECT name, major FROM students;",
      },
      {
        title: "Urutan Kolom Bebas",
        prompt: "Tampilkan kolom major, name, dan gpa dari semua mahasiswa (urutan kolom boleh berbeda dari tabel).",
        hint: "Tulis nama kolom sesuai urutan yang diminta: SELECT major, name, gpa ...",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT major, name, gpa FROM students;",
        solutionSql: "SELECT major, name, gpa FROM students;",
      },
      {
        title: "SELECT dengan Ekspresi",
        prompt: "Tampilkan name dan gpa, plus kolom baru bernama status berisi teks 'Aktif' untuk semua mahasiswa.",
        hint: "Buat kolom baru dengan string literal: SELECT name, gpa, 'Aktif' AS status FROM students;",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: "SELECT name, gpa, 'Aktif' AS status FROM students;",
      },
      {
        title: "Hilangkan Duplikat (DISTINCT)",
        prompt: "Tampilkan daftar jurusan (major) yang unik dari tabel students.",
        hint: "SELECT DISTINCT major FROM students;",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT major FROM students;",
        solutionSql: "SELECT DISTINCT major FROM students;",
      },
      {
        title: "Latihan Gabungan Dasar",
        prompt: "Tampilkan kolom id, name, dan major untuk 3 mahasiswa pertama di tabel.",
        hint: "Gabungkan SELECT kolom dengan LIMIT 3 di akhir.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT id, name, major FROM students;",
        solutionSql: "SELECT id, name, major FROM students LIMIT 3;",
      },
    ],
  },

  // ============ LEVEL 2 — FILTER WHERE ============
  {
    level: {
      slug: "filter-where",
      title: "Level 2 — Filter WHERE",
      description: "Saring data dengan WHERE: perbandingan, teks, LIKE, IN, BETWEEN, dan logika AND/OR.",
      orderIndex: 2,
    },
    exercises: [
      {
        title: "Filter Teks (WHERE =)",
        prompt: "Tampilkan name dan gpa dari mahasiswa jurusan Informatika.",
        hint: "Gunakan WHERE major = 'Informatika'. Perhatikan tanda kutip tunggal untuk teks.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: "SELECT name, gpa FROM students WHERE major = 'Informatika';",
      },
      {
        title: "Filter Numerik (>=)",
        prompt: "Tampilkan name dan gpa mahasiswa dengan IPK lebih dari atau sama dengan 3.5.",
        hint: "Operator perbandingan: >= . Tanpa tanda kutip untuk angka.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: "SELECT name, gpa FROM students WHERE gpa >= 3.5;",
      },
      {
        title: "Pencarian Teks (LIKE)",
        prompt: "Tampilkan name dari mahasiswa yang namanya mengandung kata 'Pratama'.",
        hint: "LIKE '%Pratama%' — % berarti karakter apa pun di posisi itu.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name FROM students;",
        solutionSql: "SELECT name FROM students WHERE name LIKE '%Pratama%';",
      },
      {
        title: "Awalan Nama (LIKE ...%)",
        prompt: "Tampilkan name mahasiswa yang namanya diawali huruf 'B'.",
        hint: "LIKE 'B%' — cocok dengan awalan.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name FROM students;",
        solutionSql: "SELECT name FROM students WHERE name LIKE 'B%';",
      },
      {
        title: "Daftar Nilai (IN)",
        prompt: "Tampilkan name dan major mahasiswa dari jurusan 'Informatika' atau 'Teknik Elektro'.",
        hint: "Gunakan IN: WHERE major IN ('Informatika', 'Teknik Elektro');",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, major FROM students;",
        solutionSql: "SELECT name, major FROM students WHERE major IN ('Informatika', 'Teknik Elektro');",
      },
      {
        title: "Rentang Nilai (BETWEEN)",
        prompt: "Tampilkan name dan gpa mahasiswa dengan IPK antara 3.0 dan 3.7 (inklusif).",
        hint: "WHERE gpa BETWEEN 3.0 AND 3.7;",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: "SELECT name, gpa FROM students WHERE gpa BETWEEN 3.0 AND 3.7;",
      },
      {
        title: "Logika AND",
        prompt: "Tampilkan name dan major mahasiswa jurusan Informatika yang IPK-nya di atas 3.3.",
        hint: "Gabungkan dua kondisi dengan AND.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, major FROM students;",
        solutionSql: "SELECT name, major FROM students WHERE major = 'Informatika' AND gpa > 3.3;",
      },
      {
        title: "Logika OR",
        prompt: "Tampilkan name dan major mahasiswa jurusan Sistem Informasi ATAU yang IPK-nya di atas 3.7.",
        hint: "Gunakan OR di dalam WHERE.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, major FROM students;",
        solutionSql: "SELECT name, major FROM students WHERE major = 'Sistem Informasi' OR gpa > 3.7;",
      },
    ],
  },

  // ============ LEVEL 3 — ORDER BY & LIMIT ============
  {
    level: {
      slug: "order-limit",
      title: "Level 3 — ORDER BY & LIMIT",
      description: "Urutkan hasil (ASC/DESC, banyak kolom) dan batasi jumlah baris dengan LIMIT.",
      orderIndex: 3,
    },
    exercises: [
      {
        title: "Urutkan Naik (ASC)",
        prompt: "Tampilkan name dan gpa semua mahasiswa, urut dari IPK terendah ke tertinggi.",
        hint: "ORDER BY gpa ASC — ASC naik (boleh ditulis eksplisit).",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: "SELECT name, gpa FROM students ORDER BY gpa ASC;",
      },
      {
        title: "Urutkan Turun (DESC)",
        prompt: "Tampilkan name dan gpa semua mahasiswa, urut dari IPK tertinggi.",
        hint: "ORDER BY gpa DESC — DESC untuk menurun.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: "SELECT name, gpa FROM students ORDER BY gpa DESC;",
      },
      {
        title: "Top 3 Tertinggi (LIMIT)",
        prompt: "Tampilkan 3 mahasiswa dengan IPK tertinggi (name dan gpa).",
        hint: "Kombinasikan ORDER BY gpa DESC dengan LIMIT 3.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: "SELECT name, gpa FROM students ORDER BY gpa DESC LIMIT 3;",
      },
      {
        title: "Urutkan Banyak Kolom",
        prompt: "Tampilkan name, major, dan gpa — urutkan berdasarkan major (A-Z), lalu IPK tertinggi di tiap major.",
        hint: "ORDER BY major ASC, gpa DESC — kolom kedua dipakai saat nilai kolom pertama sama.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, major, gpa FROM students;",
        solutionSql: "SELECT name, major, gpa FROM students ORDER BY major ASC, gpa DESC;",
      },
      {
        title: "Urutkan + Filter + Batas",
        prompt: "Tampilkan name dan gpa 2 mahasiswa jurusan Informatika dengan IPK tertinggi.",
        hint: "Kombinasikan WHERE major = 'Informatika', ORDER BY gpa DESC, LIMIT 2.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: "SELECT name, gpa FROM students WHERE major = 'Informatika' ORDER BY gpa DESC LIMIT 2;",
      },
    ],
  },

  // ============ LEVEL 4 — AGREGASI DASAR ============
  {
    level: {
      slug: "agregasi-dasar",
      title: "Level 4 — Agregasi Dasar",
      description: "COUNT, SUM, AVG, MIN, MAX: rekap angka dari seluruh baris.",
      orderIndex: 4,
    },
    exercises: [
      {
        title: "Hitung Semua Baris (COUNT)",
        prompt: "Hitung berapa total mahasiswa di tabel students.",
        hint: "SELECT COUNT(*) FROM students;",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT COUNT(*) FROM students;",
        solutionSql: "SELECT COUNT(*) FROM students;",
      },
      {
        title: "COUNT dengan Filter",
        prompt: "Hitung berapa banyak mahasiswa jurusan Informatika.",
        hint: "SELECT COUNT(*) FROM students WHERE major = 'Informatika';",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT COUNT(*) FROM students;",
        solutionSql: "SELECT COUNT(*) FROM students WHERE major = 'Informatika';",
      },
      {
        title: "Rata-rata (AVG)",
        prompt: "Hitung IPK rata-rata seluruh mahasiswa.",
        hint: "SELECT AVG(gpa) FROM students;",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT AVG(gpa) FROM students;",
        solutionSql: "SELECT AVG(gpa) FROM students;",
      },
      {
        title: "Total & Nilai Ekstrem",
        prompt: "Tampilkan IPK tertinggi (MAX), IPK terendah (MIN), dan total seluruh IPK (SUM) dalam satu query.",
        hint: "SELECT MAX(gpa), MIN(gpa), SUM(gpa) FROM students;",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT MAX(gpa), MIN(gpa), SUM(gpa) FROM students;",
        solutionSql: "SELECT MAX(gpa), MIN(gpa), SUM(gpa) FROM students;",
      },
      {
        title: "Agregasi Berlabel (AS)",
        prompt: "Tampilkan jumlah mahasiswa dengan nama kolom hasil 'jumlah' dan IPK rata-rata dengan nama 'rata_rata'.",
        hint: "Beri alias dengan AS: COUNT(*) AS jumlah, AVG(gpa) AS rata_rata.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT COUNT(*), AVG(gpa) FROM students;",
        solutionSql: "SELECT COUNT(*) AS jumlah, AVG(gpa) AS rata_rata FROM students;",
      },
    ],
  },

  // ============ LEVEL 5 — GROUP BY & HAVING ============
  {
    level: {
      slug: "group-by-having",
      title: "Level 5 — GROUP BY & HAVING",
      description: "Kelompokkan data per kategori dan saring kelompok dengan HAVING.",
      orderIndex: 5,
    },
    exercises: [
      {
        title: "Jumlah per Kelompok",
        prompt: "Tampilkan major dan jumlah mahasiswa per jurusan.",
        hint: "SELECT major, COUNT(*) FROM students GROUP BY major;",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT major FROM students;",
        solutionSql: "SELECT major, COUNT(*) FROM students GROUP BY major;",
      },
      {
        title: "Rata-rata per Kelompok",
        prompt: "Tampilkan major dan IPK rata-rata per jurusan.",
        hint: "SELECT major, AVG(gpa) FROM students GROUP BY major;",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT major, AVG(gpa) FROM students;",
        solutionSql: "SELECT major, AVG(gpa) FROM students GROUP BY major;",
      },
      {
        title: "Urutkan Hasil Kelompok",
        prompt: "Tampilkan major dan jumlah mahasiswa per jurusan, urutkan dari jumlah terbanyak.",
        hint: "GROUP BY major, lalu ORDER BY COUNT(*) DESC.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT major, COUNT(*) FROM students;",
        solutionSql: "SELECT major, COUNT(*) FROM students GROUP BY major ORDER BY COUNT(*) DESC;",
      },
      {
        title: "Filter Kelompok (HAVING)",
        prompt: "Tampilkan major yang memiliki lebih dari 2 mahasiswa, beserta jumlahnya.",
        hint: "HAVING dipakai untuk menyaring hasil agregasi: HAVING COUNT(*) > 2.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT major, COUNT(*) FROM students GROUP BY major;",
        solutionSql: "SELECT major, COUNT(*) FROM students GROUP BY major HAVING COUNT(*) > 2;",
      },
      {
        title: "HAVING dengan Agregat Lain",
        prompt: "Tampilkan major yang IPK rata-ratanya di atas 3.3, beserta rata-ratanya.",
        hint: "GROUP BY major, lalu HAVING AVG(gpa) > 3.3.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT major, AVG(gpa) FROM students GROUP BY major;",
        solutionSql: "SELECT major, AVG(gpa) FROM students GROUP BY major HAVING AVG(gpa) > 3.3;",
      },
    ],
  },

  // ============ LEVEL 6 — SUBQUERY & GABUNGAN ============
  {
    level: {
      slug: "subquery",
      title: "Level 6 — Subquery & Latihan Gabungan",
      description: "Query di dalam query: subquery untuk filter & agregasi, plus latihan gabungan semua materi.",
      orderIndex: 6,
    },
    exercises: [
      {
        title: "Filter dengan Subquery",
        prompt: "Tampilkan name dan gpa mahasiswa yang IPK-nya di atas IPK rata-rata seluruh mahasiswa.",
        hint: "Bandingkan dengan subquery: WHERE gpa > (SELECT AVG(gpa) FROM students).",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: "SELECT name, gpa FROM students WHERE gpa > (SELECT AVG(gpa) FROM students);",
      },
      {
        title: "Subquery dengan IN",
        prompt: "Tampilkan name mahasiswa yang jurusannya memiliki mahasiswa dengan IPK di atas 3.7.",
        hint: "Cari major dengan IPK > 3.7 di subquery, lalu filter dengan IN.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name FROM students;",
        solutionSql: "SELECT name FROM students WHERE major IN (SELECT major FROM students WHERE gpa > 3.7);",
      },
      {
        title: "Top per Kelompok (konsep)",
        prompt: "Tampilkan mahasiswa dengan IPK tertinggi secara keseluruhan (name dan gpa) menggunakan subquery tanpa ORDER BY/LIMIT.",
        hint: "WHERE gpa = (SELECT MAX(gpa) FROM students).",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: "SELECT name, gpa FROM students WHERE gpa = (SELECT MAX(gpa) FROM students);",
      },
      {
        title: "Latihan Gabungan 1",
        prompt: "Tampilkan major yang jumlah mahasiswanya lebih dari rata-rata jumlah mahasiswa per major (dipecah per major).",
        hint: "Bandingkan COUNT per major dengan AVG jumlah. Gunakan GROUP BY + HAVING dengan subquery rata-rata.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT major, COUNT(*) FROM students GROUP BY major;",
        solutionSql: "SELECT major, COUNT(*) FROM students GROUP BY major HAVING COUNT(*) > (SELECT AVG(jml) FROM (SELECT COUNT(*) AS jml FROM students GROUP BY major) sub);",
      },
    ],
  },

  // ============ LEVEL 7 — INNER JOIN & ALIAS ============
  {
    level: {
      slug: "inner-join",
      title: "Level 7 — INNER JOIN & Alias",
      description: "Gabungkan tabel students, enrollments, dan courses. Kenali foreign key untuk JOIN.",
      orderIndex: 7,
    },
    exercises: [
      {
        title: "Gabungkan students + enrollments",
        prompt: "Tampilkan name mahasiswa dan semester KRS-nya (gabungkan students dengan enrollments).",
        hint: "JOIN enrollments ON students.id = enrollments.student_id.",
        datasetSql: DATASET_FULL,
        starterSql: "SELECT students.name, enrollments.semester FROM students;",
        solutionSql: "SELECT students.name, enrollments.semester FROM students JOIN enrollments ON students.id = enrollments.student_id;",
      },
      {
        title: "Gabungkan 3 Tabel (INNER JOIN)",
        prompt: "Tampilkan nama mahasiswa beserta judul mata kuliah yang mereka ambil.",
        hint: "JOIN enrollments ON students.id = enrollments.student_id, lalu JOIN courses ON enrollments.course_id = courses.id.",
        datasetSql: DATASET_FULL,
        starterSql: "SELECT students.name, courses.title FROM students;",
        solutionSql: `SELECT students.name, courses.title
FROM students
JOIN enrollments ON students.id = enrollments.student_id
JOIN courses ON enrollments.course_id = courses.id;`,
      },
      {
        title: "Alias Tabel",
        prompt: "Tampilkan kode dan judul mata kuliah yang diambil mahasiswa bernama 'Budi Santoso'. Gunakan alias s, e, c untuk tabel.",
        hint: "Alias: FROM students s JOIN enrollments e ON s.id = e.student_id JOIN courses c ON e.course_id = c.id ... WHERE s.name = 'Budi Santoso'.",
        datasetSql: DATASET_FULL,
        starterSql: "SELECT courses.code, courses.title FROM students;",
        solutionSql: `SELECT c.code, c.title
FROM students s
JOIN enrollments e ON s.id = e.student_id
JOIN courses c ON e.course_id = c.id
WHERE s.name = 'Budi Santoso';`,
      },
      {
        title: "Join + Urutan",
        prompt: "Tampilkan name mahasiswa dan judul mata kuliah, urutkan berdasarkan nama mahasiswa lalu judul mata kuliah.",
        hint: "Tambahkan ORDER BY students.name, courses.title di akhir query 3-tabel.",
        datasetSql: DATASET_FULL,
        starterSql: "SELECT students.name, courses.title FROM students;",
        solutionSql: `SELECT students.name, courses.title
FROM students
JOIN enrollments ON students.id = enrollments.student_id
JOIN courses ON enrollments.course_id = courses.id
ORDER BY students.name, courses.title;`,
      },
    ],
  },

  // ============ LEVEL 8 — LEFT JOIN ============
  {
    level: {
      slug: "left-join",
      title: "Level 8 — LEFT JOIN",
      description: "LEFT JOIN menyimpan semua baris tabel kiri — temukan data yang tidak berpasangan.",
      orderIndex: 8,
    },
    exercises: [
      {
        title: "Semua Mahasiswa + KRS-nya",
        prompt: "Tampilkan name semua mahasiswa beserta semester KRS-nya. Mahasiswa tanpa KRS tetap muncul (semester NULL).",
        hint: "LEFT JOIN enrollments ON students.id = enrollments.student_id.",
        datasetSql: DATASET_FULL,
        starterSql: "SELECT students.name, enrollments.semester FROM students;",
        solutionSql: `SELECT students.name, enrollments.semester
FROM students
LEFT JOIN enrollments ON students.id = enrollments.student_id;`,
      },
      {
        title: "Mahasiswa Tanpa KRS (Anti-Join)",
        prompt: "Tampilkan nama mahasiswa yang belum mengambil mata kuliah apa pun (tidak ada di tabel enrollments).",
        hint: "LEFT JOIN enrollments, lalu filter enrollments.student_id IS NULL di WHERE.",
        datasetSql: DATASET_FULL,
        starterSql: "SELECT students.name FROM students LEFT JOIN enrollments ON students.id = enrollments.student_id;",
        solutionSql: `SELECT students.name
FROM students
LEFT JOIN enrollments ON students.id = enrollments.student_id
WHERE enrollments.student_id IS NULL;`,
      },
      {
        title: "Kursus Tanpa Peminat",
        prompt: "Tampilkan judul mata kuliah yang belum pernah diambil siapa pun.",
        hint: "LEFT JOIN courses dengan enrollments, lalu cari enrollments.course_id IS NULL.",
        datasetSql: DATASET_FULL,
        starterSql: "SELECT courses.title FROM courses LEFT JOIN enrollments ON courses.id = enrollments.course_id;",
        solutionSql: `SELECT courses.title
FROM courses
LEFT JOIN enrollments ON courses.id = enrollments.course_id
WHERE enrollments.course_id IS NULL;`,
      },
    ],
  },

  // ============ LEVEL 9 — JOIN + AGREGASI ============
  {
    level: {
      slug: "join-agregasi",
      title: "Level 9 — JOIN & Agregasi",
      description: "Gabungkan JOIN dengan COUNT, GROUP BY, dan HAVING untuk analisis data lintas tabel.",
      orderIndex: 9,
    },
    exercises: [
      {
        title: "Jumlah Mahasiswa per Mata Kuliah",
        prompt: "Tampilkan judul mata kuliah dan jumlah mahasiswa yang mengambilnya.",
        hint: "JOIN courses dengan enrollments, lalu GROUP BY courses.title, COUNT(*).",
        datasetSql: DATASET_FULL,
        starterSql: "SELECT courses.title FROM courses JOIN enrollments ON courses.id = enrollments.course_id;",
        solutionSql: `SELECT courses.title, COUNT(*) AS jumlah
FROM courses
JOIN enrollments ON courses.id = enrollments.course_id
GROUP BY courses.title;`,
      },
      {
        title: "Kursus Populer (HAVING)",
        prompt: "Tampilkan judul mata kuliah dan jumlah mahasiswa, hanya untuk mata kuliah yang diambil lebih dari 2 mahasiswa.",
        hint: "GROUP BY courses.title, lalu HAVING COUNT(*) > 2.",
        datasetSql: DATASET_FULL,
        starterSql: "SELECT courses.title FROM courses JOIN enrollments ON courses.id = enrollments.course_id;",
        solutionSql: `SELECT courses.title, COUNT(*) AS jumlah
FROM courses
JOIN enrollments ON courses.id = enrollments.course_id
GROUP BY courses.title
HAVING COUNT(*) > 2;`,
      },
      {
        title: "Jumlah KRS per Mahasiswa",
        prompt: "Tampilkan name mahasiswa dan jumlah mata kuliah yang diambilnya, hanya yang mengambil minimal 2 mata kuliah.",
        hint: "JOIN students dengan enrollments, GROUP BY students.name, HAVING COUNT(*) >= 2.",
        datasetSql: DATASET_FULL,
        starterSql: "SELECT students.name FROM students JOIN enrollments ON students.id = enrollments.student_id;",
        solutionSql: `SELECT students.name, COUNT(*) AS jumlah_krs
FROM students
JOIN enrollments ON students.id = enrollments.student_id
GROUP BY students.name
HAVING COUNT(*) >= 2;`,
      },
      {
        title: "Rata-rata IPK per Mata Kuliah",
        prompt: "Tampilkan judul mata kuliah dan IPK rata-rata mahasiswa yang mengambilnya.",
        hint: "JOIN courses → enrollments → students, GROUP BY courses.title, AVG(students.gpa).",
        datasetSql: DATASET_FULL,
        starterSql: "SELECT courses.title FROM courses;",
        solutionSql: `SELECT courses.title, AVG(students.gpa) AS rata_ipk
FROM courses
JOIN enrollments ON courses.id = enrollments.course_id
JOIN students ON students.id = enrollments.student_id
GROUP BY courses.title;`,
      },
    ],
  },

  // ============ LEVEL 10 — TANTANGAN SUBQUERY & JOIN ============
  {
    level: {
      slug: "tantangan",
      title: "Level 10 — Tantangan Puncak",
      description: "Kombinasikan subquery, JOIN, dan agregasi dalam soal tantangan.",
      orderIndex: 10,
    },
    exercises: [
      {
        title: "Mahasiswa di Atas Rata-rata per Jurusan",
        prompt: "Tampilkan name dan gpa mahasiswa yang IPK-nya di atas rata-rata IPK seluruh mahasiswa, urut dari IPK tertinggi.",
        hint: "WHERE gpa > (SELECT AVG(gpa) FROM students), lalu ORDER BY gpa DESC.",
        datasetSql: DATASET_FULL,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: `SELECT name, gpa
FROM students
WHERE gpa > (SELECT AVG(gpa) FROM students)
ORDER BY gpa DESC;`,
      },
      {
        title: "Mata Kuliah dengan Mahasiswa Terbaik",
        prompt: "Tampilkan judul mata kuliah yang pernah diambil oleh mahasiswa ber-IPK di atas 3.6 (gunakan subquery IN).",
        hint: "Subquery ambil course_id dari enrollments yang student-nya ber-IPK > 3.6, lalu filter courses.",
        datasetSql: DATASET_FULL,
        starterSql: "SELECT title FROM courses;",
        solutionSql: `SELECT c.title
FROM courses c
WHERE c.id IN (
  SELECT e.course_id
  FROM enrollments e
  JOIN students s ON s.id = e.student_id
  WHERE s.gpa > 3.6
);`,
      },
      {
        title: "Mahasiswa Paling Sibuk",
        prompt: "Tampilkan name mahasiswa yang jumlah KRS-nya paling banyak (gunakan subquery MAX).",
        hint: "Hitung jumlah per mahasiswa di subquery, lalu bandingkan dengan MAX-nya.",
        datasetSql: DATASET_FULL,
        starterSql: "SELECT students.name FROM students;",
        solutionSql: `SELECT s.name
FROM students s
JOIN enrollments e ON s.id = e.student_id
GROUP BY s.id, s.name
HAVING COUNT(*) = (
  SELECT MAX(jml) FROM (
    SELECT COUNT(*) AS jml FROM enrollments GROUP BY student_id
  ) sub
);`,
      },
      {
        title: "Rangking Mata Kuliah",
        prompt: "Tampilkan judul mata kuliah dan jumlah mahasiswanya, urutkan dari yang paling banyak peminat ke paling sedikit.",
        hint: "GROUP BY + COUNT, lalu ORDER BY jumlah DESC.",
        datasetSql: DATASET_FULL,
        starterSql: "SELECT courses.title FROM courses;",
        solutionSql: `SELECT c.title, COUNT(*) AS jumlah
FROM courses c
JOIN enrollments e ON c.id = e.course_id
GROUP BY c.title
ORDER BY COUNT(*) DESC;`,
      },
      {
        title: "Tantangan Terakhir",
        prompt: "Tampilkan name mahasiswa yang mengambil mata kuliah 'Basis Data' dan IPK-nya di atas rata-rata mahasiswa jurusan yang sama (major).",
        hint: "JOIN 3 tabel, filter course 'Basis Data', lalu bandingkan gpa dengan rata-rata per major memakai subquery berkorelasi.",
        datasetSql: DATASET_FULL,
        starterSql: "SELECT students.name FROM students;",
        solutionSql: `SELECT s.name
FROM students s
JOIN enrollments e ON s.id = e.student_id
JOIN courses c ON e.course_id = c.id
WHERE c.title = 'Basis Data'
  AND s.gpa > (
    SELECT AVG(s2.gpa) FROM students s2 WHERE s2.major = s.major
  );`,
      },
    ],
  },
];
