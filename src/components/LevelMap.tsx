"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export type MapNode = {
  id: number;
  slug: string;
  orderIndex: number;
  title: string;
  description: string;
  doneCount: number;
  exerciseCount: number;
  status: "locked" | "open" | "done";
};

type LevelMapProps = {
  nodes: MapNode[];
};

type Pt = { x: number; y: number };

const STORAGE_KEY = "sqlquest-hero-index";
const HERO = "🧙";
const STEP_MS = 520; // durasi meluncur antar node
const GAP_MS = 140; // jeda sebelum tiap langkah

/**
 * Posisi hero: berdiri di node "open" pertama (level yang sedang dikerjakan).
 * Jika semua level tuntas → index = nodes.length (posisi FINISH).
 */
function heroTargetIndex(nodes: MapNode[]): number {
  const open = nodes.findIndex((n) => n.status === "open");
  if (open !== -1) return open;
  if (nodes.length > 0 && nodes.every((n) => n.status === "done")) {
    return nodes.length; // finish
  }
  return 0;
}

export default function LevelMap({ nodes }: LevelMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const finishDotRef = useRef<HTMLDivElement | null>(null);

  const [heroPt, setHeroPt] = useState<Pt | null>(null);
  const [ready, setReady] = useState(false);
  const [moving, setMoving] = useState(false);

  const target = heroTargetIndex(nodes);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const delay = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    const measure = (): Pt[] => {
      const container = containerRef.current;
      if (!container) return [];
      const cRect = container.getBoundingClientRect();
      const cx = cRect.width / 2;
      const pts: Pt[] = [];
      for (const dot of dotRefs.current) {
        if (!dot) continue;
        const r = dot.getBoundingClientRect();
        pts.push({
          x: cx,
          y: r.top + r.height / 2 - cRect.top,
        });
      }
      const fin = finishDotRef.current;
      if (fin) {
        const r = fin.getBoundingClientRect();
        pts.push({
          x: cx,
          y: r.top + r.height / 2 - cRect.top,
        });
      }
      return pts;
    };

    const readLast = (): number => {
      try {
        const v = Number(sessionStorage.getItem(STORAGE_KEY) ?? "0");
        return Number.isFinite(v) ? v : 0;
      } catch {
        return 0;
      }
    };
    const writeLast = (v: number) => {
      try {
        sessionStorage.setItem(STORAGE_KEY, String(v));
      } catch {
        // mode privat / storage penuh — abaikan
      }
    };

    // Tunggu animasi entri node (pop-in stagger) selesai agar ukuran stabil
    const waitMs = nodes.length * 80 + 500;
    timer = setTimeout(async () => {
      if (cancelled) return;
      const pts = measure();
      if (pts.length === 0) return;

      let last = Math.min(readLast(), target);
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!reduceMotion && last < target && pts[last] && pts[target]) {
        // Hero melaju node demi node dari posisi terakhir yang dilihat
        setMoving(true);
        setHeroPt(pts[last]);
        setReady(true);
        for (let i = last + 1; i <= target; i++) {
          if (cancelled) return;
          await delay(GAP_MS);
          if (cancelled) return;
          if (pts[i]) setHeroPt(pts[i]);
          await delay(STEP_MS);
        }
        setMoving(false);
      } else {
        // Langsung tempatkan di posisi target (kunjungan baru / reduced motion)
        setHeroPt(pts[target] ?? pts[0] ?? { x: 0, y: 0 });
        setReady(true);
      }
      writeLast(target);
    }, waitMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [target, nodes.length]);

  const allDone = nodes.length > 0 && nodes.every((n) => n.status === "done");

  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex w-full max-w-xl flex-col items-center"
    >
      {/* Garis jalur utama */}
      <div
        aria-hidden
        className="absolute bottom-4 top-4 w-1 rounded-full bg-gradient-to-b from-quest/60 via-quest/25 to-succ/60"
      />

      {/* Hero — karakter pemain */}
      {ready && heroPt && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-30"
          style={{
            left: heroPt.x,
            top: heroPt.y,
            transitionProperty: "left, top",
            transitionDuration: moving ? `${STEP_MS}ms` : "0ms",
            transitionTimingFunction: "linear",
          }}
        >
          <div className="-translate-x-1/2 -translate-y-1/2">
            <span
              className={`block text-3xl leading-none drop-shadow-[0_0_10px_rgba(251,191,36,0.55)] ${
                moving ? "animate-bounce" : ""
              }`}
              style={moving ? { animationDuration: "420ms" } : undefined}
            >
              {HERO}
            </span>
            {/* bayangan kecil di bawah hero */}
            <div className="mx-auto mt-0.5 h-1 w-4 rounded-full bg-black/50" />
          </div>
        </div>
      )}

      {nodes.map((node, i) => {
        const isLocked = node.status === "locked";
        const isDone = node.status === "done";
        const pct =
          node.exerciseCount === 0
            ? 0
            : Math.round((node.doneCount / node.exerciseCount) * 100);
        const offset = i % 2 === 0 ? "self-start" : "self-end";

        const badge = isLocked ? (
          <span className="text-base" aria-hidden>🔒</span>
        ) : isDone ? (
          <span className="text-base font-bold text-succ" aria-hidden>✓</span>
        ) : (
          <span className="font-mono text-sm font-bold text-quest">{node.orderIndex}</span>
        );

        const nodeRing = isLocked
          ? "border-faint/30 bg-panel text-faint"
          : isDone
            ? "border-succ/70 bg-[#0d1a14] text-succ shadow-[0_0_12px_rgba(52,211,153,0.25)]"
            : "border-quest/70 bg-panel text-quest shadow-[0_0_12px_rgba(34,211,238,0.25)] animate-pulse-glow";

        return (
          <div
            key={node.id}
            className={`animate-pop-in relative z-10 mb-6 w-[86%] ${offset}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center gap-3">
              {/* Node bulat */}
              <div
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 ${nodeRing}`}
              >
                {badge}
              </div>

              {/* Kartu level */}
              {isLocked ? (
                <div className="flex-1 rounded-xl border border-edge bg-panel/30 px-4 py-3 opacity-70">
                  <div className="font-mono text-sm text-faint">
                    Level {node.orderIndex} — terkunci
                  </div>
                  <p className="mt-0.5 text-xs text-faint/70">
                    selesaikan level sebelumnya untuk membuka
                  </p>
                </div>
              ) : (
                <Link
                  href={`/learn/${node.slug}`}
                  className="group flex-1 rounded-xl border border-edge bg-panel/70 px-4 py-3 transition hover:border-quest/60 hover:bg-panel"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-phosphor group-hover:text-quest">
                      {node.title}
                    </span>
                    <span className="font-mono text-xs text-faint">
                      {node.doneCount}/{node.exerciseCount}
                      {isDone && <span className="ml-1 text-xp">★</span>}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-fog">
                    {node.description}
                  </p>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-ink">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isDone ? "bg-succ" : "bg-quest"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              )}
            </div>
          </div>
        );
      })}

      {/* Garis akhir */}
      <div
        key="finish"
        className="animate-pop-in relative z-10 mb-2 w-[86%] self-center"
        style={{ animationDelay: `${nodes.length * 80}ms` }}
      >
        <div className="flex items-center gap-3">
          <div
            ref={finishDotRef}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-xl ${
              allDone
                ? "border-xp bg-[#1c1505] shadow-[0_0_14px_rgba(251,191,36,0.4)]"
                : "border-faint/30 bg-panel opacity-60"
            }`}
          >
            🏁
          </div>
          <div
            className={`flex-1 rounded-xl border px-4 py-3 ${
              allDone
                ? "border-xp/50 bg-xp/10"
                : "border-edge bg-panel/30 opacity-60"
            }`}
          >
            <div className={`font-mono text-sm font-semibold ${allDone ? "text-xp" : "text-faint"}`}>
              FINISH
            </div>
            <p className="mt-0.5 text-xs text-fog">
              {allDone
                ? "semua level ditaklukkan — petualangan SQL-mu selesai!"
                : "bendera akhir petualangan"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
