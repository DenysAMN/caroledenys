"use client";

import { useEffect, useState } from "react";
import {
  getCountdownParts,
  type CountdownParts,
} from "@/lib/countdown";

// Atualiza a cada segundo no navegador. O estado vazio inicial evita que o
// servidor e o primeiro render do cliente discordem sobre o segundo atual.

export default function Countdown() {
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    const first = window.setTimeout(() => setParts(getCountdownParts()), 0);
    const id = window.setInterval(
      () => setParts(getCountdownParts()),
      1_000
    );
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const cells: [number | string, string][] = [
    [parts?.days ?? "—", "dias"],
    [parts?.hours ?? "—", "horas"],
    [parts?.minutes ?? "—", "min"],
    [parts?.seconds ?? "—", "seg"],
  ];

  return (
    <div className="countdown" aria-label="Contagem regressiva para o casamento">
      {cells.map(([num, label]) => (
        <div className="cd-cell" key={label}>
          <div className="cd-num">
            {typeof num === "number" ? String(num).padStart(2, "0") : num}
          </div>
          <div className="cd-label">{label}</div>
        </div>
      ))}
    </div>
  );
}
