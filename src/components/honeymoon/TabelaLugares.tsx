"use client";

import { ROTULO_TIPO, TIPOS_LUGAR, atualizarPorId, enquadrarMapa, formatarKm, googleMapsUrl, moverNaLista, novo, removerPorId, type Lugar, type TipoLugar } from "../../lib/honeymoon-plan";
import { AcoesDaLinha, Adicionar, CampoCoordenadas, Texto, estilo, type Mudar } from "./campos";

const COLUNAS = "md:grid-cols-[2rem_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,.8fr)_minmax(0,.8fr)_minmax(0,1.2fr)_auto]";

export default function TabelaLugares({ lugares, mudar }: { lugares: Lugar[]; mudar: Mudar<Lugar[]> }) {
  const mudarLugar = (id: string, mudanca: Partial<Lugar>) => mudar(lista => atualizarPorId(lista, id, mudanca));
  const quadro = enquadrarMapa(lugares);
  const distancias = new Map([...quadro.pontos, ...quadro.longe].map(item => [item.lugar.id, item.distanciaKm]));
  const origem = quadro.referencia?.tipo === "hotel" ? "do hotel" : "do centro";
  return <div className="mt-6">
    <div className={`hidden gap-3 border-b border-[var(--sand-2)] pb-2 md:grid ${COLUNAS} ${estilo.rotulo}`} aria-hidden="true">
      <span>Nº</span><span>Nome e tipo</span><span>Cidade</span><span>Coordenadas</span><span>Distância</span><span>Preço</span><span>Nota</span><span />
    </div>
    <ul className="divide-y divide-[var(--sand)]">
      {lugares.map((lugar, indice) => {
        const numero = indice + 1;
        const km = distancias.get(lugar.id);
        return <li key={lugar.id} className={`grid grid-cols-2 items-start gap-x-3 gap-y-2 py-3 md:items-end ${COLUNAS}`}>
          <span className="col-span-2 font-serif text-[22px] text-[var(--gold)] md:col-span-1 md:pb-2">{String(numero)}</span>
          <div className="col-span-2 min-w-0 md:col-span-1">
            <Texto rotulo="Nome" rotuloVisivel="celular" valor={lugar.nome} placeholder="Nome" aoMudar={nome => mudarLugar(lugar.id, { nome })} />
            <div className="flex flex-wrap items-center gap-x-3">
              <label className="inline-flex items-center gap-1">
                <span className="sr-only">{`Tipo do lugar ${numero}`}</span>
                <select value={lugar.tipo} className={`${estilo.campo} w-auto text-[13px]`} onChange={evento => mudarLugar(lugar.id, { tipo: evento.target.value as TipoLugar })}>
                  {TIPOS_LUGAR.map(tipo => <option key={tipo} value={tipo}>{ROTULO_TIPO[tipo]}</option>)}
                </select>
              </label>
              {lugar.lat !== null && lugar.lon !== null && <a className="lua-de-mel-link inline-flex min-h-11 items-center text-[13px]" href={googleMapsUrl(lugar.lat, lugar.lon)} target="_blank" rel="noopener noreferrer">Google Maps ↗</a>}
            </div>
          </div>
          <Texto rotulo="Cidade" rotuloVisivel="celular" valor={lugar.cidade} placeholder="Cidade" aoMudar={cidade => mudarLugar(lugar.id, { cidade })} />
          <div className="min-w-0">
            <CampoCoordenadas rotulo="Coordenadas" rotuloVisivel="celular" lat={lugar.lat} lon={lugar.lon} aoMudar={(lat, lon) => mudarLugar(lugar.id, { lat, lon })} />
            {km !== undefined && <span className="mt-1 block text-[11px] text-[var(--muted)]">{`≈ ${formatarKm(km)} ${origem}`}</span>}
          </div>
          <Texto rotulo="Distância" rotuloVisivel="celular" valor={lugar.distancia} placeholder="Distância" aoMudar={distancia => mudarLugar(lugar.id, { distancia })} />
          <Texto rotulo="Preço" rotuloVisivel="celular" valor={lugar.preco} placeholder="Preço" aoMudar={preco => mudarLugar(lugar.id, { preco })} />
          <Texto rotulo="Nota" rotuloVisivel="celular" className="col-span-2 md:col-span-1" valor={lugar.nota} placeholder="Nota" aoMudar={nota => mudarLugar(lugar.id, { nota })} />
          <div className="col-span-2 flex justify-end md:col-span-1">
            <AcoesDaLinha nome={`lugar ${numero}`} indice={indice} total={lugares.length}
              aoMover={delta => mudar(lista => moverNaLista(lista, indice, delta))}
              aoRemover={() => mudar(lista => removerPorId(lista, lugar.id))} />
          </div>
        </li>;
      })}
    </ul>
    {lugares.length === 0 && <p className="mt-2 text-[14px] text-[var(--muted)]">Nenhum lugar ainda.</p>}
    <Adicionar aoClicar={() => mudar(lista => [...lista, novo.lugar()])}>Adicionar lugar</Adicionar>
  </div>;
}
