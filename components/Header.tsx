"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold">Kakadu Каталог</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:underline">Каталог</Link>
          <Link href="/my" className="hover:underline">Мои выборы</Link>
          <Link href="/admin" className="hover:underline">Админка</Link>
          {session ? (
            <div className="flex items-center gap-2">
              {session.user?.image && (
                <img src={session.user.image} alt="" className="h-7 w-7 rounded-full" />
              )}
              <span className="hidden sm:inline">{session.user?.name}</span>
              <button onClick={() => signOut()} className="rounded border px-3 py-1">Выйти</button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="rounded bg-black px-3 py-1 text-white"
            >
              Войти через Google
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
