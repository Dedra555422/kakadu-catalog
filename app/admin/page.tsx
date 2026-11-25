"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("general");
  const [basePrice, setBasePrice] = useState(0);
  const [variantsText, setVariantsText] = useState("Стандарт\nПро +300");
  const [msg, setMsg] = useState("");

  if (!session) {
    return (
      <div className="space-y-3">
        <p className="text-gray-600">Админка доступна после входа.</p>
        <button onClick={() => signIn("google")} className="rounded bg-black px-4 py-2 text-white">
          Войти через Google
        </button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const variants = variantsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const m = line.match(/^(.*?)\s*\+(\d+)$/);
        return m ? { name: m[1].trim(), priceDiff: Number(m[2]) } : { name: line, priceDiff: 0 };
      });

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, imageUrl, category, basePrice, variants }),
    });

    if (res.ok) {
      setMsg("Позиция добавлена");
      setTitle(""); setDescription(""); setImageUrl(""); setBasePrice(0);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error ?? "Ошибка");
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Новая позиция</h1>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название" required className="w-full rounded-lg border px-3 py-2" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" rows={3} className="w-full rounded-lg border px-3 py-2" />
      <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="URL картинки" className="w-full rounded-lg border px-3 py-2" />
      <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Категория" className="w-full rounded-lg border px-3 py-2" />
      <input type="number" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} placeholder="Базовая цена" required className="w-full rounded-lg border px-3 py-2" />
      <textarea value={variantsText} onChange={(e) => setVariantsText(e.target.value)} rows={4} placeholder="Варианты, по одному в строке. Наценка: «Про +300»" className="w-full rounded-lg border px-3 py-2" />
      <button className="rounded-lg bg-black px-5 py-2.5 text-white">Добавить</button>
      {msg && <p className="text-sm text-gray-700">{msg}</p>}
    </form>
  );
}
