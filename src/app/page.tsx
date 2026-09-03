import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">SQL Quest</h1>
      <p className="text-lg text-gray-600">
        Game pembelajaran SQL — mulai petualangan PostgreSQL-mu.
      </p>
      <Link
        href="/levels"
        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-white hover:bg-indigo-500"
      >
        Mulai Belajar
      </Link>
    </main>
  );
}
