import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

// Singleton: better-sqlite3 is synchronous & keeps one connection per process.
const globalForDb = globalThis as unknown as { sqlite?: Database.Database };

const raw =
  globalForDb.sqlite ??
  new Database(path.join(dataDir, "learn.db"));

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = raw;
}

export const sqlite = raw;
export const db = drizzle(raw);
