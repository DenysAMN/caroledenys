import { createPublicClient, supabaseConfigured } from "@/lib/supabase";
import type { Gift } from "@/lib/types";

// Camada de leitura de presentes. Se o Supabase ainda não estiver configurado
// (sem .env.local), devolve vazio em vez de quebrar a página — assim a Home e o
// esqueleto do site funcionam antes das chaves entrarem.

export async function getGifts(): Promise<Gift[]> {
  if (!supabaseConfigured) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("gifts")
    .select("*")
    .neq("status", "OCULTO")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Erro ao ler gifts:", error.message);
    return [];
  }
  return (data as Gift[]) ?? [];
}

export async function getGift(id: string): Promise<Gift | null> {
  if (!supabaseConfigured) return null;
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("gifts")
    .select("*")
    .eq("id", id)
    .neq("status", "OCULTO")
    .maybeSingle();

  if (error) {
    console.error("Erro ao ler gift:", error.message);
    return null;
  }
  return (data as Gift | null) ?? null;
}
