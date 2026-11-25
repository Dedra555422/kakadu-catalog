"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

type Variant = { id: string; name: string; priceDiff: number };

export function VariantPicker({
  productId,
  basePrice,
  variants,
  initialVariantId,
}: {
  productId: string;
  basePrice: number;
  variants: Variant[];
  initialVariantId: string | null;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(initialVariantId);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const current = variants.find((v) => v.id === selected);
  const price = basePrice + (current?.priceDiff ?? 0);

  async function save() {
    if (!session) return signIn("google");
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, variantId: selected }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => (
          <button
            key={v.id}
            onClick={() => { setSelected(v.id); setSaved(false); }}
            className={`rounded-lg border px-4 py-2 text-sm ${
              selected === v.id ? "border-black bg-black text-white" : "bg-white"
            }`}
          >
            {v.name}
            {v.priceDiff > 0 && <span className="ml-1 opacity-70">+{v.priceDiff} ₽</span>}
          </button>
        ))}
      </div>

      <p className="text-2xl font-semibold">{price.toLocaleString("ru-RU")} ₽</p>

      <button
        onClick={save}
        disabled={saving || !selected}
        className="rounded-lg bg-black px-5 py-2.5 text-white disabled:opacity-50"
      >
        {saving ? "Сохраняю…" : session ? "Сохранить выбор" : "Войти и сохранить"}
      </button>

      {saved && <p className="text-sm text-green-600">Выбор сохранён в аккаунте</p>}
    </div>
  );
}
