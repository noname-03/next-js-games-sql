import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { exercises, levels, progress } from "@/db/schema";
import LevelMap from "@/components/LevelMap";
import type { MapNode } from "@/components/LevelMap";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allLevels = db.select().from(levels).orderBy(levels.orderIndex).all();

  const levelRows = allLevels.map((level) => {
    const exerciseCount =
      db
        .select({ count: sql<number>`count(*)` })
        .from(exercises)
        .where(sql`${exercises.levelId} = ${level.id}`)
        .get()?.count ?? 0;

    const doneCount =
      db
        .select({ count: sql<number>`count(*)` })
        .from(progress)
        .innerJoin(exercises, sql`${progress.exerciseId} = ${exercises.id}`)
        .where(sql`${exercises.levelId} = ${level.id}`)
        .get()?.count ?? 0;

    const totalXp =
      db
        .select({ sum: sql<number | null>`coalesce(sum(${progress.xp}), 0)` })
        .from(progress)
        .innerJoin(exercises, sql`${progress.exerciseId} = ${exercises.id}`)
        .where(sql`${exercises.levelId} = ${level.id}`)
        .get()?.sum ?? 0;

    return { level, exerciseCount, doneCount, totalXp };
  });

  const totalDone = levelRows.reduce((acc, r) => acc + r.doneCount, 0);
  const totalCount = levelRows.reduce((acc, r) => acc + r.exerciseCount, 0);
  const totalXp = levelRows.reduce((acc, r) => acc + r.totalXp, 0);
  const allDone = totalCount > 0 && totalDone >= totalCount;

  // Hitung status unlock: level 1 terbuka; level n terbuka bila level n-1 selesai semua
  const mapNodes: MapNode[] = levelRows.map((row, i) => {
    const prevDone = i === 0 ? true : levelRows[i - 1].doneCount >= levelRows[i - 1].exerciseCount;
    const completed = row.doneCount >= row.exerciseCount && row.exerciseCount > 0;
    const status: MapNode["status"] = completed ? "done" : prevDone ? "open" : "locked";
    return {
      id: row.level.id,
      slug: row.level.slug,
      orderIndex: row.level.orderIndex,
      title: row.level.title,
      description: row.level.description,
      doneCount: row.doneCount,
      exerciseCount: row.exerciseCount,
      status,
    };
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 p-6">
      {/* Header quest */}
      <header className="flex flex-col gap-3 border-b border-edge pb-6 pt-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-quest">▲</span>
          <h1 className="text-3xl font-bold tracking-wide text-phosphor">
            SQL<span className="text-quest">_</span>QUEST
          </h1>
        </div>
        <p className="font-mono text-sm text-fog">
          <span className="text-quest">$</span> selamat datang, petualang.
          Taklukkan 10 level PostgreSQL dan raih XP sebanyak-banyaknya.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-sm">
          <span className="text-fog">
            progres:{" "}
            <span className="font-semibold text-phosphor">
              {totalDone}/{totalCount}
            </span>{" "}
            soal
          </span>
          <span className="text-fog">
            total XP:{" "}
            <span className="font-semibold text-xp">⚡ {totalXp}</span>
          </span>
          {allDone && (
            <span className="text-succ">✓ semua level ditaklukkan!</span>
          )}
        </div>

        {/* Progress bar global */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-ink">
          <div
            className="h-full rounded-full bg-gradient-to-r from-quest to-phosphor transition-all duration-700"
            style={{
              width: `${totalCount === 0 ? 0 : (totalDone / totalCount) * 100}%`,
            }}
          />
        </div>
      </header>

      {/* Peta petualangan */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="w-full max-w-xl text-left font-mono text-xs uppercase tracking-[0.2em] text-faint">
          // peta petualangan
        </h2>
        <LevelMap nodes={mapNodes} />
      </section>

      <footer className="border-t border-edge pt-4 pb-6 text-center font-mono text-xs text-faint">
        <span className="cursor-blink">ketik query, kalahkan database</span>
      </footer>
    </main>
  );
}
