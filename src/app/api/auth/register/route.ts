import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, setSession, toSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { username?: string; password?: string; displayName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const username = (body.username ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const displayName = (body.displayName ?? "").trim() || username;

  if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
    return NextResponse.json(
      { error: "Username 3-20 karakter (huruf kecil, angka, . _)" },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password minimal 6 karakter" },
      { status: 400 }
    );
  }

  const exists = db.select().from(users).where(eq(users.username, username)).get();
  if (exists) {
    return NextResponse.json({ error: "Username sudah dipakai" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  db.insert(users)
    .values({
      username,
      passwordHash,
      displayName,
      role: "user",
      createdAt: new Date(),
    })
    .run();

  const user = db.select().from(users).where(eq(users.username, username)).get()!;
  await setSession(toSessionUser(user));

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    },
  });
}
