import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { exercises, levels, progress } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import SqlRunner from "@/components/SqlRunner";
import SchemaExplorer from "@/components/SchemaExplorer";
import LevelSnakeMap from "@/components/LevelSnakeMap";

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
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-5 p-4 sm:p-6">
      {/* Navigasi */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="rounded-full bg-white px-4 py-1.5 text-sm font-extrabold text-grape shadow-sm ring-1 ring-lilac transition hover:-translate-x-0.5 hover:shadow"
        >
          ← Kembali ke Peta
        </Link>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-extrabold text-ink-soft shadow-sm ring-1 ring-lilac">
          {completedIds.size}/{levelExercises.length} soal ✅
        </span>
      </div>

      {/* Header level */}
      <header className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-grape via-grape-deep to-pink p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-6 -top-8 text-8xl opacity-20">
          🐘
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-extrabold backdrop-blur">
            Level {level.orderIndex}
          </span>
          {allDone && (
            <span className="rounded-full bg-sun px-3 py-1 text-sm font-extrabold text-ink">
              🏆 Level Selesai!
            </span>
          )}
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight">
          {level.title}
        </h1>
        <p className="mt-1 max-w-xl text-sm font-semibold text-white/85">
          {level.description}
        </p>

        {allDone && (
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-display text-sm font-extrabold text-grape shadow transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            🐣 Lihat karaktermu melaju di peta →
          </Link>
        )}
      </header>

      {/* Peta misi ular */}
      <section className="rounded-[1.75rem] bg-white p-4 shadow-sm ring-1 ring-lilac">
        <h2 className="mb-1 text-center font-display text-lg font-extrabold text-grape">
          🗺️ Peta Misi Level Ini
        </h2>
        <p className="mb-3 text-center text-xs font-bold text-ink-soft">
          klik bulatan untuk lompat ke soal · karaktermu maju tiap jawaban benar!
        </p>
        <LevelSnakeMap
          exercises={levelExercises.map((e) => ({
            id: e.id,
            orderIndex: e.orderIndex,
            title: e.title,
          }))}
          completedIds={[...completedIds]}
        />
      </section>

      {/* Panel skema database */}
      <SchemaExplorer schemaJson={level.schemaJson} />

      {/* Daftar soal */}
      <div className="flex flex-col gap-5">
        {levelExercises.map((exercise, index) => {
          const isDone = completedIds.has(exercise.id);
          return (
            <section
              key={exercise.id}
              id={`exercise-${index + 1}`}
              className={`scroll-mt-4 rounded-[1.75rem] border-2 bg-white p-5 shadow-sm transition ${
                isDone ? "border-mint/70" : "border-lilac"
              }`}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-extrabold text-white ${
                    isDone ? "bg-mint" : "bg-grape"
                  }`}
                >
                  {isDone ? "✓" : index + 1}
                </span>
                <span className="font-display text-base font-extrabold text-ink">
                  {exercise.title}
                </span>
                {isDone && (
                  <span className="ml-auto rounded-full bg-mint-soft px-3 py-1 text-xs font-extrabold text-mint">
                    Selesai! ⭐
                  </span>
                )}
              </div>

              <p className="rounded-2xl bg-lav/60 p-3 text-sm font-semibold leading-relaxed text-ink">
                🎯 {exercise.prompt}
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
