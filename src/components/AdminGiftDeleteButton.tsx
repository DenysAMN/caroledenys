"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { excluirPresente } from "@/app/admin/actions/gifts";

export default function AdminGiftDeleteButton({ giftId }: { giftId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div>
      <button
        type="button"
        className="admin-text-danger"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Excluir este presente e todas as reservas ligadas a ele?")) return;
          startTransition(async () => {
            const result = await excluirPresente(giftId);
            if (!result.ok) setError(result.message);
            else router.push("/admin/presentes");
          });
        }}
      >
        {pending ? "Excluindo…" : "Excluir presente"}
      </button>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
