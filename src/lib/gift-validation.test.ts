import { describe, expect, it } from "vitest";
import {
  centsForInput,
  parseBRLToCents,
  parseGiftForm,
  validateGiftImageMetadata,
} from "./gift-validation";

function baseForm(type: "LINK" | "COTAS" | "LIVRE") {
  const form = new FormData();
  form.set("title", "Presente de teste");
  form.set("description", "Descrição");
  form.set("category", "Casa");
  form.set("sort_order", "10");
  form.set("status", "DISPONIVEL");
  form.set("type", type);
  return form;
}

describe("parseBRLToCents", () => {
  it("converte reais com vírgula sem usar float no resultado", () => {
    expect(parseBRLToCents("1.234,56")).toBe(123456);
    expect(parseBRLToCents("20")).toBe(2000);
  });

  it("rejeita precisão além de centavos", () => {
    expect(parseBRLToCents("10,999")).toBeNull();
  });
});

describe("centsForInput", () => {
  it("formata centavos sem depender de código servidor", () => {
    expect(centsForInput(123456)).toBe("1.234,56");
    expect(centsForInput(null)).toBe("");
  });
});

describe("parseGiftForm", () => {
  it("valida presente LINK", () => {
    const form = baseForm("LINK");
    form.set("external_url", "https://loja.example/presente");
    form.set("price_reais", "450,00");

    const result = parseGiftForm(form);
    expect(result.ok && result.gift.price_cents).toBe(45000);
  });

  it("calcula o total de COTAS", () => {
    const form = baseForm("COTAS");
    form.set("share_reais", "120,00");
    form.set("total_shares", "20");

    const result = parseGiftForm(form);
    expect(result.ok && result.gift.total_cents).toBe(240000);
  });

  it("valida contribuição LIVRE", () => {
    const form = baseForm("LIVRE");
    form.set("min_reais", "20,00");

    const result = parseGiftForm(form);
    expect(result.ok && result.gift.min_cents).toBe(2000);
  });

  it("rejeita LINK sem URL", () => {
    const result = parseGiftForm(baseForm("LINK"));
    expect(result).toEqual({ ok: false, error: "Informe o link da loja." });
  });
});

describe("validateGiftImageMetadata", () => {
  it("aceita imagem pública até 4 MB", () => {
    expect(validateGiftImageMetadata("image/webp", 4_000_000)).toEqual({
      ok: true,
      extension: "webp",
    });
  });

  it("rejeita PDF e arquivo grande", () => {
    expect(validateGiftImageMetadata("application/pdf", 100).ok).toBe(false);
    expect(validateGiftImageMetadata("image/jpeg", 4_000_001).ok).toBe(false);
  });
});
