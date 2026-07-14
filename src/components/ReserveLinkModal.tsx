"use client";

import { useState, useTransition } from "react";
import { reservarLink, type ReserveResult } from "@/app/actions/reservar-link";
import { getGuestToken, saveGuestToken } from "@/lib/guest-storage";

type Props = {
  giftId: string;
  giftTitle: string;
  externalUrl: string | null;
  onSuccess: () => void;
  onClose: () => void;
};

export default function ReserveLinkModal({
  giftId,
  giftTitle,
  externalUrl,
  onSuccess,
  onClose,
}: Props) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [recado, setRecado] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function close() {
    if (!pending) onClose();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      const res: ReserveResult = await reservarLink({
        giftId,
        nome,
        whatsapp,
        recado,
        guestToken: getGuestToken(),
      });
      if (res.ok) {
        if (res.token) saveGuestToken(res.token);
        setDone(true);
        onSuccess();
      } else if (res.error === "JA_RESERVADO") {
        setErro("Alguém foi mais rápido 😅 esse presente acabou de ser reservado. Que tal escolher outro?");
      } else if (res.error === "DADOS_INVALIDOS") {
        setErro("Confira o nome e o WhatsApp (com DDD).");
      } else {
        setErro("Algo deu errado. Tente de novo em instantes.");
      }
    });
  }

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-x"
          onClick={close}
          disabled={pending}
          aria-label="Fechar"
        >
          ×
        </button>

        {done ? (
          <div style={{ textAlign: "center" }}>
            <p className="eyebrow">Reservado</p>
            <h3 style={{ fontSize: 30, margin: "10px 0" }}>Reservado pra você! ♥</h3>
            <p style={{ color: "var(--muted)", fontSize: 15 }}>
              Anotamos que <strong>{giftTitle}</strong> é presente seu. Agora é só
              comprar quando puder.
            </p>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              {externalUrl && (
                <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="btn">
                  Ir para a loja ↗
                </a>
              )}
              <button className="btn btn-ghost" onClick={onClose}>
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="eyebrow">Quero dar este presente</p>
            <h3 style={{ fontSize: 26, margin: "8px 0 4px" }}>{giftTitle}</h3>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 18 }}>
              Deixe seu nome e WhatsApp — assim guardamos que é seu e ninguém compra
              repetido.
            </p>

            <label className="field">
              <span>Seu nome</span>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Maria Silva"
                required
              />
            </label>

            <label className="field">
              <span>WhatsApp (com DDD)</span>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(22) 99999-9999"
                inputMode="tel"
                required
              />
            </label>

            <label className="field">
              <span>Recadinho (opcional)</span>
              <textarea
                value={recado}
                onChange={(e) => setRecado(e.target.value)}
                placeholder="Um recado carinhoso para os noivos…"
                rows={3}
              />
            </label>

            {erro && <p className="field-error">{erro}</p>}

            <button type="submit" className="btn" disabled={pending} style={{ width: "100%", marginTop: 8 }}>
              {pending ? "Reservando…" : "Confirmar reserva"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
