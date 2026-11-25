import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category") ?? "";

  const products = await prisma.product.findMany({
    where: {
      AND: [
        q ? { title: { contains: q } } : {},
        category ? { category } : {},
      ],
    },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const body = await req.json();
  if (!body.title || typeof body.basePrice !== "number") {
    return NextResponse.json({ error: "Нужны title и basePrice" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      imageUrl: body.imageUrl ?? null,
      category: body.category ?? "general",
      basePrice: body.basePrice,
      variants: {
        create: (body.variants ?? []).map((v: { name: string; priceDiff?: number }) => ({
          name: v.name,
          priceDiff: v.priceDiff ?? 0,
        })),
      },
    },
    include: { variants: true },
  });

  return NextResponse.json(product, { status: 201 });
}
