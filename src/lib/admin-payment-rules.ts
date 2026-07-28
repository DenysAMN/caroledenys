const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseAdminClaimId(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  return UUID_PATTERN.test(normalized) ? normalized : null;
}

export function paymentActionError(message?: string): string {
  if (message?.includes("STATUS_INVALIDO")) {
    return "Esta contribuição já foi processada.";
  }
  return "Não foi possível concluir a ação. Tente novamente.";
}
