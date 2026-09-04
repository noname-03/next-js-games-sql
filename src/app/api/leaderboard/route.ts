import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { exercises, levels, progress, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TOP = 10;

type LeaderRow = {
  rank: number;
  userId: number;
  displayName: string;
  username: string;
  value: number; // jumlah soal / total ms
};

// Cari posisi user dalam daftar terurut
function findUserRank(rows: { userId: number }[], userId: number): number | null {
  const idx = rows.findIndex((r) => r.userId === userId);
  return idx === -1 ? null : idx + 1;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const babRaw = url.searchParams.get("bab");
  const mode = url.searchParams.get("mode") ?? "progress";
  const bab = babRaw ? parseInt(babRaw, 10) : null;
  const session = await getSessionUser();

  const LEVELS_PER_CHAPTER = 10;

  // Ambil exercise bab bila diminta
  let chapterExerciseIds: number[] = [];
  if (bab !== null) {
    const startLv = (bab - 1) * LEVELS_PER_CHAPTER + 1;
    const endLv = bab * LEVELS_PER_CHAPTER;
    const chapterLevels = db
      .select({ id: levels.id })
      .from(levels)
      .where(sql`${levels.orderIndex} >= ${startLv} AND ${levels.orderIndex} <= ${endLv}`)
      .all();
    if (chapterLevels.length === 0) {
      return NextResponse.json({ rows: [], userRank: null });
    }
    const levelIds = chapterLevels.map((l) => l.id).join(",");
    chapterExerciseIds = db
      .select({ id: exercises.id })
      .from(exercises)
      .where(sql`${exercises.levelId} IN (${sql.raw(levelIds)})`)
      .all()
      .map((e) => e.id);
    if (chapterExerciseIds.length === 0) {
      return NextResponse.json({ rows: [], userRank: null });
    }
  }

  const exFilter = chapterExerciseIds.length > 0
    ? sql` AND ${progress.exerciseId} IN (${sql.raw(chapterExerciseIds.join(","))})`
    : sql``;

  let rows: LeaderRow[] = [];

  if (mode === "speed") {
    // --- KECEPATAN: total durasi; bab = wajib tuntas semua exercise bab ---
    let list: { userId: number; totalMs: number }[] = [];
    if (bab !== null) {
      const perUser = db
        .select({
          userId: progress.userId,
          totalMs: sql<number>`coalesce(sum(${progress.durationMs}), 0)`,
          doneCount: sql<number>`count(*)`,
        })
        .from(progress)
        .where(sql`${progress.userId} IS NOT NULL AND ${progress.durationMs} IS NOT NULL${exFilter}`)
        .groupBy(progress.userId)
        .all();
      // hanya yang tuntas SEMUA exercise bab
      list = perUser
        .filter((r) => r.userId !== null && r.doneCount >= chapterExerciseIds.length)
        .map((r) => ({ userId: r.userId as number, totalMs: r.totalMs }));
    } else {
      const perUser = db
        .select({
          userId: progress.userId,
          totalMs: sql<number>`coalesce(sum(${progress.durationMs}), 0)`,
        })
        .from(progress)
        .where(sql`${progress.userId} IS NOT NULL AND ${progress.durationMs} IS NOT NULL`)
        .groupBy(progress.userId)
        .all();
      list = perUser
        .filter((r) => r.userId !== null)
        .map((r) => ({ userId: r.userId as number, totalMs: r.totalMs }));
    }

    list.sort((a, b) => a.totalMs - b.totalMs);
    const top = list.slice(0, TOP);

    const idList = top.length > 0 ? top.map((t) => t.userId).join(",") : "0";
    const userMap = new Map(
      db
        .select()
        .from(users)
        .where(sql`${users.id} IN (${sql.raw(idList)})`)
        .all()
        .map((u) => [u.id, u])
    );

    rows = top.map((t, i) => {
      const u = userMap.get(t.userId);
      return {
        rank: i + 1,
        userId: t.userId,
        displayName: u?.displayName ?? "?",
        username: u?.username ?? "",
        value: t.totalMs,
      };
    });

    const userRank = session ? findUserRank(list, session.id) : null;
    return NextResponse.json({ rows, userRank });
  }

  // --- PROGRES: jumlah soal selesai ---
  const perUser = db
    .select({
      userId: progress.userId,
      doneCount: sql<number>`count(*)`,
    })
    .from(progress)
    .where(sql`${progress.userId} IS NOT NULL${exFilter}`)
    .groupBy(progress.userId)
    .all();

  perUser.sort((a, b) => b.doneCount - a.doneCount);
  const cleanPerUser = perUser.filter((r) => r.userId !== null) as {
    userId: number;
    doneCount: number;
  }[];
  const top = cleanPerUser.slice(0, TOP);
  const idList = top.length > 0 ? top.map((t) => t.userId).join(",") : "0";
  const userMap = new Map(
    db
      .select()
      .from(users)
      .where(sql`${users.id} IN (${sql.raw(idList)})`)
      .all()
      .map((u) => [u.id, u])
  );

  rows = top.map((t, i) => {
    const u = userMap.get(t.userId);
    return {
      rank: i + 1,
      userId: t.userId,
      displayName: u?.displayName ?? "?",
      username: u?.username ?? "",
      value: t.doneCount,
    };
  });

  const userRank = session ? findUserRank(cleanPerUser, session.id) : null;
  return NextResponse.json({ rows, userRank });
}
