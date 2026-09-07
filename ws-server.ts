import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import Database from "better-sqlite3";
import path from "path";
import crypto from "crypto";

// ===== Types =====
type PlayerState = {
  userId: number;
  username: string;
  displayName: string;
  // Per-round results
  rounds: { attempts: number; correctAt: number | null; forfeited: boolean }[];
  status: "playing" | "done" | "forfeited"; // current round status
};

type ExerciseData = {
  id: number;
  prompt: string;
  datasetSql: string;
  starterSql: string;
  solutionSql: string;
};

type BattleState = {
  id: string;
  exercises: ExerciseData[];
  roundCount: number;
  currentRound: number; // 0-indexed
  players: PlayerState[];
  status: "waiting" | "countdown" | "active" | "round_finished" | "finished";
  createdAt: number;
};

// ===== In-memory store =====
const battles = new Map<string, BattleState>();

function createBattle(opts: { id: string; exercises: ExerciseData[]; creator: PlayerState }): BattleState {
  const roundCount = opts.exercises.length;
  const battle: BattleState = {
    id: opts.id,
    exercises: opts.exercises,
    roundCount,
    currentRound: 0,
    players: [opts.creator],
    status: "waiting",
    createdAt: Date.now(),
  };
  battles.set(battle.id, battle);
  return battle;
}

function getBattle(id: string) { return battles.get(id); }

function joinBattle(id: string, player: PlayerState): BattleState | null {
  const b = battles.get(id);
  if (!b || b.players.length >= 2 || b.players.some(p => p.userId === player.userId)) return null;
  b.players.push(player);
  return b;
}

function startCountdown(id: string): BattleState | null {
  const b = battles.get(id);
  if (!b || b.players.length < 2) return null;
  b.status = "countdown";
  return b;
}

function activateBattle(id: string): BattleState | null {
  const b = battles.get(id);
  if (!b) return null;
  b.status = "active";
  for (const p of b.players) { p.status = "playing"; }
  return b;
}

function recordAttempt(id: string, userId: number): BattleState | null {
  const b = battles.get(id);
  if (!b || b.status !== "active") return null;
  const p = b.players.find(p => p.userId === userId);
  if (!p || p.status !== "playing") return null;
  p.rounds[b.currentRound].attempts += 1;
  return b;
}

function recordCorrect(id: string, userId: number): BattleState | null {
  const b = battles.get(id);
  if (!b || b.status !== "active") return null;
  const p = b.players.find(p => p.userId === userId);
  if (!p || p.status !== "playing") return null;
  p.rounds[b.currentRound].attempts += 1;
  p.rounds[b.currentRound].correctAt = Date.now();
  p.status = "done";
  // Check if both done/forfeited
  if (b.players.every(p => p.status === "done" || p.status === "forfeited")) {
    b.status = "round_finished";
  }
  return b;
}

function recordForfeit(id: string, userId: number): BattleState | null {
  const b = battles.get(id);
  if (!b || b.status !== "active") return null;
  const p = b.players.find(p => p.userId === userId);
  if (!p || (p.status !== "playing")) return null;
  p.rounds[b.currentRound].forfeited = true;
  p.status = "forfeited";
  if (b.players.every(p => p.status === "done" || p.status === "forfeited")) {
    b.status = "round_finished";
  }
  return b;
}

function nextRound(id: string): BattleState | null {
  const b = battles.get(id);
  if (!b || b.status !== "round_finished") return null;
  if (b.currentRound + 1 >= b.roundCount) {
    b.status = "finished";
    return b;
  }
  b.currentRound += 1;
  b.status = "active";
  for (const p of b.players) { p.status = "playing"; }
  return b;
}

function forfeitBattle(id: string): BattleState | null {
  const b = battles.get(id);
  if (!b) return null;
  b.status = "finished";
  return b;
}

// ===== Serialization =====
function currentState(b: BattleState) {
  return {
    id: b.id,
    roundCount: b.roundCount,
    currentRound: b.currentRound,
    currentExercise: b.exercises[b.currentRound],
    status: b.status,
    players: b.players.map(p => ({
      userId: p.userId,
      displayName: p.displayName,
      status: p.status,
      rounds: p.rounds.map(r => ({
        attempts: r.attempts,
        correct: !!r.correctAt,
        forfeited: r.forfeited,
        durationMs: r.correctAt ? r.correctAt : null,
      })),
      score: p.rounds.filter(r => !!r.correctAt).length,
    })),
  };
}

function finishedState(b: BattleState) {
  return {
    ...currentState(b),
    exercises: b.exercises,
  };
}

// ===== DB =====
const dbPath = path.join(process.cwd(), "data", "learn.db");
const db = new Database(dbPath, { readonly: true });

function pickRandomExercises(levelId: number, count: number): ExerciseData[] {
  const rows = db.prepare(
    "SELECT id, prompt, dataset_sql, starter_sql, solution_sql FROM exercises WHERE level_id = ? ORDER BY RANDOM() LIMIT ?"
  ).all(levelId, count) as any[];
  return rows.map(r => ({
    id: r.id,
    prompt: r.prompt,
    datasetSql: r.dataset_sql,
    starterSql: r.starter_sql,
    solutionSql: r.solution_sql,
  }));
}

// ===== Socket.io =====
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
    const exercises = pickRandomExercises(exerciseId, 5);
    if (exercises.length === 0) { socket.emit("error", { message: "Soal tidak ditemukan" }); return; }

    const battleId = crypto.randomUUID().slice(0, 8);
    const creator: PlayerState = {
      userId, username, displayName,
      rounds: exercises.map(() => ({ attempts: 0, correctAt: null, forfeited: false })),
      status: "playing",
    };
    const battle = createBattle({ id: battleId, exercises, creator });

    socket.join("battle:" + battleId);
    currentBattleId = battleId;
    socket.emit("created", { battleId, state: currentState(battle) });
    console.log(`[ws] ${displayName} created ${battleId} with ${exercises.length} rounds`);
  });

  socket.on("join", (data: { battleId: string; userId: number; username: string; displayName: string }) => {
    const { battleId, userId, username, displayName } = data;
    const battle = getBattle(battleId);
    if (!battle) { socket.emit("error", { message: "Battle tidak ditemukan" }); return; }

    const player: PlayerState = {
      userId, username, displayName,
      rounds: battle.exercises.map(() => ({ attempts: 0, correctAt: null, forfeited: false })),
      status: "playing",
    };
    const joined = joinBattle(battleId, player);
    if (!joined) { socket.emit("error", { message: "Battle penuh" }); return; }

    socket.join("battle:" + battleId);
    currentBattleId = battleId;
    battleNs.to("battle:" + battleId).emit("player-joined", currentState(joined));

    setTimeout(() => {
      const b = startCountdown(battleId);
      if (b) {
        battleNs.to("battle:" + battleId).emit("countdown", currentState(b));
        setTimeout(() => {
          const b2 = activateBattle(battleId);
          if (b2) battleNs.to("battle:" + battleId).emit("battle-start", currentState(b2));
        }, 3000);
      }
    }, 2000);
  });

  socket.on("attempt", (data: { battleId: string; userId: number; correct: boolean }) => {
    const { battleId, userId, correct } = data;
    if (correct) {
      const battle = recordCorrect(battleId, userId);
      if (battle) {
        if (battle.status === "round_finished") {
          battleNs.to("battle:" + battleId).emit("round-finished", currentState(battle));
        } else {
          battleNs.to("battle:" + battleId).emit("opponent-done", currentState(battle));
        }
      }
    } else {
      recordAttempt(battleId, userId);
      const battle = getBattle(battleId);
      if (battle) battleNs.to("battle:" + battleId).emit("opponent-attempt", currentState(battle));
    }
  });

  socket.on("forfeit-round", (data: { battleId: string; userId: number }) => {
    const battle = recordForfeit(data.battleId, data.userId);
    if (battle) {
      if (battle.status === "round_finished") {
        battleNs.to("battle:" + data.battleId).emit("round-finished", currentState(battle));
      } else {
        battleNs.to("battle:" + data.battleId).emit("opponent-forfeited", currentState(battle));
      }
    }
  });

  socket.on("next-round", (data: { battleId: string }) => {
    const battle = nextRound(data.battleId);
    if (battle) {
      if (battle.status === "finished") {
        battleNs.to("battle:" + data.battleId).emit("battle-finished", finishedState(battle));
      } else {
        battleNs.to("battle:" + data.battleId).emit("new-round", currentState(battle));
      }
    }
  });

  socket.on("forfeit-battle", (data: { battleId: string; userId: number }) => {
    const battle = forfeitBattle(data.battleId);
    if (battle) battleNs.to("battle:" + data.battleId).emit("battle-finished", finishedState(battle));
  });

  socket.on("disconnect", () => {
    if (currentBattleId) {
      const battle = getBattle(currentBattleId);
      if (battle && battle.status === "active") {
        const finished = forfeitBattle(currentBattleId);
        if (finished) battleNs.to("battle:" + currentBattleId).emit("battle-finished", finishedState(finished));
      }
    }
  });
});

const PORT = parseInt(process.env.WS_PORT || "3001", 10);
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`> WS Battle server on port ${PORT}`);
});
