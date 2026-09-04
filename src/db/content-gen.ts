import type { LevelSeed2 } from "./content-extra";
import { DATASET_SCHOOL } from "./content-extra";

// ============================================================
// GENERATOR LEVEL LATIHAN — level 45 s.d. 200
// ============================================================
// Tiap level memakai SATU topik inti (bergilir) dengan variasi parameter
// (kelas, ambang gpa, mapel, dll) sehingga tiap level punya soal berbeda
// namun polanya sudah terverifikasi valid di PGlite.
//
// Struktur: tiap topik = pembuat soal (n, levelIndex) → exercises.

type BankTopic = {
  slug: string;
  title: (n: number) => string;
  concept: string;
  explanation: string;
  build: (n: number, levelIndex: number) => RawExercise[];
};

type RawExercise = {
  title: string;
  prompt: string;
  hint: string;
  starterSql: string;
  solutionSql: string;
};

const CLASSES = ["7A", "7B", "8A", "8B"];
const GPA_HI = 3.5;
const GPA_MID = 3.0;
const SUBJECTS = [1, 2, 3, 4, 5];

// Pemilih deterministik dari array
function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

const topics: BankTopic[] = [
  {
    slug: "latihan-select",
    title: () => "Latihan SELECT",
    concept: "Latihan SELECT",
    explanation:
      "SELECT kolom FROM tabel untuk mengambil data.\n• SELECT * = semua kolom\n• SELECT kolom1, kolom2 = kolom tertentu\n• Boleh ditambah WHERE, ORDER BY, LIMIT.\n\nKerjakan sesuai permintaan di soal!",
    build: (n) => {
      const cls = pick(CLASSES, n);
      return [
        {
          title: `Ambil Data Kelas ${cls}`,
          prompt: `Tampilkan name, class_name, dan gpa siswa kelas ${cls}.`,
          hint: `SELECT name, class_name, gpa FROM students WHERE class_name = '${cls}';`,
          starterSql: "SELECT name, class_name, gpa FROM students;",
          solutionSql: `SELECT name, class_name, gpa FROM students WHERE class_name = '${cls}';`,
        },
        {
          title: "Urutkan dari Tertinggi",
          prompt: `Tampilkan name & gpa siswa kelas ${cls}, urut gpa tertinggi dulu.`,
          hint: `... WHERE class_name='${cls}' ORDER BY gpa DESC`,
          starterSql: `SELECT name, gpa FROM students WHERE class_name = '${cls}';`,
          solutionSql: `SELECT name, gpa FROM students WHERE class_name = '${cls}' ORDER BY gpa DESC;`,
        },
        {
          title: "Hanya 3 Teratas",
          prompt: `Tampilkan 3 siswa kelas ${cls} dengan gpa tertinggi (name & gpa).`,
          hint: `... ORDER BY gpa DESC LIMIT 3`,
          starterSql: `SELECT name, gpa FROM students WHERE class_name = '${cls}';`,
          solutionSql: `SELECT name, gpa FROM students WHERE class_name = '${cls}' ORDER BY gpa DESC LIMIT 3;`,
        },
      ];
    },
  },
  {
    slug: "latihan-where",
    title: () => "Latihan WHERE",
    concept: "Latihan WHERE",
    explanation:
      "WHERE menyaring baris dengan kondisi:\n• Teks: major = 'X', LIKE '%kata%'\n• Angka: gpa >= 3.5, BETWEEN a AND b\n• Gabung: AND / OR\n\nBaca syarat di soal dengan teliti!",
    build: (n) => {
      const cls = pick(CLASSES, n);
      const hi = n % 2 === 0 ? GPA_HI : GPA_MID;
      return [
        {
          title: `Filter Ganda Kelas ${cls}`,
          prompt: `Tampilkan name siswa kelas ${cls} yang gpa-nya >= ${hi}.`,
          hint: `WHERE class_name = '${cls}' AND gpa >= ${hi}`,
          starterSql: "SELECT name FROM students;",
          solutionSql: `SELECT name FROM students WHERE class_name = '${cls}' AND gpa >= ${hi};`,
        },
        {
          title: "Nama Mengandung Huruf",
          prompt: `Tampilkan name siswa yang namanya mengandung huruf 'a' dan kelasnya ${cls}.`,
          hint: `WHERE name LIKE '%a%' AND class_name = '${cls}'`,
          starterSql: "SELECT name FROM students;",
          solutionSql: `SELECT name FROM students WHERE name LIKE '%a%' AND class_name = '${cls}';`,
        },
        {
          title: "Rentang GPA",
          prompt: `Tampilkan name siswa kelas ${cls} dengan gpa antara ${GPA_MID} dan ${GPA_HI}.`,
          hint: `WHERE class_name='${cls}' AND gpa BETWEEN ${GPA_MID} AND ${GPA_HI}`,
          starterSql: "SELECT name, gpa FROM students;",
          solutionSql: `SELECT name FROM students WHERE class_name = '${cls}' AND gpa BETWEEN ${GPA_MID} AND ${GPA_HI};`,
        },
      ];
    },
  },
  {
    slug: "latihan-agregasi",
    title: () => "Latihan Agregasi",
    concept: "Latihan Agregasi",
    explanation:
      "Fungsi agregasi meringkas banyak baris jadi satu angka:\n• COUNT(*) jumlah baris\n• AVG(kolom) rata-rata\n• MAX/MIN nilai terbesar/terkecil\n• SUM total\n\nGROUP BY kolom untuk hitung per kelompok.",
    build: (n) => {
      const cls = pick(CLASSES, n);
      const subj = pick(SUBJECTS, n);
      return [
        {
          title: `Hitung Siswa ${cls}`,
          prompt: `Hitung jumlah siswa di kelas ${cls}.`,
          hint: `SELECT COUNT(*) FROM students WHERE class_name = '${cls}';`,
          starterSql: "SELECT COUNT(*) FROM students;",
          solutionSql: `SELECT COUNT(*) FROM students WHERE class_name = '${cls}';`,
        },
        {
          title: `Rata-rata GPA ${cls}`,
          prompt: `Hitung rata-rata gpa siswa kelas ${cls}.`,
          hint: `SELECT AVG(gpa) FROM students WHERE class_name = '${cls}';`,
          starterSql: "SELECT AVG(gpa) FROM students;",
          solutionSql: `SELECT AVG(gpa) FROM students WHERE class_name = '${cls}';`,
        },
        {
          title: `Rata-rata Nilai Mapel ${subj}`,
          prompt: `Hitung rata-rata score ujian untuk subject_id ${subj}.`,
          hint: `SELECT AVG(score) FROM exam_scores WHERE subject_id = ${subj};`,
          starterSql: "SELECT AVG(score) FROM exam_scores;",
          solutionSql: `SELECT AVG(score) FROM exam_scores WHERE subject_id = ${subj};`,
        },
      ];
    },
  },
  {
    slug: "latihan-groupby",
    title: () => "Latihan GROUP BY",
    concept: "Latihan GROUP BY",
    explanation:
      "GROUP BY mengelompokkan baris lalu menghitung per kelompok:\nSELECT kelas, COUNT(*) ... GROUP BY kelas\n\nAturan: kolom non-agregat di SELECT harus ada di GROUP BY.\nHAVING menyaring kelompok (seperti WHERE untuk grup).",
    build: (n) => {
      const minCount = 2 + (n % 2);
      return [
        {
          title: "Jumlah Siswa per Kelas",
          prompt: "Tampilkan class_name dan jumlah siswa tiap kelas, urut jumlah terbanyak.",
          hint: "SELECT class_name, COUNT(*) FROM students GROUP BY class_name ORDER BY COUNT(*) DESC;",
          starterSql: "SELECT class_name FROM students;",
          solutionSql:
            "SELECT class_name, COUNT(*) FROM students GROUP BY class_name ORDER BY COUNT(*) DESC;",
        },
        {
          title: "Rata-rata per Kelas",
          prompt: "Tampilkan class_name dan rata-rata gpa tiap kelas.",
          hint: "SELECT class_name, AVG(gpa) FROM students GROUP BY class_name;",
          starterSql: "SELECT class_name, gpa FROM students;",
          solutionSql:
            "SELECT class_name, AVG(gpa) FROM students GROUP BY class_name;",
        },
        {
          title: `Kelas dengan >= ${minCount} Siswa`,
          prompt: `Tampilkan class_name dan jumlah siswa, hanya kelas dengan >= ${minCount} siswa (HAVING).`,
          hint: `GROUP BY class_name HAVING COUNT(*) >= ${minCount}`,
          starterSql: "SELECT class_name, COUNT(*) FROM students GROUP BY class_name;",
          solutionSql: `SELECT class_name, COUNT(*) FROM students GROUP BY class_name HAVING COUNT(*) >= ${minCount};`,
        },
      ];
    },
  },
  {
    slug: "latihan-join",
    title: () => "Latihan JOIN",
    concept: "Latihan JOIN",
    explanation:
      "JOIN menggabungkan tabel lewat kolom kunci:\nFROM students s JOIN exam_scores e ON s.id = e.student_id\n\nINNER JOIN = hanya baris yang cocok.\nLEFT JOIN = semua baris kiri tetap muncul.\n\nCek panel 'Data & Skema' untuk lihat kolom & FK!",
    build: (n) => {
      const cls = pick(CLASSES, n);
      return [
        {
          title: `Nilai Siswa Kelas ${cls}`,
          prompt: `Tampilkan name, subject_id, dan score siswa kelas ${cls} (JOIN students & exam_scores).`,
          hint: `FROM students s JOIN exam_scores e ON s.id = e.student_id WHERE s.class_name = '${cls}'`,
          starterSql: `SELECT s.name FROM students s WHERE s.class_name = '${cls}';`,
          solutionSql: `SELECT s.name, e.subject_id, e.score FROM students s JOIN exam_scores e ON s.id = e.student_id WHERE s.class_name = '${cls}';`,
        },
        {
          title: "Rata-rata Nilai per Siswa",
          prompt: "Tampilkan name dan rata-rata score tiap siswa (JOIN + GROUP BY).",
          hint: "SELECT s.name, AVG(e.score) FROM students s JOIN exam_scores e ON s.id = e.student_id GROUP BY s.name;",
          starterSql: "SELECT s.name FROM students s;",
          solutionSql:
            "SELECT s.name, AVG(e.score) FROM students s JOIN exam_scores e ON s.id = e.student_id GROUP BY s.name;",
        },
        {
          title: "Siswa Tanpa Nilai",
          prompt: "Tampilkan name siswa yang BELUM punya nilai ujian (LEFT JOIN + IS NULL).",
          hint: "SELECT s.name FROM students s LEFT JOIN exam_scores e ON s.id = e.student_id WHERE e.id IS NULL;",
          starterSql: "SELECT s.name FROM students s;",
          solutionSql:
            "SELECT s.name FROM students s LEFT JOIN exam_scores e ON s.id = e.student_id WHERE e.id IS NULL;",
        },
      ];
    },
  },
];

const TOPIC_NAMES = ["SELECT", "WHERE", "Agregasi", "GROUP BY", "JOIN"];

export function generatePracticeLevels(startIndex: number, count: number): LevelSeed2[] {
  const levels: LevelSeed2[] = [];
  for (let i = 0; i < count; i++) {
    const n = startIndex + i; // nomor level (45..)
    const topic = topics[n % topics.length];
    const round = Math.floor(n / topics.length); // putaran ke berapa
    levels.push({
      level: {
        slug: `${topic.slug}-${n}`,
        title: `Level ${n} — ${topic.title(n)} ${round > 0 ? `(Putaran ${round + 1})` : ""}`.trim(),
        description: `Latihan ${TOPIC_NAMES[n % topics.length]} — kerjakan dengan teliti!`,
        orderIndex: n,
        concept: topic.concept,
        explanation: topic.explanation,
      },
      exercises: topic.build(n, n).map((e) => ({ ...e, datasetSql: DATASET_SCHOOL })),
    });
  }
  return levels;
}
