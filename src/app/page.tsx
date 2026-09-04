import { sql } from "drizzle-orm";
import { BookOpen, Database, Sparkles, Trophy, Zap } from "lucide-react";
import { db } from "@/db/client";
import { exercises, levels, progress } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import ChapterBrowser from "@/components/ChapterBrowser";
import Leaderboard from "@/components/Leaderboard";
import type { ChapterMeta } from "@/components/ChapterBrowser";
import type { MapNode } from "@/components/LevelMap";

export const dynamic = "force-dynamic";

const LEVELS_PER_CHAPTER = 10;

type SearchParams = Promise<{ bab?: string }>;

// Statistik exercise & progress untuk sekumpulan level (query agregat)
function getLevelStats(levelIds: number[], userId: number | null) {
  if (levelIds.length === 0) return new Map<number, { exerciseCount: number; doneCount: number }>();
  const idList = levelIds.join(",");

  const exRows = db
    .select({ levelId: exercises.levelId, count: sql<number>`count(*)` })
    .from(exercises)
    .where(sql`${exercises.levelId} IN (${sql.raw(idList)})`)
    .groupBy(exercises.levelId)
    .all();

  const map = new Map<number, { exerciseCount: number; doneCount: number }>();
  for (const r of exRows) {
    map.set(r.levelId, { exerciseCount: r.count, doneCount: 0 });
  }

  if (userId !== null) {
    const doneRows = db
      .select({ levelId: exercises.levelId, count: sql<number>`count(*)` })
      .from(progress)
      .innerJoin(exercises, sql`${progress.exerciseId} = ${exercises.id}`)
      .where(
        sql`${exercises.levelId} IN (${sql.raw(idList)}) AND ${progress.userId} = ${userId}`
      )
      .groupBy(exercises.levelId)
      .all();
    for (const r of doneRows) {
      const cur = map.get(r.levelId) ?? { exerciseCount: 0, doneCount: 0 };
      cur.doneCount = r.count;
      map.set(r.levelId, cur);
    }
  }
  return map;
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const { bab } = await searchParams;
  const activeChapter = bab ? parseInt(bab, 10) : null;
  const chapterIdx = activeChapter !== null ? activeChapter - 1 : null;
  const user = await getCurrentUser();
  const userId = user?.id ?? null;

  // 1) Ambil semua level (id + orderIndex + judul — ringan) utk statistik bab
  const allLevels = db
    .select({
      id: levels.id,
      orderIndex: levels.orderIndex,
      title: levels.title,
      description: levels.description,
      slug: levels.slug,
    })
    .from(levels)
    .orderBy(levels.orderIndex)
    .all();

  const maxOrder = allLevels.length > 0 ? allLevels[allLevels.length - 1].orderIndex : 0;
  const TOTAL_LEVELS = maxOrder;
  const chapterCount = Math.ceil(TOTAL_LEVELS / LEVELS_PER_CHAPTER);

  const statsAll = getLevelStats(allLevels.map((l) => l.id), userId);

  // 2) Progress per bab
  const chapterProgress = Array.from({ length: chapterCount }, () => ({
    doneCount: 0,
    exerciseCount: 0,
  }));
  for (const lv of allLevels) {
    const ci = Math.floor((lv.orderIndex - 1) / LEVELS_PER_CHAPTER);
    if (chapterProgress[ci]) {
      const st = statsAll.get(lv.id) ?? { exerciseCount: 0, doneCount: 0 };
      chapterProgress[ci].exerciseCount += st.exerciseCount;
      chapterProgress[ci].doneCount += st.doneCount;
    }
  }

  const totalDone = chapterProgress.reduce((a, c) => a + c.doneCount, 0);
  const totalCount = chapterProgress.reduce((a, c) => a + c.exerciseCount, 0);
  const totalXp =
    userId === null
      ? 0
      : db
          .select({ sum: sql<number | null>`coalesce(sum(${progress.xp}), 0)` })
          .from(progress)
          .where(sql`${progress.userId} = ${userId}`)
          .get()?.sum ?? 0;
  const allDone = totalCount > 0 && totalDone >= totalCount;

  // 3) Metadata bab
  const allChaptersDone =
    chapterProgress.length > 0 &&
    chapterProgress.every((p) => p.exerciseCount > 0 && p.doneCount >= p.exerciseCount);
  const firstIncomplete = chapterProgress.findIndex(
    (p) => p.exerciseCount === 0 || p.doneCount < p.exerciseCount
  );
  const currentChapterIdx =
    allChaptersDone || firstIncomplete === -1 ? chapterCount - 1 : firstIncomplete;

  const chapterMetas: ChapterMeta[] = chapterProgress.map((p, i) => {
    const startLv = i * LEVELS_PER_CHAPTER + 1;
    const endLv = Math.min((i + 1) * LEVELS_PER_CHAPTER, TOTAL_LEVELS);
    const isDone = p.exerciseCount > 0 && p.doneCount >= p.exerciseCount;
    const isLocked =
      i > 0 &&
      chapterProgress[i - 1].exerciseCount > 0 &&
      chapterProgress[i - 1].doneCount < chapterProgress[i - 1].exerciseCount;
    return {
      index: i + 1,
      title: `Bab ${i + 1}`,
      subtitle: `Level ${startLv}–${endLv}`,
      doneCount: p.doneCount,
      exerciseCount: p.exerciseCount,
      isDone,
      isLocked,
      isCurrent: i === currentChapterIdx && !isDone,
    };
  });

  // 4) Detail bab aktif (hanya bila terbuka)
  const babTerbuka =
    chapterIdx !== null &&
    chapterIdx >= 0 &&
    chapterIdx < chapterCount &&
    !chapterMetas[chapterIdx].isLocked;

  const activeChapterMeta = chapterIdx !== null ? chapterMetas[chapterIdx] : undefined;
  const activeDone =
    !!activeChapterMeta &&
    activeChapterMeta.exerciseCount > 0 &&
    activeChapterMeta.doneCount >= activeChapterMeta.exerciseCount;

  const activeNodes: MapNode[] = [];
  if (babTerbuka && chapterIdx !== null) {
    const startLv = chapterIdx * LEVELS_PER_CHAPTER + 1;
    const endLv = Math.min((chapterIdx + 1) * LEVELS_PER_CHAPTER, TOTAL_LEVELS);
    const chapterLevels = allLevels
      .filter((l) => l.orderIndex >= startLv && l.orderIndex <= endLv)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const ids = chapterLevels.map((l) => l.id);
    const stMap = getLevelStats(ids, userId);

    chapterLevels.forEach((lv, ni) => {
      const st = stMap.get(lv.id) ?? { exerciseCount: 0, doneCount: 0 };
      const completed = st.doneCount >= st.exerciseCount && st.exerciseCount > 0;
      let status: MapNode["status"] = "done";
      if (!completed) {
        if (ni === 0) {
          status =
            chapterIdx === 0 ||
            chapterProgress[chapterIdx - 1].doneCount >=
              chapterProgress[chapterIdx - 1].exerciseCount
              ? "open"
              : "locked";
        } else {
          const prev = chapterLevels[ni - 1];
          const prevSt = stMap.get(prev.id) ?? { exerciseCount: 0, doneCount: 0 };
          status = prevSt.doneCount >= prevSt.exerciseCount ? "open" : "locked";
        }
      }
      activeNodes.push({
        id: lv.id,
        slug: lv.slug,
        orderIndex: lv.orderIndex,
        title: lv.title,
        description: lv.description,
        doneCount: st.doneCount,
        exerciseCount: st.exerciseCount,
        status,
      });
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-4 sm:p-6">
      {/* Header ceria */}
      <header className="mt-2 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-3 text-grape">
          <Sparkles className="animate-bob h-7 w-7 text-sun" />
          <Database className="animate-bob h-8 w-8 text-grape" style={{ animationDelay: "0.15s" }} />
          <Zap className="animate-bob h-7 w-7 text-peach" style={{ animationDelay: "0.3s" }} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-grape">SQL Quest</h1>
        <p className="max-w-md text-base font-semibold text-ink-soft">
          Petualangan seru belajar SQL! Pilih bab, selesaikan misi, kumpulkan XP!
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-extrabold text-grape shadow-sm ring-1 ring-lilac">
            <BookOpen className="h-4 w-4" /> {totalDone}/{totalCount} soal
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-extrabold text-peach shadow-sm ring-1 ring-lilac">
            <Zap className="h-4 w-4" /> {totalXp} XP
          </span>
          {allDone && (
            <span className="flex items-center gap-1.5 rounded-full bg-mint-soft px-4 py-1.5 text-sm font-extrabold text-mint">
              <Trophy className="h-4 w-4" /> Semua level ditaklukkan!
            </span>
          )}
        </div>

        <div className="h-4 w-full max-w-md overflow-hidden rounded-full bg-lilac/70 ring-1 ring-white">
          <div
            className="h-full rounded-full bg-gradient-to-r from-grape via-pink to-peach transition-all duration-700"
            style={{ width: `${totalCount === 0 ? 0 : (totalDone / totalCount) * 100}%` }}
          />
        </div>
      </header>

      <ChapterBrowser
        chapters={chapterMetas}
        activeChapter={babTerbuka ? activeChapter : null}
        nodes={activeNodes}
        activeDone={activeDone}
      />

      {/* Papan juara akumulasi — hanya di mode daftar bab */}
      {activeChapter === null && (
        <Leaderboard />
      )}

      {activeChapter !== null && !babTerbuka && (
        <p className="-mt-3 text-center text-sm font-bold text-ink-faint">
          Bab ini masih terkunci — selesaikan bab sebelumnya dulu ya!
        </p>
      )}
    </main>
  );
}
