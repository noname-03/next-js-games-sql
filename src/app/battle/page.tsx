import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db/client";
import { levels, exercises, battles, battleResults, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import BattleLobby from "@/components/BattleLobby";

export const dynamic = "force-dynamic";

export default async function BattlePage() {
  const user = await getCurrentUser();

  // Ambil level yang sudah selesai user ini (untuk pilih soal battle)
  const allLevels = db
    .select({
      id: levels.id,
      orderIndex: levels.orderIndex,
      title: levels.title,
      slug: levels.slug,
    })
    .from(levels)
    .orderBy(levels.orderIndex)
    .all();

  // Ambil battle history user ini (hanya jika login)
  const history = user ? db
    .select({
      id: battles.id,
      exerciseId: battles.exerciseId,
      player1Id: battles.player1Id,
      player2Id: battles.player2Id,
      status: battles.status,
      createdAt: battles.createdAt,
      finishedAt: battles.finishedAt,
    })
    .from(battles)
    .where(
      sql`${battles.player1Id} = ${user.id} OR ${battles.player2Id} = ${user.id}`
    )
    .orderBy(desc(battles.createdAt))
    .limit(20)
    .all() : [];

  // Ambil nama player untuk history
  const historyWithNames = user ? history.map((b) => {
    const p1 = db.select({ displayName: users.displayName }).from(users).where(eq(users.id, b.player1Id)).get();
    const p2 = db.select({ displayName: users.displayName }).from(users).where(eq(users.id, b.player2Id)).get();
    const myResult = db.select({ isWinner: battleResults.isWinner }).from(battleResults)
      .where(sql`${battleResults.battleId} = ${b.id} AND ${battleResults.userId} = ${user.id}`)
      .get();
    return {
      ...b,
      player1Name: p1?.displayName ?? "?",
      player2Name: p2?.displayName ?? "?",
      iWon: myResult?.isWinner ?? false,
    };
  }) : [];

  return (
    <BattleLobby
      userId={user?.id ?? 0}
      username={user?.username ?? ""}
      displayName={user?.displayName ?? ""}
      levels={allLevels}
      history={user ? historyWithNames : []}
      isLoggedIn={!!user}
    />
  );
}
