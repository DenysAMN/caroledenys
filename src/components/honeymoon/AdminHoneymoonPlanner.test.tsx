import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { planoVazio, type Lugar, type Plano } from "../../lib/honeymoon-plan";
import AdminHoneymoonPlanner from "./AdminHoneymoonPlanner";
import MapaLugares from "./MapaLugares";
import MapaMental from "./MapaMental";

// Dados inventados: o repositório é público.
const lugar = (id: string, nome: string, tipo: Lugar["tipo"], lat: number | null, lon: number | null): Lugar =>
  ({ id, nome, cidade: "Cidade A", tipo, lat, lon, distancia: "", preco: "", nota: "" });

function plano(): Plano {
  return {
    ...planoVazio(),
    titulo: "Viagem teste", periodo: "01/01/2030 a 05/01/2030", subtitulo: "Roteiro genérico",
    resolvidos: [{ id: "r1", texto: "Passagens compradas" }],
    dias: [{ id: "d1", titulo: "Chegada", data: "2030-01-01", tema: "Descanso", fixo: "Entrada às 14h", itens: [{ id: "i1", texto: "Jantar", feito: true }], nota: "" }],
    decisoes: [{ id: "x1", titulo: "Jantar especial", estado: "aberta", opcoes: [{ id: "o1", nome: "Restaurante C", minCentavos: 20000, maxCentavos: 30000, detalhe: "" }], recomendacao: "", escolhaId: null }],
    reservas: [
      { id: "s1", ate: "2029-12-01", oque: "Hotel A", onde: "Telefone", feito: false },
      { id: "s2", ate: "2030-02-01", oque: "Passeio B", onde: "", feito: false },
    ],
    lugares: [lugar("l1", "Hotel A", "hotel", 10, 20), lugar("l2", "Passeio B", "passeio", 10.05, 20.05), lugar("l3", "Aeroporto D", "transporte", 11, 20)],
    gastos: [
      { id: "g1", grupo: "Hospedagem", item: "Hotel A", minCentavos: 100000, maxCentavos: 120000, pago: true },
      { id: "g2", grupo: "Hospedagem", item: "Taxa", minCentavos: 1000, maxCentavos: 1000, pago: false },
    ],
    fontes: [{ id: "f1", nome: "Guia", url: "https://example.com/guia" }],
  };
}

const salvar = async () => ({ ok: true as const, revision: 1 });
const html = (elemento: ReactElement) => renderToStaticMarkup(elemento).replace(/ /g, " ");

describe("AdminHoneymoonPlanner", () => {
  it("explica a página vazia e oferece começar em branco ou importar", () => {
    const pagina = html(<AdminHoneymoonPlanner inicial={null} revisao={0} hoje="2030-01-01" ultimaGravacao={null} salvar={salvar} />);
    expect(pagina).toContain("Começar em branco");
    expect(pagina).toContain("Importar");
    expect(pagina).not.toContain(">Salvar<");
  });

  it("mostra os erros e o conteúdo salvo que não passou na validação", () => {
    const pagina = html(<AdminHoneymoonPlanner inicial={null} revisao={3} hoje="2030-01-01" ultimaGravacao={null} errosLeitura={["Dia 1 › data (dias[0].data): inválida"]} bruto='{"versao":9}' salvar={salvar} />);
    expect(pagina).toContain("dias[0].data");
    expect(pagina).toContain("{&quot;versao&quot;:9}");
  });

  it("monta todos os blocos editáveis e a barra de salvar", () => {
    const pagina = html(<AdminHoneymoonPlanner inicial={plano()} revisao={2} hoje="2030-01-01" ultimaGravacao="01/01 às 12:04" salvar={salvar} />);
    for (const titulo of ["Resumo", "Mapa mental", "Mapa dos lugares", "Dia a dia", "Decisões", "Reservar até", "Gastos", "Notas", "Fontes"]) {
      expect(pagina).toContain(`>${titulo}</h2>`);
    }
    expect(pagina).toContain(">Avançado</summary>");
    expect(pagina).toContain('value="Viagem teste"');
    expect(pagina).toContain(">Salvar<");
    expect(pagina).toContain("Salvo em 01/01 às 12:04");
  });

  it("calcula os totais dos gastos em reais", () => {
    const pagina = html(<AdminHoneymoonPlanner inicial={plano()} revisao={2} hoje="2030-01-01" ultimaGravacao={null} salvar={salvar} />);
    expect(pagina).toContain("R$ 1.010,00 – R$ 1.210,00");
    expect(pagina).toContain('value="1.000,00"');
  });

  it("destaca a reserva vencida e não feita", () => {
    const pagina = html(<AdminHoneymoonPlanner inicial={plano()} revisao={2} hoje="2030-01-01" ultimaGravacao={null} salvar={salvar} />);
    expect(pagina.match(/data-vencida="true"/g)).toHaveLength(1);
    expect(pagina).toContain("Vencida");
  });

  it("liga cada lugar com coordenadas ao Google Maps", () => {
    const pagina = html(<AdminHoneymoonPlanner inicial={plano()} revisao={2} hoje="2030-01-01" ultimaGravacao={null} salvar={salvar} />);
    expect(pagina).toContain('href="https://www.google.com/maps/search/?api=1&amp;query=10.05,20.05"');
    expect(pagina).toContain('value="10, 20"');
  });
});

describe("MapaLugares", () => {
  it("desenha pinos numerados, anel do hotel, escala, norte e a lista de longe", () => {
    const mapa = html(<MapaLugares lugares={plano().lugares} />);
    expect(mapa.match(/data-pino=/g)).toHaveLength(2);
    expect(mapa).toContain('data-pino="1"');
    expect(mapa).toContain("data-anel");
    expect(mapa).toContain(">5 km<");
    expect(mapa).toContain(">N<");
    expect(mapa).toContain("Longe");
    expect(mapa).toContain("Aeroporto D");
  });

  it("avisa quando nenhum lugar tem coordenadas", () => {
    const mapa = html(<MapaLugares lugares={[lugar("a", "Sem ponto", "extra", null, null)]} />);
    expect(mapa).toContain("Nenhum lugar com coordenadas");
    expect(mapa).not.toContain("<svg");
  });
});

describe("MapaMental", () => {
  it("mostra o centro, os cinco ramos e os ramos vazios", () => {
    const mapa = html(<MapaMental plano={{ ...plano(), decisoes: [] }} />);
    expect(mapa).toContain("Viagem teste");
    for (const ramo of ["Já resolvido", "Decisões abertas", "Dia a dia", "Reservas pendentes", "Lugares por tipo"]) expect(mapa).toContain(ramo);
    expect(mapa).toContain("Chegada — Descanso");
    expect(mapa).toContain("Nada por aqui ainda");
  });
});
