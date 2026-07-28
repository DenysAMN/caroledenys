const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUS_LABELS: Record<string, string> = {
  RESERVADO: "Presente reservado",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  EM_ANALISE: "Pagamento em análise",
  PAGO: "Pagamento confirmado",
  RECEBIDO: "Presente recebido",
  CANCELADO: "Reserva cancelada",
  EXPIRADO: "Reserva expirada",
};

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

export function claimStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? "Em acompanhamento";
}

export function shouldOfferPayment(status: string): boolean {
  return status === "AGUARDANDO_PAGAMENTO";
}
