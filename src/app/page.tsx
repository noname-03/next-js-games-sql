import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { exercises, levels, progress } from "@/db/schema";

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
        <p className="text-sm text-fog">
          <span className="text-quest">$</span> selamat datang, petualang.
          Taklukkan 10 level PostgreSQL dan raih XP sebanyak-banyaknya.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-fog">
            progres:{" "}
            <span className="font-semibold text-phosphor">
              {totalDone}/{totalCount}
            </span>{" "}
            soal
          </span>
          <span className="text-fog">
            total XP: <span className="font-semibold text-xp">⚡ {totalXp}</span>
          </span>
          {allDone && (
            <span className="text-succ">✓ semua level ditaklukkan — kamu hebat!</span>
          )}
        </div>

        {/* Progress bar global */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-ink">
          <div
            className="h-full rounded-full bg-gradient-to-r from-quest to-phosphor transition-all duration-700"
            style={{ width: `${totalCount === 0 ? 0 : (totalDone / totalCount) * 100}%` }}
          />
        </div>
      </header>

      {/* Daftar level — dipetakan ulang jadi peta di commit berikutnya */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-[0.2em] text-faint">
          // pilih level untuk memulai
        </h2>
        {levelRows.map(({ level, exerciseCount, doneCount }) => {
          const pct = exerciseCount === 0 ? 0 : Math.round((doneCount / exerciseCount) * 100);
          const completed = doneCount >= exerciseCount && exerciseCount > 0;
          return (
            <Link
              key={level.id}
              href={`/learn/${level.slug}`}
              className="group rounded-xl border border-edge bg-ink/60 p-5 transition hover:border-quest/60 hover:bg-panel"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-mono text-sm ${
                      completed
                        ? "border-succ/50 bg-succ/10 text-succ"
                        : "border-edge bg-panel-2 text-quest group-hover:border-quest/50"
                    }`}
                  >
                    {completed ? "✓" : level.orderIndex}
                  </span>
                  <div>
                    <h3 className="font-semibold text-phosphor group-hover:text-quest">
                      {level.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-fog">{level.description}</p>
                  </div>
                </div>
                <span className="shrink-0 font-mono text-xs text-faint">
                  {doneCount}/{exerciseCount}
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    completed ? "bg-succ" : "bg-quest"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Link>
          );
        })}
      </section>

      <footer className="border-t border-edge pt-4 pb-6 text-center font-mono text-xs text-faint">
        <span className="cursor-blink">ketik query, kalahkan database</span>
      </footer>
    </main>
  );
}
