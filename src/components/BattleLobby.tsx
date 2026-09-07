"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Crosshair,
  Loader2,
  Shield,
  Swords,
  Trophy,
  Check,
} from "lucide-react";

type Level = { id: number; orderIndex: number; title: string; slug: string };
type HistoryItem = {
  id: string;
  exerciseId: number;
  player1Name: string;
  player2Name: string;
  status: string;
  iWon: boolean;
  createdAt: Date;
};

type Props = {
  userId: number;
  username: string;
  displayName: string;
  levels: Level[];
  history: HistoryItem[];
  isLoggedIn: boolean;
};

export default function BattleLobby({
  userId,
  username,
  displayName,
  levels,
  history,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (!selectedLevel) return;
    setCreating(true);
    try {
      // Ambil random exercise dari level yang dipilih
      const res = await fetch("/api/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: selectedLevel }),
      });
      const data = await res.json();
      if (data.battleId) {
        router.push(`/battle/${data.battleId}`);
      }
    } catch {
      setCreating(false);
    }
  };

  const handleJoin = () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (!joinCode.trim()) return;
    router.push(`/battle/${joinCode.trim()}`);
  };

  const copyLink = (battleId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/battle/${battleId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-grape shadow-sm ring-1 ring-lilac transition hover:-translate-x-0.5 hover:shadow"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold text-grape">
          <Swords className="h-6 w-6" /> Battle Mode
        </h1>
      </header>

      {/* Buat Battle */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-lilac">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-extrabold text-grape">
          <Crosshair className="h-5 w-5" /> Buat Battle Baru
        </h2>
        <p className="mb-4 text-sm font-semibold text-ink-soft">
          Pilih level, lalu kirim link ke teman untuk mulai battle!
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mb-4 max-h-48 overflow-y-auto">
          {levels.slice(0, 30).map((lv) => (
            <button
              key={lv.id}
              onClick={() => setSelectedLevel(lv.id)}
              className={`rounded-lg border-2 px-3 py-2 text-left text-xs font-bold transition ${
                selectedLevel === lv.id
                  ? "border-grape bg-grape/10 text-grape"
                  : "border-lilac bg-white text-ink-soft hover:border-grape/40"
              }`}
            >
              Lv {lv.orderIndex}
              <span className="block text-[10px] font-semibold text-ink-faint truncate">
                {lv.title}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={handleCreate}
          disabled={!selectedLevel || creating}
          className="flex items-center gap-2 rounded-full bg-grape px-6 py-2.5 font-display text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Swords className="h-4 w-4" />
          )}
          Buat Battle
        </button>
      </section>

      {/* Join Battle */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-lilac">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-extrabold text-grape">
          <Shield className="h-5 w-5" /> Gabung Battle
        </h2>
        <p className="mb-4 text-sm font-semibold text-ink-soft">
          Punya kode battle dari teman? Masukkan di sini.
        </p>
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Masukkan kode battle..."
            className="flex-1 rounded-xl border-2 border-lilac bg-lav/30 px-4 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-grape"
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
          <button
            onClick={handleJoin}
            disabled={!joinCode.trim()}
            className="flex items-center gap-2 rounded-full bg-peach px-5 py-2.5 font-display text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            Gabung
          </button>
        </div>
      </section>

      {/* History */}
      {history.length > 0 && (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-lilac">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-extrabold text-grape">
            <Trophy className="h-5 w-5" /> Riwayat Battle
          </h2>
          <div className="flex flex-col gap-2">
            {history.map((h) => (
              <div
                key={h.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  h.iWon ? "bg-mint-soft" : "bg-lav/30"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${
                    h.iWon
                      ? "bg-sun text-[#b45309]"
                      : "bg-lilac text-ink-faint"
                  }`}
                >
                  {h.iWon ? <Trophy className="h-3.5 w-3.5" /> : "L"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink truncate">
                    {h.player1Name} vs {h.player2Name}
                  </p>
                  <p className="text-[10px] font-semibold text-ink-faint">
                    {new Date(h.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <span
                  className={`text-xs font-extrabold ${
                    h.iWon ? "text-mint" : "text-ink-faint"
                  }`}
                >
                  {h.iWon ? "Menang" : "Kalah"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
