/**
 * In-memory battle store — ephemeral state selama battle berlangsung.
 * Setelah battle selesai, hasil disimpan ke SQLite.
 */

export type PlayerState = {
  userId: number;
  username: string;
  displayName: string;
  startedAt: number | null;
  attempts: number;
  correctAt: number | null;
  status: "waiting" | "playing" | "done";
};

export type BattleState = {
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

export function createBattle(opts: {
  id: string;
  exerciseId: number;
  datasetSql: string;
  starterSql: string;
  solutionSql: string;
  prompt: string;
  creator: PlayerState;
}): BattleState {
  const battle: BattleState = {
    id: opts.id,
    exerciseId: opts.exerciseId,
    datasetSql: opts.datasetSql,
    starterSql: opts.starterSql,
    solutionSql: opts.solutionSql,
    prompt: opts.prompt,
    players: [opts.creator],
    status: "waiting",
    countdownStart: null,
    createdAt: Date.now(),
  };
  battles.set(battle.id, battle);
  return battle;
}

export function getBattle(id: string): BattleState | undefined {
  return battles.get(id);
}

export function joinBattle(id: string, player: PlayerState): BattleState | null {
  const b = battles.get(id);
  if (!b) return null;
  if (b.players.length >= 2) return null;
  if (b.players.some((p) => p.userId === player.userId)) return null;
  b.players.push(player);
  return b;
}

export function startCountdown(id: string): BattleState | null {
  const b = battles.get(id);
  if (!b || b.players.length < 2) return null;
  b.status = "countdown";
  b.countdownStart = Date.now();
  return b;
}

export function activateBattle(id: string): BattleState | null {
  const b = battles.get(id);
  if (!b) return null;
  b.status = "active";
  const now = Date.now();
  for (const p of b.players) {
    p.status = "playing";
    p.startedAt = now;
  }
  return b;
}

export function recordAttempt(id: string, userId: number): BattleState | null {
  const b = battles.get(id);
  if (!b || b.status !== "active") return null;
  const p = b.players.find((p) => p.userId === userId);
  if (!p || p.status !== "playing") return null;
  p.attempts += 1;
  return b;
}

export function recordCorrect(id: string, userId: number): BattleState | null {
  const b = battles.get(id);
  if (!b || b.status !== "active") return null;
  const p = b.players.find((p) => p.userId === userId);
  if (!p || p.status !== "playing") return null;
  p.correctAt = Date.now();
  p.status = "done";
  if (b.players.every((p) => p.status === "done")) {
    b.status = "finished";
  }
  return b;
}

export function finishBattle(id: string): BattleState | null {
  const b = battles.get(id);
  if (!b) return null;
  b.status = "finished";
  return b;
}

export function removeBattle(id: string): void {
  battles.delete(id);
}

export function cleanupOld(): number {
  const cutoff = Date.now() - 30 * 60 * 1000;
  let removed = 0;
  for (const [id, b] of battles) {
    if (b.status === "finished" && b.createdAt < cutoff) {
      battles.delete(id);
      removed++;
    }
  }
  return removed;
}
