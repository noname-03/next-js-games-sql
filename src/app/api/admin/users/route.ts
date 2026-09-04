import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { exercises, progress, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/users — daftar user + ringkasan progress
export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const userRows = db.select().from(users).orderBy(users.id).all();

  const stats = userRows.map((u) => {
    const agg = db
      .select({
        done: sql<number>`count(*)`,
        xp: sql<number>`coalesce(sum(${progress.xp}), 0)`,
      })
      .from(progress)
      .where(sql`${progress.userId} = ${u.id}`)
      .get();
    // level terakhir yang disentuh (max order_index exercise yang selesai)
    const lastLv = db
      .select({
        maxOrder: sql<number | null>`max(${exercises.orderIndex})`,
      })
      .from(progress)
      .innerJoin(exercises, sql`${progress.exerciseId} = ${exercises.id}`)
      .where(sql`${progress.userId} = ${u.id}`)
      .get()?.maxOrder;

    const lastProgress = db
      .select({ updatedAt: progress.updatedAt })
      .from(progress)
      .where(sql`${progress.userId} = ${u.id}`)
      .orderBy(sql`${progress.updatedAt} desc`)
      .get();

    return {
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      role: u.role,
      createdAt: u.createdAt,
      doneCount: agg?.done ?? 0,
      xp: agg?.xp ?? 0,
      lastLevel: lastLv ?? null,
      lastActive: lastProgress?.updatedAt ?? null,
    };
  });

  // Ringkasan global
  const global = db
    .select({
      totalDone: sql<number>`count(*)`,
      totalXp: sql<number>`coalesce(sum(${progress.xp}), 0)`,
    })
    .from(progress)
    .get();

  return NextResponse.json({
    stats: {
      userCount: userRows.length,
      totalDone: global?.totalDone ?? 0,
      totalXp: global?.totalXp ?? 0,
    },
    users: stats,
  });
}
