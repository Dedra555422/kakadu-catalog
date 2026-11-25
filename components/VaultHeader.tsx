"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

type Props = {
  username?: string | null;
  isAdmin?: boolean;
};

export default function VaultHeader({ username, isAdmin }: Props) {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/vault" className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center border border-neutral-700 text-xs tracking-widest text-neutral-400">
            BV
          </span>
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-200">
            Black Vault
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-xs uppercase tracking-wider text-neutral-400">
          <Link href="/vault" className="hover:text-neutral-100">
            Архив
          </Link>
          <Link href="/vault/new" className="hover:text-neutral-100">
            Публикация
          </Link>
          {isAdmin && (
            <Link href="/admin" className="hover:text-neutral-100">
              Админ
            </Link>
          )}
          {username && (
            <span className="hidden text-neutral-600 sm:inline">{username}</span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="border border-neutral-800 px-3 py-1 hover:border-neutral-600 hover:text-neutral-200"
          >
            Выход
          </button>
        </nav>
      </div>
    </header>
  );
}
