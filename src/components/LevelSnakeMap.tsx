"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SnakeExercise = {
  id: number;
  orderIndex: number;
  title: string;
};

type LevelSnakeMapProps = {
  exercises: SnakeExercise[];
  completedIds: number[];
};

// Layout peta ular: 2 kolom zigzag (kiri → kanan → kiri ...), seperti jalur ular.
const W = 320;
const LEFT_X = 84;
const RIGHT_X = 236;
const PAD_TOP = 56;
const ROW_H = 100;
const NODE_R = 26;

function nodePos(i: number): { x: number; y: number } {
  const row = Math.floor(i / 2);
  const x = i % 2 === 0 ? LEFT_X : RIGHT_X;
  return { x, y: PAD_TOP + row * ROW_H };
}

function pathD(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const midY = (a.y + b.y) / 2;
  return `M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
}

// Warna node bergantian biar ceria
const NODE_COLORS = [
  { bg: "#ede9fe", border: "#8b5cf6", text: "#7c3aed" },
  { bg: "#fce7f3", border: "#f472b6", text: "#db2777" },
  { bg: "#fff7ed", border: "#fb923c", text: "#ea580c" },
  { bg: "#d1fae5", border: "#34d399", text: "#059669" },
];

export default function LevelSnakeMap({ exercises, completedIds }: LevelSnakeMapProps) {
  const [done, setDone] = useState<Set<number>>(() => new Set(completedIds));
  const [heroPt, setHeroPt] = useState<{ x: number; y: number } | null>(null);
  const [animating, setAnimating] = useState(false);
  const firstRun = useRef(true);

  const count = exercises.length;
  const allDone = count > 0 && done.size >= count;

  // Hero berdiri di soal pertama yang belum selesai; semua selesai → finish (index = count)
  const targetHero = useMemo(() => {
    if (count === 0) return 0;
    if (allDone) return count;
    for (let i = 0; i < count; i++) {
      if (!done.has(exercises[i].id)) return i;
    }
    return count;
  }, [done, exercises, count, allDone]);

  // Sinkronkan state lokal bila prop berubah
  useEffect(() => {
    setDone(new Set(completedIds));
  }, [completedIds]);

  const positions = useMemo(() => exercises.map((_, i) => nodePos(i)), [exercises]);
  const lastPos = count > 0 ? nodePos(count - 1) : { x: LEFT_X, y: PAD_TOP };
  const finishPos =
    count % 2 === 1
      ? { x: RIGHT_X, y: lastPos.y }
      : { x: LEFT_X, y: lastPos.y + ROW_H };

  const posFor = (i: number) =>
    i >= count ? finishPos : positions[Math.max(0, Math.min(i, count - 1))];

  // Saat target hero berubah: pindahkan hero dengan transisi (kecuali render pertama)
  useEffect(() => {
    const dest = posFor(targetHero);
    if (firstRun.current) {
      firstRun.current = false;
      setHeroPt(dest);
      return;
    }
    setAnimating(false);
    requestAnimationFrame(() => {
      setAnimating(true);
      requestAnimationFrame(() => {
        setHeroPt(dest);
      });
    });
  }, [targetHero]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dengarkan event "soal selesai" dari SqlRunner → tandai done & hero melaju
  const handleDone = useCallback((e: Event) => {
    const id = (e as CustomEvent<{ exerciseId: number }>).detail?.exerciseId;
    if (!id) return;
    setDone((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("sqlquest:exercise-done", handleDone);
    return () => window.removeEventListener("sqlquest:exercise-done", handleDone);
  }, [handleDone]);

  const heroTitle =
    heroPt && targetHero < count && exercises[targetHero]
      ? exercises[targetHero].title
      : allDone
        ? "FINISH — level ditaklukkan!"
        : null;

  const height = Math.max(finishPos.y + NODE_R + 24, PAD_TOP + ROW_H);
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="overflow-x-auto pb-2">
      <div className="relative mx-auto" style={{ width: W, height }}>
        {/* Jalur ular */}
        <svg
          viewBox={`0 0 ${W} ${height}`}
          className="absolute inset-0"
          aria-hidden
          style={{ width: W, height }}
        >
          {Array.from({ length: count + 1 }, (_, seg) => {
            if (seg >= count) return null;
            const from = seg < count ? positions[seg] : lastPos;
            const to = seg === count - 1 ? finishPos : positions[seg + 1];
            const passed = seg < targetHero;
            return (
              <path
                key={`seg-${seg}`}
                d={pathD(from, to)}
                fill="none"
                stroke={passed ? "#8b5cf6" : "#e0d8f8"}
                strokeWidth={passed ? 6 : 4}
                strokeLinecap="round"
                strokeDasharray={passed ? "none" : "1 8"}
                opacity={passed ? 1 : 0.8}
                style={{ transition: "stroke 0.4s" }}
              />
            );
          })}
          {/* Segmen terakhir menuju finish ikut menyala saat semua selesai */}
          {allDone && (
            <path
              d={pathD(lastPos, finishPos)}
              fill="none"
              stroke="#fb923c"
              strokeWidth={6}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Hero */}
        {heroPt && (
          <div
            aria-hidden
            className="pointer-events-none absolute z-30"
            style={{
              left: heroPt.x,
              top: heroPt.y,
              transitionProperty: "left, top",
              transitionDuration: animating && !reduceMotion ? "650ms" : "0ms",
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div className="-translate-x-1/2 -translate-y-1/2">
              <span
                className="block text-[30px] leading-none drop-shadow-[0_4px_8px_rgba(124,58,237,0.35)]"
                style={{ animation: "bob 2.2s ease-in-out infinite" }}
              >
                🐣
              </span>
              <div className="mx-auto mt-0.5 h-1.5 w-5 rounded-full bg-ink/15" />
            </div>
          </div>
        )}

        {/* Node soal */}
        {exercises.map((ex, i) => {
          const pos = positions[i];
          const isDone = done.has(ex.id);
          const isHere = targetHero === i;
          const c = NODE_COLORS[i % NODE_COLORS.length];
          return (
            <button
              key={ex.id}
              type="button"
              onClick={() =>
                document
                  .getElementById(`exercise-${ex.orderIndex}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
              title={`Soal ${ex.orderIndex}: ${ex.title}`}
              aria-label={`Soal ${ex.orderIndex}: ${ex.title}`}
              className="absolute z-20 flex h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] font-display text-base font-extrabold transition"
              style={{
                left: pos.x,
                top: pos.y,
                ...(isDone
                  ? { backgroundColor: "#d1fae5", borderColor: "#34d399", color: "#059669" }
                  : isHere
                    ? {
                        backgroundColor: c.bg,
                        borderColor: c.border,
                        color: c.text,
                        boxShadow: `0 0 0 6px ${c.border}33`,
                        transform: "translate(-50%,-50%) scale(1.1)",
                      }
                    : { backgroundColor: "#ffffff", borderColor: "#e4dcff", color: "#9a8fc0" }),
              }}
            >
              {isDone ? "✓" : ex.orderIndex}
            </button>
          );
        })}

        {/* Finish */}
        <div
          className="absolute z-20 flex h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] text-xl transition"
          style={{
            left: finishPos.x,
            top: finishPos.y,
            ...(allDone
              ? { backgroundColor: "#fffbeb", borderColor: "#fbbf24", boxShadow: "0 0 0 6px #fbbf2433" }
              : { backgroundColor: "#ffffff", borderColor: "#e4dcff", opacity: 0.8 }),
          }}
        >
          🏁
        </div>
      </div>

      {/* Status hero */}
      <div className="mx-auto mt-2 max-w-[320px] rounded-full bg-lav/70 px-4 py-1.5 text-center font-sans text-xs font-extrabold text-ink-soft">
        {allDone ? (
          <span className="text-peach">🎉 Semua soal beres — karaktermu sampai FINISH!</span>
        ) : heroTitle ? (
          <span>
            🐣 Posisimu: <span className="text-grape">{heroTitle}</span>
          </span>
        ) : (
          <span>—</span>
        )}
      </div>
    </div>
  );
}
