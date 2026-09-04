"use client";

import { useState } from "react";
import {
  ChevronRight,
  Database,
  Eye,
  Info,
  KeyRound,
  Table2,
} from "lucide-react";
import type { DatasetSchema } from "@/lib/introspect-dataset";

type SchemaExplorerProps = {
  schemaJson: string | null;
};

function Pill({ children, tone }: { children: React.ReactNode; tone: "pk" | "fk" | "null" }) {
  const cls =
    tone === "pk"
      ? "bg-sun/20 text-[#b45309]"
      : tone === "fk"
        ? "bg-sky/15 text-[#0369a1]"
        : "bg-lilac text-ink-soft";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-extrabold ${cls}`}>
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
    <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-lilac">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-lav/50"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-display text-base font-extrabold text-grape">
          <ChevronRight
            className={`text-grape transition-transform ${open ? "rotate-90" : ""}`}
          />
          <Database className="h-5 w-5" /> Lihat Data Tabel (Skema Database)
        </span>
        <span className="rounded-full bg-lav px-3 py-1 text-xs font-extrabold text-ink-soft">
          {tableCount > 0 ? `${tableCount} tabel` : "kosong"}
        </span>
      </button>

      {open && schema && (
        <div className="flex flex-col gap-5 border-t-2 border-lilac/60 px-5 py-5">
          <p className="flex items-start gap-2 rounded-2xl bg-sky/10 p-3 text-xs font-bold leading-relaxed text-ink-soft">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
            <span>
              Ini tabel yang bisa kamu pakai di level ini. Lihat kolom{" "}
              <span className="inline-flex items-center gap-0.5 text-[#b45309]">
                <KeyRound className="h-3 w-3" /> PK
              </span>{" "}
              (kunci utama) dan FK (kunci tamu) untuk tahu cara menyambung tabel saat
              JOIN!
            </span>
          </p>

          {schema.tables.map((table) => (
            <div key={table.name} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-lg bg-grape/10 px-2.5 py-1 font-mono text-sm font-extrabold text-grape">
                  <Table2 className="h-4 w-4" /> {table.name}
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border-2 border-lilac">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-lav/70 font-display text-xs font-extrabold uppercase tracking-wide text-ink-soft">
                      <th className="px-3 py-2">Kolom</th>
                      <th className="px-3 py-2">Tipe</th>
                      <th className="px-3 py-2">Info</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.columns.map((col, ci) => (
                      <tr
                        key={col.name}
                        className={`border-t border-lilac/60 font-mono text-[13px] ${
                          ci % 2 ? "bg-lav/30" : "bg-white"
                        }`}
                      >
                        <td className="px-3 py-2 font-bold text-ink">
                          {col.isPk && (
                            <KeyRound className="mr-1 inline h-3.5 w-3.5 text-[#b45309]" />
                          )}
                          {col.name}
                        </td>
                        <td className="px-3 py-2 text-grape">{col.type}</td>
                        <td className="px-3 py-2">
                          <span className="flex flex-wrap gap-1">
                            {col.isPk && <Pill tone="pk">PK</Pill>}
                            {col.isFk && <Pill tone="fk">FK → {col.fkRef}</Pill>}
                            {col.nullable && <Pill tone="null">boleh kosong</Pill>}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {table.sampleRows.length > 0 && (
                <div className="overflow-hidden rounded-2xl border-2 border-dashed border-lilac bg-lav/20">
                  <div className="flex items-center gap-1.5 bg-lilac/40 px-3 py-1.5 font-display text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
                    <Eye className="h-3.5 w-3.5" /> Contoh isi data (beberapa baris)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full font-mono text-xs">
                      <tbody>
                        {table.sampleRows.map((row, i) => (
                          <tr
                            key={i}
                            className={`border-t border-lilac/50 ${
                              i % 2 ? "bg-white/50" : "bg-transparent"
                            }`}
                          >
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-1.5 text-ink-soft">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
