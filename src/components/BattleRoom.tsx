"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Crown,
  Loader2,
  Rocket,
  Swords,
  Timer,
  XCircle,
} from "lucide-react";
import { getSocket } from "@/lib/socket";
// Lazy load PGlite (15MB WASM) only when user runs a query
let createRunner: typeof import("@/lib/pglite-runner").createRunner | null = null;
let compareResults: typeof import("@/lib/pglite-runner").compareResults | null = null;
type RunResult = { columns: string[]; rows: string[][]; rowCount: number; timeMs: number };

async function loadRunner() {
  if (!createRunner) {
    const mod = await import("@/lib/pglite-runner");
    createRunner = mod.createRunner;
    compareResults = mod.compareResults;
  }
}

type PlayerInfo = {
  userId: number;
  displayName: string;
  status: "waiting" | "playing" | "done";
  attempts: number;
  durationMs?: number | null;
};

type BattleData = {
  id: string;
  exerciseId: number;
  prompt: string;
  datasetSql: string;
  starterSql: string;
  solutionSql?: string;
  players: PlayerInfo[];
  status: "waiting" | "countdown" | "active" | "finished";
};

type Props = {
  battleId: string;
  userId: number;
  username: string;
  displayName: string;
  exerciseId?: number;
};

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return m + ":" + (s % 60).toString().padStart(2, "0");
}

export default function BattleRoom({ battleId, userId, username, displayName, exerciseId }: Props) {
  const [battle, setBattle] = useState<BattleData | null>(null);
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [myAttempts, setMyAttempts] = useState(0);
  const [iFinished, setIFinished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actualBattleId, setActualBattleId] = useState(battleId);
  const socketRef = useRef(getSocket());
  const runnerRef = useRef<any>(null);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const socket = socketRef.current;
    socket.on("created", (data: { battleId: string; state: BattleData }) => {
      setBattle(data.state);
      setCode(data.state.starterSql);
      setActualBattleId(data.battleId);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/battle/" + data.battleId);
      }
    });
    socket.on("player-joined", (state: BattleData) => {
      setBattle(state);
      setCode(state.starterSql);
    });
    socket.on("countdown", (state: BattleData) => {
      setBattle(state);
      setCountdown(3);
      const iv = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(iv); return 0; }
          return c - 1;
        });
      }, 1000);
    });
    socket.on("battle-start", (state: BattleData) => {
      setBattle(state);
      setCode(state.starterSql);
      startedAtRef.current = Date.now();
      timerRef.current = setInterval(() => {
        if (startedAtRef.current) setElapsedMs(Date.now() - startedAtRef.current);
      }, 500);
    });
    socket.on("opponent-attempt", (state: BattleData) => setBattle(state));
    socket.on("opponent-done", (state: BattleData) => setBattle(state));
    socket.on("battle-finished", (state: BattleData) => {
      setBattle(state);
      if (timerRef.current) clearInterval(timerRef.current);
    });
    socket.on("error", (data: { message: string }) => setError(data.message));

    return () => {
      socket.off("created");
      socket.off("player-joined");
      socket.off("countdown");
      socket.off("battle-start");
      socket.off("opponent-attempt");
      socket.off("opponent-done");
      socket.off("battle-finished");
      socket.off("error");
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (battleId === "new" && exerciseId) {
      // Creator: create battle via socket
      socket.emit("create", { exerciseId, userId, username, displayName });
    } else if (battleId !== "new") {
      // Opponent: join existing battle
      socket.emit("join", { battleId, userId, username, displayName });
    }
  }, [battleId, userId, username, displayName, exerciseId]);

  useEffect(() => {
    return () => { void runnerRef.current?.close(); };
  }, []);

  const runQuery = useCallback(async () => {
    if (!battle || iFinished) return;
    try {
      await loadRunner();
      if (!runnerRef.current) {
        runnerRef.current = await createRunner!(battle.datasetSql);
      }
      const runner = runnerRef.current;
      const outcome = await runner.run(code);
      if (!outcome.ok || outcome.kind === "error") {
        setError("Query error");
        return;
      }
      const sol = await runner.run(battle.solutionSql || "");
      if (!sol.ok || sol.kind !== "success" || !sol.result) {
        setError("Solusi gagal");
        return;
      }
      const userResult = outcome.result;
      const ok = compareResults!(userResult, sol.result, /order\\s+by/i.test(battle.solutionSql || ""));
      setMyAttempts((a) => a + 1);
      setResult(userResult);
      if (ok) {
        setIFinished(true);
        const dur = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
        setElapsedMs(dur);
        socketRef.current.emit("attempt", { battleId: battle.id, userId, correct: true });
      } else {
        socketRef.current.emit("attempt", { battleId: battle.id, userId, correct: false });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [battle, code, userId, iFinished, battleId]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin + "/battle/" + battleId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleForfeit = () => {
    socketRef.current.emit("forfeit", { battleId: actualBattleId, userId });
  };

  if (!battle) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-grape" />
        <p className="font-display text-lg font-extrabold text-grape">
          {actualBattleId === "new" ? "Membuat battle..." : "Menunggu battle..."}
        </p>
        <p className="text-sm font-semibold text-ink-soft">
          {actualBattleId === "new" ? "Tunggu sebentar..." : "Pastikan link battle benar"}
        </p>
      </main>
    );
  }

  const me = battle.players.find((p) => p.userId === userId);
  const opponent = battle.players.find((p) => p.userId !== userId);
  const isFinished = battle.status === "finished";
  const iWon = isFinished && me?.status === "done" && opponent?.status === "done"
    ? (me.durationMs ?? Infinity) < (opponent.durationMs ?? Infinity)
    : me?.status === "done" && opponent?.status !== "done";

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-3">
        <Link href="/battle" className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-grape shadow-sm ring-1 ring-lilac">
          <ArrowLeft className="h-4 w-4" /> Lobby
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-ink-soft shadow-sm ring-1 ring-lilac">
            <Swords className="h-3.5 w-3.5" /> Battle #{battle.id}
          </span>
          <button onClick={() => { navigator.clipboard.writeText(window.location.origin + "/battle/" + actualBattleId); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-1 rounded-full border border-lilac bg-white px-3 py-1.5 text-xs font-extrabold text-ink-soft transition hover:bg-lav">
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-mint" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {battle.players.map((p) => {
          const isMe = p.userId === userId;
          const done = p.status === "done";
          const dur = p.durationMs ? fmt(p.durationMs) : null;
          return (
            <div key={p.userId} className={"rounded-2xl p-4 shadow-sm ring-1 " + (isMe ? "bg-grape/5 ring-grape/30" : "bg-peach/5 ring-peach/30") + (done ? " ring-2 ring-mint" : "")}>
              <div className="flex items-center gap-2 mb-2">
                <span className={"text-xs font-bold " + (isMe ? "text-grape" : "text-peach")}>{isMe ? "Kamu" : "Lawan"}</span>
                {done && <Crown className="h-4 w-4 text-sun" />}
              </div>
              <p className="font-display text-base font-extrabold text-ink">{p.displayName}</p>
              <div className="mt-2 flex items-center gap-3 text-xs font-bold text-ink-soft">
                <span>{p.attempts} percobaan</span>
                {dur && <span className="text-mint">{dur}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {battle.status === "active" && (
        <div className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-lilac">
          <Timer className="h-4 w-4 text-grape" />
          <span className="font-mono text-lg font-extrabold text-grape">{fmt(elapsedMs)}</span>
        </div>
      )}

      {battle.status === "countdown" && countdown > 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-grape text-white font-display text-4xl font-extrabold animate-bounce">{countdown}</div>
        </div>
      )}

      {battle.status === "waiting" && (
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-lilac text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-grape/10">
              <Swords className="h-8 w-8 text-grape" />
            </div>
          </div>
          <h2 className="font-display text-xl font-extrabold text-grape">Menunggu Lawan...</h2>
          <p className="mt-1 text-sm font-semibold text-ink-soft">Bagikan link di bawah ke temanmu</p>
          <div className="mt-4 rounded-xl bg-lav/50 p-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-faint">Battle ID</p>
            <p className="font-mono text-2xl font-extrabold text-grape tracking-wider">{actualBattleId}</p>
          </div>
          <div className="mt-3 rounded-xl bg-lav/50 p-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-faint">Link Battle</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-white px-3 py-2 text-xs font-mono text-ink ring-1 ring-lilac">
                {typeof window !== "undefined" ? window.location.origin : ""}/battle/{actualBattleId}
              </code>
              <button onClick={() => { navigator.clipboard.writeText(window.location.origin + "/battle/" + actualBattleId); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="shrink-0 flex items-center gap-1 rounded-lg bg-grape px-3 py-2 text-sm font-extrabold text-white transition hover:bg-grape-deep">
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "OK!" : "Salin"}
              </button>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-center gap-2 text-ink-soft">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-bold">Menunggu lawan bergabung...</span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-ink-faint">Kamu: <span className="text-grape font-extrabold">{displayName}</span></p>
          </div>
        </div>
      )}

      {(battle.status === "active" || isFinished) && (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-lilac">
          <p className="text-sm font-semibold leading-relaxed text-ink">{battle.prompt}</p>
        </div>
      )}

      {battle.status === "active" && !iFinished && (
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-2xl border-2 border-lilac bg-white shadow-sm">
            <div className="border-b-2 border-lilac/60 bg-lav/50 px-3 py-2">
              <span className="font-display text-xs font-extrabold text-ink-soft">Tulis query-mu (PostgreSQL)</span>
            </div>
            <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} rows={5} className="block w-full resize-y bg-[#faf8ff] p-4 font-mono text-sm leading-relaxed text-ink caret-grape outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={runQuery} className="flex items-center gap-2 rounded-full bg-grape px-6 py-2.5 font-display text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
              <Rocket className="h-4 w-4" /> Jalankan
            </button>
            <button onClick={handleForfeit} className="flex items-center gap-1.5 rounded-full border-2 border-rose/40 bg-white px-5 py-2.5 font-display text-sm font-extrabold text-rose transition hover:bg-rose/10">
              <XCircle className="h-4 w-4" /> Menyerah
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border-2 border-rose/40 bg-rose/10 p-3 text-sm font-bold text-[#be123c]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-rose/60 hover:text-rose">x</button>
        </div>
      )}

      {result && (
        <div className="overflow-hidden rounded-2xl border-2 border-lilac bg-white">
          <div className="border-b-2 border-lilac/60 bg-lav/50 px-3 py-2 font-display text-xs font-extrabold text-ink-soft">Hasil query ({result.rowCount} baris)</div>
          <div className="overflow-x-auto max-h-48">
            <table className="w-full font-mono text-sm">
              <thead><tr className="bg-grape/5 text-left">{result.columns.map((c) => (<th key={c} className="px-3 py-2 font-extrabold text-grape">{c}</th>))}</tr></thead>
              <tbody>{result.rows.map((row, i) => (<tr key={i} className={i % 2 ? "bg-lav/30" : "bg-white"}>{row.map((cell, j) => (<td key={j} className="px-3 py-1.5 text-ink">{cell}</td>))}</tr>))}</tbody>
            </table>
          </div>
        </div>
      )}

      {isFinished && (
        <div className="rounded-2xl bg-white p-6 shadow-lg ring-2 ring-grape/20 text-center">
          <div className="mb-4 flex justify-center">
            {iWon ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sun/20"><Crown className="h-8 w-8 text-sun" /></div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lav"><XCircle className="h-8 w-8 text-ink-faint" /></div>
            )}
          </div>
          <h2 className="font-display text-2xl font-extrabold text-grape">{iWon ? "Kamu Menang!" : "Kamu Kalah"}</h2>
          <p className="mt-2 text-sm font-semibold text-ink-soft">{myAttempts} percobaan - {fmt(elapsedMs)}</p>
          <div className="mt-4 flex flex-col gap-2">
            {battle.players.sort((a, b) => (a.durationMs ?? Infinity) - (b.durationMs ?? Infinity)).map((p, i) => (
              <div key={p.userId} className={"flex items-center gap-3 rounded-lg px-3 py-2 " + (i === 0 ? "bg-sun/10" : "bg-lav/30")}>
                <span className="text-lg">{i === 0 ? "1st" : "2nd"}</span>
                <span className="flex-1 text-sm font-bold text-ink">{p.displayName}</span>
                <span className="font-mono text-sm font-extrabold text-ink-soft">{p.durationMs ? fmt(p.durationMs) : "-"}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/battle" className="flex items-center gap-2 rounded-full bg-grape px-6 py-2.5 font-display text-sm font-extrabold text-white shadow-md">
              <Swords className="h-4 w-4" /> Battle Lagi
            </Link>
            <Link href="/" className="flex items-center gap-2 rounded-full border-2 border-lilac bg-white px-6 py-2.5 font-display text-sm font-extrabold text-ink-soft">
              <ArrowLeft className="h-4 w-4" /> Peta
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
