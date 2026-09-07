"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Loader2,
  PenLine,
  RotateCcw,
  Rocket,
  Table2,
  Timer,
  TriangleAlert,
  Star,
} from "lucide-react";
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
const CONFETTI_COLORS = ["#8b5cf6", "#fbbf24", "#fb923c", "#34d399", "#38bdf8", "#fbbf24"];
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
  // Timer: mulai saat Jalankan pertama, berhenti saat benar
  const [elapsedMs, setElapsedMs] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [penaltyPerWrong, setPenaltyPerWrong] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const wrongCountRef = useRef(0);
  const attemptsRef = useRef(0);
  const successRef = useRef(false);
  const runnerRef = useRef<Awaited<ReturnType<typeof createRunner>> | null>(null);

  // Ambil setting penalti (detik per percobaan salah)
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setPenaltyPerWrong(Number(d?.penaltyPerWrong) || 0))
      .catch(() => setPenaltyPerWrong(0));
  }, []);

  // Tick timer display
  useEffect(() => {
    if (!timerActive) return;
    const iv = setInterval(() => {
      if (startedAtRef.current !== null) {
        setElapsedMs(Date.now() - startedAtRef.current);
      }
    }, 500);
    return () => clearInterval(iv);
  }, [timerActive]);

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
    async (attempts: number, durationMs?: number) => {
      if (!exerciseId) return;
      try {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exerciseId, attempts, xp: 10, durationMs }),
        });
        if (res.status === 401) {
          // Belum login — arahkan untuk masuk supaya progres tersimpan
          window.location.href = "/login";
        }
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
      // Timer mulai saat percobaan pertama (klik Jalankan)
      if (startedAtRef.current === null) {
        startedAtRef.current = Date.now();
        setElapsedMs(0);
        setTimerActive(true);
      }
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
      const orderSensitive = /order\s+by/i.test(solutionSql);
      const ok = compareResults(userResult, solutionOutcome.result, orderSensitive);
      if (ok) {
        successRef.current = true;
        // Hentikan timer & hitung durasi (ms) + penalti
        setTimerActive(false);
        const durationMs =
          startedAtRef.current !== null
            ? Date.now() - startedAtRef.current + wrongCountRef.current * penaltyPerWrong * 1000
            : undefined;
        setElapsedMs(durationMs ?? 0);
        setResultTable(userOutcome.result);
        setStatus({ kind: "success", result: userOutcome.result, attempts: attemptsRef.current });
        setConfettiBurst((n) => n + 1);
        void recordProgress(attemptsRef.current, durationMs);
        if (exerciseId) {
          window.dispatchEvent(
            new CustomEvent("sqlquest:exercise-done", { detail: { exerciseId } })
          );
        }
      } else {
        wrongCountRef.current += 1;
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
    wrongCountRef.current = 0;
    startedAtRef.current = null;
    setElapsedMs(0);
    setTimerActive(false);
    void runnerRef.current?.close();
    runnerRef.current = null;
    setShowHint(false);
  };

  const showResult = status.kind === "success" || status.kind === "mismatch";

  // Format mm:ss dari ms
  const fmt = (ms: number) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Editor SQL */}
      <div className="overflow-hidden rounded-2xl border-2 border-lilac bg-white shadow-sm">
        <div className="flex items-center justify-between border-b-2 border-lilac/60 bg-lav/50 px-3 py-2">
          <span className="flex items-center gap-1.5 font-display text-xs font-extrabold text-ink-soft">
            <PenLine className="h-3.5 w-3.5" /> Tulis query-mu di sini (PostgreSQL)
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
        {/* Timer */}
        {(timerActive || elapsedMs > 0) && (
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 font-mono text-sm font-extrabold ${
              successRef.current
                ? "bg-mint-soft text-[#047857]"
                : "bg-lav/70 text-grape"
            }`}
          >
            <Timer className="h-4 w-4" /> {fmt(elapsedMs)}
            {successRef.current && wrongCountRef.current > 0 && penaltyPerWrong > 0 && (
              <span className="text-[10px] font-bold text-[#047857]/70">
                (+{wrongCountRef.current * penaltyPerWrong}s penalti)
              </span>
            )}
          </span>
        )}
        <button
          onClick={runQuery}
          disabled={status.kind === "running" || successRef.current}
          className={`flex items-center gap-2 rounded-full px-6 py-2.5 font-display text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 ${
            status.kind === "running" ? "bg-ink-soft" : "animate-pulse-glow bg-grape"
          }`}
        >
          {status.kind === "running" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Menjalankan...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" /> Jalankan
            </>
          )}
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 rounded-full border-2 border-lilac bg-white px-5 py-2.5 font-display text-sm font-extrabold text-ink-soft transition hover:border-rose/40 hover:text-rose"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
        <button
          onClick={() => setShowHint((v) => !v)}
          className="flex items-center gap-1.5 rounded-full border-2 border-lilac bg-white px-5 py-2.5 font-display text-sm font-extrabold text-ink-soft transition hover:border-sun/60 hover:text-peach"
        >
          <Lightbulb className="h-4 w-4" />
          {showHint ? "Sembunyikan Hint" : "Lihat Hint"}
        </button>
      </div>

      {/* Hint */}
      {showHint && (
        <div className="animate-pop-in rounded-2xl border-2 border-dashed border-sun bg-sun/10 p-3">
          <span className="mb-1 flex items-center gap-1.5 font-display text-xs font-extrabold text-peach">
            <Lightbulb className="h-3.5 w-3.5" /> Petunjuk — coba query seperti ini:
          </span>
          <code className="whitespace-pre-wrap font-mono text-xs text-ink">{solutionSql}</code>
        </div>
      )}

      {/* Status: error */}
      {status.kind === "error" && (
        <div
          role="alert"
          className="animate-pop-in flex items-start gap-2 rounded-2xl border-2 border-rose/40 bg-rose/10 p-3 font-sans text-sm font-bold text-[#be123c]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Ups, error! {status.message}</span>
        </div>
      )}

      {/* Status: sukses */}
      {status.kind === "success" && (
        <div className="flex flex-col gap-2">
          <div
            role="status"
            className="animate-pop-in relative overflow-visible rounded-2xl border-2 border-mint bg-mint-soft p-4"
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
            <div className="flex items-start gap-2 font-display text-base font-extrabold text-[#047857]">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <div>BENAR! Query-mu cocok dengan solusi.</div>
                {status.result && (
                  <div className="mt-1 font-sans text-sm font-bold text-[#047857]/80">
                    {status.result.rowCount} baris · {status.result.timeMs} ms · percobaan ke-
                    {status.attempts}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="pointer-events-none relative h-0">
            <span className="animate-float-up absolute right-4 top-0 flex items-center gap-1 font-display text-xl font-extrabold text-peach drop-shadow-sm">
              <Star className="h-5 w-5 fill-peach" /> +10 XP
            </span>
          </div>
        </div>
      )}

      {/* Status: mismatch */}
      {status.kind === "mismatch" && (
        <div
          role="status"
          className="animate-pop-in flex items-start gap-2 rounded-2xl border-2 border-peach/50 bg-peach/10 p-3 font-sans text-sm font-bold text-[#c2410c]"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Belum tepat — hasil query-mu belum sama dengan solusi. Coba lagi, kamu pasti bisa!</span>
        </div>
      )}

      {/* Tabel hasil */}
      {showResult && resultTable && (
        <div className="animate-pop-in overflow-hidden rounded-2xl border-2 border-lilac bg-white">
          <div className="flex items-center gap-1.5 border-b-2 border-lilac/60 bg-lav/50 px-3 py-2 font-display text-xs font-extrabold text-ink-soft">
            <Table2 className="h-3.5 w-3.5" /> Hasil query ({resultTable.rowCount} baris)
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
