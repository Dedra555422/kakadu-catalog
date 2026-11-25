import { prisma } from "@/lib/prisma";
import { CatalogFilters } from "@/components/CatalogFilters";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const q = searchParams.q?.trim() ?? "";
  const category = searchParams.category ?? "";

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

  const all = await prisma.product.findMany({ select: { category: true } });
  const categories = Array.from(new Set(all.map((p) => p.category)));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Каталог</h1>
      <CatalogFilters categories={categories} />
      {products.length === 0 ? (
        <p className="text-gray-500">Ничего не найдено.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
