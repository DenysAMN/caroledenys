"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  confirmarPagamento,
  rejeitarPagamento,
} from "@/app/admin/actions/payments";

export default function AdminPaymentActions({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function run(action: typeof confirmarPagamento) {
    startTransition(async () => {
      const result = await action(claimId);
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="admin-payment-actions">
      <button className="btn" disabled={pending} onClick={() => run(confirmarPagamento)}>
        {pending ? "Processando…" : "Confirmar"}
      </button>
      <button
        className="btn admin-btn-danger"
        disabled={pending}
        onClick={() => {
          if (window.confirm("Cancelar esta contribuição imediatamente?")) {
            run(rejeitarPagamento);
          }
        }}
      >
        Rejeitar
      </button>
      {message && <p className="admin-action-message" role="status">{message}</p>}
    </div>
  );
}
