import { describe, expect, it } from "vitest";
import { planoVazio, type Plano } from "./honeymoon-plan";
import { MENSAGEM_CONFLITO, salvarPlanoCom, type GravarPlano } from "./honeymoon-save";

function gravadorFalso(resposta: Awaited<ReturnType<GravarPlano>>) {
  const chamadas: { dados: Plano; revisao: number }[] = [];
  const gravar: GravarPlano = async (dados, revisao) => { chamadas.push({ dados, revisao }); return resposta; };
  return { gravar, chamadas };
}

describe("salvarPlanoCom", () => {
  it("valida, grava o plano normalizado e devolve a nova revisão", async () => {
    const { gravar, chamadas } = gravadorFalso({ data: 4, error: null });
    const resultado = await salvarPlanoCom(gravar, { ...planoVazio(), titulo: "Teste", campoEstranho: 1 }, 3);
    expect(resultado).toEqual({ ok: true, revision: 4 });
    expect(chamadas).toEqual([{ dados: { ...planoVazio(), titulo: "Teste" }, revisao: 3 }]);
  });

  it("não chama o banco quando o plano é inválido", async () => {
    const { gravar, chamadas } = gravadorFalso({ data: 1, error: null });
    const resultado = await salvarPlanoCom(gravar, { versao: 1, dias: [{ id: "" }] }, 0);
    expect(resultado).toMatchObject({ ok: false, erro: "INVALIDO" });
    expect(resultado.ok === false && resultado.mensagens[0]).toContain("dias[0].id");
    expect(chamadas).toHaveLength(0);
  });

  it("recusa revisão que não é um inteiro não negativo", async () => {
    const { gravar, chamadas } = gravadorFalso({ data: 1, error: null });
    for (const revisao of [-1, 1.5, Number.NaN, "2"]) {
      expect(await salvarPlanoCom(gravar, planoVazio(), revisao)).toMatchObject({ ok: false, erro: "INVALIDO" });
    }
    expect(chamadas).toHaveLength(0);
  });

  it("traduz STALE_REVISION do banco em conflito sem perder o texto da tela", async () => {
    const { gravar } = gravadorFalso({ data: null, error: { code: "P0001", message: "STALE_REVISION" } });
    expect(await salvarPlanoCom(gravar, planoVazio(), 0)).toEqual({ ok: false, erro: "STALE", mensagens: [MENSAGEM_CONFLITO] });
    expect(MENSAGEM_CONFLITO).toBe("Outra pessoa salvou antes. Suas mudanças continuam na tela; copie o que precisar e recarregue.");
  });

  it("explica quando a migração ainda não foi aplicada", async () => {
    const { gravar } = gravadorFalso({ data: null, error: { code: "PGRST202", message: "Could not find the function" } });
    const resultado = await salvarPlanoCom(gravar, planoVazio(), 0);
    expect(resultado).toMatchObject({ ok: false, erro: "FALHA" });
    expect(resultado.ok === false && resultado.mensagens[0]).toContain("migração");
  });

  it("devolve falha genérica quando o banco ou a rede falham", async () => {
    const quebrado: GravarPlano = async () => { throw new Error("rede"); };
    expect(await salvarPlanoCom(quebrado, planoVazio(), 0)).toMatchObject({ ok: false, erro: "FALHA" });
    const { gravar } = gravadorFalso({ data: "x", error: null });
    expect(await salvarPlanoCom(gravar, planoVazio(), 0)).toMatchObject({ ok: false, erro: "FALHA" });
  });
});
