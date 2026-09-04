import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { progress } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan login dulu" }, { status: 401 });
  }

  let body: { exerciseId?: number; attempts?: number; xp?: number; durationMs?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const exerciseId = body.exerciseId;
  const attempts = typeof body.attempts === "number" ? body.attempts : 1;
  const xp = typeof body.xp === "number" ? body.xp : 10;
  const durationMs =
    typeof body.durationMs === "number" && body.durationMs > 0
      ? Math.round(body.durationMs)
      : null;

  if (!exerciseId || typeof exerciseId !== "number") {
    return NextResponse.json({ error: "exerciseId wajib diisi" }, { status: 400 });
  }

  const existing = db
    .select({ id: progress.id, durationMs: progress.durationMs })
    .from(progress)
    .where(
      and(
        eq(progress.userId, session.id),
        eq(progress.exerciseId, exerciseId)
      )
    )
    .get();

  if (existing) {
    // Simpan durasi TERBAIK (terkecil); data lama NULL dianggap tak terbatas
    const bestDuration =
      durationMs !== null &&
      (existing.durationMs === null || durationMs < existing.durationMs)
        ? durationMs
        : existing.durationMs;

    db.update(progress)
      .set({
        attempts,
        xp,
        durationMs: bestDuration,
        updatedAt: new Date(),
      })
      .where(eq(progress.id, existing.id))
      .run();
  } else {
    db.insert(progress)
      .values({
        userId: session.id,
        exerciseId,
        status: "done",
        attempts,
        xp,
        durationMs,
        updatedAt: new Date(),
      })
      .run();
  }

  return NextResponse.json({ ok: true });
}
