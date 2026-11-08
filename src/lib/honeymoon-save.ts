// Regras da gravação do plano, separadas da Server Action para serem testadas
// sem Supabase. Quem chama injeta a função que fala com o banco.
import { parsePlano, type Plano } from "./honeymoon-plan";

export type SalvarPlanoResultado =
  | { ok: true; revision: number }
  | { ok: false; erro: "STALE" | "INVALIDO" | "FALHA"; mensagens: string[] };

export type GravarPlano = (dados: Plano, revisao: number) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>;

export const MENSAGEM_CONFLITO = "Outra pessoa salvou antes. Suas mudanças continuam na tela; copie o que precisar e recarregue.";
const SEM_MIGRACAO = ["PGRST202", "PGRST205", "42P01", "42883"];

export async function salvarPlanoCom(gravar: GravarPlano, dados: unknown, revisao: unknown): Promise<SalvarPlanoResultado> {
  if (typeof revisao !== "number" || !Number.isSafeInteger(revisao) || revisao < 0) {
    return { ok: false, erro: "INVALIDO", mensagens: ["A versão aberta nesta tela é inválida. Recarregue a página."] };
  }
  const validado = parsePlano(dados);
  if (!validado.ok) return { ok: false, erro: "INVALIDO", mensagens: validado.erros };

  let resposta: Awaited<ReturnType<GravarPlano>>;
  try {
    resposta = await gravar(validado.plano, revisao);
  } catch {
    return { ok: false, erro: "FALHA", mensagens: ["Não foi possível salvar agora. Suas mudanças continuam na tela; tente de novo em instantes."] };
  }
  const { data, error } = resposta;
  if (error) {
    if (error.message?.includes("STALE_REVISION")) return { ok: false, erro: "STALE", mensagens: [MENSAGEM_CONFLITO] };
    if (SEM_MIGRACAO.includes(error.code ?? "")) {
      return { ok: false, erro: "FALHA", mensagens: ["O banco ainda não tem a tabela da lua de mel. Aplique a migração 20261108000000_honeymoon_plan.sql e recarregue a página."] };
    }
    if (error.message?.includes("INVALID_PLAN") || error.message?.includes("PLAN_TOO_LARGE")) {
      return { ok: false, erro: "INVALIDO", mensagens: ["O banco recusou o conteúdo (formato ou tamanho)."] };
    }
    console.error("honeymoon save:", error.code);
    return { ok: false, erro: "FALHA", mensagens: ["Não foi possível salvar agora. Suas mudanças continuam na tela; tente de novo em instantes."] };
  }
  const nova = typeof data === "number" || typeof data === "string" ? Number(data) : Number.NaN;
  if (!Number.isSafeInteger(nova) || nova <= revisao) {
    return { ok: false, erro: "FALHA", mensagens: ["O banco respondeu de um jeito inesperado. Recarregue a página para conferir o que foi salvo."] };
  }
  return { ok: true, revision: nova };
}
