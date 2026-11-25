import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return <p className="text-gray-600">Войдите через Google, чтобы увидеть свои выборы.</p>;
  }

  const selections = await prisma.selection.findMany({
    where: { userId },
    include: { product: true, variant: true },
    orderBy: { updatedAt: "desc" },
  });

  if (selections.length === 0) {
    return (
      <p className="text-gray-600">
        Пока ничего не выбрано. <Link href="/" className="underline">В каталог</Link>
      </p>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Мои выборы</h1>
      <ul className="space-y-3">
        {selections.map((s) => (
          <li key={s.id} className="flex items-center justify-between rounded-xl border bg-white p-4">
            <div>
              <Link href={`/product/${s.productId}`} className="font-medium hover:underline">
                {s.product.title}
              </Link>
              <p className="text-sm text-gray-500">
                Вариант: {s.variant?.name ?? "не выбран"} ·{" "}
                {(s.product.basePrice + (s.variant?.priceDiff ?? 0)).toLocaleString("ru-RU")} ₽
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
