"use client";

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

/**
 * Peta level bergaya quest: jalur zigzag vertikal (Duolingo-like).
 * Dibuat dengan CSS murni (flex + offset), node berbentuk bulat,
 * garis penghubung vertikal, status terkunci/terbuka/selesai.
 */
export default function LevelMap({ nodes }: LevelMapProps) {
  return (
    <div className="relative mx-auto flex w-full max-w-xl flex-col items-center">
      {/* Garis jalur utama (di belakang node) */}
      <div
        aria-hidden
        className="absolute bottom-4 top-4 w-1 rounded-full bg-gradient-to-b from-quest/60 via-quest/25 to-succ/60"
      />

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
    </div>
  );
}
