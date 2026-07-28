"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { moderateMessage } from "@/app/admin/actions/messages";
import type {
  MessageSource,
  ModerationDecision,
} from "@/lib/admin-message-rules";

export default function AdminMessageActions({
  id,
  source,
  approved,
}: {
  id: string;
  source: MessageSource;
  approved: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function run(decision: ModerationDecision) {
    startTransition(async () => {
      const result = await moderateMessage(id, source, decision);
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="admin-message-actions">
      <button
        type="button"
        className={`btn${approved ? " admin-btn-danger" : ""}`}
        disabled={pending}
        onClick={() => run(approved ? "HIDE" : "APPROVE")}
      >
        {pending ? "Salvando…" : approved ? "Ocultar" : "Aprovar"}
      </button>
      {message && <p className="admin-action-message" role="status">{message}</p>}
    </div>
  );
}
