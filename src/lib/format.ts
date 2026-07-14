// Centavos (integer) -> texto em Reais. 12500 -> "R$ 125,00".
// Nunca faça conta de dinheiro com float; aqui só formatamos pra exibir.

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

// Versão curta, sem centavos, pra valores redondos em cards. 45000 -> "R$ 450".
export function formatBRLShort(cents: number): string {
  if (cents % 100 === 0) {
    return `R$ ${(cents / 100).toLocaleString("pt-BR")}`;
  }
  return formatBRL(cents);
}
