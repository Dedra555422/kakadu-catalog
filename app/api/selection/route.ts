import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { productId, variantId } = await req.json();
  if (!productId) return NextResponse.json({ error: "Нужен productId" }, { status: 400 });

  const selection = await prisma.selection.upsert({
    where: { userId_productId: { userId, productId } },
    update: { variantId: variantId ?? null },
    create: { userId, productId, variantId: variantId ?? null },
  });

  return NextResponse.json(selection);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "Нужен productId" }, { status: 400 });

  await prisma.selection.deleteMany({ where: { userId, productId } });
  return NextResponse.json({ ok: true });
}
