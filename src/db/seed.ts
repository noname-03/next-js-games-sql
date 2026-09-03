import { sqlite } from "./client";
import { DATASET_FULL, DATASET_STUDENTS, levelSeeds } from "./content";
import { introspectDataset } from "../lib/introspect-dataset";
import type { DatasetSchema } from "../lib/introspect-dataset";

// Seed konten kurikulum ke SQLite (data/learn.db).
// Idempoten per level: kalau slug level sudah ada, level & exercise-nya dilewati
// (tidak menduplikasi). Untuk mengubah konten yang sudah terlanjur di-seed,
// hapus data/learn.db lalu jalankan ulang db:setup.
//
// levels.schema_json diisi hasil introspection dataset level tsb (struktur tabel,
// kolom, PK/FK, contoh data) — dipakai panel "Skema Database" di halaman latihan.

async function main() {
  console.log("Seeding database...");

  // Introspect tiap varian dataset sekali (hemat karena PGlite dijalankan di Node)
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

  // Panaskan cache: dataset yang dipakai level
  await getSchema(DATASET_STUDENTS);
  await getSchema(DATASET_FULL);

  for (const seed of levelSeeds) {
    const existing = sqlite
      .prepare("SELECT id FROM levels WHERE slug = ?")
      .get(seed.level.slug);

    if (existing) {
      console.log(`  Level "${seed.level.title}" sudah ada — dilewati.`);
      continue;
    }

    const schemaJson = await getSchema(seed.exercises[0]?.datasetSql ?? "");

    const levelId = Number(
      sqlite
        .prepare(
          "INSERT INTO levels (slug, title, description, order_index, schema_json) VALUES (?, ?, ?, ?, ?)"
        )
        .run(
          seed.level.slug,
          seed.level.title,
          seed.level.description,
          seed.level.orderIndex,
          schemaJson
        ).lastInsertRowid
    );

    let order = 1;
    const insertExercise = sqlite.prepare(
      "INSERT INTO exercises (level_id, title, prompt, hint, dataset_sql, starter_sql, solution_sql, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
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
      `  Level "${seed.level.title}" -> ${seed.exercises.length} exercise`
    );
  }

  console.log("Seed selesai.");
}

main();
