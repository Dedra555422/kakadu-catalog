import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VaultHeader from "@/components/VaultHeader";

const SECTIONS = [
  { key: "SPECIAL_OKG", title: "Специальное ОКГ", code: "SECTION 01" },
  { key: "REGULAR_OKG", title: "Обычное ОКГ", code: "SECTION 02" },
] as const;

export default async function VaultPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const discordId = (session.user as any).discordId;
  const user = discordId
    ? await prisma.user.findUnique({ where: { discordId } })
    : null;

  if (!user || user.status !== "APPROVED") redirect("/pending");

  const isAdmin = user.role === "OWNER" || user.role === "ADMIN";
  const materials = await prisma.material.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-black">
      <VaultHeader username={user.username} isAdmin={isAdmin} />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-10 border-l-2 border-neutral-700 pl-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
            Уровень доступа подтверждён
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-wide text-neutral-100">
            Архив материалов
          </h1>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {SECTIONS.map((section) => {
            const items = materials.filter((m) => m.section === section.key);
            return (
              <section
                key={section.key}
                className="border border-neutral-800 bg-neutral-950/60"
              >
                <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-600">
                      {section.code}
                    </p>
                    <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-200">
                      {section.title}
                    </h2>
                  </div>
                  <span className="text-xs text-neutral-600">{items.length}</span>
                </div>

                <ul className="divide-y divide-neutral-900">
                  {items.length === 0 && (
                    <li className="px-4 py-6 text-xs text-neutral-600">
                      Материалов пока нет.
                    </li>
                  )}
                  {items.map((m) => (
                    <li key={m.id}>
                      <Link
                        href={`/vault/${m.id}`}
                        className="block px-4 py-3 hover:bg-neutral-900/60"
                      >
                        <p className="text-sm text-neutral-200">{m.title}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-wider text-neutral-600">
                          {m.category || "Без категории"} ·{" "}
                          {new Date(m.createdAt).toLocaleDateString("ru-RU")}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <p className="mt-10 text-[11px] leading-relaxed text-neutral-600">
          Материалы предназначены для внутреннего использования. Не передавайте
          доступ третьим лицам.
        </p>
      </main>
    </div>
  );
}
