import { redirect } from "next/navigation";
import Link from "next/link";
import { sql } from "drizzle-orm";
import { ArrowLeft, BookOpen, ShieldCheck, Timer, Users, Zap } from "lucide-react";
import { db } from "@/db/client";
import { exercises, levels, progress } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import AdminUsersTable from "@/components/AdminUsersTable";
import AdminSettings from "@/components/AdminSettings";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  const levelCount = db.select({ c: sql<number>`count(*)` }).from(levels).get()?.c ?? 0;
  const exerciseCount =
    db.select({ c: sql<number>`count(*)` }).from(exercises).get()?.c ?? 0;
  const totalDone =
    db.select({ c: sql<number>`count(*)` }).from(progress).get()?.c ?? 0;
  const totalXp =
    db
      .select({ c: sql<number>`coalesce(sum(${progress.xp}), 0)` })
      .from(progress)
      .get()?.c ?? 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-5 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-extrabold text-grape shadow-sm ring-1 ring-lilac transition hover:-translate-x-0.5 hover:shadow"
        >
          <ArrowLeft className="h-4 w-4" /> Beranda
        </Link>
        <span className="flex items-center gap-1.5 rounded-full bg-sun/20 px-4 py-1.5 text-sm font-extrabold text-[#b45309]">
          <ShieldCheck className="h-4 w-4" /> Dashboard Admin
        </span>
      </div>

      <header className="rounded-[1.75rem] bg-gradient-to-br from-grape via-grape-deep to-pink p-6 text-white shadow-lg">
        <h1 className="font-display text-3xl font-extrabold">Halo, {user.displayName}</h1>
        <p className="mt-1 text-sm font-semibold text-white/85">
          Kelola user dan pantau perkembangan belajar SQL Quest.
        </p>
      </header>

      {/* Ringkasan */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Level", value: levelCount, icon: <BookOpen className="h-5 w-5" />, color: "text-grape" },
          { label: "Total Soal", value: exerciseCount, icon: <Zap className="h-5 w-5" />, color: "text-peach" },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-3xl border-2 border-lilac bg-white p-4"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-lav/60 ${s.color}`}>
              {s.icon}
            </span>
            <div>
              <p className="font-display text-2xl font-extrabold text-ink">{s.value}</p>
              <p className="text-xs font-bold text-ink-soft">{s.label}</p>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-3 rounded-3xl border-2 border-lilac bg-white p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lav/60 text-grape">
            <Zap className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-extrabold text-ink">{totalDone}</p>
            <p className="text-xs font-bold text-ink-soft">Soal Diselesaikan</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-3xl border-2 border-lilac bg-white p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lav/60 text-peach">
            <Zap className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-extrabold text-ink">{totalXp}</p>
            <p className="text-xs font-bold text-ink-soft">Total XP User</p>
          </div>
        </div>
      </section>

      {/* Pengaturan timer & penalti */}
      <section className="rounded-[1.75rem] bg-white/70 p-5 shadow-sm ring-1 ring-lilac backdrop-blur">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-extrabold text-grape">
          <Timer className="h-5 w-5" /> Pengaturan Timer
        </h2>
        <AdminSettings />
      </section>

      {/* Manajemen user */}
      <section className="rounded-[1.75rem] bg-white/70 p-5 shadow-sm ring-1 ring-lilac backdrop-blur">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-extrabold text-grape">
          <Users className="h-5 w-5" /> Manajemen User
        </h2>
        <AdminUsersTable />
      </section>
    </main>
  );
}
