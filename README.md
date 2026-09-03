# SQL Quest — Game Pembelajaran SQL

Game/learning app SQL interaktif bergaya **dark retro-terminal**. Siswa menulis query
SQL sungguhan di browser dan dieksekusi oleh **PostgreSQL asli** (via
PGlite/WebAssembly) — tanpa perlu server database terpisah saat deploy.

## Fitur

- **10 level kurikulum progresif** (49 soal): SELECT dasar → WHERE → ORDER BY/LIMIT →
  agregasi → GROUP BY/HAVING → subquery → INNER JOIN → LEFT JOIN → JOIN+agregasi →
  tantangan puncak.
- **Panel skema database** di tiap level: lihat tabel, kolom, tipe, PK/FK, dan contoh
  data sebelum mengerjakan soal (dibangkitkan otomatis dari dataset).
- **Level map** di beranda: peta petualangan zigzag dengan status terkunci/terbuka/selesai.
- **Eksekusi query di PostgreSQL asli** (PGlite WASM) di browser, validasi hasil
  dibandingkan dengan solusi (bukan pencocokan string).
- **Game feel**: XP, animasi sukses + konfeti, progress bar, tema terminal konsisten.

## Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 (design tokens dark terminal) |
| Database aplikasi | SQLite (`better-sqlite3`) + Drizzle ORM — level, soal, progress |
| Engine eksekusi SQL | [PGlite](https://pglite.dev) — PostgreSQL WASM di browser |
| Introspection skema | PGlite (Node) saat seed → `levels.schema_json` |
| Migrasi/seed | `drizzle-kit push` + script seed (via `tsx`) |

## Cara menjalankan

> Catatan: pastikan `NODE_ENV` tidak `production` saat install, agar devDependencies
> (drizzle-kit, tsx, typescript) ikut terpasang.

```bash
npm install

# 1) buat + isi database aplikasi (levels, exercises, schema per level) → data/learn.db
npm run db:setup

# 2) jalankan dev server
npm run dev
```

Buka http://localhost:3000. Pilih level di peta → baca panel skema → tulis query →
**▶ jalankan**. Benar = banner sukses + konfeti + XP, soal ditandai selesai, level
berikutnya terbuka di peta.

## Script

| Script | Fungsi |
|---|---|
| `npm run dev` | Dev server Next.js |
| `npm run build` / `start` | Build & jalankan produksi |
| `npm run db:setup` | Push skema ke SQLite + seed konten + introspection schema |
| `npm run db:seed` | Seed ulang (skip level yang slug-nya sudah ada) |
| `npm run db:verify` | Jalankan semua solusi & starter di PGlite, pastikan valid |

> Mengubah konten yang sudah ter-seed? Hapus `data/learn.db`, lalu `npm run db:setup`.

## Struktur

```
src/db/schema.ts         tabel SQLite (levels/exercises/progress)
src/db/content.ts        kurikulum 10 level (dataset, soal, solusi)
src/db/seed.ts           seed idempoten + isi schema_json (introspection)
src/lib/introspect-dataset.ts   baca struktur tabel dari dataset via PGlite Node
src/lib/pglite-runner.ts        PGlite browser: load dataset, run query, banding hasil
src/components/LevelMap.tsx     peta petualangan (unlock logic ada di page)
src/components/SchemaExplorer.tsx  panel "schema --database" collapsible
src/components/SqlRunner.tsx    editor SQL + tombol + hasil + animasi sukses
src/app/page.tsx                landing: header quest + level map + progress
src/app/learn/[levelSlug]/      halaman latihan per level
src/app/api/progress/           POST — catat exercise selesai
scripts/verify-solutions.ts     verifikasi semua solusi valid di PGlite
```

## Cara kerja sandbox latihan

1. Server mengirim soal + `dataset_sql` (CREATE TABLE + INSERT data) ke browser.
2. Client membuat instance PGlite dan mengeksekusi `dataset_sql` — database
   PostgreSQL sungguhan di dalam tab browser.
3. Query siswa dieksekusi terhadap database itu.
4. Query solusi dieksekusi di instance yang sama; hasil keduanya dinormalisasi
   (angka, NULL, tanggal) lalu dibandingkan sebagai multiset baris — kolom boleh
   beda urutan.

## Menambah level/soal

1. Edit `src/db/content.ts`: tambah `LevelSeed` (level + exercises) dengan
   `datasetSql` berisi DDL+DML PostgreSQL valid.
2. Hapus `data/learn.db`, jalankan `npm run db:setup` (schema_json otomatis diisi).
3. Jalankan `npm run db:verify` untuk memastikan solusi & starter valid.

## Deploy

Cukup **satu VPS/instance** (atau PaaS dengan persistent disk):

- Aplikasi Next.js + file SQLite (`data/learn.db`) + PGlite di browser siswa.
- **Tidak perlu** menjalankan service PostgreSQL/MySQL/Docker apa pun di server
  untuk fase 1.
- Jangan deploy ke platform dengan filesystem ephemeral (mis. Vercel) tanpa
  memindahkan SQLite ke layanan persisten (Turso/libSQL, dsb).

## Roadmap fase berikutnya

- Level DML/DDL (INSERT/UPDATE/DELETE, CREATE TABLE) — butuh validasi state DB
- Track MySQL/MariaDB (sandbox Docker server-side atau engine kedua di browser)
- Auth + leaderboard + streak
