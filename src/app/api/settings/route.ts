import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const row = db
    .select()
    .from(settings)
    .where(eq(settings.key, "penalty_per_wrong"))
    .get();
  return NextResponse.json({
    penaltyPerWrong: Number(row?.value ?? "0") || 0,
  });
}
