import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.role;
  const uid = (session as any)?.uid;
  if (!uid || (role !== "OWNER" && role !== "ADMIN")) return null;
  return uid as string;
}

export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      discordId: true,
      username: true,
      role: true,
      status: true,
      createdAt: true,
      lastLogin: true,
    },
  });
  return NextResponse.json(users);
}

export async function PATCH(req: Request) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  const body = await req.json();
  const { userId, status, role } = body;
  if (!userId) return NextResponse.json({ error: "Нужен userId" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  if (target.role === "OWNER" && role && role !== "OWNER") {
    return NextResponse.json({ error: "Роль владельца менять нельзя" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(status ? { status } : {}),
      ...(role ? { role } : {}),
    },
  });

  await prisma.adminLog.create({
    data: {
      actorId: adminId,
      action: status ? "status:" + status : "role:" + role,
      target: updated.discordId,
    },
  });

  return NextResponse.json({ ok: true });
}
