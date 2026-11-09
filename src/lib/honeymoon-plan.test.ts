import { describe, expect, it } from "vitest";
import {
  LIMITES,
  atualizarPorId,
  centavosParaEntrada,
  dataCurta,
  dataNoFuso,
  distanciaKm,
  enquadrarMapa,
  formatarCoordenadas,
  formatarKm,
  googleMapsUrl,
  lerPlanoSalvo,
  mapaMental,
  momentoNoFuso,
  moverNaLista,
  novo,
  novoId,
  ordenarReservas,
  parseCoordenadas,
  parsePlano,
  parsePlanoJson,
  planoVazio,
  reaisParaCentavos,
  removerOpcao,
  removerPorId,
  totaisGastos,
  type Lugar,
  type Plano,
} from "./honeymoon-plan";

// Dados inventados: o repositório é público e nada real da viagem entra aqui.
function exemplo(): Plano {
  return {
    versao: 1,
    titulo: "Viagem teste",
    periodo: "01/01/2030 a 05/01/2030",
    subtitulo: "Roteiro genérico",
    resolvidos: [{ id: "r1", texto: "Passagens compradas" }],
    dias: [
      { id: "d1", titulo: "Chegada", data: "2030-01-01", tema: "Descanso", fixo: "Entrada às 14h", itens: [{ id: "i1", texto: "Jantar no Hotel A", feito: false }], nota: "" },
      { id: "d2", titulo: "Passeios", data: "2030-01-02", tema: "Natureza", fixo: "", itens: [], nota: "Levar casaco" },
    ],
    decisoes: [
      {
        id: "x1", titulo: "Jantar especial", estado: "aberta",
        opcoes: [
          { id: "o1", nome: "Restaurante C", minCentavos: 20000, maxCentavos: 30000, detalhe: "" },
          { id: "o2", nome: "Restaurante D", minCentavos: null, maxCentavos: null, detalhe: "Sem preço" },
        ],
        recomendacao: "Restaurante C", escolhaId: null,
      },
      { id: "x2", titulo: "Carro", estado: "decidida", opcoes: [{ id: "o3", nome: "Locadora E", minCentavos: 50000, maxCentavos: 50000, detalhe: "" }], recomendacao: "", escolhaId: "o3" },
    ],
    reservas: [
      { id: "s1", ate: "2030-01-10", oque: "Passeio B", onde: "Site B", feito: false },
      { id: "s2", ate: "2029-12-01", oque: "Hotel A", onde: "Telefone", feito: false },
      { id: "s3", ate: "", oque: "Jantar", onde: "", feito: false },
      { id: "s4", ate: "2029-11-01", oque: "Passagem", onde: "", feito: true },
    ],
    lugares: [
      { id: "l1", nome: "Hotel A", cidade: "Cidade A", tipo: "hotel", lat: 10, lon: 20, distancia: "", preco: "", nota: "" },
      { id: "l2", nome: "Passeio B", cidade: "Cidade A", tipo: "passeio", lat: 10.05, lon: 20.05, distancia: "7 km", preco: "R$ 50", nota: "" },
      { id: "l3", nome: "Vinícola C", cidade: "Cidade B", tipo: "vinho", lat: null, lon: null, distancia: "", preco: "", nota: "" },
      { id: "l4", nome: "Aeroporto D", cidade: "Cidade D", tipo: "transporte", lat: 11, lon: 20, distancia: "", preco: "", nota: "" },
    ],
    gastos: [
      { id: "g1", grupo: "Hospedagem", item: "Hotel A", minCentavos: 100000, maxCentavos: 120000, pago: true },
      { id: "g2", grupo: "Passeios", item: "Passeio B", minCentavos: 5000, maxCentavos: 8000, pago: false },
      { id: "g3", grupo: "Hospedagem", item: "Taxa", minCentavos: 1000, maxCentavos: 1000, pago: false },
      { id: "g4", grupo: "", item: "Lembranças", minCentavos: 0, maxCentavos: 2000, pago: false },
    ],
    notas: "Notas livres",
    fontes: [{ id: "f1", nome: "Guia", url: "https://example.com/guia" }],
  };
}

function erros(entrada: unknown): string[] {
  const resultado = parsePlano(entrada);
  if (resultado.ok) throw new Error("esperava erro de validação");
  return resultado.erros;
}

describe("parsePlano", () => {
  it("aceita um plano completo e devolve o mesmo conteúdo", () => {
    expect(parsePlano(exemplo())).toEqual({ ok: true, plano: exemplo() });
  });

  it("preenche campos ausentes e descarta campos desconhecidos", () => {
    expect(parsePlano({ versao: 1, extra: "x" })).toEqual({ ok: true, plano: planoVazio() });
    const resultado = parsePlano({ versao: 1, dias: [{ id: "d1", lixo: true }] });
    expect(resultado.ok && resultado.plano.dias[0]).toEqual({ id: "d1", titulo: "", data: "", tema: "", fixo: "", itens: [], nota: "" });
  });

  it("recusa o que não é um objeto de plano", () => {
    for (const entrada of [null, [], "texto", 3]) expect(erros(entrada)[0]).toContain("objeto");
    expect(erros({ titulo: "Sem versão" })[0]).toContain('"versao": 1');
    expect(erros({ versao: 2 })[0]).toContain("versão");
  });

  it("exige identificadores de 1 a 64 caracteres, sem repetição na mesma lista", () => {
    const plano = exemplo();
    plano.dias[0].id = "";
    plano.dias[1].itens = [{ id: "a".repeat(65), texto: "x", feito: false }];
    plano.fontes.push({ id: "f1", nome: "Outra", url: "" });
    const mensagens = erros(plano);
    expect(mensagens.some(m => m.includes("Dia 1") && m.includes("dias[0].id"))).toBe(true);
    expect(mensagens.some(m => m.includes("Dia 2, item 1") && m.includes("dias[1].itens[0].id"))).toBe(true);
    expect(mensagens.some(m => m.includes("fontes[1].id") && m.includes("repete"))).toBe(true);
  });

  it("limita textos a 2000 caracteres e as notas a 20000", () => {
    const plano = exemplo();
    plano.notas = "n".repeat(LIMITES.notas);
    plano.titulo = "t".repeat(LIMITES.texto);
    expect(parsePlano(plano).ok).toBe(true);
    plano.notas += "n";
    plano.dias[0].tema = "t".repeat(LIMITES.texto + 1);
    const mensagens = erros(plano);
    expect(mensagens.some(m => m.includes("(notas)") && m.includes("20000"))).toBe(true);
    expect(mensagens.some(m => m.includes("dias[0].tema") && m.includes("2000"))).toBe(true);
  });

  it("limita cada lista a 200 itens", () => {
    const plano = exemplo();
    plano.resolvidos = Array.from({ length: 201 }, (_, i) => ({ id: `r${i}`, texto: "ok" }));
    expect(erros(plano).some(m => m.includes("(resolvidos)") && m.includes("200"))).toBe(true);
  });

  it("aceita só centavos inteiros não negativos, com mínimo até o máximo", () => {
    const plano = exemplo() as unknown as { gastos: Record<string, unknown>[]; decisoes: { opcoes: Record<string, unknown>[] }[] };
    plano.gastos[0].minCentavos = 10.5;
    plano.gastos[1].maxCentavos = -1;
    plano.gastos[2].minCentavos = "1000";
    plano.gastos[3].maxCentavos = null;
    plano.decisoes[0].opcoes[0].minCentavos = 40000;
    const mensagens = erros(plano);
    expect(mensagens.some(m => m.includes("gastos[0].minCentavos"))).toBe(true);
    expect(mensagens.some(m => m.includes("gastos[1].maxCentavos"))).toBe(true);
    expect(mensagens.some(m => m.includes("gastos[2].minCentavos"))).toBe(true);
    expect(mensagens.some(m => m.includes("gastos[3].maxCentavos"))).toBe(true);
    expect(mensagens.some(m => m.includes("decisoes[0].opcoes[0]") && m.includes("maior que o máximo"))).toBe(true);
  });

  it("valida latitude, longitude e o par completo", () => {
    const plano = exemplo();
    plano.lugares[0].lat = 91;
    plano.lugares[1].lon = -180.5;
    plano.lugares[2].lat = 5;
    const mensagens = erros(plano);
    expect(mensagens.some(m => m.includes("lugares[0].lat"))).toBe(true);
    expect(mensagens.some(m => m.includes("lugares[1].lon"))).toBe(true);
    expect(mensagens.some(m => m.includes("lugares[2]") && m.includes("juntas"))).toBe(true);
  });

  it("aceita data vazia ou AAAA-MM-DD que exista", () => {
    const plano = exemplo();
    plano.dias[0].data = "2030-02-30";
    plano.dias[1].data = "2030-1-2";
    plano.reservas[0].ate = "amanhã";
    const mensagens = erros(plano);
    expect(mensagens.some(m => m.includes("Dia 1") && m.includes("AAAA-MM-DD"))).toBe(true);
    expect(mensagens.some(m => m.includes("dias[1].data"))).toBe(true);
    expect(mensagens.some(m => m.includes("reservas[0].ate"))).toBe(true);
  });

  it("aceita fonte só com endereço https", () => {
    const plano = exemplo();
    plano.fontes = [
      { id: "a", nome: "Vazia", url: "" },
      { id: "b", nome: "Insegura", url: "http://example.com" },
      { id: "c", nome: "Script", url: "javascript:alert(1)" },
      { id: "d", nome: "Quebrada", url: "https://" },
    ];
    const mensagens = erros(plano);
    expect(mensagens.some(m => m.includes("fontes[0]"))).toBe(false);
    for (const i of [1, 2, 3]) expect(mensagens.some(m => m.includes(`fontes[${i}].url`) && m.includes("https"))).toBe(true);
  });

  it("valida tipo de lugar, estado e escolha da decisão", () => {
    const plano = exemplo() as unknown as { lugares: Record<string, unknown>[]; decisoes: Record<string, unknown>[] };
    plano.lugares[0].tipo = "museu";
    plano.decisoes[0].estado = "talvez";
    plano.decisoes[1].escolhaId = "nao-existe";
    const mensagens = erros(plano);
    expect(mensagens.some(m => m.includes("lugares[0].tipo") && m.includes("hotel"))).toBe(true);
    expect(mensagens.some(m => m.includes("decisoes[0].estado"))).toBe(true);
    expect(mensagens.some(m => m.includes("decisoes[1].escolhaId"))).toBe(true);
  });

  it("recusa tipos errados com mensagens em português", () => {
    const mensagens = erros({ versao: 1, titulo: 3, dias: "x", reservas: [{ id: "s", feito: "sim" }] });
    expect(mensagens).toEqual(expect.arrayContaining([
      expect.stringContaining("título (titulo): deve ser um texto"),
      expect.stringContaining("(dias): deve ser uma lista"),
      expect.stringContaining("(reservas[0].feito): deve ser verdadeiro ou falso"),
    ]));
  });

  it("recusa plano acima de 300 KB", () => {
    const plano = exemplo();
    plano.dias = Array.from({ length: 200 }, (_, i) => ({ ...novo.dia(), id: `d${i}`, nota: "x".repeat(1999) }));
    expect(erros(plano)[0]).toContain("300 KB");
  });

  it("resume a quantidade de problemas quando há muitos", () => {
    const plano = exemplo();
    plano.resolvidos = Array.from({ length: 100 }, () => ({ id: "", texto: "" }));
    const mensagens = erros(plano);
    expect(mensagens.length).toBeLessThanOrEqual(41);
    expect(mensagens.at(-1)).toMatch(/e mais \d+ problema/);
  });
});

describe("parsePlanoJson", () => {
  it("lê o texto colado e valida o plano", () => {
    expect(parsePlanoJson(JSON.stringify(exemplo()))).toEqual({ ok: true, plano: exemplo() });
  });
  it("explica JSON inválido e texto grande demais", () => {
    const invalido = parsePlanoJson("{ versao: 1 ");
    expect(invalido.ok === false && invalido.erros[0]).toContain("JSON válido");
    const grande = parsePlanoJson(" ".repeat(LIMITES.bytes + 1));
    expect(grande.ok === false && grande.erros[0]).toContain("300 KB");
  });
});

describe("lerPlanoSalvo", () => {
  it("separa banco vazio, plano válido e conteúdo inválido", () => {
    expect(lerPlanoSalvo({})).toEqual({ tipo: "vazio" });
    expect(lerPlanoSalvo(null)).toEqual({ tipo: "vazio" });
    expect(lerPlanoSalvo(exemplo())).toEqual({ tipo: "ok", plano: exemplo() });
    expect(lerPlanoSalvo({ versao: 9 })).toMatchObject({ tipo: "invalido" });
  });
});

describe("criação e edição de listas", () => {
  it("cria itens novos que já passam na validação", () => {
    const plano: Plano = {
      ...planoVazio(),
      resolvidos: [novo.resolvido()],
      dias: [{ ...novo.dia(), itens: [novo.item()] }],
      decisoes: [{ ...novo.decisao(), opcoes: [novo.opcao()] }],
      reservas: [novo.reserva()], lugares: [novo.lugar()], gastos: [novo.gasto()], fontes: [novo.fonte()],
    };
    expect(parsePlano(plano)).toEqual({ ok: true, plano });
  });
  it("gera identificadores únicos de até 64 caracteres", () => {
    const ids = Array.from({ length: 50 }, novoId);
    expect(new Set(ids).size).toBe(50);
    expect(ids.every(id => id.length >= 1 && id.length <= 64)).toBe(true);
  });
  it("move, altera e remove sem mudar a lista original", () => {
    const lista = [{ id: "a", v: 1 }, { id: "b", v: 2 }, { id: "c", v: 3 }];
    expect(moverNaLista(lista, 0, 1).map(x => x.id)).toEqual(["b", "a", "c"]);
    expect(moverNaLista(lista, 0, -1)).toEqual(lista);
    expect(moverNaLista(lista, 2, 1)).toEqual(lista);
    expect(atualizarPorId(lista, "b", { v: 9 })[1]).toEqual({ id: "b", v: 9 });
    expect(removerPorId(lista, "a").map(x => x.id)).toEqual(["b", "c"]);
    expect(lista.map(x => x.id)).toEqual(["a", "b", "c"]);
  });
  it("limpa a escolha quando a opção escolhida é removida", () => {
    const decisao = exemplo().decisoes[1];
    expect(removerOpcao(decisao, "o3")).toMatchObject({ opcoes: [], escolhaId: null });
    const outra = exemplo().decisoes[0];
    expect(removerOpcao({ ...outra, escolhaId: "o1" }, "o2")).toMatchObject({ escolhaId: "o1" });
  });
});

describe("dinheiro na tela em reais", () => {
  it("converte reais digitados em centavos inteiros", () => {
    expect(reaisParaCentavos("1.234,56")).toEqual({ ok: true, centavos: 123456 });
    expect(reaisParaCentavos("R$ 125")).toEqual({ ok: true, centavos: 12500 });
    expect(reaisParaCentavos("0")).toEqual({ ok: true, centavos: 0 });
    expect(reaisParaCentavos("0,00")).toEqual({ ok: true, centavos: 0 });
    expect(reaisParaCentavos("  ")).toEqual({ ok: true, centavos: null });
    for (const texto of ["abc", "-5", "12,345"]) expect(reaisParaCentavos(texto)).toEqual({ ok: false });
  });
  it("mostra centavos no formato do campo", () => {
    expect(centavosParaEntrada(123456)).toBe("1.234,56");
    expect(centavosParaEntrada(0)).toBe("0,00");
    expect(centavosParaEntrada(null)).toBe("");
  });
});

describe("totaisGastos", () => {
  it("soma por grupo, na ordem em que aparecem, e no total", () => {
    expect(totaisGastos(exemplo().gastos)).toEqual({
      grupos: [
        { grupo: "Hospedagem", minCentavos: 101000, maxCentavos: 121000, quantidade: 2 },
        { grupo: "Passeios", minCentavos: 5000, maxCentavos: 8000, quantidade: 1 },
        { grupo: "Sem grupo", minCentavos: 0, maxCentavos: 2000, quantidade: 1 },
      ],
      minCentavos: 106000,
      maxCentavos: 131000,
    });
    expect(totaisGastos([])).toEqual({ grupos: [], minCentavos: 0, maxCentavos: 0 });
  });
});

describe("ordenarReservas", () => {
  it("ordena por data, deixa sem data no fim e marca as vencidas não feitas", () => {
    const ordem = ordenarReservas(exemplo().reservas, "2030-01-01");
    expect(ordem.map(x => x.reserva.id)).toEqual(["s4", "s2", "s1", "s3"]);
    expect(ordem.map(x => x.vencida)).toEqual([false, true, false, false]);
  });
  it("não marca vencida sem a data de hoje", () => {
    expect(ordenarReservas(exemplo().reservas, "").some(x => x.vencida)).toBe(false);
  });
});

describe("mapaMental", () => {
  it("deriva os ramos a partir dos dados", () => {
    const mapa = mapaMental(exemplo());
    expect(mapa.rotulo).toBe("Viagem teste");
    expect(mapa.filhos.map(ramo => ramo.rotulo)).toEqual(["Já resolvido", "Decisões abertas", "Dia a dia", "Reservas pendentes", "Lugares por tipo"]);
    const [resolvidos, decisoes, dias, reservas, lugares] = mapa.filhos;
    expect(resolvidos.filhos.map(n => n.rotulo)).toEqual(["Passagens compradas"]);
    expect(decisoes.filhos.map(n => n.rotulo)).toEqual(["Jantar especial"]);
    expect(dias.filhos.map(n => n.rotulo)).toEqual(["Chegada — Descanso", "Passeios — Natureza"]);
    expect(reservas.filhos.map(n => n.rotulo)).toEqual(["01/12 · Hotel A", "10/01 · Passeio B", "sem data · Jantar"]);
    expect(lugares.filhos.map(n => n.rotulo)).toEqual(["Hotel", "Passeio", "Vinho", "Transporte"]);
    expect(lugares.filhos[0].filhos.map(n => n.rotulo)).toEqual(["Hotel A"]);
  });
  it("usa nomes padrão quando faltam títulos", () => {
    const plano = { ...planoVazio(), dias: [novo.dia()] };
    const mapa = mapaMental(plano);
    expect(mapa.rotulo).toBe("Lua de mel");
    expect(mapa.filhos[2].filhos[0].rotulo).toBe("Dia 1");
    expect(mapa.filhos.every(ramo => Array.isArray(ramo.filhos))).toBe(true);
  });
});

describe("mapa dos lugares", () => {
  const lugar = (id: string, tipo: Lugar["tipo"], lat: number | null, lon: number | null): Lugar => ({ ...novo.lugar(), id, nome: id, tipo, lat, lon });
  const tela = { largura: 640, altura: 480, margem: 40 };

  it("calcula distância em linha reta", () => {
    expect(distanciaKm({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(111.19, 1);
    expect(distanciaKm({ lat: 10, lon: 20 }, { lat: 10, lon: 20 })).toBe(0);
  });

  it("centra no hotel, numera pela lista e separa os lugares longe", () => {
    const quadro = enquadrarMapa([
      lugar("Passeio", "passeio", 10.05, 20.05),
      lugar("Hotel", "hotel", 10, 20),
      lugar("Sem coordenada", "extra", null, null),
      lugar("Longe", "transporte", 11, 20),
    ], tela);
    expect(quadro.referencia).toEqual({ lat: 10, lon: 20, tipo: "hotel" });
    expect(quadro.pontos.map(p => [p.lugar.id, p.numero])).toEqual([["Passeio", 1], ["Hotel", 2]]);
    expect(quadro.longe.map(p => [p.lugar.id, p.numero])).toEqual([["Longe", 4]]);
    expect(quadro.longe[0].distanciaKm).toBeGreaterThan(60);
    expect(quadro.semCoordenadas.map(p => p.numero)).toEqual([3]);
    const hotel = quadro.pontos[1];
    expect(quadro.anel).toEqual({ x: hotel.x, y: hotel.y, raio: 10 * quadro.pxPorKm });
  });

  it("enquadra os pontos dentro da margem, com o norte para cima", () => {
    const quadro = enquadrarMapa([lugar("H", "hotel", 10, 20), lugar("N", "passeio", 10.2, 20), lugar("L", "comida", 10, 20.3)], tela);
    for (const p of quadro.pontos) {
      expect(p.x).toBeGreaterThanOrEqual(tela.margem - 1e-9);
      expect(p.x).toBeLessThanOrEqual(tela.largura - tela.margem + 1e-9);
      expect(p.y).toBeGreaterThanOrEqual(tela.margem - 1e-9);
      expect(p.y).toBeLessThanOrEqual(tela.altura - tela.margem + 1e-9);
    }
    const [h, n, l] = quadro.pontos;
    expect(n.y).toBeLessThan(h.y);
    expect(l.x).toBeGreaterThan(h.x);
    const encostaNasBordas = quadro.pontos.some(p => Math.abs(p.x - tela.margem) < 1e-6 || Math.abs(p.y - tela.margem) < 1e-6);
    expect(encostaNasBordas).toBe(true);
  });

  it("corrige a longitude pelo cosseno da latitude", () => {
    const quadro = enquadrarMapa([lugar("H", "hotel", 60, 0), lugar("Leste", "passeio", 60, 0.2), lugar("Norte", "passeio", 60.1, 0)], tela);
    const [h, leste, norte] = quadro.pontos;
    expect(leste.x - h.x).toBeCloseTo(h.y - norte.y, 6);
  });

  it("usa o centro dos lugares quando não há hotel", () => {
    const quadro = enquadrarMapa([lugar("A", "passeio", 10, 20), lugar("B", "passeio", 10.1, 20.1), lugar("C", "comida", 10.2, 20.2), lugar("D", "extra", 15, 25)], tela);
    expect(quadro.referencia?.tipo).toBe("centro");
    expect(quadro.anel).toBeNull();
    expect(quadro.longe.map(p => p.lugar.id)).toEqual(["D"]);
    expect(quadro.pontos).toHaveLength(3);
  });

  it("traz escala de 5 km proporcional e lida com um ponto só ou nenhum", () => {
    const quadro = enquadrarMapa([lugar("H", "hotel", 10, 20), lugar("P", "passeio", 10.3, 20.3)], tela);
    expect(quadro.escala).toEqual({ km: 5, px: 5 * quadro.pxPorKm });
    const um = enquadrarMapa([lugar("H", "hotel", 10, 20)], tela);
    expect(um.pontos[0]).toMatchObject({ x: 320, y: 240 });
    expect(Number.isFinite(um.pxPorKm)).toBe(true);
    const nenhum = enquadrarMapa([lugar("S", "extra", null, null)], tela);
    expect(nenhum).toMatchObject({ referencia: null, pontos: [], longe: [], anel: null, escala: null });
  });
});

describe("coordenadas coladas", () => {
  it("aceita os formatos comuns", () => {
    expect(parseCoordenadas("-12.5, -45.25")).toEqual({ ok: true, lat: -12.5, lon: -45.25 });
    expect(parseCoordenadas("-12.5,-45.25")).toEqual({ ok: true, lat: -12.5, lon: -45.25 });
    expect(parseCoordenadas("  -12.5   -45.25 ")).toEqual({ ok: true, lat: -12.5, lon: -45.25 });
    expect(parseCoordenadas("(-12,5; -45,25)")).toEqual({ ok: true, lat: -12.5, lon: -45.25 });
    expect(parseCoordenadas("")).toEqual({ ok: true, lat: null, lon: null });
  });
  it("recusa texto e números fora do globo", () => {
    for (const texto of ["abc", "10", "100, 20", "10, 200", "1, 2, 3"]) expect(parseCoordenadas(texto).ok).toBe(false);
  });
  it("formata coordenadas e o link do Google Maps", () => {
    expect(formatarCoordenadas(-12.5, -45.25)).toBe("-12.5, -45.25");
    expect(formatarCoordenadas(null, null)).toBe("");
    expect(googleMapsUrl(-12.5, -45.25)).toBe("https://www.google.com/maps/search/?api=1&query=-12.5,-45.25");
  });
  it("formata distâncias", () => {
    expect(formatarKm(7.06)).toBe("7,1 km");
    expect(formatarKm(112.4)).toBe("112 km");
  });
});

describe("datas", () => {
  it("mostra dia e mês curtos", () => {
    expect(dataCurta("2030-01-05")).toBe("05/01");
    expect(dataCurta("")).toBe("sem data");
  });
  it("calcula a data e o horário no fuso indicado", () => {
    expect(dataNoFuso(new Date("2030-01-01T02:00:00Z"), "America/Sao_Paulo")).toBe("2029-12-31");
    expect(dataNoFuso(new Date("2030-01-01T12:00:00Z"), "America/Sao_Paulo")).toBe("2030-01-01");
    expect(momentoNoFuso("2030-01-01T15:04:00Z", "America/Sao_Paulo")).toBe("01/01 às 12:04");
  });
});
