"use client";

import { useState } from "react";
import type { DatasetSchema } from "@/lib/introspect-dataset";

type SchemaExplorerProps = {
  schemaJson: string | null;
};

function Pill({ children, tone }: { children: React.ReactNode; tone: "pk" | "fk" | "null" }) {
  const cls =
    tone === "pk"
      ? "bg-amber-500/15 text-amber-300 ring-amber-400/30"
      : tone === "fk"
        ? "bg-sky-500/15 text-sky-300 ring-sky-400/30"
        : "bg-gray-500/15 text-gray-400 ring-gray-400/20";
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 font-mono text-[10px] ring-1 ${cls}`}>
      {children}
    </span>
  );
}

export default function SchemaExplorer({ schemaJson }: SchemaExplorerProps) {
  const [open, setOpen] = useState(false);

  let schema: DatasetSchema | null = null;
  if (schemaJson) {
    try {
      schema = JSON.parse(schemaJson) as DatasetSchema;
    } catch {
      schema = null;
    }
  }

  const tableCount = schema?.tables.length ?? 0;

  return (
    <div className="overflow-hidden rounded-xl border border-cyan-500/25 bg-[#0b1220]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-cyan-500/5"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-mono text-sm text-cyan-300">
          <span className={open ? "rotate-90 transition-transform" : "transition-transform"}>▸</span>
          <span className="text-cyan-500">$</span> schema --database {tableCount > 0 ? `(${tableCount} tabel)` : ""}
        </span>
        <span className="font-mono text-xs text-gray-500">
          {tableCount > 0 ? `${tableCount} relation${tableCount > 1 ? "s" : ""}` : "kosong"}
        </span>
      </button>

      {open && schema && (
        <div className="flex flex-col gap-4 border-t border-cyan-500/15 px-4 py-4">
          <p className="font-mono text-xs text-gray-400">
            // Tabel yang tersedia di level ini — perhatikan kolom <span className="text-amber-300">PK</span> dan{" "}
            <span className="text-sky-300">FK</span> untuk menyusun JOIN.
          </p>

          {schema.tables.map((table) => (
            <div key={table.name} className="flex flex-col gap-2">
              <div className="font-mono text-sm font-semibold text-emerald-300">
                <span className="text-gray-500">table</span> {table.name}
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-700/60">
                <table className="w-full font-mono text-xs">
                  <thead>
                    <tr className="border-b border-gray-700/60 bg-gray-800/40 text-left text-gray-400">
                      <th className="px-3 py-1.5 font-medium">kolom</th>
                      <th className="px-3 py-1.5 font-medium">tipe</th>
                      <th className="px-3 py-1.5 font-medium">atribut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.columns.map((col) => (
                      <tr key={col.name} className="border-b border-gray-800/60 last:border-0">
                        <td className="px-3 py-1.5 text-gray-200">
                          {col.isPk && <span className="mr-1 text-amber-300">🔑</span>}
                          {col.name}
                        </td>
                        <td className="px-3 py-1.5 text-violet-300">{col.type}</td>
                        <td className="px-3 py-1.5">
                          <span className="flex flex-wrap gap-1">
                            {col.isPk && <Pill tone="pk">PK</Pill>}
                            {col.isFk && <Pill tone="fk">FK → {col.fkRef}</Pill>}
                            {col.nullable && <Pill tone="null">NULL?</Pill>}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {table.sampleRows.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-gray-800 bg-black/30">
                  <div className="border-b border-gray-800 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-gray-500">
                    contoh data (max {table.sampleRows.length} baris)
                  </div>
                  <table className="w-full font-mono text-xs">
                    <tbody>
                      {table.sampleRows.map((row, i) => (
                        <tr key={i} className="border-b border-gray-800/50 last:border-0">
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-1 text-gray-300">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
