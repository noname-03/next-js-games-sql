"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Lock,
  Map,
  Trophy,
} from "lucide-react";
import LevelMap from "./LevelMap";
import Leaderboard from "./Leaderboard";
import type { MapNode } from "./LevelMap";

export type ChapterMeta = {
  index: number;
  title: string;
  subtitle: string;
  doneCount: number;
  exerciseCount: number;
  isDone: boolean;
  isLocked: boolean;
  isCurrent: boolean;
};

type ChapterListProps = {
  chapters: ChapterMeta[];
  activeChapter: number | null; // null = tampilkan daftar
  nodes: MapNode[];
  activeDone: boolean;
};

const CHAPTER_COLORS = [
  { bg: "#ede9fe", border: "#8b5cf6", text: "#7c3aed" },
  { bg: "#fce7f3", border: "#f472b6", text: "#db2777" },
  { bg: "#fff7ed", border: "#fb923c", text: "#ea580c" },
  { bg: "#d1fae5", border: "#34d399", text: "#059669" },
  { bg: "#e0f2fe", border: "#38bdf8", text: "#0284c7" },
  { bg: "#fef9c3", border: "#facc15", text: "#a16207" },
];

export default function ChapterBrowser({
  chapters,
  activeChapter,
  nodes,
  activeDone,
}: ChapterListProps) {
  const router = useRouter();
  const totalChapters = chapters.length;

  // Mode peta bab aktif (dari query ?bab=N)
  if (activeChapter !== null) {
    const c = CHAPTER_COLORS[(activeChapter - 1) % CHAPTER_COLORS.length];
    return (
      <section className="flex flex-col items-center gap-3 rounded-[2rem] bg-white/70 p-5 shadow-sm ring-1 ring-lilac backdrop-blur">
        <div className="flex w-full items-center justify-between gap-2">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-grape shadow-sm ring-1 ring-lilac transition hover:-translate-x-0.5 hover:shadow"
          >
            <ArrowLeft className="h-4 w-4" /> Semua Bab
          </button>
          <span className="rounded-full bg-lav px-3 py-1 text-xs font-extrabold text-ink-soft">
            Bab {activeChapter} dari {totalChapters}
          </span>
        </div>

        <h2 className="text-center font-display text-2xl font-extrabold text-grape">
          Bab {activeChapter}
        </h2>
        <p className="-mt-1 text-center text-sm font-semibold text-ink-soft">
          Level {(activeChapter - 1) * 10 + 1}–{Math.min(activeChapter * 10, 200)} ·
          pilih level untuk mulai
        </p>

        <LevelMap nodes={nodes} />

        {/* Papan juara bab ini */}
        <div className="mt-2 w-full max-w-md">
          <Leaderboard bab={activeChapter} />
        </div>

        {activeDone && activeChapter < totalChapters && (
          <button
            onClick={() => router.push(`/?bab=${activeChapter + 1}`)}
            className="mt-1 flex items-center gap-2 rounded-full bg-grape px-6 py-3 font-display text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Trophy className="h-4 w-4" /> Lanjut ke Bab {activeChapter + 1}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        {activeDone && activeChapter >= totalChapters && (
          <div className="mt-1 rounded-full bg-mint-soft px-5 py-2 text-sm font-extrabold text-mint">
            <Trophy className="mr-1 inline h-4 w-4" /> Bab terakhir selesai — kamu hebat!
          </div>
        )}
      </section>
    );
  }

  // Mode daftar bab
  return (
    <section className="flex flex-col items-center gap-4 rounded-[2rem] bg-white/70 p-6 shadow-sm ring-1 ring-lilac backdrop-blur">
      <h2 className="flex items-center gap-2 text-center text-xl font-extrabold text-grape">
        <Map className="h-5 w-5" /> Pilih Bab Petualangan
      </h2>
      <p className="text-center text-sm font-semibold text-ink-soft">
        {totalChapters} bab · tiap bab berisi 10 level · taklukkan satu per satu!
      </p>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {chapters.map((ch, i) => {
          const c = CHAPTER_COLORS[i % CHAPTER_COLORS.length];
          const pct =
            ch.exerciseCount === 0
              ? 0
              : Math.round((ch.doneCount / ch.exerciseCount) * 100);

          return (
            <button
              key={ch.index}
              onClick={() => router.push(`/?bab=${ch.index}`)}
              disabled={ch.isLocked}
              className={`group relative flex flex-col gap-1.5 rounded-3xl border-[3px] bg-white p-4 text-left transition ${
                ch.isLocked
                  ? "cursor-not-allowed opacity-60"
                  : "hover:-translate-y-1 hover:shadow-lg"
              } ${ch.isCurrent && !ch.isDone ? "ring-2 ring-grape/40" : ""}`}
              style={{ borderColor: ch.isDone ? "#34d399" : c.border }}
            >
              {ch.isDone && (
                <span className="absolute right-3 top-3 text-mint">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
              )}
              {ch.isLocked && (
                <span className="absolute right-3 top-3 text-ink-faint">
                  <Lock className="h-5 w-5" />
                </span>
              )}

              <span
                className="flex h-10 w-10 items-center justify-center rounded-2xl font-display text-lg font-extrabold"
                style={{ backgroundColor: c.bg, color: c.text }}
              >
                {ch.index}
              </span>
              <span className="font-display text-base font-extrabold text-ink">
                {ch.title}
              </span>
              <span className="text-xs font-bold text-ink-soft">{ch.subtitle}</span>
              <span className="text-xs font-extrabold" style={{ color: c.text }}>
                {ch.doneCount}/{ch.exerciseCount} soal
              </span>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-lav">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: ch.isDone ? "#34d399" : c.border }}
                />
              </div>
              {ch.isLocked && (
                <span className="text-[11px] font-bold text-ink-faint">
                  Selesaikan bab sebelumnya untuk membuka
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
