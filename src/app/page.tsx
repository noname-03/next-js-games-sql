import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { exercises, levels, progress } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allLevels = db.select().from(levels).orderBy(levels.orderIndex).all();

  const levelRows = allLevels.map((level) => {
    const exerciseCount = db
      .select({ count: sql<number>`count(*)` })
      .from(exercises)
      .where(sql`${exercises.levelId} = ${level.id}`)
      .get()?.count ?? 0;

    const doneCount = db
      .select({ count: sql<number>`count(*)` })
      .from(progress)
      .innerJoin(exercises, sql`${progress.exerciseId} = ${exercises.id}`)
      .where(sql`${exercises.levelId} = ${level.id}`)
      .get()?.count ?? 0;

    const totalXp = db
      .select({ sum: sql<number | null>`coalesce(sum(${progress.xp}), 0)` })
      .from(progress)
      .innerJoin(exercises, sql`${progress.exerciseId} = ${exercises.id}`)
      .where(sql`${exercises.levelId} = ${level.id}`)
      .get()?.sum ?? 0;

    return { level, exerciseCount, doneCount, totalXp };
  });

  const totalDone = levelRows.reduce((acc, r) => acc + r.doneCount, 0);
  const totalCount = levelRows.reduce((acc, r) => acc + r.exerciseCount, 0);
  const allDone = totalCount > 0 && totalDone >= totalCount;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2 pt-6">
        <h1 className="text-3xl font-bold">SQL Quest</h1>
        <p className="text-gray-600">
          Game pembelajaran SQL. Selesaikan setiap level untuk menaklukkan
          PostgreSQL!
        </p>
        {allDone ? (
          <p className="text-emerald-600">Selamat, kamu sudah menyelesaikan semua level! 🎉</p>
        ) : (
          <p className="text-sm text-gray-500">
            Progress: {totalDone}/{totalCount} exercise selesai
          </p>
        )}
      </header>

      <section className="flex flex-col gap-4">
        {levelRows.map(({ level, exerciseCount, doneCount }) => {
          const pct = exerciseCount === 0 ? 0 : Math.round((doneCount / exerciseCount) * 100);
          return (
            <Link
              key={level.id}
              href={`/learn/${level.slug}`}
              className="group rounded-2xl border border-gray-200 p-5 transition hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold group-hover:text-indigo-700">
                    {level.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">{level.description}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {doneCount}/{exerciseCount}
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
