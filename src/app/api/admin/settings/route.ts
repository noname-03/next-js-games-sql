import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  let body: { penaltyPerWrong?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const penalty = Number(body.penaltyPerWrong);
  if (!Number.isFinite(penalty) || penalty < 0 || penalty > 120) {
    return NextResponse.json(
      { error: "Penalti harus angka 0-120 detik" },
      { status: 400 }
    );
  }

  db.insert(settings)
    .values({ key: "penalty_per_wrong", value: String(Math.round(penalty)) })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: String(Math.round(penalty)) },
    })
    .run();

  return NextResponse.json({ ok: true, penaltyPerWrong: penalty });
}
