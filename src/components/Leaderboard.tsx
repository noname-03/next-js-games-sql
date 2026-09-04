"use client";

import { useEffect, useState } from "react";
import { Clock3, Crown, Loader2, Medal, Trophy } from "lucide-react";

type LeaderRow = {
  rank: number;
  userId: number;
  displayName: string;
  username: string;
  value: number;
};

type LeaderboardProps = {
  bab?: number | null; // null = akumulasi global
};

function fmtDuration(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}j ${m}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

const MEDAL_COLORS = ["#fbbf24", "#c0c0c0", "#cd7f32"];

export default function Leaderboard({ bab = null }: LeaderboardProps) {
  const [mode, setMode] = useState<"progress" | "speed">("progress");
  const [data, setData] = useState<{ rows: LeaderRow[]; userRank: number | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ mode });
    if (bab !== null && bab !== undefined) params.set("bab", String(bab));
    fetch(`/api/leaderboard?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setData({ rows: [], userRank: null });
        setLoading(false);
      });
  }, [mode, bab]);

  const title =
    bab !== null && bab !== undefined ? `Papan Juara Bab ${bab}` : "Papan Juara Umum";

  return (
    <div className="w-full rounded-[1.75rem] bg-white/80 p-4 shadow-sm ring-1 ring-lilac backdrop-blur">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-grape">
          <Trophy className="h-5 w-5" /> {title}
        </h3>
        {/* Tab mode */}
        <div className="flex rounded-full bg-lav/70 p-1">
          <button
            onClick={() => setMode("progress")}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold transition ${
              mode === "progress" ? "bg-white text-grape shadow-sm" : "text-ink-soft"
            }`}
          >
            <Medal className="h-3.5 w-3.5" /> Terjauh
          </button>
          <button
            onClick={() => setMode("speed")}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold transition ${
              mode === "speed" ? "bg-white text-peach shadow-sm" : "text-ink-soft"
            }`}
          >
            <Clock3 className="h-3.5 w-3.5" /> Tercepat
          </button>
        </div>
      </div>

      {/* hint dihapus: per-bab speed kini menampilkan semua user dengan data durasi */}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-ink-soft">
          <Loader2 className="h-5 w-5 animate-spin" /> Memuat papan juara...
        </div>
      ) : data && data.rows.length === 0 ? (
        <p className="py-6 text-center text-sm font-bold text-ink-faint">
          Belum ada yang masuk papan — jadilah yang pertama!
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {data?.rows.map((r) => {
            const medal = r.rank <= 3;
            return (
              <div
                key={r.userId}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${
                  medal ? "bg-lav/50" : "bg-white"
                }`}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold"
                  style={{
                    backgroundColor: medal ? MEDAL_COLORS[r.rank - 1] + "33" : "#f1f1f6",
                    color: medal ? MEDAL_COLORS[r.rank - 1] : "#9a8fc0",
                  }}
                >
                  {r.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-ink">
                    {r.displayName}
                    {r.rank === 1 && (
                      <Crown className="ml-1 inline h-3.5 w-3.5 text-sun" />
                    )}
                  </p>
                  <p className="text-[11px] font-bold text-ink-faint">@{r.username}</p>
                </div>
                <span
                  className={`shrink-0 font-mono text-sm font-extrabold ${
                    mode === "speed" ? "text-peach" : "text-grape"
                  }`}
                >
                  {mode === "speed"
                    ? fmtDuration(r.value)
                    : `${r.value} soal`}
                </span>
              </div>
            );
          })}

          {data?.userRank !== null && data?.userRank !== undefined && (
            <p className="mt-2 text-center text-xs font-bold text-ink-soft">
              Peringkatmu:{" "}
              <span className="font-extrabold text-grape">
                #{data.userRank}
              </span>{" "}
              {mode === "progress"
                ? "dari jumlah soal"
                : "dari total waktu"}
            </p>
          )}
          {!data?.userRank && (
            <p className="mt-2 text-center text-xs font-bold text-ink-faint">
              {mode === "speed"
                ? "Selesaikan soal untuk masuk papan kecepatan."
                : "Selesaikan soal untuk masuk papan."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
