"use client";

import { useState } from "react";
import ReserveLinkModal from "@/components/ReserveLinkModal";

// Ponte cliente para a página de detalhe (server component).
// Fica SEMPRE montado para LINK, decidindo o que mostrar pelo estado local +
// status do banco. Assim, quando a página se revalida após a reserva (o presente
// vira RESERVADO), a confirmação de sucesso NÃO some — o componente não é trocado.
export default function LinkReserveButton({
  giftId,
  giftTitle,
  externalUrl,
  status,
}: {
  giftId: string;
  giftTitle: string;
  externalUrl: string | null;
  status: string;
}) {
  const [open, setOpen] = useState(false);
  const [reserved, setReserved] = useState(false);

  const taken = reserved || status !== "DISPONIVEL";

  const modal = open ? (
    <ReserveLinkModal
      giftId={giftId}
      giftTitle={giftTitle}
      externalUrl={externalUrl}
      onSuccess={() => setReserved(true)}
      onClose={() => setOpen(false)}
    />
  ) : null;

  if (taken) {
    return (
      <>
        <p className="gift-price" style={{ color: "var(--marsala)" }}>
          {reserved ? "Reservado pra você ♥" : "Já reservado 💝"}
        </p>
        {modal}
      </>
    );
  }

  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>
        Quero dar este presente
      </button>
      {modal}
    </>
  );
}
