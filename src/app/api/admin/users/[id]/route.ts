import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { progress, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

async function requireAdmin() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return null;
  return admin;
}

// PATCH /api/admin/users/[id] { action: "reset-password", password } | { action: "set-role", role } | { action: "reset-progress" }
export async function PATCH(request: Request, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  }

  const target = db.select().from(users).where(eq(users.id, userId)).get();
  if (!target) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

  let body: { action?: string; password?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  if (body.action === "reset-password") {
    const password = body.password ?? "";
    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }
    const passwordHash = await hashPassword(password);
    db.update(users).set({ passwordHash }).where(eq(users.id, userId)).run();
    return NextResponse.json({ ok: true });
  }

  if (body.action === "set-role") {
    if (body.role !== "admin" && body.role !== "user") {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
    }
    // cegah admin menghapus role sendiri
    if (userId === admin.id && body.role !== "admin") {
      return NextResponse.json({ error: "Tidak bisa mengubah role sendiri" }, { status: 400 });
    }
    db.update(users).set({ role: body.role }).where(eq(users.id, userId)).run();
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reset-progress") {
    db.delete(progress).where(eq(progress.userId, userId)).run();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
}

// DELETE /api/admin/users/[id]
export async function DELETE(_request: Request, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  }
  if (userId === admin.id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
  }
  const target = db.select().from(users).where(eq(users.id, userId)).get();
  if (!target) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

  db.delete(progress).where(eq(progress.userId, userId)).run();
  db.delete(users).where(eq(users.id, userId)).run();
  return NextResponse.json({ ok: true });
}
