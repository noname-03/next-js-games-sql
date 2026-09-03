import { sqlite } from "./client";
import type { NewLevel } from "./schema";

type SeedExercise = {
  title: string;
  prompt: string;
  hint: string;
  datasetSql: string;
  starterSql: string;
  solutionSql: string;
};

// Skema + data yang di-load ke PGlite (Postgres) untuk tiap level.
// Level 1 & 2: tabel students. Level 3: students + courses + enrollments.
const DATASET_STUDENTS = `
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

const DATASET_FULL = `
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

type LevelSeed = {
  level: NewLevel;
  exercises: SeedExercise[];
};

const levelSeeds: LevelSeed[] = [
  {
    level: {
      slug: "select-dasar",
      title: "Level 1 — SELECT Dasar",
      description:
        "Pelajari cara mengambil data: SELECT, kolom tertentu, WHERE, LIKE, dan operator logika.",
      orderIndex: 1,
    },
    exercises: [
      {
        title: "Pilih Semua Mahasiswa",
        prompt:
          "Tampilkan semua kolom dari tabel students menggunakan SELECT *.",
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
        title: "Filter dengan WHERE",
        prompt:
          "Tampilkan name dan gpa dari mahasiswa jurusan Informatika.",
        hint: "Gunakan WHERE major = 'Informatika'. Perhatikan tanda kutip tunggal untuk teks.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql:
          "SELECT name, gpa FROM students WHERE major = 'Informatika';",
      },
      {
        title: "Filter Numerik",
        prompt:
          "Tampilkan name dan gpa mahasiswa dengan IPK lebih dari atau sama dengan 3.5.",
        hint: "Operator perbandingan: >= . Tanpa tanda kutip untuk angka.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: "SELECT name, gpa FROM students WHERE gpa >= 3.5;",
      },
      {
        title: "Kombinasi Kondisi (AND/OR)",
        prompt:
          "Tampilkan name dan major mahasiswa jurusan Informatika ATAU yang IPK-nya di atas 3.7.",
        hint: "Gunakan OR di dalam WHERE.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, major FROM students;",
        solutionSql:
          "SELECT name, major FROM students WHERE major = 'Informatika' OR gpa > 3.7;",
      },
      {
        title: "Pencarian Teks (LIKE)",
        prompt:
          "Tampilkan name dari mahasiswa yang namanya mengandung kata 'Pratama'.",
        hint: "LIKE '%Pratama%' — % berarti karakter apa pun di posisi itu.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name FROM students;",
        solutionSql: "SELECT name FROM students WHERE name LIKE '%Pratama%';",
      },
    ],
  },
  {
    level: {
      slug: "order-agregasi",
      title: "Level 2 — Urutan & Agregasi",
      description:
        "ORDER BY, LIMIT, COUNT, AVG, dan pengelompokan dengan GROUP BY.",
      orderIndex: 2,
    },
    exercises: [
      {
        title: "Urutkan Hasil (ORDER BY)",
        prompt: "Tampilkan name dan gpa semua mahasiswa, urut dari IPK tertinggi.",
        hint: "ORDER BY gpa DESC — DESC untuk menurun.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql: "SELECT name, gpa FROM students ORDER BY gpa DESC;",
      },
      {
        title: "Batas Jumlah Baris (LIMIT)",
        prompt: "Tampilkan 3 mahasiswa dengan IPK tertinggi (name dan gpa).",
        hint: "Kombinasikan ORDER BY gpa DESC dengan LIMIT 3.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT name, gpa FROM students;",
        solutionSql:
          "SELECT name, gpa FROM students ORDER BY gpa DESC LIMIT 3;",
      },
      {
        title: "Hitung Jumlah Baris (COUNT)",
        prompt: "Hitung berapa banyak mahasiswa jurusan Informatika.",
        hint: "SELECT COUNT(*) FROM students WHERE major = 'Informatika';",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT COUNT(*) FROM students;",
        solutionSql:
          "SELECT COUNT(*) FROM students WHERE major = 'Informatika';",
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
        title: "Agregasi per Kelompok (GROUP BY)",
        prompt:
          "Tampilkan major dan jumlah mahasiswa per jurusan, urutkan dari jumlah terbanyak.",
        hint: "GROUP BY major, lalu COUNT(*). Urutkan hasilnya dengan ORDER BY.",
        datasetSql: DATASET_STUDENTS,
        starterSql: "SELECT major FROM students;",
        solutionSql:
          "SELECT major, COUNT(*) FROM students GROUP BY major ORDER BY COUNT(*) DESC;",
      },
    ],
  },
  {
    level: {
      slug: "join-multi-tabel",
      title: "Level 3 — JOIN Multi-Tabel",
      description:
        "Gabungkan beberapa tabel dengan INNER JOIN, LEFT JOIN, dan agregasi ber-JOIN.",
      orderIndex: 3,
    },
    exercises: [
      {
        title: "Gabungkan Dua Tabel (INNER JOIN)",
        prompt:
          "Tampilkan nama mahasiswa beserta judul mata kuliah yang mereka ambil (gunakan students dan enrollments serta courses).",
        hint: "JOIN enrollments ON students.id = enrollments.student_id, lalu JOIN courses ON enrollments.course_id = courses.id.",
        datasetSql: DATASET_FULL,
        starterSql: "SELECT students.name, courses.title FROM students;",
        solutionSql: `SELECT students.name, courses.title
FROM students
JOIN enrollments ON students.id = enrollments.student_id
JOIN courses ON enrollments.course_id = courses.id;`,
      },
      {
        title: "Mahasiswa Tanpa KRS (LEFT JOIN)",
        prompt:
          "Tampilkan nama mahasiswa yang belum mengambil mata kuliah apa pun (tidak ada di tabel enrollments).",
        hint: "LEFT JOIN enrollments, lalu filter enrollments.student_id IS NULL di WHERE.",
        datasetSql: DATASET_FULL,
        starterSql:
          "SELECT students.name FROM students LEFT JOIN enrollments ON students.id = enrollments.student_id;",
        solutionSql: `SELECT students.name
FROM students
LEFT JOIN enrollments ON students.id = enrollments.student_id
WHERE enrollments.student_id IS NULL;`,
      },
      {
        title: "Join + Agregasi",
        prompt:
          "Tampilkan judul mata kuliah dan jumlah mahasiswa yang mengambilnya, hanya untuk mata kuliah yang diambil lebih dari 2 mahasiswa.",
        hint: "JOIN courses dengan enrollments, GROUP BY courses.title, lalu HAVING COUNT(*) > 2.",
        datasetSql: DATASET_FULL,
        starterSql:
          "SELECT courses.title FROM courses JOIN enrollments ON courses.id = enrollments.course_id;",
        solutionSql: `SELECT courses.title, COUNT(*) AS jumlah
FROM courses
JOIN enrollments ON courses.id = enrollments.course_id
GROUP BY courses.title
HAVING COUNT(*) > 2;`,
      },
    ],
  },
];

function main() {
  console.log("Seeding database...");

  const existing = sqlite.prepare("SELECT id FROM levels LIMIT 1").all();
  if (existing.length > 0) {
    console.log("Database sudah berisi data — lewati seed.");
    return;
  }

  for (const seed of levelSeeds) {
    const levelId = Number(
      sqlite
        .prepare(
          "INSERT INTO levels (slug, title, description, order_index) VALUES (?, ?, ?, ?)"
        )
        .run(
          seed.level.slug,
          seed.level.title,
          seed.level.description,
          seed.level.orderIndex
        ).lastInsertRowid
    );

    let order = 1;
    for (const ex of seed.exercises) {
      sqlite
        .prepare(
          "INSERT INTO exercises (level_id, title, prompt, hint, dataset_sql, starter_sql, solution_sql, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .run(
          levelId,
          ex.title,
          ex.prompt,
          ex.hint,
          ex.datasetSql,
          ex.starterSql,
          ex.solutionSql,
          order++
        );
    }
    console.log(
      `  Level "${seed.level.title}" -> ${seed.exercises.length} exercise`
    );
  }

  console.log("Seed selesai.");
}

main();
