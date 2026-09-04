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
  {
    slug: "latihan-case",
    title: () => "Latihan CASE",
    concept: "Latihan CASE",
    explanation:
      "CASE membuat kolom baru berdasarkan kondisi:\nCASE WHEN kondisi THEN hasil ELSE hasil_lain END\n\nBisa dipakai untuk memberi label (bagus/cukup/kurang) pada angka.\nBisa juga di ORDER BY untuk urutan khusus.",
    build: (n) => {
      const cls = pick(CLASSES, n);
      const subj = pick(SUBJECTS, n);
      return [
        {
          title: `Label Nilai Mapel ${subj}`,
          prompt: `Tampilkan student_id dan label score ujian subject ${subj}: >=85 'Bagus', >=70 'Cukup', lainnya 'Kurang'.`,
          hint: `SELECT student_id, CASE WHEN score >= 85 THEN 'Bagus' WHEN score >= 70 THEN 'Cukup' ELSE 'Kurang' END FROM exam_scores WHERE subject_id = ${subj};`,
          starterSql: `SELECT student_id, score FROM exam_scores WHERE subject_id = ${subj};`,
          solutionSql: `SELECT student_id, CASE WHEN score >= 85 THEN 'Bagus' WHEN score >= 70 THEN 'Cukup' ELSE 'Kurang' END FROM exam_scores WHERE subject_id = ${subj};`,
        },
        {
          title: `Predikat Kelas ${cls}`,
          prompt: `Tampilkan name dan predikat siswa kelas ${cls}: gpa>=3.5 'A', >=3.0 'B', lainnya 'C'.`,
          hint: `SELECT name, CASE WHEN gpa >= 3.5 THEN 'A' WHEN gpa >= 3.0 THEN 'B' ELSE 'C' END FROM students WHERE class_name = '${cls}';`,
          starterSql: `SELECT name, gpa FROM students WHERE class_name = '${cls}';`,
          solutionSql: `SELECT name, CASE WHEN gpa >= 3.5 THEN 'A' WHEN gpa >= 3.0 THEN 'B' ELSE 'C' END FROM students WHERE class_name = '${cls}';`,
        },
        {
          title: "Urutkan Perempuan Dulu",
          prompt: "Tampilkan name & gender siswa kelas 7, urutkan: Perempuan (P) lebih dulu, lalu Laki-laki (L).",
          hint: "SELECT name, gender FROM students WHERE class_name LIKE '7%' ORDER BY CASE gender WHEN 'P' THEN 1 ELSE 2 END;",
          starterSql: "SELECT name, gender FROM students WHERE class_name LIKE '7%';",
          solutionSql:
            "SELECT name, gender FROM students WHERE class_name LIKE '7%' ORDER BY CASE gender WHEN 'P' THEN 1 ELSE 2 END;",
        },
      ];
    },
  },
  {
    slug: "latihan-tanggal",
    title: () => "Latihan Fungsi Tanggal",
    concept: "Latihan Fungsi Tanggal",
    explanation:
      "Fungsi tanggal:\n• EXTRACT(YEAR/MONTH FROM tanggal)\n• AGE(tanggal) → umur\n• CURRENT_DATE → hari ini\n• Tanggal bisa dibandingkan: exam_date > '2024-03-12'\n\nLatihan memakai kolom birth_date & exam_date.",
    build: (n) => {
      const day = 10 + (n % 6); // 10..15 Maret 2024
      return [
        {
          title: "Ujian Setelah Tanggal",
          prompt: `Tampilkan student_id & exam_date ujian setelah tanggal '2024-03-${day}'.`,
          hint: `WHERE exam_date > '2024-03-${day}'`,
          starterSql: "SELECT student_id, exam_date FROM exam_scores;",
          solutionSql: `SELECT student_id, exam_date FROM exam_scores WHERE exam_date > '2024-03-${day}';`,
        },
        {
          title: "Siswa Lahir 2009",
          prompt: "Tampilkan name siswa lahir tahun 2009 (EXTRACT(YEAR FROM birth_date) = 2009).",
          hint: "WHERE EXTRACT(YEAR FROM birth_date) = 2009",
          starterSql: "SELECT name, birth_date FROM students;",
          solutionSql:
            "SELECT name FROM students WHERE EXTRACT(YEAR FROM birth_date) = 2009;",
        },
        {
          title: "Umur per Nama",
          prompt: "Tampilkan name dan umur dalam tahun (EXTRACT(YEAR FROM AGE(birth_date))).",
          hint: "EXTRACT(YEAR FROM AGE(birth_date))",
          starterSql: "SELECT name, birth_date FROM students;",
          solutionSql:
            "SELECT name, EXTRACT(YEAR FROM AGE(birth_date)) FROM students;",
        },
      ];
    },
  },
  {
    slug: "latihan-window",
    title: () => "Latihan Window",
    concept: "Latihan Window",
    explanation:
      "Window function menghitung per baris tanpa menggabungkan:\nROW_NUMBER() OVER (ORDER BY ...)\nRANK() OVER (PARTITION BY ... ORDER BY ...)\nSUM/AVG OVER (...) untuk total/rata berjalan.\n\nBiasanya dibungkus CTE/subquery jika ingin difilter.",
    build: (n) => {
      const subj = pick(SUBJECTS, n);
      return [
        {
          title: `Peringkat Ujian Mapel ${subj}`,
          prompt: `Tampilkan student_id, score, dan ROW_NUMBER() urut score DESC untuk subject ${subj}.`,
          hint: `SELECT student_id, score, ROW_NUMBER() OVER (ORDER BY score DESC) FROM exam_scores WHERE subject_id = ${subj};`,
          starterSql: `SELECT student_id, score FROM exam_scores WHERE subject_id = ${subj};`,
          solutionSql: `SELECT student_id, score, ROW_NUMBER() OVER (ORDER BY score DESC) FROM exam_scores WHERE subject_id = ${subj};`,
        },
        {
          title: "Ranking per Mapel",
          prompt: "Tampilkan student_id, subject_id, score, RANK() per subject urut score DESC.",
          hint: "RANK() OVER (PARTITION BY subject_id ORDER BY score DESC)",
          starterSql: "SELECT student_id, subject_id, score FROM exam_scores;",
          solutionSql:
            "SELECT student_id, subject_id, score, RANK() OVER (PARTITION BY subject_id ORDER BY score DESC) FROM exam_scores;",
        },
      ];
    },
  },
  {
    slug: "latihan-gabungan",
    title: () => "Latihan Gabungan",
    concept: "Latihan Gabungan (Multi-Konsep)",
    explanation:
      "Soal gabungan memakai beberapa konsep sekaligus: JOIN + GROUP BY + HAVING, atau subquery + agregasi.\n\nLangkah menaklukkan:\n1. Tentukan tabel yang terlibat\n2. Tulis JOIN bila perlu\n3. Kelompokkan (GROUP BY) untuk agregasi\n4. Saring dengan HAVING/WHERE\n\nBaca kebutuhan soal pelan-pelan!",
    build: (n) => {
      const minScore = 75 + (n % 3) * 5; // 75/80/85
      return [
        {
          title: "Siswa Rata-rata di Atas Ambang",
          prompt: `Tampilkan name siswa yang rata-rata nilainya di atas ${minScore} (JOIN + GROUP BY + HAVING).`,
          hint: `SELECT s.name FROM students s JOIN exam_scores e ON s.id = e.student_id GROUP BY s.name HAVING AVG(e.score) > ${minScore};`,
          starterSql: "SELECT s.name FROM students s;",
          solutionSql: `SELECT s.name FROM students s JOIN exam_scores e ON s.id = e.student_id GROUP BY s.name HAVING AVG(e.score) > ${minScore};`,
        },
        {
          title: "Jumlah Ujian di Atas Rata-rata",
          prompt: "Tampilkan subject_id yang jumlah ujiannya di atas rata-rata jumlah ujian semua subject.",
          hint: "SELECT subject_id, COUNT(*) FROM exam_scores GROUP BY subject_id HAVING COUNT(*) > (SELECT AVG(jml) FROM (SELECT COUNT(*) AS jml FROM exam_scores GROUP BY subject_id) sub);",
          starterSql: "SELECT subject_id, COUNT(*) FROM exam_scores GROUP BY subject_id;",
          solutionSql:
            "SELECT subject_id, COUNT(*) FROM exam_scores GROUP BY subject_id HAVING COUNT(*) > (SELECT AVG(jml) FROM (SELECT COUNT(*) AS jml FROM exam_scores GROUP BY subject_id) sub);",
        },
      ];
    },
  },
];

const TOPIC_NAMES = [
  "SELECT",
  "WHERE",
  "Agregasi",
  "GROUP BY",
  "JOIN",
  "CASE",
  "Fungsi Tanggal",
  "Window",
  "Gabungan",
];

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
