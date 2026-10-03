"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { editMessage, moderateMessage } from "@/app/admin/actions/messages";
import type { MessageSource, ModerationDecision } from "@/lib/admin-message-rules";

export default function AdminMessageActions({ id, source, approved, originalText, editingEnabled }: {
  id: string; source: MessageSource; approved: boolean; originalText: string; editingEnabled: boolean;
}) {
  const router = useRouter();
  const textId = useId();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(originalText);

  function run(decision: ModerationDecision) {
    startTransition(async () => {
      try {
        const result = await moderateMessage(id, source, decision);
        setMessage(result.message);
        if (result.ok) router.refresh();
      } catch { setMessage("Não foi possível salvar. Atualize a página e tente novamente."); }
    });
  }

  return <div className="admin-message-actions">
    <div className="admin-inline-actions">
      <button type="button" className={`btn${approved ? " admin-btn-danger" : ""}`} disabled={pending} onClick={() => run(approved ? "HIDE" : "APPROVE")}>
        {pending ? "Salvando…" : approved ? "Ocultar" : "Aprovar"}
      </button>
      <button type="button" className="btn btn-ghost" disabled={pending || !editingEnabled} onClick={() => { setText(originalText); setEditing(true); setMessage(""); }}>Editar texto</button>
      {editingEnabled && <Link className="text-link" href={`/admin/historico?entity=${id}`}>Histórico</Link>}
    </div>
    {editing && <form className="admin-inline-form" onSubmit={event => {
      event.preventDefault();
      startTransition(async () => {
        try {
          const result = await editMessage(id, source, text, originalText);
          setMessage(result.message);
          if (result.ok) { setEditing(false); router.refresh(); }
        } catch { setMessage("Não foi possível salvar. Atualize a página e tente novamente."); }
      });
    }}>
      <label htmlFor={textId}>Texto do recado</label>
      <textarea id={textId} value={text} onChange={event => setText(event.target.value)} maxLength={2000} required rows={5} disabled={pending} />
      <p>A versão anterior será preservada no histórico. O estado publicado ou oculto permanece o mesmo.</p>
      <div className="admin-inline-actions"><button className="btn" disabled={pending}>{pending ? "Salvando…" : "Salvar texto"}</button><button type="button" className="btn btn-ghost" disabled={pending} onClick={() => setEditing(false)}>Voltar</button></div>
    </form>}
    {message && <p className="admin-action-message" role="status">{message}</p>}
  </div>;
}
