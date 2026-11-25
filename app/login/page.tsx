"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md border border-neutral-800 bg-neutral-950 p-8">
        <div className="mb-8 text-center">
          <p className="text-xs tracking-[0.4em] text-neutral-500">ACCESS CONTROL</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[0.2em] text-neutral-100">BLACK VAULT</h1>
          <p className="mt-2 text-xs tracking-[0.3em] text-neutral-600">ЗАКРЫТЫЙ АРХИВ ОТДЕЛА</p>
        </div>

        <div className="mb-6 border border-neutral-800 bg-neutral-900/40 p-4 text-xs leading-relaxed text-neutral-400">
          Вход выполняется через Discord. После авторизации заявка уходит на рассмотрение
          администрации. Доступ к материалам открывается только после одобрения.
        </div>

        <button
          onClick={() => signIn("discord", { callbackUrl: "/vault" })}
          className="w-full border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm font-medium tracking-wider text-neutral-100 transition hover:bg-neutral-700"
        >
          ВОЙТИ ЧЕРЕЗ DISCORD
        </button>

        <p className="mt-6 text-center text-[11px] tracking-wider text-neutral-600">
          УРОВЕНЬ ДОСТУПА: НЕ ПОДТВЕРЖДЁН
        </p>
      </div>
    </div>
  );
}
