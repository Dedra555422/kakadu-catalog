import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VaultHeader from "@/components/VaultHeader";
import AdminUserRow from "./AdminUserRow";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const discordId = (session.user as any).discordId;
  const me = discordId
    ? await prisma.user.findUnique({ where: { discordId } })
    : null;

  if (!me) redirect("/pending");
  if (me.role !== "OWNER" && me.role !== "ADMIN") redirect("/vault");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  const logs = await prisma.adminLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const pending = users.filter((u) => u.status === "PENDING");

  return (
    <div className="min-h-screen bg-black">
      <VaultHeader username={me.username} isAdmin />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
          Служебный раздел
        </p>
        <h1 className="mt-2 text-xl font-semibold text-neutral-100">
          Панель администрации
        </h1>

        <section className="mt-8">
          <h2 className="border-b border-neutral-800 pb-2 text-xs uppercase tracking-wider text-neutral-400">
            Заявки на доступ · {pending.length}
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-neutral-600">
                <tr>
                  <th className="py-2 pr-4">Discord</th>
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Роль</th>
                  <th className="py-2 pr-4">Статус</th>
                  <th className="py-2">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {users.map((u) => (
                  <AdminUserRow
                    key={u.id}
                    id={u.id}
                    username={u.username}
                    discordId={u.discordId}
                    role={u.role}
                    status={u.status}
                    isSelf={u.id === me.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="border-b border-neutral-800 pb-2 text-xs uppercase tracking-wider text-neutral-400">
            Журнал действий
          </h2>
          <ul className="mt-3 space-y-2 text-xs text-neutral-500">
            {logs.length === 0 && <li>Записей нет.</li>}
            {logs.map((l) => (
              <li key={l.id} className="border-l border-neutral-800 pl-3">
                <span className="text-neutral-400">{l.action}</span>
                {l.target ? ` · ${l.target}` : ""} ·{" "}
                {new Date(l.createdAt).toLocaleString("ru-RU")}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
