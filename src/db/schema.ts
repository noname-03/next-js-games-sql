import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const levels = sqliteTable("levels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  orderIndex: integer("order_index").notNull(),
});

export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  levelId: integer("level_id")
    .notNull()
    .references(() => levels.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  hint: text("hint"),
  datasetSql: text("dataset_sql").notNull(),
  starterSql: text("starter_sql").notNull(),
  solutionSql: text("solution_sql").notNull(),
  orderIndex: integer("order_index").notNull(),
});

export const progress = sqliteTable("progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["done"] }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Level = typeof levels.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type ProgressRow = typeof progress.$inferSelect;
