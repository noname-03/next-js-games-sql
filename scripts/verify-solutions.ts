import { PGlite } from "@electric-sql/pglite";
import { sqlite } from "../src/db/client";

// Verifikasi: semua solusi & starter exercise bisa dieksekusi PGlite tanpa error.
// Dioptimalkan: satu instance PGlite per dataset unik (solusi berupa SELECT murni,
// tidak mengubah state) sehingga ratusan exercise terverifikasi cepat.

async function main() {
  const rows = sqlite
    .prepare(
      "SELECT e.id, e.title, e.dataset_sql, e.solution_sql, e.starter_sql FROM exercises e ORDER BY e.id"
    )
    .all() as {
    id: number;
    title: string;
    dataset_sql: string;
    solution_sql: string;
    starter_sql: string;
  }[];

  // Kelompokkan per dataset unik
  const groups = new Map<string, typeof rows>();
  for (const ex of rows) {
    if (!groups.has(ex.dataset_sql)) groups.set(ex.dataset_sql, []);
    groups.get(ex.dataset_sql)!.push(ex);
  }

  let fail = 0;
  let checked = 0;
  let starterWarn = 0;

  for (const [datasetSql, groupRows] of groups) {
    const pg = new PGlite();
    try {
      await pg.exec(datasetSql);
    } catch (err) {
      for (const ex of groupRows) {
        console.log(`✗ [${ex.id}] ${ex.title}: dataset gagal — ${(err as Error).message}`);
        fail++;
      }
      await pg.close();
      continue;
    }

    for (const ex of groupRows) {
      try {
        await pg.exec(ex.solution_sql);
        checked++;
      } catch (err) {
        console.log(`✗ [${ex.id}] ${ex.title}: solusi error — ${(err as Error).message}`);
        fail++;
      }
      try {
        await pg.exec(ex.starter_sql);
      } catch (err) {
        console.log(`⚠ [${ex.id}] ${ex.title}: starter error — ${(err as Error).message}`);
        starterWarn++;
      }
    }
    await pg.close();
  }

  console.log(`\n${checked} solusi dicek, ${fail} gagal, ${starterWarn} starter error.`);
  console.log(fail === 0 ? "SEMUA SOLUSI VALID" : `ADA ${fail} SOLUSI BERMASALAH`);
}

main();
