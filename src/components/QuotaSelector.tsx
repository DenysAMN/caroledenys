"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/format";

// Seletor de cotas (só visual nesta sessão — a reserva de verdade é a S4).
// Mostra [− n +] e calcula n × valor-da-cota, limitado às cotas restantes.

export default function QuotaSelector({
  shareCents,
  remaining,
}: {
  shareCents: number;
  remaining: number;
}) {
  const max = Math.max(remaining, 1);
  const [n, setN] = useState(1);

  return (
    <div>
      <div className="qty">
        <button
          aria-label="Menos uma cota"
          onClick={() => setN((v) => Math.max(1, v - 1))}
        >
          −
        </button>
        <span className="n">{n}</span>
        <button
          aria-label="Mais uma cota"
          onClick={() => setN((v) => Math.min(max, v + 1))}
        >
          +
        </button>
        <span style={{ color: "var(--muted)", fontSize: 14 }}>
          {n === 1 ? "cota" : "cotas"} · {remaining} disponíveis
        </span>
      </div>
      <p className="gift-price" style={{ fontSize: 30 }}>
        {formatBRL(n * shareCents)}
      </p>
    </div>
  );
}
