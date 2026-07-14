"use client";

import { useEffect, useState } from "react";

// Cronômetro da reserva de COTAS. Deriva de expires_at (banco), não de
// setTimeout — se recarregar, continua certo. (armadilha da spec)
export default function PaymentCountdown({ expiresAt }: { expiresAt: string }) {
  const target = new Date(expiresAt).getTime();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    const first = window.setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [target]);

  if (left === null) return null;

  if (left === 0) {
    return (
      <p style={{ fontSize: 14, color: "var(--marsala-deep)" }}>
        A reserva expirou. Volte à lista e reserve de novo, sem pressa.
      </p>
    );
  }

  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <p style={{ fontSize: 14, color: "var(--muted)" }}>
      Suas cotas estão reservadas por{" "}
      <strong style={{ color: "var(--marsala)" }}>
        {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </strong>
    </p>
  );
}
