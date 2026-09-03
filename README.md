# SQL Quest — Game Pembelajaran SQL

Game/learning app SQL interaktif. Siswa menulis query SQL sungguhan di browser dan
dieksekusi oleh **PostgreSQL asli** (via PGlite/WebAssembly) — tanpa perlu server
database terpisah saat deploy.

## Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database aplikasi | SQLite (`better-sqlite3`) + Drizzle ORM — menyimpan level, soal, & progress |
| Engine eksekusi SQL | [PGlite](https://pglite.dev) — PostgreSQL WASM, berjalan di browser siswa |
| Migrasi/seed | `drizzle-kit push` + script seed (via `tsx`) |

## Cara menjalankan

> Catatan: pastikan `NODE_ENV` tidak `production` saat install, agar devDependencies
> (drizzle-kit, tsx, typescript) ikut terpasang.

```bash
npm install

# 1) buat + isi database aplikasi (levels, exercises) → data/learn.db
npm run db:setup

# 2) jalankan dev server
npm run dev
```

Buka http://localhost:3000. Pilih level → tulis query di editor → **Jalankan**.
Query dieksekusi di Postgres (WASM) di browser; hasil dibandingkan dengan solusi
referensi (struktur kolom + isi baris). Benar = soal ditandai selesai.

## Script

| Script | Fungsi |
|---|---|
| `npm run dev` | Dev server Next.js |
| `npm run build` / `start` | Build & jalankan produksi |
| `npm run db:setup` | Push skema ke SQLite + seed konten |
| `npm run db:seed` | Seed ulang (skip bila DB sudah terisi) |

## Struktur

```
src/db/            skema (schema.ts), koneksi SQLite (client.ts), konten (seed.ts)
src/app/page.tsx   landing — daftar level + progress
src/app/learn/[levelSlug]/   halaman latihan per level
src/components/SqlRunner.tsx editor SQL (client component)
src/lib/pglite-runner.ts     helper PGlite: load dataset, run query, banding hasil
src/app/api/progress/        POST — catat exercise selesai
```

## Cara kerja sandbox latihan

1. Server mengirim soal + `dataset_sql` (CREATE TABLE + INSERT data) ke browser.
2. Client membuat instance PGlite dan mengeksekusi `dataset_sql` — database
   PostgreSQL sungguhan di dalam tab browser.
3. Query siswa dieksekusi terhadap database itu.
4. Query solusi dieksekusi di instance yang sama; hasil keduanya dinormalisasi
   (angka, NULL, tanggal) lalu dibandingkan sebagai multiset baris — kolom boleh
   beda urutan.

## Deploy

Cukup **satu VPS/instance** (atau PaaS dengan persistent disk):

- Aplikasi Next.js + file SQLite (`data/learn.db`) + PGlite di browser siswa.
- **Tidak perlu** menjalankan service PostgreSQL/MySQL/Docker apa pun di server
  untuk fase 1.
- Jangan deploy ke platform dengan filesystem ephemeral (mis. Vercel) tanpa
  memindahkan SQLite ke layanan persisten (Turso/libSQL, dsb).

## Roadmap fase berikutnya

- Track MySQL/MariaDB (sandbox Docker server-side atau engine kedua di browser)
- Auth + leaderboard
- Level DML/DDL (INSERT/UPDATE/DELETE, CREATE TABLE)
