"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function CatalogFilters({ categories }: { categories: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const category = params.get("category") ?? "";

  function apply(next: { q?: string; category?: string }) {
    const sp = new URLSearchParams();
    const nq = next.q ?? q;
    const nc = next.category ?? category;
    if (nq) sp.set("q", nq);
    if (nc) sp.set("category", nc);
    router.push(`/?${sp.toString()}`);
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); apply({ q }); }}
      className="mb-6 flex flex-wrap gap-3"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Поиск по названию"
        className="min-w-56 flex-1 rounded-lg border px-3 py-2"
      />
      <select
        value={category}
        onChange={(e) => apply({ category: e.target.value })}
        className="rounded-lg border px-3 py-2"
      >
        <option value="">Все категории</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <button className="rounded-lg bg-black px-4 py-2 text-white">Найти</button>
    </form>
  );
}
