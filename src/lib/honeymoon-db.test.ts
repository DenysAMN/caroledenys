import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// PostgreSQL em memória (PGlite); nunca usa URL ou credencial do Supabase.
let db: PGlite;
type Linha = { data: Record<string, unknown>; revision: number | bigint; updated_at: Date };
async function linhas() {
  return (await db.query<Linha>("select data, revision, updated_at from honeymoon_plan")).rows;
}
async function salvar(data: unknown, revision: number) {
  const resultado = await db.query<{ nova: number | bigint }>("select admin_save_honeymoon_plan($1::jsonb, $2) as nova", [JSON.stringify(data), revision]);
  return Number(resultado.rows[0].nova);
}

beforeAll(async () => {
  db = new PGlite();
  // No Supabase a service_role ignora o RLS; aqui o papel imita isso.
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  await db.exec(await readFile(join(process.cwd(), "supabase/migrations/20261108000000_honeymoon_plan.sql"), "utf8"));
}, 30000);
afterAll(async () => { await db?.close(); });

describe("planejador da lua de mel em PostgreSQL isolado", () => {
  it("começa com uma única linha vazia na revisão 0", async () => {
    const [linha, ...resto] = await linhas();
    expect(resto).toHaveLength(0);
    expect(linha.data).toEqual({});
    expect(Number(linha.revision)).toBe(0);
  });

  it("não aceita uma segunda linha", async () => {
    await expect(db.query("insert into honeymoon_plan(id) values (false)")).rejects.toThrow();
    await expect(db.query("insert into honeymoon_plan(id) values (true)")).rejects.toThrow();
  });

  it("grava quando a revisão confere e devolve a revisão seguinte", async () => {
    const antes = (await linhas())[0].updated_at;
    expect(await salvar({ versao: 1, titulo: "Plano teste" }, 0)).toBe(1);
    const [linha] = await linhas();
    expect(linha.data).toEqual({ versao: 1, titulo: "Plano teste" });
    expect(Number(linha.revision)).toBe(1);
    expect(linha.updated_at.getTime()).toBeGreaterThanOrEqual(antes.getTime());
  });

  it("recusa revisão antiga com STALE_REVISION e preserva o que já estava salvo", async () => {
    await expect(salvar({ versao: 1, titulo: "Atrasado" }, 0)).rejects.toThrow("STALE_REVISION");
    const [linha] = await linhas();
    expect(linha.data).toEqual({ versao: 1, titulo: "Plano teste" });
    expect(Number(linha.revision)).toBe(1);
  });

  it("recusa conteúdo que não é um objeto JSON", async () => {
    await expect(salvar([1, 2], 1)).rejects.toThrow("INVALID_PLAN");
    expect(Number((await linhas())[0].revision)).toBe(1);
  });

  it("mantém RLS ligado e nenhuma política pública", async () => {
    const rls = await db.query<{ relrowsecurity: boolean }>("select relrowsecurity from pg_class where relname = 'honeymoon_plan'");
    expect(rls.rows[0].relrowsecurity).toBe(true);
    const politicas = await db.query<{ total: number }>("select count(*)::int as total from pg_policies where tablename = 'honeymoon_plan'");
    expect(politicas.rows[0].total).toBe(0);
  });

  it("fixa o search_path da função de gravação", async () => {
    const funcao = await db.query<{ prosecdef: boolean; proconfig: string[] }>("select prosecdef, proconfig from pg_proc where proname = 'admin_save_honeymoon_plan'");
    expect(funcao.rows[0].prosecdef).toBe(true);
    expect(funcao.rows[0].proconfig.join(",")).toContain("search_path=public, pg_temp");
  });

  it("nega leitura, escrita e gravação para anon e authenticated", async () => {
    for (const papel of ["anon", "authenticated"]) {
      await db.exec(`set role ${papel}`);
      try {
        await expect(db.query("select data from honeymoon_plan")).rejects.toThrow("permission denied");
        await expect(db.query("update honeymoon_plan set data = '{}'::jsonb")).rejects.toThrow("permission denied");
        await expect(db.query("select admin_save_honeymoon_plan('{}'::jsonb, 1)")).rejects.toThrow("permission denied");
      } finally {
        await db.exec("reset role");
      }
    }
  });

  it("permite ao servidor (service_role) ler e gravar", async () => {
    await db.exec("set role service_role");
    try {
      expect(await salvar({ versao: 1, titulo: "Pelo servidor" }, 1)).toBe(2);
      const [linha] = await linhas();
      expect(linha.data).toEqual({ versao: 1, titulo: "Pelo servidor" });
    } finally {
      await db.exec("reset role");
    }
  });
});
