import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { VariantPicker } from "@/components/VariantPicker";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { variants: true },
  });
  if (!product) notFound();

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const selection = userId
    ? await prisma.selection.findUnique({
        where: { userId_productId: { userId, productId: product.id } },
      })
    : null;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="overflow-hidden rounded-xl bg-gray-100">
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">{product.title}</h1>
          {product.description && <p className="mt-2 text-gray-600">{product.description}</p>}
        </div>
        <VariantPicker
          productId={product.id}
          basePrice={product.basePrice}
          variants={product.variants}
          initialVariantId={selection?.variantId ?? null}
        />
      </div>
    </div>
  );
}
