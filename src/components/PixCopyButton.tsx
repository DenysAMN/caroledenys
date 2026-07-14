"use client";

import { useState } from "react";

export default function PixCopyButton({ code }: { code: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("manual");
    }
  }

  return (
    <div>
      <button className="btn" onClick={copy} style={{ width: "100%" }}>
        {status === "copied" ? "Copiado! ✓" : "Copiar código PIX"}
      </button>
      <label className="pix-code-label">
        <span>Código PIX copia e cola</span>
        <textarea
          className="pix-code"
          value={code}
          readOnly
          rows={3}
          onFocus={(event) => event.currentTarget.select()}
          aria-label="Código PIX copia e cola"
        />
      </label>
      {status === "manual" && (
        <p className="receipt-limit" role="status">
          O navegador não permitiu copiar sozinho. Toque no código acima, selecione e copie.
        </p>
      )}
    </div>
  );
}
