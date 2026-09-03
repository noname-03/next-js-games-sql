import { PGlite } from "@electric-sql/pglite";

export type RunResult = {
  columns: string[];
  rows: string[][];
  rowCount: number;
  timeMs: number;
};

export type QueryOutcome =
  | { ok: true; kind: "success"; message: string; result: RunResult | null }
  | { ok: true; kind: "error"; message: string }
  | { ok: false; message: string };

export type RunQueryFn = (sqlText: string) => Promise<QueryOutcome>;

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") {
    // 3.5 vs 3.50 vs 3.500 — bandingkan secara numerik
    return Number(value.toFixed(6)).toString();
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Siapkan sandbox PGlite: load dataset (CREATE + INSERT), lalu kembalikan fungsi run. */
export async function createRunner(datasetSql: string): Promise<{
  run: RunQueryFn;
  close: () => Promise<void>;
}> {
  const pg = new PGlite();

  try {
    await pg.exec(datasetSql);
  } catch (err) {
    await pg.close();
    throw new Error(
      `Gagal memuat dataset: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const run: RunQueryFn = async (sqlText: string) => {
    const trimmed = sqlText.trim();
    if (!trimmed) {
      return { ok: true, kind: "error", message: "Query kosong. Tulis dulu query-mu." };
    }

    const started = performance.now();
    try {
      // pg.exec mendukung multi-statement dan mengembalikan array hasil per statement.
      const result = await pg.exec(trimmed);
      const timeMs = Math.round(performance.now() - started);

      const last = result[result.length - 1];
      const rows = last?.rows ?? [];

      if (!last || !Array.isArray(rows)) {
        // Statement non-SELECT (mis. CREATE/INSERT) sukses tapi tanpa hasil
        return { ok: true, kind: "success", message: "Query berhasil dijalankan.", result: null };
      }

      const columns = last.fields.map((f) => f.name);
      const data = rows.map((r) => columns.map((c) => normalizeCell(r[c])));
      return {
        ok: true,
        kind: "success",
        message: `Query berhasil. ${data.length} baris dikembalikan.`,
        result: { columns, rows: data, rowCount: data.length, timeMs },
      };
    } catch (err) {
      return {
        ok: true,
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      };
    }
  };

  return { run, close: () => pg.close() };
}

/**
 * Bandingkan hasil query siswa dengan hasil solusi.
 * Kolom boleh beda urutan; baris diperlakukan sebagai multiset.
 */
export function compareResults(user: RunResult | null, solution: RunResult): boolean {
  if (!user) return false;
  if (user.rows.length !== solution.rows.length) return false;
  if (user.columns.length !== solution.columns.length) return false;

  const norm = (r: string[]): string => [...r].sort().join("|");
  const userSet = new Set(user.rows.map(norm));
  const solSet = new Set(solution.rows.map(norm));
  if (userSet.size !== solSet.size) return false;

  for (const row of userSet) {
    if (!solSet.has(row)) return false;
  }
  return true;
}
