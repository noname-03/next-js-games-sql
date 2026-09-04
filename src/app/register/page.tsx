"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Database, Loader2, UserPlus } from "lucide-react";
import { notifyAuthChanged } from "@/components/UserBadge";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal daftar");
        setLoading(false);
        return;
      }
      notifyAuthChanged();
      router.push("/");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan, coba lagi");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-lg ring-1 ring-lilac">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-grape/10">
            <Database className="h-7 w-7 text-grape" />
          </div>
          <h1 className="text-2xl font-extrabold text-grape">Buat Akun Baru</h1>
          <p className="text-sm font-semibold text-ink-soft">
            Mulai petualangan SQL-mu dari awal
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-extrabold text-ink">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-2xl border-2 border-lilac bg-lav/30 px-4 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-grape"
              placeholder="mis. budi2024 (3-20 karakter)"
            />
          </div>
          <div>
            <label htmlFor="displayName" className="mb-1 block text-sm font-extrabold text-ink">
              Nama Panggilan
            </label>
            <input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-2xl border-2 border-lilac bg-lav/30 px-4 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-grape"
              placeholder="mis. Budi"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-extrabold text-ink">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-2xl border-2 border-lilac bg-lav/30 px-4 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-grape"
              placeholder="minimal 6 karakter"
            />
          </div>

          {error && (
            <p className="rounded-2xl border-2 border-rose/40 bg-rose/10 px-4 py-2 text-sm font-bold text-[#be123c]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-full bg-grape px-6 py-3 font-display text-sm font-extrabold text-white shadow-md transition hover:bg-grape-deep disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Daftar
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-bold text-ink-soft">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-grape underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </main>
  );
}
