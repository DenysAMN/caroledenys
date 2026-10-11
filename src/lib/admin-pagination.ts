// Supabase limits each response; totals must include every page, not just 1,000 rows.
export async function readAllRows<T>(load: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await load(from, from + 999);
    if (error) throw new Error("Não foi possível carregar o resumo. Atualize a página; os totais não foram calculados com dados incompletos.");
    rows.push(...(data ?? []) as T[]);
    if (!data || data.length < 1000) return rows;
  }
}
