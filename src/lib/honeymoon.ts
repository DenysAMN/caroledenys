import "server-only";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { dataNoFuso, lerPlanoSalvo, momentoNoFuso, type Plano } from "@/lib/honeymoon-plan";

export const FUSO_DO_CASAL = "America/Sao_Paulo";
const SEM_MIGRACAO = ["PGRST202", "PGRST205", "42P01"];

export type PlanoNoPainel =
  | { estado: "pronto"; plano: Plano | null; revisao: number; hoje: string; ultimaGravacao: string | null; errosLeitura: string[]; bruto: string }
  | { estado: "sem-tabela" }
  | { estado: "erro" };

/** Lê o plano com o cliente admin (service_role), sempre depois de conferir o login do admin. */
export async function getAdminHoneymoonPlan(): Promise<PlanoNoPainel> {
  await requireAdmin();
  let resposta;
  try {
    resposta = await createAdminClient().from("honeymoon_plan").select("data, revision, updated_at").eq("id", true).maybeSingle();
  } catch {
    return { estado: "erro" };
  }
  const { data, error } = resposta;
  if (error) {
    if (SEM_MIGRACAO.includes(error.code)) return { estado: "sem-tabela" };
    console.error("honeymoon read:", error.code);
    return { estado: "erro" };
  }
  if (!data) return { estado: "sem-tabela" };
  const revisao = Number(data.revision);
  const lido = lerPlanoSalvo(data.data);
  return {
    estado: "pronto",
    plano: lido.tipo === "ok" ? lido.plano : null,
    revisao: Number.isSafeInteger(revisao) ? revisao : 0,
    hoje: dataNoFuso(new Date(), FUSO_DO_CASAL),
    ultimaGravacao: revisao > 0 && typeof data.updated_at === "string" ? momentoNoFuso(data.updated_at, FUSO_DO_CASAL) : null,
    errosLeitura: lido.tipo === "invalido" ? lido.erros : [],
    bruto: lido.tipo === "invalido" ? JSON.stringify(data.data, null, 2) : "",
  };
}
