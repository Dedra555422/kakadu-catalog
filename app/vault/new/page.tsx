"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewMaterialPage() {
  const router = useRouter();
  const [section, setSection] = useState("SPECIAL_OKG");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, category, title, body, linkUrl }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Не удалось опубликовать материал");
      return;
    }
    router.push("/vault");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-black">
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
          Новая запись
        </p>
        <h1 className="mt-2 text-xl font-semibold text-neutral-100">
          Публикация материала
        </h1>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500">
              Раздел
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="mt-2 w-full border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
            >
              <option value="SPECIAL_OKG">Специальное ОКГ</option>
              <option value="REGULAR_OKG">Обычное ОКГ</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500">
              Категория
            </label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Необязательно"
              className="mt-2 w-full border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500">
              Заголовок
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500">
              Описание
            </label>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-2 w-full border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500">
              Ссылка на вложение
            </label>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="mt-2 w-full border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="border border-neutral-700 px-5 py-2 text-xs uppercase tracking-wider text-neutral-200 hover:border-neutral-500 disabled:opacity-50"
          >
            {loading ? "Публикация..." : "Опубликовать"}
          </button>
        </form>
      </main>
    </div>
  );
}
