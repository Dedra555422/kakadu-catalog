import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function currentUser() {
  const session = await getServerSession(authOptions);
  const uid = (session as any)?.uid;
  const status = (session as any)?.status;
  const role = (session as any)?.role;
  if (!uid || status !== "APPROVED") return null;
  return { uid: uid as string, role: role as string };
}

function isAdmin(role: string) {
  return role === "OWNER" || role === "ADMIN";
}

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section");
  const category = searchParams.get("category");

  const materials = await prisma.material.findMany({
    where: {
      ...(section ? { section: section as any } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { username: true, discordId: true } } },
  });
  return NextResponse.json(materials);
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  const body = await req.json();
  const { section, category, title, body: text, linkUrl } = body;
  if (!section || !title || !text) {
    return NextResponse.json({ error: "Нужны section, title, body" }, { status: 400 });
  }

  const material = await prisma.material.create({
    data: {
      section,
      category: category || "general",
      title,
      body: text,
      linkUrl: linkUrl || null,
      authorId: user.uid,
    },
  });

  if (isAdmin(user.role)) {
    await prisma.adminLog.create({
      data: { actorId: user.uid, action: "material:create", target: material.id },
    });
  }

  return NextResponse.json(material, { status: 201 });
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  const body = await req.json();
  const { id, title, body: text, category, linkUrl } = body;
  if (!id) return NextResponse.json({ error: "Нужен id" }, { status: 400 });

  const existing = await prisma.material.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  if (existing.authorId !== user.uid && !isAdmin(user.role)) {
    return NextResponse.json({ error: "Нельзя редактировать чужой материал" }, { status: 403 });
  }

  const updated = await prisma.material.update({
    where: { id },
    data: {
      ...(title ? { title } : {}),
      ...(text ? { body: text } : {}),
      ...(category ? { category } : {}),
      ...(linkUrl !== undefined ? { linkUrl: linkUrl || null } : {}),
    },
  });

  if (isAdmin(user.role)) {
    await prisma.adminLog.create({
      data: { actorId: user.uid, action: "material:update", target: id },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Нужен id" }, { status: 400 });

  const existing = await prisma.material.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  if (existing.authorId !== user.uid && !isAdmin(user.role)) {
    return NextResponse.json({ error: "Нельзя удалять чужой материал" }, { status: 403 });
  }

  await prisma.material.delete({ where: { id } });

  if (isAdmin(user.role)) {
    await prisma.adminLog.create({
      data: { actorId: user.uid, action: "material:delete", target: id },
    });
  }

  return NextResponse.json({ ok: true });
}
