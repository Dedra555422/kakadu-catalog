"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  username: string;
  discordId: string;
  role: string;
  status: string;
  isSelf: boolean;
};

export default function AdminUserRow({
  id,
  username,
  discordId,
  role,
  status,
  isSelf,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function patch(payload: { status?: string; role?: string }) {
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Ошибка");
      return;
    }
    startTransition(() => router.refresh());
  }

  const btn =
    "border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wider hover:border-neutral-600 disabled:opacity-40";

  return (
    <tr className="text-neutral-300">
      <td className="py-2 pr-4">{username}</td>
      <td className="py-2 pr-4 font-mono text-xs text-neutral-500">
        {discordId}
      </td>
      <td className="py-2 pr-4 text-xs">{role}</td>
      <td className="py-2 pr-4 text-xs">
        <span
          className={
            status === "APPROVED"
              ? "text-emerald-500"
              : status === "BLOCKED"
              ? "text-red-500"
              : "text-amber-500"
          }
        >
          {status}
        </span>
      </td>
      <td className="py-2">
        <div className="flex flex-wrap gap-2">
          {status !== "APPROVED" && (
            <button
              disabled={pending}
              onClick={() => patch({ status: "APPROVED" })}
              className={btn}
            >
              Одобрить
            </button>
          )}
          {status !== "BLOCKED" && !isSelf && (
            <button
              disabled={pending}
              onClick={() => patch({ status: "BLOCKED" })}
              className={btn}
            >
              Блок
            </button>
          )}
          {role === "MEMBER" && (
            <button
              disabled={pending}
              onClick={() => patch({ role: "ADMIN" })}
              className={btn}
            >
              Сделать админом
            </button>
          )}
          {role === "ADMIN" && (
            <button
              disabled={pending}
              onClick={() => patch({ role: "MEMBER" })}
              className={btn}
            >
              Снять админа
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
      </td>
    </tr>
  );
}
