"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

type AdminUser = {
  id: number;
  username: string;
  displayName: string;
  role: "admin" | "user";
  createdAt: Date;
  doneCount: number;
  xp: number;
  lastLevel: number | null;
  lastActive: Date | null;
};

export default function AdminUsersTable() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const load = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          return;
        }
        setUsers(d.users);
      })
      .catch(() => setError("Gagal memuat data"));
  };

  useEffect(load, []);

  const act = async (id: number, action: string, extra?: object) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal");
      }
    } catch {
      setError("Terjadi kesalahan");
    }
    setBusyId(null);
    setResetTarget(null);
    setNewPassword("");
    load();
  };

  const remove = async (u: AdminUser) => {
    if (!confirm(`Hapus user "${u.displayName}" beserta progresnya?`)) return;
    setBusyId(u.id);
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Gagal hapus");
    setBusyId(null);
    load();
  };

  const filtered = (users ?? []).filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-2xl border-2 border-rose/40 bg-rose/10 px-4 py-2 text-sm font-bold text-[#be123c]">
          {error}
        </p>
      )}

      {/* Pencarian */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari username atau nama..."
          className="w-full rounded-full border-2 border-lilac bg-white py-2.5 pl-11 pr-4 text-sm font-semibold text-ink outline-none transition focus:border-grape"
        />
      </div>

      {!users && (
        <div className="flex items-center justify-center gap-2 py-10 text-ink-soft">
          <Loader2 className="h-5 w-5 animate-spin" /> Memuat...
        </div>
      )}

      {users && filtered.length === 0 && (
        <p className="py-8 text-center text-sm font-bold text-ink-faint">
          Tidak ada user yang cocok.
        </p>
      )}

      {/* Daftar user */}
      <div className="flex flex-col gap-3">
        {filtered.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center gap-3 rounded-3xl border-2 border-lilac bg-white p-4"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-grape/10">
              {u.role === "admin" ? (
                <ShieldCheck className="h-5 w-5 text-grape" />
              ) : (
                <UserRound className="h-5 w-5 text-grape" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display font-extrabold text-ink">
                  {u.displayName}
                </span>
                <span className="font-mono text-xs text-ink-faint">@{u.username}</span>
                {u.role === "admin" && (
                  <span className="rounded-full bg-sun/20 px-2 py-0.5 text-[10px] font-extrabold text-[#b45309]">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-ink-soft">
                {u.doneCount} soal selesai · {u.xp} XP
                {u.lastLevel ? ` · sampai level ${u.lastLevel}` : " · belum mulai"}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setResetTarget(u);
                  setNewPassword("");
                }}
                disabled={busyId === u.id}
                title="Reset password"
                className="rounded-full border border-lilac bg-white p-2 text-ink-soft transition hover:border-sun hover:text-[#b45309] disabled:opacity-40"
              >
                <KeyRound className="h-4 w-4" />
              </button>
              <button
                onClick={() => act(u.id, "reset-progress")}
                disabled={busyId === u.id}
                title="Reset progres"
                className="rounded-full border border-lilac bg-white p-2 text-ink-soft transition hover:border-sky hover:text-sky disabled:opacity-40"
              >
                {busyId === u.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
              </button>
              {u.role !== "admin" && (
                <button
                  onClick={() => remove(u)}
                  disabled={busyId === u.id}
                  title="Hapus user"
                  className="rounded-full border border-lilac bg-white p-2 text-ink-soft transition hover:border-rose hover:text-rose disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal reset password */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold text-ink">
                Reset password
              </h3>
              <button
                onClick={() => setResetTarget(null)}
                className="rounded-full p-1.5 text-ink-soft hover:bg-lav"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-sm font-semibold text-ink-soft">
              Password baru untuk{" "}
              <span className="font-extrabold text-grape">@{resetTarget.username}</span>
            </p>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="minimal 6 karakter"
              className="mb-4 w-full rounded-2xl border-2 border-lilac bg-lav/30 px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-grape"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setResetTarget(null)}
                className="rounded-full border-2 border-lilac px-5 py-2 text-sm font-extrabold text-ink-soft"
              >
                Batal
              </button>
              <button
                onClick={() =>
                  newPassword.length >= 6 &&
                  act(resetTarget.id, "reset-password", { password: newPassword })
                }
                disabled={newPassword.length < 6}
                className="rounded-full bg-grape px-5 py-2 text-sm font-extrabold text-white disabled:opacity-40"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          load();
          router.refresh();
        }}
        className="self-end text-xs font-bold text-ink-faint hover:text-grape"
      >
        Segarkan data
      </button>
    </div>
  );
}
