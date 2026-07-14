// Espelha a tabela `gifts` (seção 2 da ESPECIFICACAO.md).
// Dinheiro SEMPRE em centavos (integer). R$ 125,00 = 12500.

export type GiftType = "LINK" | "COTAS" | "LIVRE";
export type GiftStatus = "DISPONIVEL" | "RESERVADO" | "CONCLUIDO" | "OCULTO";

export interface Gift {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  type: GiftType;
  status: GiftStatus;
  category: string | null;
  sort_order: number;

  // LINK
  external_url: string | null;
  price_cents: number | null;

  // COTAS
  total_cents: number | null;
  share_cents: number | null;
  total_shares: number | null;
  shares_taken: number;

  // LIVRE
  min_cents: number | null;

  created_at: string;
}
