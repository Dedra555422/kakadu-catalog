import Link from "next/link";

type Props = {
  product: {
    id: string;
    title: string;
    imageUrl: string | null;
    basePrice: number;
    variants: { id: string; name: string; priceDiff: number }[];
  };
};

export function ProductCard({ product }: Props) {
  const minPrice = product.basePrice + Math.min(0, ...product.variants.map(v => v.priceDiff));

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-white transition hover:shadow-md"
    >
      <div className="aspect-[3/2] bg-gray-100">
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-medium group-hover:underline">{product.title}</h3>
        <p className="text-sm text-gray-500">
          Вариантов: {product.variants.length}
        </p>
        <p className="mt-auto font-semibold">от {minPrice.toLocaleString("ru-RU")} ₽</p>
      </div>
    </Link>
  );
}
