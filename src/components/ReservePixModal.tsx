"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reservarCotas } from "@/app/actions/reservar-cotas";
import { reservarLivre } from "@/app/actions/reservar-livre";
import {
  getGuestToken,
  saveClaimAccessToken,
  saveGuestToken,
} from "@/lib/guest-storage";
import { formatBRL } from "@/lib/format";

// Modal de identidade para COTAS e LIVRE. Ao reservar com sucesso, guarda o
// token e navega para a tela de pagamento (/pagamento/[claimId]).

type Props = {
  giftId: string;
  giftTitle: string;
  kind: "COTAS" | "LIVRE";
  shares?: number;
  amountCents: number;
  onClose: () => void;
};

function mensagemErro(code: string): string {
  switch (code) {
    case "COTAS_INSUFICIENTES":
      return "Ops, não há tantas cotas disponíveis agora. Atualize a página e tente com menos.";
    case "PRESENTE_INDISPONIVEL":
      return "Este presente não está disponível agora. Volte à lista para escolher outro.";
    case "VALOR_INVALIDO":
      return "O valor está abaixo do mínimo. Aumente um pouquinho.";
    case "DADOS_INVALIDOS":
      return "Confira o nome e o WhatsApp (com DDD).";
    case "MUITAS_TENTATIVAS":
      return "Muitas tentativas. Aguarde um minuto e tente novamente.";
    default:
      return "Algo deu errado. Tente de novo em instantes.";
  }
}

export default function ReservePixModal({
  giftId,
  giftTitle,
  kind,
  shares,
  amountCents,
  onClose,
}: Props) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [recado, setRecado] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    if (!pending) onClose();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      const guestToken = getGuestToken();
      const res =
        kind === "COTAS"
          ? await reservarCotas({
              giftId,
              shares: shares ?? 1,
              nome,
              whatsapp,
              recado,
              guestToken,
            })
          : await reservarLivre({
              giftId,
              amountCents,
              nome,
              whatsapp,
              recado,
              guestToken,
            });

      if (res.ok) {
        if (res.guestToken) saveGuestToken(res.guestToken);
        saveClaimAccessToken(res.claimId, res.claimAccessToken);
        router.push(`/pagamento/${res.claimId}`);
      } else {
        setErro(mensagemErro(res.error));
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
        <form onSubmit={submit}>
          <p className="eyebrow">Presentear por PIX</p>
          <h3 style={{ fontSize: 26, margin: "8px 0 2px" }}>{giftTitle}</h3>
          <p style={{ color: "var(--marsala-deep)", fontFamily: "var(--font-display)", fontSize: 26 }}>
            {formatBRL(amountCents)}
            {kind === "COTAS" ? ` · ${shares} ${shares === 1 ? "cota" : "cotas"}` : ""}
          </p>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: "8px 0 18px" }}>
            Deixe seu nome e WhatsApp. Na próxima tela você paga por PIX.
          </p>

          <label className="field">
            <span>Seu nome</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Maria Silva" required />
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
            {pending ? "Reservando…" : "Ir para o pagamento"}
          </button>
        </form>
      </div>
    </div>
  );
}
