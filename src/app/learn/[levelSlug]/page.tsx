import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { exercises, levels, progress } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import SqlRunner from "@/components/SqlRunner";

export const dynamic = "force-dynamic";

export default async function LearnLevelPage({
  params,
}: {
  params: Promise<{ levelSlug: string }>;
}) {
  const { levelSlug } = await params;

  const level = db
    .select()
    .from(levels)
    .where(eq(levels.slug, levelSlug))
    .get();

  if (!level) notFound();

  const levelExercises = db
    .select()
    .from(exercises)
    .where(eq(exercises.levelId, level.id))
    .orderBy(exercises.orderIndex)
    .all();

  // Progress yang sudah tercatat
  const progressRows = db
    .select()
    .from(progress)
    .where(
      sql`${progress.exerciseId} IN (${sql.join(
        levelExercises.map((e) => sql`${e.id}`),
        sql`, `
      )})`
    )
    .all();

  const completedIds = new Set(progressRows.map((p) => p.exerciseId));

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          ← Semua level
        </Link>
        <span className="text-sm text-gray-500">
          {completedIds.size}/{levelExercises.length} selesai
        </span>
      </div>

      <header>
        <h1 className="text-2xl font-bold">{level.title}</h1>
        <p className="mt-1 text-gray-600">{level.description}</p>
      </header>

      <div className="flex flex-col gap-8">
        {levelExercises.map((exercise, index) => {
          const isDone = completedIds.has(exercise.id);
          return (
            <section
              key={exercise.id}
              id={`exercise-${index + 1}`}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  Soal {index + 1}
                </span>
                {isDone && (
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    ✓ Selesai
                  </span>
                )}
              </div>
              <h2 className="text-lg font-semibold">{exercise.title}</h2>
              <p className="mt-2 text-gray-700">{exercise.prompt}</p>

              <div className="mt-4">
                <SqlRunner
                  exerciseId={exercise.id}
                  datasetSql={exercise.datasetSql}
                  starterSql={exercise.starterSql}
                  solutionSql={exercise.solutionSql}
                />
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
