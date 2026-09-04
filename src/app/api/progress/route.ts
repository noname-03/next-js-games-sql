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

  let body: { exerciseId?: number; attempts?: number; xp?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const exerciseId = body.exerciseId;
  const attempts = typeof body.attempts === "number" ? body.attempts : 1;
  const xp = typeof body.xp === "number" ? body.xp : 10;

  if (!exerciseId || typeof exerciseId !== "number") {
    return NextResponse.json({ error: "exerciseId wajib diisi" }, { status: 400 });
  }

  const existing = db
    .select({ id: progress.id })
    .from(progress)
    .where(
      and(
        eq(progress.userId, session.id),
        eq(progress.exerciseId, exerciseId)
      )
    )
    .get();

  if (existing) {
    db.update(progress)
      .set({
        attempts,
        xp,
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
        updatedAt: new Date(),
      })
      .run();
  }

  return NextResponse.json({ ok: true });
}
