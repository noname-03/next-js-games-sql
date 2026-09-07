import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

// Inline battle store (tanpa alias @/ yang butuh bundler)
import Database from "better-sqlite3";
import path from "path";
import crypto from "crypto";

// ===== In-memory battle store =====
type PlayerState = {
  userId: number;
  username: string;
  displayName: string;
  startedAt: number | null;
  attempts: number;
  correctAt: number | null;
  status: "waiting" | "playing" | "done";
};

type BattleState = {
  id: string;
  exerciseId: number;
  datasetSql: string;
  starterSql: string;
  solutionSql: string;
  prompt: string;
  players: PlayerState[];
  status: "waiting" | "countdown" | "active" | "finished";
  countdownStart: number | null;
  createdAt: number;
};

const battles = new Map<string, BattleState>();

function createBattle(opts: { id: string; exerciseId: number; datasetSql: string; starterSql: string; solutionSql: string; prompt: string; creator: PlayerState }): BattleState {
  const battle: BattleState = { ...opts, players: [opts.creator], status: "waiting", countdownStart: null, createdAt: Date.now() };
  battles.set(battle.id, battle);
  return battle;
}
function getBattle(id: string) { return battles.get(id); }
function joinBattle(id: string, player: PlayerState) {
  const b = battles.get(id);
  if (!b || b.players.length >= 2 || b.players.some(p => p.userId === player.userId)) return null;
  b.players.push(player);
  return b;
}
function startCountdown(id: string) {
  const b = battles.get(id);
  if (!b || b.players.length < 2) return null;
  b.status = "countdown";
  b.countdownStart = Date.now();
  return b;
}
function activateBattle(id: string) {
  const b = battles.get(id);
  if (!b) return null;
  b.status = "active";
  const now = Date.now();
  for (const p of b.players) { p.status = "playing"; p.startedAt = now; }
  return b;
}
function recordCorrect(id: string, userId: number) {
  const b = battles.get(id);
  if (!b || b.status !== "active") return null;
  const p = b.players.find(p => p.userId === userId);
  if (!p || p.status !== "playing") return null;
  p.correctAt = Date.now();
  p.status = "done";
  if (b.players.every(p => p.status === "done")) b.status = "finished";
  return b;
}
function recordAttempt(id: string, userId: number) {
  const b = battles.get(id);
  if (!b || b.status !== "active") return null;
  const p = b.players.find(p => p.userId === userId);
  if (p && p.status === "playing") p.attempts += 1;
  return b;
}
function finishBattle(id: string) {
  const b = battles.get(id);
  if (b) b.status = "finished";
  return b;
}

// ===== DB (read-only, untuk ambil exercise) =====
const dbPath = path.join(process.cwd(), "data", "learn.db");
const db = new Database(dbPath, { readonly: true });

function safeState(b: BattleState) {
  return {
    id: b.id, exerciseId: b.exerciseId, prompt: b.prompt, datasetSql: b.datasetSql, starterSql: b.starterSql, solutionSql: b.solutionSql,
    players: b.players.map(p => ({ userId: p.userId, displayName: p.displayName, status: p.status, attempts: p.attempts })),
    status: b.status,
  };
}

function finishedState(b: BattleState) {
  return {
    ...safeState(b), solutionSql: b.solutionSql,
    players: b.players.map(p => ({ ...safeState(b).players.find(x => x.userId === p.userId)!, durationMs: p.correctAt && p.startedAt ? p.correctAt - p.startedAt : null })),
  };
}

// ===== Socket.io server =====
const httpServer = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WS server running");
});

const io = new SocketIOServer(httpServer, { path: "/socket.io", cors: { origin: "*", methods: ["GET", "POST"] } });

const battleNs = io.of("/battle");

battleNs.on("connection", (socket) => {
  console.log(`[ws] connected: ${socket.id}`);
  let currentBattleId: string | null = null;

  socket.on("create", (data: { exerciseId: number; userId: number; username: string; displayName: string }) => {
    const { exerciseId, userId, username, displayName } = data;
    const ex = db.prepare("SELECT * FROM exercises WHERE id = ?").get(exerciseId) as any;
    if (!ex) { socket.emit("error", { message: "Soal tidak ditemukan" }); return; }

    const battleId = crypto.randomUUID().slice(0, 8);
    const creator: PlayerState = { userId, username, displayName, startedAt: null, attempts: 0, correctAt: null, status: "waiting" };
    const battle = createBattle({ id: battleId, exerciseId: ex.id, datasetSql: ex.dataset_sql, starterSql: ex.starter_sql, solutionSql: ex.solution_sql, prompt: ex.prompt, creator });

    socket.join("battle:" + battleId);
    currentBattleId = battleId;
    socket.emit("created", { battleId, state: safeState(battle) });
    console.log(`[ws] ${displayName} created ${battleId}`);
  });

  socket.on("join", (data: { battleId: string; userId: number; username: string; displayName: string }) => {
    const { battleId, userId, username, displayName } = data;
    const player: PlayerState = { userId, username, displayName, startedAt: null, attempts: 0, correctAt: null, status: "waiting" };
    const battle = joinBattle(battleId, player);
    if (!battle) { socket.emit("error", { message: "Battle tidak ditemukan atau sudah penuh" }); return; }

    socket.join("battle:" + battleId);
    currentBattleId = battleId;
    battleNs.to("battle:" + battleId).emit("player-joined", safeState(battle));

    setTimeout(() => {
      const b = startCountdown(battleId);
      if (b) {
        battleNs.to("battle:" + battleId).emit("countdown", safeState(b));
        setTimeout(() => {
          const b2 = activateBattle(battleId);
          if (b2) battleNs.to("battle:" + battleId).emit("battle-start", safeState(b2));
        }, 3000);
      }
    }, 2000);
  });

  socket.on("attempt", (data: { battleId: string; userId: number; correct: boolean }) => {
    const { battleId, userId, correct } = data;
    if (correct) {
      const battle = recordCorrect(battleId, userId);
      if (battle) {
        if (battle.status === "finished") {
          battleNs.to("battle:" + battleId).emit("battle-finished", finishedState(battle));
        } else {
          battleNs.to("battle:" + battleId).emit("opponent-done", safeState(battle));
        }
      }
    } else {
      recordAttempt(battleId, userId);
      const battle = getBattle(battleId);
      if (battle) battleNs.to("battle:" + battleId).emit("opponent-attempt", safeState(battle));
    }
  });

  socket.on("forfeit", (data: { battleId: string; userId: number }) => {
    const battle = finishBattle(data.battleId);
    if (battle) battleNs.to("battle:" + data.battleId).emit("battle-finished", finishedState(battle));
  });

  socket.on("disconnect", () => {
    if (currentBattleId) {
      const battle = getBattle(currentBattleId);
      if (battle && battle.status === "active") {
        const finished = finishBattle(currentBattleId);
        if (finished) battleNs.to("battle:" + currentBattleId).emit("battle-finished", finishedState(finished));
      }
    }
  });
});

const PORT = parseInt(process.env.WS_PORT || "3001", 10);
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`> WS Battle server on port ${PORT}`);
});
