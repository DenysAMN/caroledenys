"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  getMyGifts,
  type MyGiftsResult,
  type MyGiftClaim,
} from "@/app/actions/meus-presentes";
import { formatBRL } from "@/lib/format";
import { claimStatusLabel, shouldOfferPayment } from "@/lib/guest-area-rules";
import {
  getGuestToken,
  saveClaimAccessToken,
} from "@/lib/guest-storage";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function claimSummary(claim: MyGiftClaim): string {
  if (claim.gift.type === "COTAS" && claim.shares) {
    const label = claim.shares === 1 ? "cota" : "cotas";
    return `${claim.shares} ${label}${
      claim.amountCents ? ` · ${formatBRL(claim.amountCents)}` : ""
    }`;
  }
  if (claim.amountCents) return formatBRL(claim.amountCents);
  return "Presente comprado na loja";
}

export default function MyGifts() {
  const [result, setResult] = useState<MyGiftsResult | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      setResult(await getMyGifts(getGuestToken()));
    });
  }, []);

  if (pending || result === null) {
    return (
      <div className="my-gifts-state" aria-live="polite">
        <span className="my-gifts-seal">C &amp; D</span>
        <p>Procurando suas lembranças neste aparelho…</p>
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="my-gifts-state">
        <span className="my-gifts-seal">C &amp; D</span>
        <h2>Nenhum histórico neste aparelho</h2>
        <p>
          As reservas ficam ligadas ao navegador usado no momento do presente.
          Abra esta página no mesmo celular ou computador em que você reservou.
        </p>
        <Link className="btn" href="/presentes">Ver lista de presentes</Link>
      </div>
    );
  }

  if (result.claims.length === 0) {
    return (
      <div className="my-gifts-state">
        <span className="my-gifts-seal">C &amp; D</span>
        <h2>Olá, {result.guestName}</h2>
        <p>Você já está identificado, mas ainda não reservou nenhum presente.</p>
        <Link className="btn" href="/presentes">Escolher um presente</Link>
      </div>
    );
  }

  function continuePayment(claim: MyGiftClaim) {
    saveClaimAccessToken(claim.id, claim.accessToken);
    window.location.assign(`/pagamento/${claim.id}`);
  }

  return (
    <div className="my-gifts-sheet">
      <header>
        <p className="eyebrow">Guardado neste aparelho</p>
        <h2>Presentes de {result.guestName}</h2>
        <p>{result.claims.length} registro(s) no nosso livro</p>
      </header>
      <ol className="my-gifts-list">
        {result.claims.map((claim, index) => (
          <li key={claim.id}>
            <span className="my-gifts-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="my-gifts-copy">
              <p className="gift-kicker">{claim.gift.type}</p>
              <h3>{claim.gift.title}</h3>
              <p>{claimSummary(claim)}</p>
              <time dateTime={claim.createdAt}>
                Reservado em {dateFormatter.format(new Date(claim.createdAt))}
              </time>
            </div>
            <div className="my-gifts-status">
              <strong>{claimStatusLabel(claim.status)}</strong>
              {shouldOfferPayment(claim.status) && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => continuePayment(claim)}
                >
                  Continuar pagamento
                </button>
              )}
              {claim.status === "RESERVADO" && claim.gift.externalUrl && (
                <a
                  className="btn btn-ghost"
                  href={claim.gift.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir loja ↗
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
