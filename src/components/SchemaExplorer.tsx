"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Eye,
  Info,
  KeyRound,
  PanelRightClose,
  Table2,
} from "lucide-react";
import type { DatasetSchema } from "@/lib/introspect-dataset";

type SchemaExplorerProps = {
  schemaJson: string | null;
  // true = panel kanan terbuka; false = rail tertutup (tombol di tepi kanan)
  open: boolean;
  onToggle: () => void;
};

const PER_PAGE = 10;

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

/** Pagination tabel data */
function DataTable({ columns, rows }: { columns: { name: string; isPk: boolean }[]; rows: string[][] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const slice = rows.slice(start, start + PER_PAGE);

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-lilac">
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="bg-lav/80 text-left">
              {columns.map((c) => (
                <th key={c.name} className="px-2.5 py-1.5 font-extrabold text-grape">
                  {c.isPk && <KeyRound className="mr-0.5 inline h-3 w-3 text-[#b45309]" />}
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-2.5 py-3 text-center text-ink-faint">
                  (tabel kosong)
                </td>
              </tr>
            ) : (
              slice.map((row, i) => (
                <tr key={start + i} className={i % 2 ? "bg-lav/30" : "bg-white"}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-2.5 py-1 text-ink">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-2 flex items-center justify-between text-xs font-extrabold text-ink-soft">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="flex items-center gap-0.5 rounded-full border border-lilac bg-white px-2 py-1 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <span>
            {safePage}/{totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="flex items-center gap-0.5 rounded-full border border-lilac bg-white px-2 py-1 disabled:opacity-40"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function SchemaExplorer({ schemaJson, open, onToggle }: SchemaExplorerProps) {
  const [expanded, setExpanded] = useState(true);

  let schema: DatasetSchema | null = null;
  if (schemaJson) {
    try {
      schema = JSON.parse(schemaJson) as DatasetSchema;
    } catch {
      schema = null;
    }
  }

  const tableCount = schema?.tables.length ?? 0;
  if (!open) return null; // panel disembunyikan — tombol buka ada di tepi kanan halaman

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-lilac">
      {/* Header panel */}
      <div className="flex items-center justify-between gap-2 border-b-2 border-lilac/60 bg-lav/40 px-4 py-3">
        <div className="flex items-center gap-2 font-display text-sm font-extrabold text-grape">
          <Database className="h-4 w-4" /> Data & Skema
        </div>
        <button
          onClick={onToggle}
          aria-label="Sembunyikan panel data"
          title="Sembunyikan panel"
          className="rounded-full p-1.5 text-ink-soft transition hover:bg-lilac hover:text-grape"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Info singkat */}
        <p className="mb-3 flex items-start gap-1.5 rounded-xl bg-sky/10 p-2.5 text-[11px] font-bold leading-relaxed text-ink-soft">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky" />
          <span>
            Kolom <span className="text-[#b45309]">PK</span> = kunci utama, FK =
            kunci tamu untuk JOIN antar tabel.
          </span>
        </p>

        {schema?.tables.map((table) => (
          <div key={table.name} className="mb-4 flex flex-col gap-2">
            {/* Nama tabel + toggle per tabel */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl bg-grape/10 px-3 py-2 text-left transition hover:bg-grape/15"
            >
              <span className="flex items-center gap-1.5 font-mono text-sm font-extrabold text-grape">
                <Table2 className="h-4 w-4" /> {table.name}
              </span>
              <span className="rounded-full bg-white px-2 py-0.5 font-sans text-[10px] font-extrabold text-ink-faint">
                {table.sampleRows.length} baris
              </span>
            </button>

            {expanded && (
              <div className="flex flex-col gap-2">
                {/* Struktur kolom */}
                <div className="overflow-x-auto rounded-lg border border-lilac">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-lav/80 font-display text-[10px] font-extrabold uppercase tracking-wide text-ink-soft">
                        <th className="px-2.5 py-1.5">Kolom</th>
                        <th className="px-2.5 py-1.5">Tipe</th>
                        <th className="px-2.5 py-1.5">Info</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.columns.map((col, ci) => (
                        <tr
                          key={col.name}
                          className={`border-t border-lilac/60 font-mono text-[11px] ${
                            ci % 2 ? "bg-lav/30" : "bg-white"
                          }`}
                        >
                          <td className="px-2.5 py-1.5 font-bold text-ink">
                            {col.isPk && (
                              <KeyRound className="mr-0.5 inline h-3 w-3 text-[#b45309]" />
                            )}
                            {col.name}
                          </td>
                          <td className="px-2.5 py-1.5 text-grape">{col.type}</td>
                          <td className="px-2.5 py-1.5">
                            <span className="flex flex-wrap gap-1">
                              {col.isPk && <Pill tone="pk">PK</Pill>}
                              {col.isFk && <Pill tone="fk">FK → {col.fkRef}</Pill>}
                              {col.nullable && <Pill tone="null">nullable</Pill>}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Data contoh: header kolom + semua baris + pagination */}
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">
                  <Eye className="h-3.5 w-3.5" /> Contoh isi data
                </div>
                <DataTable
                  columns={table.columns.map((c) => ({ name: c.name, isPk: c.isPk }))}
                  rows={table.sampleRows}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
