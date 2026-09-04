import { sqlite } from "./client";
import { DATASET_FULL, DATASET_STUDENTS, levelSeeds } from "./content";
import { DATASET_SCHOOL, extraLevelsA, extraLevelsB, extraLevelsC, extraLevelsD, extraLevelsE, extraLevelsF, extraLevelsG, extraLevelsH } from "./content-extra";
import { generatePracticeLevels } from "./content-gen";
import { introspectDataset } from "../lib/introspect-dataset";
import type { DatasetSchema } from "../lib/introspect-dataset";

// Seed konten kurikulum ke SQLite (data/learn.db).
// Idempoten per level: kalau slug level sudah ada, level & exercise-nya dilewati
// (tidak menduplikasi). Untuk mengubah konten yang sudah terlanjur di-seed,
// hapus data/learn.db lalu jalankan ulang db:setup.
//
// levels.schema_json diisi hasil introspection dataset level tsb (struktur tabel,
// kolom, PK/FK, contoh data) — dipakai panel "Skema Database" di halaman latihan.
// levels.concept + explanation = materi/istilah baru tiap level.

async function main() {
  console.log("Seeding database...");

  const schemaCache = new Map<string, DatasetSchema>();
  const getSchema = async (datasetSql: string): Promise<string | null> => {
    if (!schemaCache.has(datasetSql)) {
      try {
        schemaCache.set(datasetSql, await introspectDataset(datasetSql));
      } catch (err) {
        console.warn(
          `  Introspection gagal: ${err instanceof Error ? err.message : String(err)}`
        );
        schemaCache.set(datasetSql, { tables: [] });
      }
    }
    const schema = schemaCache.get(datasetSql)!;
    return schema.tables.length > 0 ? JSON.stringify(schema) : null;
  };

  await getSchema(DATASET_STUDENTS);
  await getSchema(DATASET_FULL);
  await getSchema(DATASET_SCHOOL);

  // Gabungkan semua sumber level: bab manual + level latihan generator (45-200)
  const practiceLevels = generatePracticeLevels(45, 156);
  const allSeeds = [
    ...levelSeeds,
    ...extraLevelsA,
    ...extraLevelsB,
    ...extraLevelsC,
    ...extraLevelsD,
    ...extraLevelsE,
    ...extraLevelsF,
    ...extraLevelsG,
    ...extraLevelsH,
    ...practiceLevels,
  ];

  const insertLevel = sqlite.prepare(
    "INSERT INTO levels (slug, title, description, order_index, schema_json, concept, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const insertExercise = sqlite.prepare(
    "INSERT INTO exercises (level_id, title, prompt, hint, dataset_sql, starter_sql, solution_sql, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );

  for (const seed of allSeeds) {
    const existing = sqlite
      .prepare("SELECT id FROM levels WHERE slug = ?")
      .get(seed.level.slug);

    if (existing) {
      console.log(`  Level "${seed.level.title}" sudah ada — dilewati.`);
      continue;
    }

    const schemaJson = await getSchema(seed.exercises[0]?.datasetSql ?? "");
    const lv = seed.level;

    const levelId = Number(
      insertLevel.run(
        lv.slug,
        lv.title,
        lv.description,
        lv.orderIndex,
        schemaJson,
        lv.concept ?? null,
        lv.explanation ?? null
      ).lastInsertRowid
    );

    let order = 1;
    for (const ex of seed.exercises) {
      insertExercise.run(
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
      `  Level "${lv.title}" -> ${seed.exercises.length} exercise` +
        (lv.concept ? ` [materi: ${lv.concept}]` : "")
    );
  }

  // Akun admin bawaan (bila belum ada)
  const adminExists = sqlite
    .prepare("SELECT id FROM users WHERE username = ?")
    .get("admin");
  if (!adminExists) {
    const { hashPassword } = await import("../lib/auth");
    const passwordHash = await hashPassword(
      process.env.ADMIN_PASSWORD || "admin123"
    );
    sqlite
      .prepare(
        "INSERT INTO users (username, password_hash, display_name, role, created_at) VALUES (?, ?, ?, ?, ?)"
      )
      .run(
        "admin",
        passwordHash,
        "Administrator",
        "admin",
        Math.floor(Date.now() / 1000) // drizzle timestamp mode = detik
      );
    console.log(
      "  Akun admin dibuat (username: admin, password: " +
        (process.env.ADMIN_PASSWORD ? "dari env ADMIN_PASSWORD" : "admin123 — segera ganti!") +
        ")"
    );
  } else {
    console.log("  Akun admin sudah ada.");
  }

  console.log("Seed selesai.");
}

main();
