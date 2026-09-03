"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createRunner, compareResults } from "@/lib/pglite-runner";
import type { RunQueryFn, QueryOutcome, RunResult } from "@/lib/pglite-runner";

type SqlRunnerProps = {
  datasetSql: string;
  starterSql: string;
  solutionSql: string;
  exerciseId?: number;
};

type Status =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "success"; result: RunResult | null; attempts: number }
  | { kind: "mismatch"; userResult: RunResult; solutionResult: RunResult; attempts: number }
  | { kind: "error"; message: string };

export default function SqlRunner({ datasetSql, starterSql, solutionSql, exerciseId }: SqlRunnerProps) {
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

  const recordProgress = useCallback(
    async (attempts: number) => {
      if (!exerciseId) return;
      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exerciseId, attempts, xp: 10 }),
        });
      } catch {
        // Simpan progress gagal — jangan blokir pengalaman belajar
      }
    },
    [exerciseId]
  );

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
        void recordProgress(attemptsRef.current);
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

  const runBtnBase =
    "rounded-lg border px-4 py-2 font-mono text-sm transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex flex-col gap-3">
      {/* Editor SQL */}
      <div className="overflow-hidden rounded-xl border border-edge bg-[#05080f]">
        <div className="flex items-center justify-between border-b border-edge bg-panel px-3 py-1.5">
          <span className="font-mono text-[11px] text-faint">
            query.sql — PostgreSQL
          </span>
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-xp/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-succ/60" />
          </span>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          rows={6}
          aria-label="Editor query SQL"
          className="block w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed text-phosphor caret-quest outline-none placeholder:text-faint"
          placeholder="-- tulis query PostgreSQL-mu di sini"
        />
      </div>

      {/* Aksi */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={runQuery}
          disabled={status.kind === "running" || successRef.current}
          className={`${runBtnBase} border-quest/60 bg-quest/15 text-quest hover:bg-quest/25 ${
            status.kind === "running" ? "" : "animate-pulse-glow"
          }`}
        >
          {status.kind === "running" ? "▮ menjalankan..." : "▶ jalankan"}
        </button>
        <button
          onClick={reset}
          className={`${runBtnBase} border-edge bg-panel-2 text-fog hover:border-faint hover:text-phosphor`}
        >
          ↺ reset
        </button>
        <button
          onClick={() => setShowHint((v) => !v)}
          className={`${runBtnBase} border-edge bg-panel-2 text-fog hover:border-faint hover:text-phosphor`}
        >
          {showHint ? "▲ sembunyikan hint" : "▼ hint"}
        </button>
      </div>

      {/* Hint */}
      {showHint && (
        <div className="rounded-xl border border-xp/30 bg-xp/5 p-3 font-mono text-xs text-xp">
          <span className="mr-2">// hint:</span>
          <code>{solutionSql}</code>
        </div>
      )}

      {/* Status: error */}
      {status.kind === "error" && (
        <div
          role="alert"
          className="rounded-xl border border-danger/40 bg-danger/10 p-3 font-mono text-sm text-danger"
        >
          <span className="mr-2">✗ error:</span>
          {status.message}
        </div>
      )}

      {/* Status: sukses */}
      {status.kind === "success" && (
        <div className="flex flex-col gap-3">
          <div
            role="status"
            className="animate-pop-in rounded-xl border border-succ/50 bg-succ/10 p-3 font-mono text-sm text-succ"
          >
            <span className="mr-2">✓ query benar!</span>
            {status.result && (
              <span className="text-fog">
                ({status.result.rowCount} baris · {status.result.timeMs} ms · percobaan{" "}
                {status.attempts})
              </span>
            )}
          </div>
          {/* XP float */}
          <div className="pointer-events-none relative h-0">
            <span className="animate-float-up absolute right-4 top-0 font-mono text-lg font-bold text-xp">
              +10 XP
            </span>
          </div>
        </div>
      )}

      {/* Status: mismatch */}
      {status.kind === "mismatch" && (
        <div
          role="status"
          className="rounded-xl border border-xp/40 bg-xp/10 p-3 font-mono text-sm text-xp"
        >
          <span className="mr-2">≈ belum tepat:</span>
          hasil query-mu belum sama dengan solusi. coba lagi!
        </div>
      )}

      {/* Tabel hasil */}
      {showResult && resultTable && (
        <div className="overflow-hidden rounded-xl border border-edge">
          <div className="border-b border-edge bg-panel px-3 py-1.5 font-mono text-[11px] text-faint">
            hasil ({resultTable.rowCount} baris)
          </div>
          <div className="overflow-x-auto bg-[#05080f]">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="border-b border-edge bg-panel/60 text-left">
                  {resultTable.columns.map((c) => (
                    <th key={c} className="px-3 py-2 font-semibold text-quest">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resultTable.rows.map((row, i) => (
                  <tr
                    key={i}
                    className={i % 2 ? "bg-panel/20" : "bg-transparent"}
                  >
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-1.5 text-phosphor/90">
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
  );
}
