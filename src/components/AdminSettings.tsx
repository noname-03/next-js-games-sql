"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Timer } from "lucide-react";

export default function AdminSettings() {
  const [penalty, setPenalty] = useState("0");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setPenalty(String(d?.penaltyPerWrong ?? 0));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ penaltyPerWrong: Number(penalty) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Gagal menyimpan");
      } else {
        setMsg("Tersimpan. Penalti berlaku untuk percobaan baru.");
      }
    } catch {
      setErr("Terjadi kesalahan");
    }
    setSaving(false);
  };

  if (!loaded) {
    return (
      <div className="flex items-center gap-2 py-4 text-ink-soft">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold text-ink-soft">
        Timer per soal mulai saat user klik Jalankan & berhenti saat jawaban benar.
        Penalti ditambahkan ke durasi setiap kali jawaban salah.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-extrabold text-ink" htmlFor="penalty">
          Penalti per jawaban salah (detik):
        </label>
        <select
          id="penalty"
          value={penalty}
          onChange={(e) => setPenalty(e.target.value)}
          className="rounded-2xl border-2 border-lilac bg-white px-4 py-2 text-sm font-bold text-ink outline-none focus:border-grape"
        >
          <option value="0">0 detik (tanpa penalti)</option>
          <option value="10">+10 detik</option>
          <option value="30">+30 detik</option>
          <option value="60">+60 detik</option>
        </select>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-full bg-grape px-5 py-2 text-sm font-extrabold text-white disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan
        </button>
        <span className="flex items-center gap-1 text-xs font-bold text-ink-faint">
          <Timer className="h-3.5 w-3.5" /> berlaku untuk leaderboard Tercepat
        </span>
      </div>
      {msg && <p className="text-sm font-bold text-mint">{msg}</p>}
      {err && <p className="text-sm font-bold text-[#be123c]">{err}</p>}
    </div>
  );
}
