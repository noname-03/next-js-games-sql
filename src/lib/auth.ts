import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@/db/schema";

// ============================================================
// Auth: password hash (bcrypt) + sesi token (HMAC-signed)
// ============================================================

export const SESSION_COOKIE = "sqlquest_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 hari

// Secret untuk menandatangani token. Di produksi set env SESSION_SECRET.
function getSecret(): string {
  const env = process.env.SESSION_SECRET;
  if (env) return env;
  // Fallback dev: tetap stabil per instance (jangan dipakai produksi)
  return "sqlquest-dev-secret-change-me";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export type SessionUser = {
  id: number;
  username: string;
  displayName: string;
  role: "admin" | "user";
};

function signToken(payload: string): string {
  const hmac = crypto.createHmac("sha256", getSecret());
  hmac.update(payload);
  return hmac.digest("base64url");
}

export function createSessionToken(user: SessionUser): string {
  const body = Buffer.from(
    JSON.stringify({ ...user, exp: Date.now() + SESSION_TTL_MS })
  ).toString("base64url");
  return `${body}.${signToken(body)}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  const dot = token.indexOf(".");
  if (dot === -1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = signToken(body);
  // timing-safe compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionUser & {
      exp: number;
    };
    if (data.exp < Date.now()) return null;
    return {
      id: data.id,
      username: data.username,
      displayName: data.displayName,
      role: data.role,
    };
  } catch {
    return null;
  }
}

export async function setSession(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Baca user dari cookie sesi (tanpa query DB) */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Ambil user lengkap dari DB berdasarkan sesi (pastikan masih ada) */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSessionUser();
  if (!session) return null;
  const user = db.select().from(users).where(eq(users.id, session.id)).get();
  return user ?? null;
}

/** Sesi user untuk dipakai di server component */
export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
}
