"use client";

import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Database,
  Flag,
  Lightbulb,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightOpen,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import LevelSnakeMap from "./LevelSnakeMap";
import SchemaExplorer from "./SchemaExplorer";

export type LearnExercise = {
  id: number;
  orderIndex: number;
  title: string;
};

type LearningLayoutProps = {
  level: {
    orderIndex: number;
    title: string;
    description: string;
    slug: string;
  };
  concept?: string | null;
  explanation?: string | null;
  exercises: LearnExercise[];
  completedIds: number[];
  allDone: boolean;
  schemaJson: string | null;
  children: React.ReactNode;
};

export default function LearningLayout({
  level,
  concept,
  explanation,
  exercises,
  completedIds,
  allDone,
  schemaJson,
  children,
}: LearningLayoutProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const totalDone = completedIds.length;
  const total = exercises.length;

  // Panel peta misi (rail kiri di desktop / section di mobile)
  const leftPanel = (
    <div className="flex flex-col gap-3">
      <Link
        href="/"
        className="flex items-center gap-2 rounded-2xl border-2 border-lilac bg-white px-4 py-3 font-display text-sm font-extrabold text-grape shadow-sm transition hover:-translate-x-0.5 hover:shadow"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Peta
      </Link>
      <div className="rounded-[1.5rem] bg-white p-3 shadow-sm ring-1 ring-lilac">
        <div className="mb-1 flex items-center justify-between px-1">
          <h2 className="flex items-center gap-1.5 font-display text-sm font-extrabold text-grape">
            <Map className="h-4 w-4" /> Peta Misi
          </h2>
          <button
            onClick={() => setLeftOpen(false)}
            aria-label="Sembunyikan peta misi"
            className="rounded-full p-1 text-ink-soft transition hover:bg-lilac hover:text-grape"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-2 px-1 text-[11px] font-bold leading-snug text-ink-soft">
          Klik bulatan untuk lompat ke soal. Karaktermu maju tiap jawaban benar!
        </p>
        <LevelSnakeMap compact exercises={exercises} completedIds={completedIds} />
      </div>
    </div>
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-4 lg:p-5">
      {/* Header atas */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-extrabold text-grape shadow-sm ring-1 ring-lilac transition hover:-translate-x-0.5 hover:shadow lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" /> Peta
          </Link>
          {/* Toggle rail kiri (desktop) */}
          {leftOpen ? (
            <button
              onClick={() => setLeftOpen(false)}
              aria-label="Sembunyikan peta misi"
              title="Sembunyikan peta misi"
              className="hidden rounded-full border border-lilac bg-white p-2 text-grape shadow-sm transition hover:bg-lav lg:inline-flex"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setLeftOpen(true)}
              aria-label="Tampilkan peta misi"
              title="Tampilkan peta misi"
              className="hidden rounded-full border border-lilac bg-white p-2 text-grape shadow-sm transition hover:bg-lav lg:inline-flex"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-extrabold text-ink-soft shadow-sm ring-1 ring-lilac">
            <Check className="h-4 w-4 text-mint" />
            {totalDone}/{total} soal
          </span>
          {/* Toggle rail kanan */}
          <button
            onClick={() => setRightOpen((v) => !v)}
            aria-label="Tampilkan/sembunyikan data tabel"
            title="Tampilkan/sembunyikan data tabel"
            className="rounded-full border border-lilac bg-white p-2 text-grape shadow-sm transition hover:bg-lav"
          >
            <Database className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Mobile: peta misi tampil sebagai section paling atas */}
      {leftOpen && <div className="lg:hidden">{leftPanel}</div>}

      <div className="flex flex-1 items-start gap-4">
        {/* ===== RAIL KIRI (desktop sticky) ===== */}
        {leftOpen && (
          <aside className="sticky top-4 hidden w-64 shrink-0 lg:block">
            {leftPanel}
          </aside>
        )}

        {/* Tombol pojok kiri saat tertutup (desktop) */}
        {!leftOpen && (
          <button
            onClick={() => setLeftOpen(true)}
            aria-label="Tampilkan peta misi"
            title="Tampilkan peta misi"
            className="sticky top-4 z-30 mt-1 hidden rounded-full border border-lilac bg-white p-2.5 text-grape shadow-md transition hover:bg-lav lg:block"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        )}

        {/* ===== TENGAH: banner + soal ===== */}
        <main className="min-w-0 flex-1">
          <div className="relative mb-5 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-grape via-grape-deep to-pink p-5 text-white shadow-lg">
            <Database className="pointer-events-none absolute -right-3 -top-4 h-28 w-28 opacity-15" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-0.5 text-sm font-extrabold backdrop-blur">
                Level {level.orderIndex}
              </span>
              {allDone && (
                <span className="flex items-center gap-1 rounded-full bg-sun px-3 py-0.5 text-sm font-extrabold text-ink">
                  <Trophy className="h-4 w-4" /> Selesai!
                </span>
              )}
            </div>
            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight">
              {level.title}
            </h1>
            <p className="mt-1 max-w-xl text-sm font-semibold text-white/85">
              {level.description}
            </p>
            {allDone && (
              <Link
                href="/"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-display text-sm font-extrabold text-grape shadow transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Flag className="h-4 w-4" /> Lihat karaktermu melaju di peta
              </Link>
            )}
          </div>

          {/* Kartu materi: istilah baru dijelaskan DULU sebelum soal */}
          {concept && explanation && (
            <div className="mb-5 overflow-hidden rounded-[1.75rem] border-2 border-sun/50 bg-gradient-to-br from-sun/10 via-white to-pink/5 shadow-sm">
              <div className="flex items-center gap-2 border-b-2 border-sun/30 bg-sun/15 px-5 py-3">
                <Lightbulb className="h-5 w-5 text-peach" />
                <h2 className="font-display text-base font-extrabold text-ink">
                  Materi: {concept}
                </h2>
              </div>
              <div className="px-5 py-4">
                <p className="flex items-start gap-2 text-sm font-semibold leading-relaxed text-ink">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-grape" />
                  <span className="whitespace-pre-wrap">{explanation}</span>
                </p>
              </div>
            </div>
          )}

          {children}
        </main>

        {/* ===== RAIL KANAN (desktop sticky, tinggi penuh) ===== */}
        {rightOpen && (
          <aside className="sticky top-4 hidden w-80 shrink-0 lg:block lg:h-[calc(100vh-6rem)]">
            <SchemaExplorer
              schemaJson={schemaJson}
              open
              onToggle={() => setRightOpen(false)}
            />
          </aside>
        )}

        {/* Tombol pojok kanan saat tertutup (desktop) */}
        {!rightOpen && (
          <button
            onClick={() => setRightOpen(true)}
            aria-label="Tampilkan data tabel"
            title="Tampilkan data tabel"
            className="sticky top-4 z-30 mt-1 hidden rounded-full border border-lilac bg-white p-2.5 text-grape shadow-md transition hover:bg-lav lg:block"
          >
            <PanelRightOpen className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Mobile: data & skema setelah soal */}
      {rightOpen && (
        <div className="lg:hidden">
          <SchemaExplorer
            schemaJson={schemaJson}
            open
            onToggle={() => setRightOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
