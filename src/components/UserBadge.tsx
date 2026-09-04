"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";

type SessionUser = {
  id: number;
  username: string;
  displayName: string;
  role: "admin" | "user";
};

/** Nama event global: dipakai login/register/logout untuk memberi tahu UserBadge */
export const AUTH_CHANGED_EVENT = "sqlquest:auth-changed";

export function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export default function UserBadge() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const d = await res.json();
      setUser(d.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Perbarui badge tiap kali auth berubah (login/register/logout di tab ini)
    window.addEventListener(AUTH_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, refresh);
  }, [refresh]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    notifyAuthChanged();
    router.push("/");
    router.refresh();
  };

  if (!loaded) return <div className="h-9 w-9" />; // placeholder

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-grape shadow-sm ring-1 ring-lilac transition hover:bg-lav"
        >
          <LogIn className="h-4 w-4" /> Masuk
        </Link>
        <Link
          href="/register"
          className="flex items-center gap-1.5 rounded-full bg-grape px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-grape-deep"
        >
          Daftar
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {user.role === "admin" && (
        <Link
          href="/admin"
          className="flex items-center gap-1 rounded-full bg-sun/20 px-3 py-1.5 text-xs font-extrabold text-[#b45309] ring-1 ring-sun/50 transition hover:bg-sun/30"
        >
          <ShieldCheck className="h-4 w-4" /> Admin
        </Link>
      )}
      <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-extrabold text-ink shadow-sm ring-1 ring-lilac">
        <UserIcon className="h-4 w-4 text-grape" /> {user.displayName}
      </span>
      <button
        onClick={logout}
        title="Keluar"
        aria-label="Keluar"
        className="rounded-full border border-lilac bg-white p-2 text-ink-soft transition hover:border-rose/40 hover:text-rose"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
