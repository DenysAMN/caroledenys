"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/format";
import ReservePixModal from "@/components/ReservePixModal";

const SUGESTOES = [5000, 10000, 20000]; // R$ 50 / 100 / 200 em centavos

// Seção de reserva LIVRE: campo de valor + sugestões + botão que abre o modal.
export default function LivreReserveSection({
  giftId,
  giftTitle,
  minCents,
}: {
  giftId: string;
  giftTitle: string;
  minCents: number;
}) {
  const [reais, setReais] = useState("");
  const [open, setOpen] = useState(false);

  const cents = Math.round((parseFloat(reais.replace(",", ".")) || 0) * 100);
  const valido = cents >= minCents;

  const inputStyle: React.CSSProperties = {
    width: 150,
    fontFamily: "var(--font-body)",
    fontSize: 20,
    color: "var(--ink)",
    background: "var(--paper)",
    border: "1px solid var(--sand)",
    borderRadius: "var(--radius)",
    padding: "12px 14px",
  };

  return (
    <div style={{ marginTop: 26 }}>
      <p style={{ fontSize: 14, color: "var(--muted)" }}>
        Você escolhe o valor · mínimo {formatBRL(minCents)}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--marsala-deep)" }}>
          R$
        </span>
        <input
          inputMode="decimal"
          value={reais}
          onChange={(e) => setReais(e.target.value)}
          placeholder="100,00"
          style={inputStyle}
        />
      </div>

      <div className="chips" style={{ justifyContent: "flex-start", marginTop: 12 }}>
        {SUGESTOES.map((c) => (
          <button
            type="button"
            key={c}
            className="chip"
            onClick={() => setReais(String(c / 100))}
          >
            {formatBRL(c)}
          </button>
        ))}
      </div>

      <button
        className="btn"
        style={{ marginTop: 8 }}
        disabled={!valido}
        onClick={() => valido && setOpen(true)}
      >
        Presentear por PIX{valido ? ` · ${formatBRL(cents)}` : ""}
      </button>

      {open && valido && (
        <ReservePixModal
          giftId={giftId}
          giftTitle={giftTitle}
          kind="LIVRE"
          amountCents={cents}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
