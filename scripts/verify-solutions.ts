import { PGlite } from "@electric-sql/pglite";
import { sqlite } from "../src/db/client";

// Verifikasi: semua solusi exercise di DB bisa dieksekusi PGlite tanpa error,
// dan starter query juga valid (supaya tombol reset tidak menghasilkan error).
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

  let fail = 0;
  for (const ex of rows) {
    const pg = new PGlite();
    try {
      await pg.exec(ex.dataset_sql);
    } catch (err) {
      console.log(`✗ [${ex.id}] ${ex.title}: dataset gagal — ${(err as Error).message}`);
      fail++;
      await pg.close();
      continue;
    }
    // solusi
    try {
      const res = await pg.exec(ex.solution_sql);
      const last = res[res.length - 1];
      const rowCount = Array.isArray(last?.rows) ? last.rows.length : 0;
      console.log(`✓ [${ex.id}] ${ex.title} — solusi OK (${rowCount} baris)`);
    } catch (err) {
      console.log(`✗ [${ex.id}] ${ex.title}: solusi error — ${(err as Error).message}`);
      fail++;
    }
    // starter (jangan error; mungkin hasil beda, itu wajar)
    try {
      await pg.exec(ex.starter_sql);
    } catch (err) {
      console.log(`⚠ [${ex.id}] ${ex.title}: starter error — ${(err as Error).message}`);
    }
    await pg.close();
  }
  console.log(fail === 0 ? "SEMUA SOLUSI VALID" : `ADA ${fail} SOLUSI BERMASALAH`);
}

main();
