import { normalizePhone } from "./reservas";

const SITE_URL = "https://caroledenys.vercel.app";

export function reservationMessage(input: {
  name: string;
  giftTitle: string;
  giftId: string;
  claimId?: string;
  expiresAt?: string | null;
}) {
  const url = input.claimId
    ? `${SITE_URL}/pagamento/${encodeURIComponent(input.claimId)}`
    : `${SITE_URL}/presentes/${encodeURIComponent(input.giftId)}`;
  const status = input.claimId
    ? "Reserva registrada. PIX pendente; pagamento ainda não confirmado."
    : "Reserva registrada. O presente deve ser comprado na loja.";
  const expiry = input.expiresAt
    ? `Prazo para pagar e enviar o comprovante: ${new Date(input.expiresAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (horário de Brasília).`
    : "";
  return ["Casamento Carol e Denys", `Reserva de: ${input.name.trim()}`,
    `Presente: ${input.giftTitle}`, status, expiry, url,
    "Para acessar sua reserva e enviar comprovantes, use o mesmo navegador em que reservou."].filter(Boolean).join("\n");
}

export function whatsappUrl(phone: string, message: string): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized.slice(1)}?text=${encodeURIComponent(message)}`;
}
