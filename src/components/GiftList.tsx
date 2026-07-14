"use client";

import { useMemo, useState } from "react";
import type { Gift } from "@/lib/types";
import GiftCard from "@/components/GiftCard";

// Lista com filtros: Todos | Disponíveis | por categoria.
// Filtra no cliente (a lista é pequena, ~22 presentes) — sem ida ao servidor.

export default function GiftList({ gifts }: { gifts: Gift[] }) {
  const [filter, setFilter] = useState<string>("all");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(gifts.map((g) => g.category).filter((c): c is string => Boolean(c)))
      ),
    [gifts]
  );

  const shown = gifts.filter((g) => {
    if (filter === "all") return true;
    if (filter === "available") return g.status !== "CONCLUIDO";
    return g.category === filter;
  });

  const chips: [string, string][] = [
    ["all", "Todos"],
    ["available", "Disponíveis"],
    ...categories.map((c) => [c, c] as [string, string]),
  ];

  return (
    <>
      <div className="chips">
        {chips.map(([value, label]) => (
          <button
            key={value}
            className={`chip${filter === value ? " active" : ""}`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="gift-grid">
        {shown.map((g) => (
          <GiftCard key={g.id} gift={g} />
        ))}
      </div>
    </>
  );
}
