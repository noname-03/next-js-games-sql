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
      {/* Header ceria */}
      <header className="mt-2 flex flex-col items-center gap-3 text-center">
        <div className="flex items-end gap-2 text-5xl">
          <span className="animate-bob inline-block">🐣</span>
          <span className="animate-bob inline-block" style={{ animationDelay: "0.15s" }}>⚡</span>
          <span className="animate-bob inline-block" style={{ animationDelay: "0.3s" }}>🐘</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-grape">
          SQL Quest
        </h1>
        <p className="max-w-md text-base font-semibold text-ink-soft">
          Petualangan seru belajar SQL! Selesaikan misi, kumpulkan XP, dan jadilah
          master database. 🚀
        </p>

        {/* Statistik */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-extrabold text-grape shadow-sm ring-1 ring-lilac">
            📚 {totalDone}/{totalCount} soal
          </span>
          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-extrabold text-peach shadow-sm ring-1 ring-lilac">
            ⚡ {totalXp} XP
          </span>
          {allDone && (
            <span className="rounded-full bg-mint-soft px-4 py-1.5 text-sm font-extrabold text-mint">
              🏆 semua level ditaklukkan!
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-4 w-full max-w-md overflow-hidden rounded-full bg-lilac/70 ring-1 ring-white">
          <div
            className="h-full rounded-full bg-gradient-to-r from-grape via-pink to-peach transition-all duration-700"
            style={{
              width: `${totalCount === 0 ? 0 : (totalDone / totalCount) * 100}%`,
            }}
          />
        </div>
      </header>

      {/* Peta petualangan */}
      <section className="flex flex-col items-center gap-3 rounded-[2rem] bg-white/70 p-6 shadow-sm ring-1 ring-lilac backdrop-blur">
        <h2 className="w-full text-center text-xl font-extrabold text-grape">
          🗺️ Peta Petualanganmu
        </h2>
        <p className="text-center text-sm font-semibold text-ink-soft">
          Ikuti jalurnya, selesaikan tiap level, dan lihat karaktermu melaju!
        </p>
        <LevelMap nodes={mapNodes} />
      </section>

      <footer className="pb-6 text-center text-sm font-bold text-ink-faint">
        dibuat dengan 💜 untuk para calon master database
      </footer>
    </main>
  );
}
