import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { exercises, levels, progress } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import LearningLayout from "@/components/LearningLayout";
import PagedExercises from "@/components/PagedExercises";

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

  const snakeExercises = levelExercises.map((e) => ({
    id: e.id,
    orderIndex: e.orderIndex,
    title: e.title,
  }));

  const pagedExercises = levelExercises.map((e) => ({
    id: e.id,
    orderIndex: e.orderIndex,
    title: e.title,
    prompt: e.prompt,
    datasetSql: e.datasetSql,
    starterSql: e.starterSql,
    solutionSql: e.solutionSql,
  }));

  return (
    <LearningLayout
      level={{
        orderIndex: level.orderIndex,
        title: level.title,
        description: level.description,
        slug: level.slug,
      }}
      exercises={snakeExercises}
      completedIds={[...completedIds]}
      allDone={allDone}
      schemaJson={level.schemaJson}
    >
      <PagedExercises
        exercises={pagedExercises}
        completedIds={[...completedIds]}
      />
    </LearningLayout>
  );
}
