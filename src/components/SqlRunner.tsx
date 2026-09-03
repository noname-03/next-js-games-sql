"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createRunner, compareResults } from "@/lib/pglite-runner";
import type { RunQueryFn, QueryOutcome, RunResult } from "@/lib/pglite-runner";

type SqlRunnerProps = {
  datasetSql: string;
  starterSql: string;
  solutionSql: string;
  onSuccess?: (attempts: number) => void;
};

type Status =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "success"; result: RunResult | null; attempts: number }
  | { kind: "mismatch"; userResult: RunResult; solutionResult: RunResult; attempts: number }
  | { kind: "error"; message: string };

export default function SqlRunner({ datasetSql, starterSql, solutionSql, onSuccess }: SqlRunnerProps) {
  const [code, setCode] = useState(starterSql);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [resultTable, setResultTable] = useState<RunResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const attemptsRef = useRef(0);
  const successRef = useRef(false);
  const runnerRef = useRef<Awaited<ReturnType<typeof createRunner>> | null>(null);

  const ensureRunner = useCallback(async () => {
    if (!runnerRef.current) {
      runnerRef.current = await createRunner(datasetSql);
    }
    return runnerRef.current;
  }, [datasetSql]);

  useEffect(() => {
    return () => {
      void runnerRef.current?.close();
    };
  }, []);

  const runQuery = async () => {
    if (successRef.current) return;
    setStatus({ kind: "running" });
    try {
      const runner = await ensureRunner();
      attemptsRef.current += 1;

      const userOutcome: QueryOutcome = await runner.run(code);
      if (!userOutcome.ok) {
        setStatus({ kind: "error", message: userOutcome.message });
        return;
      }
      if (userOutcome.kind === "error") {
        setStatus({ kind: "error", message: userOutcome.message });
        return;
      }

      // Eksekusi solusi di runner yang sama untuk pembanding
      const solutionOutcome: QueryOutcome = await runner.run(solutionSql);
      if (!solutionOutcome.ok || solutionOutcome.kind !== "success") {
        setStatus({ kind: "error", message: "Solusi gagal dijalankan di sandbox." });
        return;
      }
      if (!solutionOutcome.result) {
        setStatus({ kind: "error", message: "Solusi tidak mengembalikan hasil." });
        return;
      }

      const userResult = userOutcome.result;
      const ok = compareResults(userResult, solutionOutcome.result);
      if (ok) {
        successRef.current = true;
        setResultTable(userOutcome.result);
        setStatus({ kind: "success", result: userOutcome.result, attempts: attemptsRef.current });
        onSuccess?.(attemptsRef.current);
      } else {
        setResultTable(userOutcome.result);
        setStatus({ kind: "mismatch", userResult: userOutcome.result ?? { columns: [], rows: [], rowCount: 0, timeMs: 0 }, solutionResult: solutionOutcome.result, attempts: attemptsRef.current });
      }
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : String(err) });
    }
  };

  const reset = () => {
    setCode(starterSql);
    setStatus({ kind: "idle" });
    setResultTable(null);
    attemptsRef.current = 0;
    // buat runner baru supaya dataset bersih dari percobaan
    void runnerRef.current?.close();
    runnerRef.current = null;
    setShowHint(false);
  };

  const showResult = status.kind === "success" || status.kind === "mismatch";

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        rows={6}
        className="w-full resize-y rounded-xl border border-gray-300 bg-gray-950 p-4 font-mono text-sm text-emerald-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={runQuery}
          disabled={status.kind === "running" || successRef.current}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status.kind === "running" ? "Menjalankan..." : "▶ Jalankan"}
        </button>
        <button
          onClick={reset}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          ↺ Reset
        </button>
        <button
          onClick={() => setShowHint((v) => !v)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          {showHint ? "Sembunyikan Hint" : "💡 Hint"}
        </button>
      </div>

      {showHint && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {solutionSql}
        </div>
      )}

      {status.kind === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {status.message}
        </div>
      )}

      {status.kind === "success" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          ✅ Benar! Query-mu cocok dengan solusi.
          {status.result && (
            <span className="ml-1 text-emerald-600">({status.result.rowCount} baris, {status.result.timeMs} ms)</span>
          )}
        </div>
      )}

      {status.kind === "mismatch" && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
          ❌ Belum tepat — hasil query-mu belum sama dengan solusi. Coba lagi!
        </div>
      )}

      {showResult && resultTable && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                {resultTable.columns.map((c) => (
                  <th key={c} className="px-3 py-2 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resultTable.rows.map((row, i) => (
                <tr key={i} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-1.5">
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
  );
}
