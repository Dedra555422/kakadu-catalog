import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VaultHeader from "@/components/VaultHeader";

const SECTION_TITLES: Record<string, string> = {
  SPECIAL_OKG: "Специальное ОКГ",
  REGULAR_OKG: "Обычное ОКГ",
};

export default async function MaterialPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const discordId = (session.user as any).discordId;
  const user = discordId
    ? await prisma.user.findUnique({ where: { discordId } })
    : null;

  if (!user || user.status !== "APPROVED") redirect("/pending");

  const isAdmin = user.role === "OWNER" || user.role === "ADMIN";
  const material = await prisma.material.findUnique({
    where: { id: params.id },
  });

  if (!material) notFound();

  return (
    <div className="min-h-screen bg-black">
      <VaultHeader username={user.username} isAdmin={isAdmin} />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/vault"
          className="text-[11px] uppercase tracking-[0.2em] text-neutral-600 hover:text-neutral-300"
        >
          ← К архиву
        </Link>

        <div className="mt-6 border-l-2 border-neutral-700 pl-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
            {SECTION_TITLES[material.section] ?? material.section}
            {material.category ? ` · ${material.category}` : ""}
          </p>
          <h1 className="mt-2 text-xl font-semibold text-neutral-100">
            {material.title}
          </h1>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-neutral-600">
            Опубликовано{" "}
            {new Date(material.createdAt).toLocaleDateString("ru-RU")}
          </p>
        </div>

        <article className="mt-8 whitespace-pre-wrap border border-neutral-800 bg-neutral-950/60 p-5 text-sm leading-relaxed text-neutral-300">
          {material.body || "Описание не указано."}
        </article>

        {material.linkUrl && (
          <a
            href={material.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block border border-neutral-800 px-4 py-2 text-xs uppercase tracking-wider text-neutral-300 hover:border-neutral-600"
          >
            Открыть вложение
          </a>
        )}
      </main>
    </div>
  );
}
