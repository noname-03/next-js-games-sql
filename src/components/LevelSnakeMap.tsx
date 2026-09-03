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

  // Sinkronkan state lokal bila prop berubah (mis. habis refresh / navigasi)
  useEffect(() => {
    setDone(new Set(completedIds));
  }, [completedIds]);

  const positions = useMemo(() => exercises.map((_, i) => nodePos(i)), [exercises]);
  const lastPos = count > 0 ? nodePos(count - 1) : { x: LEFT_X, y: PAD_TOP };
  // Finish: jika ular berakhir di kiri → finish di kanan baris sama; jika kanan → baris baru di kiri
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
      setHeroPt(dest); // langsung di posisi, tanpa animasi
      return;
    }
    // Fase 1: set transisi mati, paksa browser catat posisi lama
    setAnimating(false);
    requestAnimationFrame(() => {
      // Fase 2: hidupkan transisi lalu pindah ke tujuan
      setAnimating(true);
      requestAnimationFrame(() => {
        setHeroPt(dest);
      });
    });
  }, [targetHero]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dengarkan event "soal selesai" dari SqlRunner → tandai done & hero melaju
  const handleDone = useCallback(
    (e: Event) => {
      const id = (e as CustomEvent<{ exerciseId: number }>).detail?.exerciseId;
      if (!id) return;
      setDone((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    },
    []
  );

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
    <div className="overflow-x-auto">
      <div className="relative mx-auto" style={{ width: W, height }}>
        {/* Jalur ular */}
        <svg
          viewBox={`0 0 ${W} ${height}`}
          className="absolute inset-0"
          aria-hidden
          style={{ width: W, height }}
        >
          {Array.from({ length: count + 1 }, (_, seg) => {
            // segmen seg: dari node seg menuju node seg+1 (atau finish di akhir)
            if (seg >= count) return null;
            const from = seg < count ? positions[seg] : lastPos;
            const to = seg === count - 1 ? finishPos : positions[seg + 1];
            const passed = seg < targetHero;
            return (
              <path
                key={`seg-${seg}`}
                d={pathD(from, to)}
                fill="none"
                stroke={passed ? "#34d399" : "#1e2a40"}
                strokeWidth={passed ? 5 : 3}
                strokeLinecap="round"
                strokeDasharray={passed ? "none" : "1 7"}
                opacity={passed ? 0.95 : 0.7}
                style={{ transition: "stroke 0.4s" }}
              />
            );
          })}
          {/* Segmen terakhir menuju finish ikut menyala saat semua selesai */}
          {allDone && (
            <path
              d={pathD(lastPos, finishPos)}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={5}
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
                className="block text-[28px] leading-none drop-shadow-[0_0_10px_rgba(251,191,36,0.55)]"
                style={{ animation: "bounce 1.8s ease-in-out infinite" }}
              >
                🧙
              </span>
              <div className="mx-auto mt-0.5 h-1.5 w-5 rounded-full bg-black/50" />
            </div>
          </div>
        )}

        {/* Node soal */}
        {exercises.map((ex, i) => {
          const pos = positions[i];
          const isDone = done.has(ex.id);
          const isHere = targetHero === i;
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
              className="absolute z-20 flex h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 font-mono text-sm font-bold transition"
              style={{
                left: pos.x,
                top: pos.y,
                ...(isDone
                  ? { borderColor: "#34d399", backgroundColor: "#0d1a14", color: "#34d399" }
                  : isHere
                    ? {
                        borderColor: "#22d3ee",
                        backgroundColor: "#0d1524",
                        color: "#22d3ee",
                        boxShadow: "0 0 14px rgba(34,211,238,0.35)",
                      }
                    : { borderColor: "#1e2a40", backgroundColor: "#0d1524", color: "#5c6f8c" }),
              }}
            >
              {isDone ? "✓" : ex.orderIndex}
            </button>
          );
        })}

        {/* Finish */}
        <div
          className="absolute z-20 flex h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xl"
          style={{
            left: finishPos.x,
            top: finishPos.y,
            ...(allDone
              ? { borderColor: "#fbbf24", backgroundColor: "#1c1505", boxShadow: "0 0 16px rgba(251,191,36,0.45)" }
              : { borderColor: "#1e2a40", backgroundColor: "#0d1524", opacity: 0.7 }),
          }}
        >
          🏁
        </div>
      </div>

      {/* Status hero */}
      <div className="mx-auto mt-1 max-w-[320px] text-center font-mono text-xs text-fog">
        {allDone ? (
          <span className="text-xp">🎉 semua soal beres — hero-mu sampai FINISH!</span>
        ) : heroTitle ? (
          <span>
            <span className="text-xp">🧙 posisimu:</span> {heroTitle}
          </span>
        ) : (
          <span className="text-faint">—</span>
        )}
      </div>
    </div>
  );
}
