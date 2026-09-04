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

// Partikel perayaan warna pastel cerah
const CONFETTI_COLORS = ["#8b5cf6", "#f472b6", "#fb923c", "#34d399", "#38bdf8", "#fbbf24"];
const CONFETTI_COUNT = 28;
const confettiPieces = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 10) * 0.05,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  rotate: (i * 47) % 360,
  size: 5 + (i % 3) * 2,
}));

export default function SqlRunner({ datasetSql, starterSql, solutionSql, exerciseId }: SqlRunnerProps) {
  const [code, setCode] = useState(starterSql);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [resultTable, setResultTable] = useState<RunResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [confettiBurst, setConfettiBurst] = useState(0);
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
        setConfettiBurst((n) => n + 1);
        void recordProgress(attemptsRef.current);
        if (exerciseId) {
          window.dispatchEvent(
            new CustomEvent("sqlquest:exercise-done", { detail: { exerciseId } })
          );
        }
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
    void runnerRef.current?.close();
    runnerRef.current = null;
    setShowHint(false);
  };

  const showResult = status.kind === "success" || status.kind === "mismatch";

  return (
    <div className="flex flex-col gap-3">
      {/* Editor SQL */}
      <div className="overflow-hidden rounded-2xl border-2 border-lilac bg-white shadow-sm">
        <div className="flex items-center justify-between border-b-2 border-lilac/60 bg-lav/50 px-3 py-2">
          <span className="font-display text-xs font-extrabold text-ink-soft">
            ✍️ Tulis query-mu di sini (PostgreSQL)
          </span>
          <span className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose/80" />
            <span className="h-3 w-3 rounded-full bg-sun/90" />
            <span className="h-3 w-3 rounded-full bg-mint" />
          </span>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          rows={6}
          aria-label="Editor query SQL"
          className="block w-full resize-y bg-[#faf8ff] p-4 font-mono text-sm leading-relaxed text-ink caret-grape outline-none placeholder:text-ink-faint"
          placeholder="-- tulis query PostgreSQL-mu di sini, contoh: SELECT * FROM students;"
        />
      </div>

      {/* Aksi */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={runQuery}
          disabled={status.kind === "running" || successRef.current}
          className={`rounded-full px-6 py-2.5 font-display text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 ${
            status.kind === "running" ? "bg-ink-soft" : "animate-pulse-glow bg-grape"
          }`}
        >
          {status.kind === "running" ? "⏳ Menjalankan..." : "🚀 Jalankan"}
        </button>
        <button
          onClick={reset}
          className="rounded-full border-2 border-lilac bg-white px-5 py-2.5 font-display text-sm font-extrabold text-ink-soft transition hover:border-rose/40 hover:text-rose"
        >
          ↺ Reset
        </button>
        <button
          onClick={() => setShowHint((v) => !v)}
          className="rounded-full border-2 border-lilac bg-white px-5 py-2.5 font-display text-sm font-extrabold text-ink-soft transition hover:border-sun/60 hover:text-peach"
        >
          {showHint ? "🙈 Sembunyikan Hint" : "💡 Lihat Hint"}
        </button>
      </div>

      {/* Hint */}
      {showHint && (
        <div className="animate-pop-in rounded-2xl border-2 border-dashed border-sun bg-sun/10 p-3">
          <span className="mb-1 block font-display text-xs font-extrabold text-peach">
            💡 Petunjuk — coba query seperti ini:
          </span>
          <code className="whitespace-pre-wrap font-mono text-xs text-ink">{solutionSql}</code>
        </div>
      )}

      {/* Status: error */}
      {status.kind === "error" && (
        <div
          role="alert"
          className="animate-pop-in rounded-2xl border-2 border-rose/40 bg-rose/10 p-3 font-sans text-sm font-bold text-[#be123c]"
        >
          😅 Ups, error! {status.message}
        </div>
      )}

      {/* Status: sukses */}
      {status.kind === "success" && (
        <div className="flex flex-col gap-2">
          <div
            role="status"
            className="animate-pop-in relative overflow-visible rounded-2xl border-2 border-mint bg-mint-soft p-4 font-display text-base font-extrabold text-[#047857]"
          >
            {confettiBurst > 0 && (
              <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-2 h-40">
                {confettiPieces.map((p, i) => (
                  <span
                    key={`${confettiBurst}-${i}`}
                    className="animate-confetti absolute top-0 block rounded-[2px]"
                    style={{
                      left: `${p.left}%`,
                      width: p.size,
                      height: p.size * 0.6,
                      backgroundColor: p.color,
                      transform: `rotate(${p.rotate}deg)`,
                      animationDelay: `${p.delay}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <span>🎉 BENAR! Query-mu cocok dengan solusi.</span>
            {status.result && (
              <span className="mt-1 block font-sans text-sm font-bold text-[#047857]/80">
                {status.result.rowCount} baris · {status.result.timeMs} ms · percobaan ke-
                {status.attempts}
              </span>
            )}
          </div>
          <div className="pointer-events-none relative h-0">
            <span className="animate-float-up absolute right-4 top-0 font-display text-xl font-extrabold text-peach drop-shadow-sm">
              +10 XP ⚡
            </span>
          </div>
        </div>
      )}

      {/* Status: mismatch */}
      {status.kind === "mismatch" && (
        <div
          role="status"
          className="animate-pop-in rounded-2xl border-2 border-peach/50 bg-peach/10 p-3 font-sans text-sm font-bold text-[#c2410c]"
        >
          🤔 Belum tepat — hasil query-mu belum sama dengan solusi. Coba lagi, kamu pasti bisa!
        </div>
      )}

      {/* Tabel hasil */}
      {showResult && resultTable && (
        <div className="animate-pop-in overflow-hidden rounded-2xl border-2 border-lilac bg-white">
          <div className="border-b-2 border-lilac/60 bg-lav/50 px-3 py-2 font-display text-xs font-extrabold text-ink-soft">
            📊 Hasil query ({resultTable.rowCount} baris)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="bg-grape/5 text-left">
                  {resultTable.columns.map((c) => (
                    <th key={c} className="px-3 py-2 font-extrabold text-grape">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resultTable.rows.map((row, i) => (
                  <tr key={i} className={i % 2 ? "bg-lav/30" : "bg-white"}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-1.5 text-ink">
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
