import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signOut } from "next-auth/react";

export default async function PendingPage() {
  const session = await getServerSession(authOptions);
  const uid = (session as any)?.uid;
  if (!uid) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) redirect("/login");
  if (user.status === "APPROVED") redirect("/vault");

  const blocked = user.status === "BLOCKED";

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-lg border border-neutral-800 bg-neutral-950 p-8 text-center">
        <p className="text-xs tracking-[0.4em] text-neutral-500">BLACK VAULT</p>
        <h1 className="mt-4 text-2xl font-bold tracking-widest text-neutral-100">
          {blocked ? "ДОСТУП ЗАБЛОКИРОВАН" : "ЗАЯВКА НА РАССМОТРЕНИИ"}
        </h1>

        <div className="mt-6 space-y-2 border border-neutral-800 bg-neutral-900/40 p-4 text-left text-xs text-neutral-400">
          <p>DISCORD ID: <span className="text-neutral-200">{user.discordId}</span></p>
          <p>ИМЯ: <span className="text-neutral-200">{user.username}</span></p>
          <p>СТАТУС: <span className="text-neutral-200">{user.status}</span></p>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-neutral-500">
          {blocked
            ? "Доступ к архиву отозван администрацией."
            : "Материалы архива недоступны до одобрения заявки администрацией."}
        </p>

        <a
          href="/api/auth/signout"
          className="mt-8 inline-block border border-neutral-700 px-5 py-2 text-xs tracking-widest text-neutral-300 hover:bg-neutral-800"
        >
          ВЫЙТИ
        </a>
      </div>
    </div>
  );
}
