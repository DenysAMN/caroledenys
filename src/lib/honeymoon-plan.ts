// Planejador da lua de mel: modelo de dados, validação e cálculos puros.
// Sem acesso a banco ou rede, para ser usado igual no servidor e no navegador.
// Dinheiro sempre em centavos inteiros (regra nº 1); a tela converte para reais.
import { formatBRL } from "./format";
import { centsForInput, parseBRLToCents } from "./gift-validation";

export const TIPOS_LUGAR = ["hotel", "passeio", "vinho", "comida", "extra", "transporte"] as const;
export type TipoLugar = typeof TIPOS_LUGAR[number];
export const ROTULO_TIPO: Record<TipoLugar, string> = {
  hotel: "Hotel", passeio: "Passeio", vinho: "Vinho", comida: "Comida", extra: "Extra", transporte: "Transporte",
};
export const COR_TIPO: Record<TipoLugar, string> = {
  hotel: "#7A1E33", passeio: "#435525", vinho: "#6B2D5C", comida: "#A8541A", extra: "#2F5D7C", transporte: "#5B5048",
};

export type Resolvido = { id: string; texto: string };
export type ItemDia = { id: string; texto: string; feito: boolean };
export type Dia = { id: string; titulo: string; data: string; tema: string; fixo: string; itens: ItemDia[]; nota: string };
export type Opcao = { id: string; nome: string; minCentavos: number | null; maxCentavos: number | null; detalhe: string };
export type Decisao = { id: string; titulo: string; estado: "aberta" | "decidida"; opcoes: Opcao[]; recomendacao: string; escolhaId: string | null };
export type Reserva = { id: string; ate: string; oque: string; onde: string; feito: boolean };
export type Lugar = { id: string; nome: string; cidade: string; tipo: TipoLugar; lat: number | null; lon: number | null; distancia: string; preco: string; nota: string };
export type Gasto = { id: string; grupo: string; item: string; minCentavos: number; maxCentavos: number; pago: boolean };
export type Fonte = { id: string; nome: string; url: string };
export type Plano = {
  versao: 1;
  titulo: string; periodo: string; subtitulo: string;
  resolvidos: Resolvido[];
  dias: Dia[];
  decisoes: Decisao[];
  reservas: Reserva[];
  lugares: Lugar[];
  gastos: Gasto[];
  notas: string;
  fontes: Fonte[];
};

export const LIMITES = { id: 64, texto: 2000, notas: 20000, lista: 200, bytes: 300 * 1024, centavos: 100_000_000, raioKm: 60, erros: 40 } as const;

export function planoVazio(): Plano {
  return { versao: 1, titulo: "", periodo: "", subtitulo: "", resolvidos: [], dias: [], decisoes: [], reservas: [], lugares: [], gastos: [], notas: "", fontes: [] };
}

// ---------- validação ----------

export type ResultadoPlano = { ok: true; plano: Plano } | { ok: false; erros: string[] };
type Obj = Record<string, unknown>;
type Onde = { rotulo: string; caminho: string };

const NOMES: Record<string, string> = {
  id: "identificador", titulo: "título", periodo: "período", subtitulo: "subtítulo", texto: "texto", feito: "feito",
  data: "data", tema: "tema", fixo: "horário fixo", nota: "nota", notas: "notas", itens: "itens", nome: "nome",
  minCentavos: "valor mínimo", maxCentavos: "valor máximo", detalhe: "detalhe", estado: "estado", opcoes: "opções",
  recomendacao: "recomendação", escolhaId: "escolha", ate: "data limite", oque: "o quê", onde: "onde", cidade: "cidade",
  tipo: "tipo", lat: "latitude", lon: "longitude", distancia: "distância", preco: "preço", grupo: "grupo", item: "item",
  pago: "pago", url: "endereço", resolvidos: "Já resolvido", dias: "Dia a dia", decisoes: "Decisões",
  reservas: "Reservar até", lugares: "Lugares", gastos: "Gastos", fontes: "Fontes",
};

const ehObjeto = (valor: unknown): valor is Obj => typeof valor === "object" && valor !== null && !Array.isArray(valor);

function bytesJson(valor: unknown): number | null {
  try { return new TextEncoder().encode(JSON.stringify(valor)).length; } catch { return null; }
}

function dataValida(texto: string): boolean {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return false;
  const [ano, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

function urlHttps(texto: string): boolean {
  try { const url = new URL(texto); return url.protocol === "https:" && url.hostname.length > 0; } catch { return false; }
}

class Leitor {
  erros: string[] = [];

  erro(onde: Onde, campo: string, problema: string) {
    const caminho = onde.caminho ? `${onde.caminho}.${campo}` : campo;
    this.erros.push(`${onde.rotulo} › ${NOMES[campo] ?? campo} (${caminho}): ${problema}`);
  }

  texto(o: Obj, campo: string, onde: Onde, max: number = LIMITES.texto): string {
    const valor = o[campo];
    if (valor === undefined || valor === null) return "";
    if (typeof valor !== "string") { this.erro(onde, campo, "deve ser um texto."); return ""; }
    if (valor.length > max) this.erro(onde, campo, `tem ${valor.length} caracteres; o máximo é ${max}.`);
    return valor;
  }

  id(o: Obj, onde: Onde): string | null {
    const valor = o.id;
    if (typeof valor !== "string" || valor.length < 1 || valor.length > LIMITES.id) {
      this.erro(onde, "id", `informe um identificador de 1 a ${LIMITES.id} caracteres.`);
      return null;
    }
    return valor;
  }

  booleano(o: Obj, campo: string, onde: Onde): boolean {
    const valor = o[campo];
    if (valor === undefined || valor === null) return false;
    if (typeof valor !== "boolean") { this.erro(onde, campo, "deve ser verdadeiro ou falso (true/false)."); return false; }
    return valor;
  }

  data(o: Obj, campo: string, onde: Onde): string {
    const valor = this.texto(o, campo, onde);
    if (valor !== "" && !dataValida(valor)) this.erro(onde, campo, `"${valor.slice(0, 40)}" não vale; use o formato AAAA-MM-DD com uma data que exista, ou deixe vazio.`);
    return valor;
  }

  opcao<T extends string>(o: Obj, campo: string, onde: Onde, valores: readonly T[], padrao?: T): T {
    const valor = o[campo];
    if ((valor === undefined || valor === null) && padrao !== undefined) return padrao;
    if (typeof valor === "string" && (valores as readonly string[]).includes(valor)) return valor as T;
    this.erro(onde, campo, `use um destes valores: ${valores.join(", ")}.`);
    return padrao ?? valores[0];
  }

  /** Devolve o valor lido e se ele é válido (para não acusar mínimo > máximo à toa). */
  centavos(o: Obj, campo: string, onde: Onde, anulavel: boolean): { valor: number | null; ok: boolean } {
    const valor = o[campo];
    if (valor === undefined || valor === null) {
      if (anulavel) return { valor: null, ok: true };
      this.erro(onde, campo, "informe o valor em centavos (número inteiro; 12500 = R$ 125,00).");
      return { valor: 0, ok: false };
    }
    if (typeof valor !== "number" || !Number.isSafeInteger(valor) || valor < 0 || valor > LIMITES.centavos) {
      this.erro(onde, campo, `deve ser um número inteiro de centavos, de 0 a ${LIMITES.centavos} (12500 = R$ 125,00).`);
      return { valor: anulavel ? null : 0, ok: false };
    }
    return { valor, ok: true };
  }

  faixa(o: Obj, onde: Onde, anulavel: boolean) {
    const min = this.centavos(o, "minCentavos", onde, anulavel);
    const max = this.centavos(o, "maxCentavos", onde, anulavel);
    if (min.ok && max.ok && min.valor !== null && max.valor !== null && min.valor > max.valor) {
      this.erro(onde, "minCentavos", `o mínimo (${formatBRL(min.valor)}) é maior que o máximo (${formatBRL(max.valor)}).`);
    }
    return { min: min.valor, max: max.valor };
  }

  coordenada(o: Obj, campo: "lat" | "lon", onde: Onde): { valor: number | null; ok: boolean } {
    const valor = o[campo];
    if (valor === undefined || valor === null) return { valor: null, ok: true };
    const limite = campo === "lat" ? 90 : 180;
    if (typeof valor !== "number" || !Number.isFinite(valor) || valor < -limite || valor > limite) {
      this.erro(onde, campo, `deve ser um número entre -${limite} e ${limite}.`);
      return { valor: null, ok: false };
    }
    return { valor, ok: true };
  }

  lista<T extends { id: string }>(o: Obj, campo: string, pai: Onde, nomeItem: string, ler: (item: Obj, onde: Onde) => Omit<T, "id">): T[] {
    const valor = o[campo];
    if (valor === undefined || valor === null) return [];
    if (!Array.isArray(valor)) { this.erro(pai, campo, "deve ser uma lista."); return []; }
    if (valor.length > LIMITES.lista) this.erro(pai, campo, `tem ${valor.length} itens; o máximo é ${LIMITES.lista}.`);
    const vistos = new Set<string>();
    const lidos: T[] = [];
    valor.slice(0, LIMITES.lista).forEach((item, indice) => {
      const onde: Onde = {
        rotulo: pai.caminho ? `${pai.rotulo}, ${nomeItem} ${indice + 1}` : `${nomeItem[0].toUpperCase()}${nomeItem.slice(1)} ${indice + 1}`,
        caminho: `${pai.caminho ? `${pai.caminho}.` : ""}${campo}[${indice}]`,
      };
      if (!ehObjeto(item)) { this.erros.push(`${onde.rotulo} (${onde.caminho}): deve ser um objeto.`); return; }
      const id = this.id(item, onde);
      if (id !== null) {
        if (vistos.has(id)) this.erro(onde, "id", `repete o identificador "${id}" de outro item desta lista.`);
        vistos.add(id);
      }
      lidos.push({ id: id ?? "", ...ler(item, onde) } as T);
    });
    return lidos;
  }
}

/** Valida um plano vindo de qualquer lugar (banco, Server Action, importação) e devolve a forma normalizada. */
export function parsePlano(entrada: unknown): ResultadoPlano {
  if (!ehObjeto(entrada)) return { ok: false, erros: ["O plano precisa ser um objeto JSON (um texto que começa com { e termina com })."] };
  const bytes = bytesJson(entrada);
  if (bytes === null) return { ok: false, erros: ["O plano não pode ser convertido em JSON."] };
  if (bytes > LIMITES.bytes) return { ok: false, erros: [`O plano tem ${Math.ceil(bytes / 1024)} KB; o máximo é 300 KB.`] };
  if (entrada.versao === undefined) return { ok: false, erros: ['Este JSON não parece um plano de lua de mel: falta "versao": 1.'] };
  if (entrada.versao !== 1) return { ok: false, erros: [`A versão ${JSON.stringify(entrada.versao)} não é suportada; use "versao": 1.`] };

  const l = new Leitor();
  const raiz: Onde = { rotulo: "Plano", caminho: "" };
  const plano: Plano = {
    versao: 1,
    titulo: l.texto(entrada, "titulo", raiz),
    periodo: l.texto(entrada, "periodo", raiz),
    subtitulo: l.texto(entrada, "subtitulo", raiz),
    resolvidos: l.lista<Resolvido>(entrada, "resolvidos", raiz, "já resolvido", (o, onde) => ({ texto: l.texto(o, "texto", onde) })),
    dias: l.lista<Dia>(entrada, "dias", raiz, "dia", (o, onde) => ({
      titulo: l.texto(o, "titulo", onde),
      data: l.data(o, "data", onde),
      tema: l.texto(o, "tema", onde),
      fixo: l.texto(o, "fixo", onde),
      itens: l.lista<ItemDia>(o, "itens", onde, "item", (item, ondeItem) => ({ texto: l.texto(item, "texto", ondeItem), feito: l.booleano(item, "feito", ondeItem) })),
      nota: l.texto(o, "nota", onde),
    })),
    decisoes: l.lista<Decisao>(entrada, "decisoes", raiz, "decisão", (o, onde) => {
      const opcoes = l.lista<Opcao>(o, "opcoes", onde, "opção", (op, ondeOp) => {
        const nome = l.texto(op, "nome", ondeOp);
        const { min, max } = l.faixa(op, ondeOp, true);
        return { nome, minCentavos: min, maxCentavos: max, detalhe: l.texto(op, "detalhe", ondeOp) };
      });
      const escolha = o.escolhaId;
      let escolhaId: string | null = null;
      if (escolha !== undefined && escolha !== null) {
        if (typeof escolha === "string" && opcoes.some(op => op.id === escolha)) escolhaId = escolha;
        else l.erro(onde, "escolhaId", "deve ser o identificador de uma das opções desta decisão, ou null.");
      }
      return {
        titulo: l.texto(o, "titulo", onde),
        estado: l.opcao(o, "estado", onde, ["aberta", "decidida"] as const, "aberta"),
        opcoes,
        recomendacao: l.texto(o, "recomendacao", onde),
        escolhaId,
      };
    }),
    reservas: l.lista<Reserva>(entrada, "reservas", raiz, "reserva", (o, onde) => ({
      ate: l.data(o, "ate", onde), oque: l.texto(o, "oque", onde), onde: l.texto(o, "onde", onde), feito: l.booleano(o, "feito", onde),
    })),
    lugares: l.lista<Lugar>(entrada, "lugares", raiz, "lugar", (o, onde) => {
      const nome = l.texto(o, "nome", onde);
      const cidade = l.texto(o, "cidade", onde);
      const tipo = l.opcao(o, "tipo", onde, TIPOS_LUGAR);
      const lat = l.coordenada(o, "lat", onde);
      const lon = l.coordenada(o, "lon", onde);
      if (lat.ok && lon.ok && (lat.valor === null) !== (lon.valor === null)) l.erro(onde, "lat", "informe latitude e longitude juntas, ou deixe as duas vazias.");
      return { nome, cidade, tipo, lat: lat.valor, lon: lon.valor, distancia: l.texto(o, "distancia", onde), preco: l.texto(o, "preco", onde), nota: l.texto(o, "nota", onde) };
    }),
    gastos: l.lista<Gasto>(entrada, "gastos", raiz, "gasto", (o, onde) => {
      const grupo = l.texto(o, "grupo", onde);
      const item = l.texto(o, "item", onde);
      const { min, max } = l.faixa(o, onde, false);
      return { grupo, item, minCentavos: min ?? 0, maxCentavos: max ?? 0, pago: l.booleano(o, "pago", onde) };
    }),
    notas: l.texto(entrada, "notas", raiz, LIMITES.notas),
    fontes: l.lista<Fonte>(entrada, "fontes", raiz, "fonte", (o, onde) => {
      const nome = l.texto(o, "nome", onde);
      const url = l.texto(o, "url", onde);
      if (url !== "" && !urlHttps(url)) l.erro(onde, "url", "use um endereço completo que comece com https://, ou deixe vazio.");
      return { nome, url };
    }),
  };

  if (l.erros.length === 0) return { ok: true, plano };
  if (l.erros.length <= LIMITES.erros) return { ok: false, erros: l.erros };
  const resto = l.erros.length - LIMITES.erros;
  return { ok: false, erros: [...l.erros.slice(0, LIMITES.erros), `…e mais ${resto} problema(s).`] };
}

/** Lê o texto colado em "Importar". */
export function parsePlanoJson(texto: string): ResultadoPlano {
  const bytes = new TextEncoder().encode(texto).length;
  if (bytes > LIMITES.bytes) return { ok: false, erros: [`O texto tem ${Math.ceil(bytes / 1024)} KB; o máximo é 300 KB.`] };
  let dados: unknown;
  try { dados = JSON.parse(texto); } catch { return { ok: false, erros: ["O texto colado não é um JSON válido. Confira se copiou tudo, do primeiro { ao último }."] }; }
  return parsePlano(dados);
}

/** Interpreta o que está no banco: `{}` é a página ainda vazia. */
export function lerPlanoSalvo(dados: unknown): { tipo: "vazio" } | { tipo: "ok"; plano: Plano } | { tipo: "invalido"; erros: string[] } {
  if (dados === null || dados === undefined || (ehObjeto(dados) && Object.keys(dados).length === 0)) return { tipo: "vazio" };
  const resultado = parsePlano(dados);
  return resultado.ok ? { tipo: "ok", plano: resultado.plano } : { tipo: "invalido", erros: resultado.erros };
}

// ---------- criação e edição ----------

export function novoId(): string {
  const cripto = globalThis.crypto;
  if (cripto && typeof cripto.randomUUID === "function") return cripto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export const novo = {
  resolvido: (): Resolvido => ({ id: novoId(), texto: "" }),
  dia: (): Dia => ({ id: novoId(), titulo: "", data: "", tema: "", fixo: "", itens: [], nota: "" }),
  item: (): ItemDia => ({ id: novoId(), texto: "", feito: false }),
  decisao: (): Decisao => ({ id: novoId(), titulo: "", estado: "aberta", opcoes: [], recomendacao: "", escolhaId: null }),
  opcao: (): Opcao => ({ id: novoId(), nome: "", minCentavos: null, maxCentavos: null, detalhe: "" }),
  reserva: (): Reserva => ({ id: novoId(), ate: "", oque: "", onde: "", feito: false }),
  lugar: (): Lugar => ({ id: novoId(), nome: "", cidade: "", tipo: "passeio", lat: null, lon: null, distancia: "", preco: "", nota: "" }),
  gasto: (): Gasto => ({ id: novoId(), grupo: "", item: "", minCentavos: 0, maxCentavos: 0, pago: false }),
  fonte: (): Fonte => ({ id: novoId(), nome: "", url: "" }),
};

export function moverNaLista<T>(lista: readonly T[], indice: number, delta: number): T[] {
  const destino = indice + delta;
  const copia = [...lista];
  if (indice < 0 || indice >= lista.length || destino < 0 || destino >= lista.length) return copia;
  const [item] = copia.splice(indice, 1);
  copia.splice(destino, 0, item);
  return copia;
}

export function atualizarPorId<T extends { id: string }>(lista: readonly T[], id: string, mudanca: Partial<T>): T[] {
  return lista.map(item => item.id === id ? { ...item, ...mudanca } : item);
}

export function removerPorId<T extends { id: string }>(lista: readonly T[], id: string): T[] {
  return lista.filter(item => item.id !== id);
}

export function removerOpcao(decisao: Decisao, opcaoId: string): Decisao {
  return { ...decisao, opcoes: removerPorId(decisao.opcoes, opcaoId), escolhaId: decisao.escolhaId === opcaoId ? null : decisao.escolhaId };
}

// ---------- dinheiro na tela ----------

export function reaisParaCentavos(texto: string): { ok: true; centavos: number | null } | { ok: false } {
  const limpo = texto.trim();
  if (limpo === "") return { ok: true, centavos: null };
  if (/^(R\$\s*)?0+([.,]0{1,2})?$/i.test(limpo)) return { ok: true, centavos: 0 };
  const centavos = parseBRLToCents(limpo);
  return centavos === null ? { ok: false } : { ok: true, centavos };
}

export function centavosParaEntrada(centavos: number | null): string {
  return centsForInput(centavos);
}

// ---------- totais, reservas e mapa mental ----------

export type TotaisGastos = { grupos: { grupo: string; minCentavos: number; maxCentavos: number; quantidade: number }[]; minCentavos: number; maxCentavos: number };

export function totaisGastos(gastos: readonly Gasto[]): TotaisGastos {
  const grupos = new Map<string, TotaisGastos["grupos"][number]>();
  let minCentavos = 0;
  let maxCentavos = 0;
  for (const gasto of gastos) {
    const nome = gasto.grupo.trim() || "Sem grupo";
    const grupo = grupos.get(nome) ?? { grupo: nome, minCentavos: 0, maxCentavos: 0, quantidade: 0 };
    grupo.minCentavos += gasto.minCentavos;
    grupo.maxCentavos += gasto.maxCentavos;
    grupo.quantidade += 1;
    grupos.set(nome, grupo);
    minCentavos += gasto.minCentavos;
    maxCentavos += gasto.maxCentavos;
  }
  return { grupos: [...grupos.values()], minCentavos, maxCentavos };
}

/** Ordena por data (sem data vai para o fim). `hoje` em AAAA-MM-DD; vazio = não marca vencidas. */
export function ordenarReservas(reservas: readonly Reserva[], hoje: string): { reserva: Reserva; vencida: boolean }[] {
  return reservas
    .map((reserva, indice) => ({ reserva, indice }))
    .sort((a, b) => {
      if (a.reserva.ate === b.reserva.ate) return a.indice - b.indice;
      if (a.reserva.ate === "") return 1;
      if (b.reserva.ate === "") return -1;
      return a.reserva.ate < b.reserva.ate ? -1 : 1;
    })
    .map(({ reserva }) => ({ reserva, vencida: hoje !== "" && reserva.ate !== "" && !reserva.feito && reserva.ate < hoje }));
}

export function dataCurta(data: string): string {
  const partes = /^\d{4}-(\d{2})-(\d{2})$/.exec(data);
  return partes ? `${partes[2]}/${partes[1]}` : "sem data";
}

export type NoMapa = { rotulo: string; filhos: NoMapa[] };
const folha = (rotulo: string): NoMapa => ({ rotulo, filhos: [] });

export function mapaMental(plano: Plano): NoMapa {
  return {
    rotulo: plano.titulo.trim() || "Lua de mel",
    filhos: [
      { rotulo: "Já resolvido", filhos: plano.resolvidos.filter(r => r.texto.trim()).map(r => folha(r.texto.trim())) },
      { rotulo: "Decisões abertas", filhos: plano.decisoes.filter(d => d.estado === "aberta").map(d => folha(d.titulo.trim() || "Decisão sem título")) },
      { rotulo: "Dia a dia", filhos: plano.dias.map((dia, i) => folha([dia.titulo.trim() || `Dia ${i + 1}`, dia.tema.trim()].filter(Boolean).join(" — "))) },
      { rotulo: "Reservas pendentes", filhos: ordenarReservas(plano.reservas, "").filter(x => !x.reserva.feito).map(({ reserva }) => folha(`${dataCurta(reserva.ate)} · ${reserva.oque.trim() || "Reserva sem nome"}`)) },
      {
        rotulo: "Lugares por tipo",
        filhos: TIPOS_LUGAR.filter(tipo => plano.lugares.some(lugar => lugar.tipo === tipo)).map(tipo => ({
          rotulo: ROTULO_TIPO[tipo],
          filhos: plano.lugares.filter(lugar => lugar.tipo === tipo).map(lugar => folha(lugar.nome.trim() || "Lugar sem nome")),
        })),
      },
    ],
  };
}

// ---------- mapa dos lugares ----------

const RAIO_TERRA_KM = 6371;
const KM_POR_GRAU = (Math.PI / 180) * RAIO_TERRA_KM;
const rad = (graus: number) => (graus * Math.PI) / 180;
type Coordenada = { lat: number; lon: number };

export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function mediana(valores: number[]): number {
  const ordem = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordem.length / 2);
  return ordem.length % 2 ? ordem[meio] : (ordem[meio - 1] + ordem[meio]) / 2;
}

export type Tela = { largura: number; altura: number; margem: number };
export const TELA_MAPA: Tela = { largura: 640, altura: 480, margem: 44 };
export type PontoMapa = { lugar: Lugar; numero: number; x: number; y: number; distanciaKm: number };
export type Enquadramento = {
  referencia: (Coordenada & { tipo: "hotel" | "centro" }) | null;
  pontos: PontoMapa[];
  longe: { lugar: Lugar; numero: number; distanciaKm: number }[];
  semCoordenadas: { lugar: Lugar; numero: number }[];
  pxPorKm: number;
  anel: { x: number; y: number; raio: number } | null;
  escala: { km: number; px: number } | null;
};

/**
 * Projeção equirretangular em volta da referência (hotel, ou a mediana dos lugares),
 * com a longitude corrigida por cos(lat). Lugares a mais de 60 km ficam na lista "longe".
 * O número de cada lugar é a posição dele na lista, igual na tabela e no pino.
 */
export function enquadrarMapa(lugares: readonly Lugar[], tela: Tela = TELA_MAPA): Enquadramento {
  const numerados = lugares.map((lugar, i) => ({ lugar, numero: i + 1 }));
  const semCoordenadas = numerados.filter(({ lugar }) => lugar.lat === null || lugar.lon === null);
  const comCoordenadas = numerados.filter(({ lugar }) => lugar.lat !== null && lugar.lon !== null) as { lugar: Lugar & Coordenada; numero: number }[];
  if (comCoordenadas.length === 0) return { referencia: null, pontos: [], longe: [], semCoordenadas, pxPorKm: 0, anel: null, escala: null };

  const hotel = comCoordenadas.find(({ lugar }) => lugar.tipo === "hotel");
  const referencia = hotel
    ? { lat: hotel.lugar.lat, lon: hotel.lugar.lon, tipo: "hotel" as const }
    : { lat: mediana(comCoordenadas.map(({ lugar }) => lugar.lat)), lon: mediana(comCoordenadas.map(({ lugar }) => lugar.lon)), tipo: "centro" as const };
  const medidos = comCoordenadas.map(item => ({ ...item, distanciaKm: distanciaKm(referencia, item.lugar) }));
  const dentro = medidos.filter(item => item.distanciaKm <= LIMITES.raioKm);
  const longe = medidos.filter(item => item.distanciaKm > LIMITES.raioKm);

  const cosLat = Math.cos(rad(referencia.lat));
  const km = dentro.map(item => ({ ...item, kx: (item.lugar.lon - referencia.lon) * cosLat * KM_POR_GRAU, ky: (item.lugar.lat - referencia.lat) * KM_POR_GRAU }));
  const xs = km.map(p => p.kx);
  const ys = km.map(p => p.ky);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const vaoMinimo = 2;
  const larguraUtil = tela.largura - 2 * tela.margem;
  const alturaUtil = tela.altura - 2 * tela.margem;
  const pxPorKm = Math.min(larguraUtil / Math.max(maxX - minX, vaoMinimo), alturaUtil / Math.max(maxY - minY, vaoMinimo));
  const centroX = (minX + maxX) / 2;
  const centroY = (minY + maxY) / 2;
  const pontos = km.map(({ lugar, numero, distanciaKm: distancia, kx, ky }) => ({
    lugar, numero, distanciaKm: distancia,
    x: tela.largura / 2 + (kx - centroX) * pxPorKm,
    y: tela.altura / 2 - (ky - centroY) * pxPorKm,
  }));
  const pinoHotel = hotel ? pontos.find(p => p.numero === hotel.numero) : undefined;
  // Escala de 5 km; só cai para 1 km quando 5 km nem cabem no desenho (lugares muito juntos).
  const escalaKm = 5 * pxPorKm <= larguraUtil * 0.8 ? 5 : 1;
  return {
    referencia,
    pontos,
    longe: longe.map(({ lugar, numero, distanciaKm: distancia }) => ({ lugar, numero, distanciaKm: distancia })),
    semCoordenadas,
    pxPorKm,
    anel: pinoHotel ? { x: pinoHotel.x, y: pinoHotel.y, raio: 10 * pxPorKm } : null,
    escala: { km: escalaKm, px: escalaKm * pxPorKm },
  };
}

export function parseCoordenadas(texto: string): { ok: true; lat: number | null; lon: number | null } | { ok: false; erro: string } {
  const limpo = texto.trim().replace(/^\(|\)$/g, "").trim();
  if (limpo === "") return { ok: true, lat: null, lon: null };
  const partes = limpo.includes(";")
    ? limpo.split(";").map(parte => parte.trim().replace(",", "."))
    : limpo.includes(",") ? limpo.split(",").map(parte => parte.trim()) : limpo.split(/\s+/);
  const numero = /^[+-]?\d+(\.\d+)?$/;
  if (partes.length !== 2 || !partes.every(parte => numero.test(parte))) return { ok: false, erro: "Cole no formato latitude, longitude (ex.: -12.34, -45.67)." };
  const [lat, lon] = partes.map(Number);
  if (lat < -90 || lat > 90) return { ok: false, erro: "A latitude vai de -90 a 90." };
  if (lon < -180 || lon > 180) return { ok: false, erro: "A longitude vai de -180 a 180." };
  return { ok: true, lat, lon };
}

export function formatarCoordenadas(lat: number | null, lon: number | null): string {
  return lat === null || lon === null ? "" : `${lat}, ${lon}`;
}

export function googleMapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

export function formatarKm(km: number): string {
  return km < 10 ? `${km.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km` : `${Math.round(km).toLocaleString("pt-BR")} km`;
}

// ---------- datas ----------

function partesNoFuso(data: Date, fuso: string, opcoes: Intl.DateTimeFormatOptions) {
  const partes = new Intl.DateTimeFormat("en-US", { timeZone: fuso, hourCycle: "h23", ...opcoes }).formatToParts(data);
  return Object.fromEntries(partes.map(parte => [parte.type, parte.value]));
}

/** Data AAAA-MM-DD no fuso indicado (ex.: "America/Sao_Paulo"). */
export function dataNoFuso(agora: Date, fuso: string): string {
  const p = partesNoFuso(agora, fuso, { year: "numeric", month: "2-digit", day: "2-digit" });
  return `${p.year}-${p.month}-${p.day}`;
}

/** "DD/MM às HH:MM" no fuso indicado. */
export function momentoNoFuso(iso: string, fuso: string): string {
  const p = partesNoFuso(new Date(iso), fuso, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  return `${p.day}/${p.month} às ${p.hour}:${p.minute}`;
}
