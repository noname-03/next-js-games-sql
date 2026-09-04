# SQL Quest — Game Pembelajaran SQL

Game/learning app SQL interaktif bergaya **pastel futuristik** yang ramah anak SMP.
Siswa menulis query SQL sungguhan di browser dan dieksekusi oleh **PostgreSQL asli**
(via PGlite/WebAssembly) — tanpa perlu server database terpisah saat deploy.

## Fitur

- **200 level kurikulum** (794 soal): dari SELECT dasar sampai CTE, window functions,
  dan subquery berkorelasi.
- **Materi per level**: setiap level yang memperkenalkan istilah baru (UPPER, JOIN,
  COALESCE, dst) menampilkan kartu penjelasan SEBELUM soal — istilah dijelaskan dulu,
  baru diminta dipakai.
- **Panel skema database** di halaman level: lihat tabel, kolom, tipe, PK/FK, dan
  seluruh isi data dengan pagination + nama kolom.
- **Peta misi ular + hero** di tiap level: karakter maju tiap jawaban benar.
- **Layout 3 kolom** ala workspace belajar: peta misi di kiri (sticky), soal di tengah
  (4 soal per halaman), data & skema di kanan (sticky) — rail kiri/kanan bisa
  disembunyikan.
- **Level map** di beranda: peta petualangan dengan status terkunci/terbuka/selesai,
  hero melaju di jalur khusus di kiri.
- **Eksekusi query di PostgreSQL asli** (PGlite WASM) di browser, validasi hasil
  dibandingkan dengan solusi (bukan pencocokan string).
- **Game feel**: XP, animasi sukses + konfeti, progress bar.

## Kurikulum (bab)

1. Level 1-10: SELECT dasar, WHERE, ORDER/LIMIT, agregasi, GROUP BY/HAVING, subquery,
   INNER/LEFT JOIN, JOIN+agregasi, tantangan
2. Level 11-16: fungsi string (UPPER/LOWER, LENGTH, SUBSTRING, CONCAT) & COALESCE
3. Level 17-20: fungsi tanggal (EXTRACT, AGE, CURRENT_DATE)
4. Level 21-26: CASE & logika kondisi, NULLIF
5. Level 27-32: subquery lanjutan (FROM, EXISTS, correlated), UNION/INTERSECT/EXCEPT
6. Level 33-37: window functions (ROW_NUMBER, RANK, LAG, SUM/AVG OVER)
7. Level 38-40: fungsi matematika (ROUND, CEIL, FLOOR, ABS, MOD)
8. Level 41-44: CTE (WITH) & self-join
9. Level 101-104: string lanjutan (REPLACE, POSITION, TRIM, LEFT/RIGHT)
10. Level 45-100 & 105-200: latihan terstruktur 9 topik (SELECT, WHERE, agregasi,
    GROUP BY, JOIN, CASE, tanggal, window, gabungan) dengan variasi soal

## Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 (design tokens pastel) |
| Database aplikasi | SQLite (`better-sqlite3`) + Drizzle ORM — user, level, soal, progress |
| Autentikasi | bcryptjs (hash password) + sesi cookie HMAC-signed |
| Engine eksekusi SQL | [PGlite](https://pglite.dev) — PostgreSQL WASM di browser |
| Introspection skema | PGlite (Node) saat seed → `levels.schema_json` |
| Migrasi/seed | `drizzle-kit push` + script seed (via `tsx`) |

## Cara menjalankan

> Catatan: pastikan `NODE_ENV` tidak `production` saat install, agar devDependencies
> (drizzle-kit, tsx, typescript) ikut terpasang.

```bash
npm install

# 1) buat + isi database aplikasi (levels, exercises, schema per level) → data/learn.db
npm run db:setup   # sekaligus membuat akun admin (admin / admin123)

# 2) jalankan dev server
npm run dev
```

Buka http://localhost:3000. Daftar akun → pilih bab & level di peta → baca panel
skema → tulis query → **Jalankan**. Benar = banner sukses + konfeti + XP, progres
tersimpan per user.

**Akun admin bawaan:** username `admin`, password `admin123` (segera ganti; bisa di-set
lewat env `ADMIN_PASSWORD` saat seed). Dashboard admin di `/admin`: statistik umum,
daftar user + progres, reset password user, reset progres, hapus user.

> Untuk produksi, set env `SESSION_SECRET` (penanda sesi) & `ADMIN_PASSWORD`.

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
src/db/schema.ts         tabel SQLite (levels/exercises/progress) + materi
src/db/content.ts        kurikulum bab 1 (level 1-10) + dataset
src/db/content-extra.ts  bab lanjutan manual (level 11-44, 101-104) + dataset sekolah
src/db/content-gen.ts    generator latihan terstruktur 9 topik (level 45-200)
src/db/seed.ts           seed idempoten + isi schema_json (introspection)
src/lib/introspect-dataset.ts   baca struktur tabel dari dataset via PGlite Node
src/lib/pglite-runner.ts        PGlite browser: load dataset, run query, banding hasil
src/components/LevelMap.tsx     peta petualangan di home (jalur hero di kiri)
src/components/LevelSnakeMap.tsx  peta misi ular per level (compact utk rail kiri)
src/components/LearningLayout.tsx layout 3 kolom + rail hide/unhide + kartu materi
src/components/PagedExercises.tsx  soal 4/halaman + tombol kembali
src/components/SchemaExplorer.tsx  panel data & skema (sticky, pagination data)
src/components/SqlRunner.tsx    editor SQL + tombol + hasil + animasi sukses
src/app/page.tsx                landing: header + level map + progress
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

1. Level bertema: tambah `LevelSeed2` di `src/db/content-extra.ts`.
2. Level latihan massal: perbanyak topik di `src/db/content-gen.ts`.
3. Hubungkan di `src/db/seed.ts` (array `allSeeds`), lalu jalankan `npm run db:seed`
   (level baru masuk; yang sudah ada di-skip). Setiap level otomatis mendapat
   `schema_json` hasil introspection dataset-nya.
4. Jalankan `npm run db:verify` untuk memastikan solusi & starter valid.

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
