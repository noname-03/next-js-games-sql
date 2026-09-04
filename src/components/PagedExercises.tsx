"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Check, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import SqlRunner from "./SqlRunner";

export type PagedExercise = {
  id: number;
  orderIndex: number;
  title: string;
  prompt: string;
  datasetSql: string;
  starterSql: string;
  solutionSql: string;
};

type PagedExercisesProps = {
  exercises: PagedExercise[];
  completedIds: number[];
};

const PER_PAGE = 4;

export default function PagedExercises({ exercises, completedIds }: PagedExercisesProps) {
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.max(1, Math.ceil(exercises.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const slice = exercises.slice(start, start + PER_PAGE);

  // Scroll ke awal daftar soal saat halaman berubah
  useEffect(() => {
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

  return (
    <div className="flex flex-col gap-5">
      {/* Anchor scroll: browser scroll ke sini saat ganti halaman */}
      <div ref={listRef} className="flex flex-col gap-5 scroll-mt-24">
        {slice.map((exercise, i) => {
          const absIndex = start + i + 1;
          const isDone = completedIds.includes(exercise.id);
          return (
            <section
              key={exercise.id}
              id={`exercise-${exercise.orderIndex}`}
              className={`scroll-mt-4 rounded-[1.75rem] border-2 bg-white p-5 shadow-sm transition ${
                isDone ? "border-mint/70" : "border-lilac"
              }`}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-extrabold text-white ${
                    isDone ? "bg-mint" : "bg-grape"
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : absIndex}
                </span>
                <span className="font-display text-base font-extrabold text-ink">
                  {exercise.title}
                </span>
                {isDone && (
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-mint-soft px-3 py-1 text-xs font-extrabold text-mint">
                    Selesai!
                  </span>
                )}
              </div>

              <p className="flex gap-2 rounded-2xl bg-lav/60 p-3 text-sm font-semibold leading-relaxed text-ink">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-grape" />
                <span>{exercise.prompt}</span>
              </p>

              <div className="mt-4">
                <SqlRunner
                  exerciseId={exercise.id}
                  datasetSql={exercise.datasetSql}
                  starterSql={exercise.starterSql}
                  solutionSql={exercise.solutionSql}
                />
              </div>
            </section>
          );
        })}
      </div>

      {/* Pagination 4 soal / halaman */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="flex items-center gap-1 rounded-full border-2 border-lilac bg-white px-4 py-2 font-display text-sm font-extrabold text-grape shadow-sm transition hover:bg-lav disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Sebelumnya
          </button>
          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-extrabold text-ink-soft ring-1 ring-lilac">
            {safePage}/{totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="flex items-center gap-1 rounded-full border-2 border-lilac bg-white px-4 py-2 font-display text-sm font-extrabold text-grape shadow-sm transition hover:bg-lav disabled:cursor-not-allowed disabled:opacity-40"
          >
            Berikutnya <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tombol kembali ke peta di bawah */}
      <div className="flex justify-center pb-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full bg-grape px-6 py-3 font-display text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Peta Level
        </Link>
      </div>
    </div>
  );
}
