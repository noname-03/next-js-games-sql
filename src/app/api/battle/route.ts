import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db/client";
import { exercises, levels } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { createBattle, type PlayerState } from "@/lib/battle-store";

// POST /api/battle — buat battle baru
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Login dulu" }, { status: 401 });
  }

  const body = await req.json();
  const { exerciseId } = body as { exerciseId: number };

  if (!exerciseId) {
    return NextResponse.json({ error: "exerciseId wajib" }, { status: 400 });
  }

  const ex = db.select().from(exercises).where(eq(exercises.id, exerciseId)).get();
  if (!ex) {
    return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 });
  }

  const battleId = crypto.randomUUID().slice(0, 8);
  const creator: PlayerState = {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    startedAt: null,
    attempts: 0,
    correctAt: null,
    status: "waiting",
  };

  createBattle({
    id: battleId,
    exerciseId: ex.id,
    datasetSql: ex.datasetSql,
    starterSql: ex.starterSql,
    solutionSql: ex.solutionSql,
    prompt: ex.prompt,
    creator,
  });

  return NextResponse.json({ battleId, exerciseId });
}
