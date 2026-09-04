"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Flag, Lock, PersonStanding } from "lucide-react";

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
const STEP_MS = 520; // durasi meluncur antar level
const GAP_MS = 140; // jeda sebelum tiap langkah

// Warna node bergantian biar peta ceria
const NODE_COLORS = [
  { bg: "#ede9fe", border: "#8b5cf6", text: "#7c3aed" },
  { bg: "#fce7f3", border: "#f472b6", text: "#db2777" },
  { bg: "#fff7ed", border: "#fb923c", text: "#ea580c" },
  { bg: "#d1fae5", border: "#34d399", text: "#059669" },
];

/**
 * Layout "rel kiri": semua nomor level sejajar di kolom kiri (seperti daftar/
 * timeline), garis jalur & hero mengikuti kolom itu — tidak menutupi kartu.
 * Kartu level di kanan berselang (genap rata kiri, ganjil rata kanan) supaya
 * tetap terasa seperti peta berkelok.
 */

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
  // Posisi garis jalur (rel kiri): top & tinggi dihitung dari titik node pertama & finish
  const [rail, setRail] = useState<{ top: number; height: number } | null>(null);

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
      // Hero berjalan di kolom jalur khusus (paling kiri, selebar 48px).
      // x konstan = pusat kolom jalur (24px). y mengikuti tinggi node (sama
      // dengan tinggi baris karena items-center).
      const LANE_CENTER_X = 24;
      const pts: Pt[] = [];
      for (const dot of dotRefs.current) {
        if (!dot) continue;
        const r = dot.getBoundingClientRect();
        pts.push({
          x: LANE_CENTER_X,
          y: r.top + r.height / 2 - cRect.top,
        });
      }
      const fin = finishDotRef.current;
      if (fin) {
        const r = fin.getBoundingClientRect();
        pts.push({
          x: LANE_CENTER_X,
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

      // Gambar garis rel dari titik pertama sampai titik finish
      setRail({ top: pts[0].y, height: pts[pts.length - 1].y - pts[0].y });

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
      className="relative mx-auto w-full max-w-xl"
    >
      {/* Rel kiri: garis jalur di kolom kosong khusus (pusat x=24) */}
      {rail && (
        <div
          aria-hidden
          className="absolute w-1.5 rounded-full bg-gradient-to-b from-grape/60 via-pink/50 to-peach/60"
          style={{
            left: 24 - 3, // pusat kolom jalur (24px) dikurangi separuh tebal garis
            top: rail.top,
            height: rail.height,
          }}
        />
      )}

      {/* Hero — berjalan di rel kiri (kolom nomor level) */}
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
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-grape to-pink text-white shadow-lg ring-4 ring-white ${
                moving ? "animate-bounce" : ""
              }`}
              style={moving ? { animationDuration: "420ms" } : undefined}
            >
              <PersonStanding className="h-6 w-6" />
            </div>
            <div className="mx-auto mt-0.5 h-1.5 w-5 rounded-full bg-ink/15" />
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
        // Genap: kartu di kiri dekat node · Ganjil: kartu di kanan (berselang)
        const cardAlign = i % 2 === 1 ? "ml-auto" : "";
        const c = NODE_COLORS[i % NODE_COLORS.length];

        const badge = isLocked ? (
          <Lock className="h-5 w-5" />
        ) : isDone ? (
          <Check className="h-6 w-6" strokeWidth={3.5} />
        ) : (
          <span className="font-display text-lg font-extrabold">{node.orderIndex}</span>
        );

        const nodeStyle = isLocked
          ? { backgroundColor: "#f1f1f6", borderColor: "#d9d9e8", color: "#b0b0c8" }
          : isDone
            ? { backgroundColor: "#d1fae5", borderColor: "#34d399", color: "#059669" }
            : {
                backgroundColor: c.bg,
                borderColor: c.border,
                color: c.text,
                boxShadow: `0 6px 16px ${c.border}44`,
              };

        return (
          <div
            key={node.id}
            className="animate-pop-in relative z-10 mb-5 flex w-full items-center gap-3 pl-12"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Kolom jalur kosong (48px) — tempat hero berjalan, tanpa konten */}
            <div className="pointer-events-none absolute left-0 top-1/2 h-0 w-12 -translate-y-1/2" />

            {/* Node bulat bernomor */}
            <div
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              className="z-20 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] bg-white"
              style={nodeStyle}
            >
              {badge}
            </div>

            {/* Kartu level — berselang kiri/kanan */}
            {isLocked ? (
              <div className={`flex-1 rounded-2xl border-2 border-lilac bg-white/60 px-4 py-3 opacity-75 ${cardAlign}`}>
                <div className="font-display text-sm font-bold text-ink-faint">
                  Level {node.orderIndex} · terkunci
                </div>
                <p className="mt-0.5 text-xs font-semibold text-ink-faint/80">
                  selesaikan level sebelumnya untuk membuka
                </p>
              </div>
            ) : (
              <Link
                href={`/learn/${node.slug}`}
                className={`group flex-1 rounded-2xl border-2 border-lilac bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${cardAlign}`}
                style={{ boxShadow: `0 4px 0 ${c.border}33` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display text-sm font-extrabold text-ink group-hover:text-grape">
                    {node.title}
                  </span>
                  <span className="rounded-full bg-lav px-2 py-0.5 text-xs font-extrabold text-ink-soft">
                    {node.doneCount}/{node.exerciseCount}
                    {isDone && (
                      <Check className="ml-1 inline h-3 w-3 text-sun" strokeWidth={3} />
                    )}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-ink-soft">
                  {node.description}
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-lav">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isDone ? "bg-mint" : ""
                    }`}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isDone ? undefined : c.border,
                    }}
                  />
                </div>
              </Link>
            )}
          </div>
        );
      })}

      {/* Garis akhir — node finish di kolom yang sama (setelah padding 48px) */}
      <div
        key="finish"
        className="animate-pop-in relative z-10 mb-2 flex w-full items-center gap-3 pl-12"
        style={{ animationDelay: `${nodes.length * 80}ms` }}
      >
        <div className="pointer-events-none absolute left-0 top-1/2 h-0 w-12 -translate-y-1/2" />

        <div
          ref={finishDotRef}
          className={`z-20 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] bg-white transition ${
            allDone
              ? "border-sun bg-sun/20 text-peach"
              : "border-lilac text-ink-faint opacity-80"
          }`}
        >
          <Flag className="h-6 w-6" />
        </div>
        <div
          className={`flex-1 rounded-2xl border-2 px-4 py-3 transition ${
            allDone
              ? "border-sun bg-sun/10"
              : "border-lilac bg-white/60 opacity-70"
          }`}
        >
          <div
            className={`flex items-center gap-1.5 font-display text-sm font-extrabold ${
              allDone ? "text-peach" : "text-ink-faint"
            }`}
          >
            <Flag className="h-4 w-4" /> FINISH
          </div>
          <p className="mt-0.5 text-xs font-semibold text-ink-soft">
            {allDone
              ? "kamu sudah menaklukkan semua level — luar biasa!"
              : "garis akhir petualanganmu"}
          </p>
        </div>
      </div>
    </div>
  );
}
