import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const levels = sqliteTable("levels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  orderIndex: integer("order_index").notNull(),
  schemaJson: text("schema_json"),
  // Materi level: istilah/konsep baru + penjelasan singkat (ditampilkan sebelum soal)
  concept: text("concept"),
  explanation: text("explanation"),
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

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const progress = sqliteTable("progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["done"] }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  // Durasi terbaik (ms) sampai jawaban benar — dipakai leaderboard kecepatan
  durationMs: integer("duration_ms"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Level = typeof levels.$inferSelect;
export type NewLevel = typeof levels.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type ProgressRow = typeof progress.$inferSelect;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ===== Battle tables =====
export const battles = sqliteTable("battles", {
  id: text("id").primaryKey(), // UUID pendek
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id),
  player1Id: integer("player1_id")
    .notNull()
    .references(() => users.id),
  player2Id: integer("player2_id")
    .notNull()
    .references(() => users.id),
  status: text("status", { enum: ["active", "finished", "cancelled"] }).notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
});

export const battleResults = sqliteTable("battle_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  battleId: text("battle_id")
    .notNull()
    .references(() => battles.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  attempts: integer("attempts").notNull().default(0),
  durationMs: integer("duration_ms"),
  isWinner: integer("is_winner", { mode: "boolean" }).notNull().default(false),
});
