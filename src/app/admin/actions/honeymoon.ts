"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { salvarPlanoCom, type SalvarPlanoResultado } from "@/lib/honeymoon-save";

// Grava o plano inteiro da lua de mel. A revisão impede sobrescrever quem salvou antes.
export async function salvarPlano(dados: unknown, revisao: number): Promise<SalvarPlanoResultado> {
  await requireAdmin();
  const resultado = await salvarPlanoCom(async (plano, revisaoAtual) => {
    const { data, error } = await createAdminClient().rpc("admin_save_honeymoon_plan", { p_data: plano, p_revision: revisaoAtual });
    return { data, error };
  }, dados, revisao);
  if (resultado.ok) revalidatePath("/admin/lua-de-mel");
  return resultado;
}
