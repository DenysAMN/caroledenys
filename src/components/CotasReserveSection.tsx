"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/format";
import ReservePixModal from "@/components/ReservePixModal";

// Seção de reserva de COTAS: seletor [− n +] + botão que abre o modal PIX.
export default function CotasReserveSection({
  giftId,
  giftTitle,
  shareCents,
  remaining,
}: {
  giftId: string;
  giftTitle: string;
  shareCents: number;
  remaining: number;
}) {
  const max = Math.max(remaining, 1);
  const [n, setN] = useState(1);
  const [open, setOpen] = useState(false);
  const amount = n * shareCents;

  return (
    <div style={{ marginTop: 24 }}>
      <p style={{ fontSize: 14, color: "var(--muted)" }}>
        Cada cota vale {formatBRL(shareCents)}
      </p>
      <div className="qty">
        <button aria-label="Menos uma cota" onClick={() => setN((v) => Math.max(1, v - 1))}>
          −
        </button>
        <span className="n">{n}</span>
        <button aria-label="Mais uma cota" onClick={() => setN((v) => Math.min(max, v + 1))}>
          +
        </button>
        <span style={{ color: "var(--muted)", fontSize: 14 }}>
          {n === 1 ? "cota" : "cotas"} · {remaining} disponíveis
        </span>
      </div>

      <button className="btn" style={{ marginTop: 8 }} onClick={() => setOpen(true)}>
        Presentear por PIX · {formatBRL(amount)}
      </button>

      {open && (
        <ReservePixModal
          giftId={giftId}
          giftTitle={giftTitle}
          kind="COTAS"
          shares={n}
          amountCents={amount}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
