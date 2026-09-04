import { PGlite } from "@electric-sql/pglite";

export type SchemaColumn = {
  name: string;
  type: string;
  nullable: boolean;
  isPk: boolean;
  isFk: boolean;
  fkRef?: string; // "tabel(kolom)"
};

export type SchemaTable = {
  name: string;
  columns: SchemaColumn[];
  sampleRows: string[][];
};

export type DatasetSchema = {
  tables: SchemaTable[];
};

function quoteIdent(name: string): string {
  // Nama tabel/kolom berasal dari dataset_sql milik sendiri (bukan input user),
  // tapi tetap amankan dengan double-quote.
  return '"' + name.replace(/"/g, '""') + '"';
}

function normCell(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Jalankan datasetSql di PGlite (Node) lalu baca struktur & contoh data
 * dari information_schema Postgres. Dipakai saat seed untuk mengisi
 * kolom levels.schema_json.
 */
export async function introspectDataset(datasetSql: string): Promise<DatasetSchema> {
  const pg = new PGlite();
  try {
    await pg.exec(datasetSql);

    // Tabel user (schema public), urutkan sesuai abjad
    const tablesRes = await pg.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );
    const tableNames = tablesRes.rows.map((r) => r.table_name);

    // Primary key: tabel -> set kolom
    const pkRes = await pg.query<{ table_name: string; column_name: string }>(
      `SELECT tc.table_name, kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
       WHERE tc.constraint_type = 'PRIMARY KEY'
         AND tc.table_schema = 'public'`
    );
    const pkMap = new Map<string, Set<string>>();
    for (const r of pkRes.rows) {
      if (!pkMap.has(r.table_name)) pkMap.set(r.table_name, new Set());
      pkMap.get(r.table_name)!.add(r.column_name);
    }

    // Foreign key: (tabel, kolom) -> referensi tabel(kolom)
    const fkRes = await pg.query<{
      table_name: string;
      column_name: string;
      ref_table: string;
      ref_column: string;
    }>(
      `SELECT tc.table_name,
              kcu.column_name,
              ccu.table_name AS ref_table,
              ccu.column_name AS ref_column
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
       JOIN information_schema.constraint_column_usage ccu
         ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
       WHERE tc.constraint_type = 'FOREIGN KEY'
         AND tc.table_schema = 'public'`
    );
    const fkMap = new Map<string, Map<string, string>>(); // tabel -> kolom -> ref
    for (const r of fkRes.rows) {
      if (!fkMap.has(r.table_name)) fkMap.set(r.table_name, new Map());
      fkMap.get(r.table_name)!.set(r.column_name, `${r.ref_table}(${r.ref_column})`);
    }

    const tables: SchemaTable[] = [];
    for (const name of tableNames) {
      const colsRes = await pg.query<{
        column_name: string;
        data_type: string;
        is_nullable: string;
      }>(
        `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        [name]
      );

      const pkCols = pkMap.get(name) ?? new Set<string>();
      const fkCols = fkMap.get(name) ?? new Map<string, string>();

      const columns: SchemaColumn[] = colsRes.rows.map((c) => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable === "YES",
        isPk: pkCols.has(c.column_name),
        isFk: fkCols.has(c.column_name),
        fkRef: fkCols.get(c.column_name),
      }));

      // Semua baris data (dipakai panel "contoh isi data" dengan pagination di UI)
      let sampleRows: string[][] = [];
      try {
        const data = await pg.query(`SELECT * FROM ${quoteIdent(name)}`);
        sampleRows = data.rows.map((row) =>
          columns.map((col) => normCell((row as Record<string, unknown>)[col.name]))
        );
      } catch {
        sampleRows = [];
      }

      tables.push({ name, columns, sampleRows });
    }

    return { tables };
  } finally {
    await pg.close();
  }
}
