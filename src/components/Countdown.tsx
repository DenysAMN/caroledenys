"use client";

import { useEffect, useState } from "react";

// Contagem regressiva até a cerimônia. Deriva do relógio do navegador e
// atualiza a cada segundo. Renderiza vazio até "montar" no cliente para
// evitar mismatch de hidratação (servidor e cliente veriam horas diferentes).

const TARGET = new Date("2027-01-31T16:00:00-03:00").getTime();

type Parts = { d: number; h: number; m: number; s: number };

function diff(): Parts {
  const ms = Math.max(0, TARGET - Date.now());
  const total = Math.floor(ms / 1000);
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

export default function Countdown() {
  const [p, setP] = useState<Parts | null>(null);

  useEffect(() => {
    setP(diff());
    const id = setInterval(() => setP(diff()), 1000);
    return () => clearInterval(id);
  }, []);

  const cells: [number | string, string][] = [
    [p?.d ?? "—", "dias"],
    [p?.h ?? "—", "horas"],
    [p?.m ?? "—", "min"],
    [p?.s ?? "—", "seg"],
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
