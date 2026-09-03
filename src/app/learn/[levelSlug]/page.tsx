import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { exercises, levels, progress } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import SqlRunner from "@/components/SqlRunner";
import SchemaExplorer from "@/components/SchemaExplorer";

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
  const allDone =
    levelExercises.length > 0 && completedIds.size >= levelExercises.length;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      {/* Navigasi */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-sm text-fog transition hover:text-quest"
        >
          <span className="text-quest">←</span> peta level
        </Link>
        <span className="font-mono text-xs text-faint">
          [ {completedIds.size}/{levelExercises.length} ] soal selesai
        </span>
      </div>

      {/* Header level */}
      <header className="rounded-xl border border-edge bg-ink/60 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded border border-quest/40 bg-quest/10 px-2 py-0.5 font-mono text-xs text-quest">
            LEVEL {level.orderIndex}
          </span>
          {allDone && (
            <span className="rounded border border-succ/40 bg-succ/10 px-2 py-0.5 font-mono text-xs text-succ">
              ✓ COMPLETE
            </span>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-wide text-phosphor">
          {level.title}
        </h1>
        <p className="mt-1 font-mono text-sm text-fog">
          <span className="text-quest">$</span> {level.description}
        </p>
      </header>

      {/* Panel skema database */}
      <SchemaExplorer schemaJson={level.schemaJson} />

      {/* Daftar soal */}
      <div className="flex flex-col gap-6">
        {levelExercises.map((exercise, index) => {
          const isDone = completedIds.has(exercise.id);
          return (
            <section
              key={exercise.id}
              id={`exercise-${index + 1}`}
              className="rounded-xl border border-edge bg-panel/70 p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`rounded border px-2 py-0.5 font-mono text-xs ${
                    isDone
                      ? "border-succ/40 bg-succ/10 text-succ"
                      : "border-edge bg-panel-2 text-fog"
                  }`}
                >
                  {isDone ? "✓ DONE" : `SOAL ${index + 1}`}
                </span>
                <span className="font-mono text-xs text-faint">
                  // {exercise.title}
                </span>
              </div>

              <p className="font-mono text-sm leading-relaxed text-phosphor">
                {exercise.prompt}
              </p>

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
