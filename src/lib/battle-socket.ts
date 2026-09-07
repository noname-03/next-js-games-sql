/**
 * Socket.io event handlers untuk battle system.
 * Dipanggil dari custom server.ts setelah Socket.io diinisialisasi.
 */
import type { Server as SocketIOServer, Socket } from "socket.io";
import {
  createBattle,
  getBattle,
  joinBattle,
  startCountdown,
  activateBattle,
  recordAttempt,
  recordCorrect,
  finishBattle,
  cleanupOld,
  type PlayerState,
  type BattleState,
} from "./battle-store";
import { db } from "@/db/client";
import { exercises, levels, battles as battlesTable, battleResults } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

/** Serialize battle untuk dikirim ke client (hapus solutionSql) */
function safeState(b: BattleState) {
  return {
    id: b.id,
    exerciseId: b.exerciseId,
    prompt: b.prompt,
    datasetSql: b.datasetSql,
    starterSql: b.starterSql,
    players: b.players.map((p) => ({
      userId: p.userId,
      displayName: p.displayName,
      status: p.status,
      attempts: p.attempts,
      // Jangan kirim correctAt ke lawan — beri tahu setelah selesai
    })),
    status: b.status,
  };
}

/** Serialize untuk pemenang — kirim solusi setelah battle selesai */
function finishedState(b: BattleState) {
  return {
    ...safeState(b),
    solutionSql: b.solutionSql,
    players: b.players.map((p) => ({
      userId: p.userId,
      displayName: p.displayName,
      status: p.status,
      attempts: p.attempts,
      durationMs: p.correctAt && p.startedAt ? p.correctAt - p.startedAt : null,
    })),
  };
}

/** Simpan hasil battle ke SQLite */
function persistBattle(b: BattleState) {
  try {
    const p0 = b.players[0];
    const p1 = b.players[1];
    if (!p0 || !p1) return;

    const dur0 = p0.correctAt && p0.startedAt ? p0.correctAt - p0.startedAt : null;
    const dur1 = p1.correctAt && p1.startedAt ? p1.correctAt - p1.startedAt : null;

    // Insert battle record
    const battleRow = db
      .insert(battlesTable)
      .values({
        id: b.id,
        exerciseId: b.exerciseId,
        player1Id: p0.userId,
        player2Id: p1.userId,
        status: "finished",
        createdAt: new Date(b.createdAt),
        finishedAt: new Date(),
      })
      .returning()
      .get();

    // Insert results
    for (const p of b.players) {
      const dur = p.correctAt && p.startedAt ? p.correctAt - p.startedAt : null;
      db.insert(battleResults)
        .values({
          battleId: b.id,
          userId: p.userId,
          attempts: p.attempts,
          durationMs: dur,
          isWinner: false, // hitung di bawah
        })
        .run();
    }

    // Tentukan pemenang: yang benar duluan, atau yang attempts lebih sedikit
    const winner = determineWinner(b);
    if (winner) {
      db.update(battleResults)
        .set({ isWinner: true })
        .where(and(eq(battleResults.battleId, b.id), eq(battleResults.userId, winner.userId)))
        .run();
    }
  } catch (err) {
    console.error("Gagal simpan battle:", err);
  }
}

function determineWinner(b: BattleState): PlayerState | null {
  const done = b.players.filter((p) => p.status === "done");
  if (done.length === 0) return null;
  if (done.length === 1) return done[0];
  // Keduanya selesai — yang duluan menang
  return done[0].correctAt! <= done[1].correctAt! ? done[0] : done[1];
}

/** Cleanup interval */
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

export function initBattleSocket(io: SocketIOServer) {
  // Cleanup old battles every 10 min
  if (!cleanupTimer) {
    cleanupTimer = setInterval(() => {
      const n = cleanupOld();
      if (n > 0) console.log(`[battle] cleaned up ${n} old battles`);
    }, 10 * 60 * 1000);
  }

  const battleNs = io.of("/battle");

  battleNs.on("connection", (socket: Socket) => {
    console.log(`[battle] client connected: ${socket.id}`);
    let currentBattleId: string | null = null;
    let currentUserId: number | null = null;

    // ===== CREATE BATTLE =====
    socket.on("create", (data: { exerciseId: number; userId: number; username: string; displayName: string }) => {
      const { exerciseId, userId, username, displayName } = data;

      // Ambil exercise dari DB
      const ex = db.select().from(exercises).where(eq(exercises.id, exerciseId)).get();
      if (!ex) {
        socket.emit("error", { message: "Soal tidak ditemukan" });
        return;
      }

      const battleId = crypto.randomUUID().slice(0, 8);
      const creator: PlayerState = {
        userId,
        username,
        displayName,
        startedAt: null,
        attempts: 0,
        correctAt: null,
        status: "waiting",
      };

      const battle = createBattle({
        id: battleId,
        exerciseId: ex.id,
        datasetSql: ex.datasetSql,
        starterSql: ex.starterSql,
        solutionSql: ex.solutionSql,
        prompt: ex.prompt,
        creator,
      });

      socket.join(`battle:${battleId}`);
      currentBattleId = battleId;
      currentUserId = userId;

      socket.emit("created", { battleId, state: safeState(battle) });
      console.log(`[battle] ${displayName} created ${battleId}`);
    });

    // ===== JOIN BATTLE =====
    socket.on("join", (data: { battleId: string; userId: number; username: string; displayName: string }) => {
      const { battleId, userId, username, displayName } = data;

      const player: PlayerState = {
        userId,
        username,
        displayName,
        startedAt: null,
        attempts: 0,
        correctAt: null,
        status: "waiting",
      };

      const battle = joinBattle(battleId, player);
      if (!battle) {
        socket.emit("error", { message: "Battle tidak ditemukan atau sudah penuh" });
        return;
      }

      socket.join(`battle:${battleId}`);
      currentBattleId = battleId;
      currentUserId = userId;

      // Beri tahu semua orang ada yang join
      battleNs.to(`battle:${battleId}`).emit("player-joined", safeState(battle));
      console.log(`[battle] ${displayName} joined ${battleId}`);

      // Auto-start countdown setelah 2 detik
      setTimeout(() => {
        const b = startCountdown(battleId);
        if (b) {
          battleNs.to(`battle:${battleId}`).emit("countdown", safeState(b));
          // Activate setelah 3 detik countdown
          setTimeout(() => {
            const b2 = activateBattle(battleId);
            if (b2) {
              battleNs.to(`battle:${battleId}`).emit("battle-start", safeState(b2));
            }
          }, 3000);
        }
      }, 2000);
    });

    // ===== SUBMIT ATTEMPT =====
    socket.on("attempt", (data: { battleId: string; userId: number; correct: boolean }) => {
      const { battleId, userId, correct } = data;

      if (correct) {
        const battle = recordCorrect(battleId, userId);
        if (battle) {
          if (battle.status === "finished") {
            // Semua selesai — kirim hasil lengkap
            persistBattle(battle);
            battleNs.to(`battle:${battleId}`).emit("battle-finished", finishedState(battle));
          } else {
            // Satu player selesai, yang lain masih main
            battleNs.to(`battle:${battleId}`).emit("opponent-done", safeState(battle));
          }
        }
      } else {
        recordAttempt(battleId, userId);
        // Update attempt count ke lawan
        const battle = getBattle(battleId);
        if (battle) {
          battleNs.to(`battle:${battleId}`).emit("opponent-attempt", safeState(battle));
        }
      }
    });

    // ===== FORFEIT / LEAVE =====
    socket.on("forfeit", (data: { battleId: string; userId: number }) => {
      const battle = finishBattle(data.battleId);
      if (battle) {
        persistBattle(battle);
        battleNs.to(`battle:${data.battleId}`).emit("battle-finished", finishedState(battle));
      }
    });

    // ===== DISCONNECT =====
    socket.on("disconnect", () => {
      if (currentBattleId) {
        const battle = getBattle(currentBattleId);
        if (battle && battle.status === "active") {
          // Player disconnect saat battle aktif — treat as forfeit
          const finished = finishBattle(currentBattleId);
          if (finished) {
            persistBattle(finished);
            battleNs.to(`battle:${currentBattleId}`).emit("battle-finished", finishedState(finished));
          }
        }
      }
      console.log(`[battle] client disconnected: ${socket.id}`);
    });
  });
}
