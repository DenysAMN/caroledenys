import { isUuid } from "./guest-area-rules";
import type { MessageSource } from "./admin-message-rules";

export type ReservationAction = "CANCEL" | "RECEIVE" | "REOPEN";
export const RESERVATION_STATUSES = ["RESERVADO", "AGUARDANDO_PAGAMENTO", "EM_ANALISE", "PAGO", "RECEBIDO", "CANCELADO", "EXPIRADO"] as const;
export const ACTIVE_RESERVATION_STATUSES = ["RESERVADO", "AGUARDANDO_PAGAMENTO", "EM_ANALISE", "PAGO", "RECEBIDO"];

export function parseMessageEdit(id: unknown, source: unknown, text: unknown, expectedText: unknown) {
  if (!isUuid(id) || (source !== "CLAIM" && source !== "RSVP") || typeof text !== "string" || typeof expectedText !== "string") return null;
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 2000 || expectedText.length > 10000) return null;
  return { id: id.trim().toLowerCase(), source: source as MessageSource, text: trimmed, expectedText };
}

export function parseReservationAction(id: unknown, action: unknown, reason: unknown) {
  if (!isUuid(id) || (action !== "CANCEL" && action !== "RECEIVE" && action !== "REOPEN") || typeof reason !== "string") return null;
  const trimmed = reason.trim();
  if (trimmed.length < 3 || trimmed.length > 300) return null;
  return { id: id.trim().toLowerCase(), action: action as ReservationAction, reason: trimmed };
}

export function reservationActions(type: string, status: string): ReservationAction[] {
  if (type === "LINK" && status === "RECEBIDO") return ["REOPEN"];
  if (type === "LINK" && status === "RESERVADO") return ["RECEIVE", "CANCEL"];
  if (["AGUARDANDO_PAGAMENTO", "EM_ANALISE"].includes(status) && ["COTAS", "LIVRE"].includes(type)) return ["CANCEL"];
  return [];
}

export function managementError(error: { code?: string; message?: string }) {
  if (error.code === "PGRST202" || error.message?.includes("admin_management_ready")) return "Esta opção precisa da atualização do banco indicada no aviso do painel.";
  if (error.message?.includes("CONFLITO_EDICAO")) return "Este recado mudou em outra sessão. Atualize a página antes de editar novamente.";
  if (error.message?.includes("STATUS_INVALIDO")) return "A reserva mudou de status. Atualize a página; pagamentos confirmados não podem ser cancelados aqui.";
  if (error.message?.includes("COTAS_INCONSISTENTES")) return "A contagem de cotas precisa de conferência. Nenhuma alteração foi aplicada.";
  return "Não foi possível salvar. Tente novamente.";
}

export function csvCell(value: string) {
  // Neutraliza fórmulas ao abrir o CSV no Excel, inclusive após espaços.
  const safe = /^\s*[=+@-]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
