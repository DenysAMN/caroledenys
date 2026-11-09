"use client";

import { formatBRL } from "../../lib/format";
import {
  LIMITES, atualizarPorId, novo, ordenarReservas, removerPorId, totaisGastos,
  type Fonte, type Gasto, type Plano, type Reserva, type Resolvido,
} from "../../lib/honeymoon-plan";
import { AcoesDaLinha, Adicionar, AreaTexto, Caixa, CampoReais, Texto, estilo, type Mudar } from "./campos";

const faixa = (min: number, max: number) => min === max ? formatBRL(min) : `${formatBRL(min)} – ${formatBRL(max)}`;

export function BlocoResumo({ plano, atualizar }: { plano: Plano; atualizar: Mudar<Plano> }) {
  const mudarResolvidos = (mudanca: (lista: Resolvido[]) => Resolvido[]) => atualizar(p => ({ ...p, resolvidos: mudanca(p.resolvidos) }));
  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
    <div className={estilo.cartao}>
      <Texto rotulo="Título" destaque valor={plano.titulo} placeholder="Nome da viagem" aoMudar={titulo => atualizar(p => ({ ...p, titulo }))} />
      <Texto className="mt-3" rotulo="Período" valor={plano.periodo} placeholder="De quando a quando" aoMudar={periodo => atualizar(p => ({ ...p, periodo }))} />
      <AreaTexto className="mt-3" rotulo="Subtítulo" valor={plano.subtitulo} placeholder="Uma frase sobre a viagem" aoMudar={subtitulo => atualizar(p => ({ ...p, subtitulo }))} />
    </div>
    <div className={estilo.cartao}>
      <h3 className="text-[24px]">Já resolvido</h3>
      <ul className="mt-2">
        {plano.resolvidos.map((item, indice) => <li key={item.id} className="flex items-center gap-2">
          <span aria-hidden="true" className="text-[var(--forest)]">✓</span>
          <Texto className="flex-1" rotulo={`Resolvido ${indice + 1}`} rotuloVisivel={false} valor={item.texto} placeholder="O que já está certo"
            aoMudar={texto => mudarResolvidos(lista => atualizarPorId(lista, item.id, { texto }))} />
          <AcoesDaLinha nome={`resolvido ${indice + 1}`} indice={indice} total={plano.resolvidos.length} aoRemover={() => mudarResolvidos(lista => removerPorId(lista, item.id))} />
        </li>)}
      </ul>
      <Adicionar aoClicar={() => mudarResolvidos(lista => [...lista, novo.resolvido()])}>Adicionar</Adicionar>
    </div>
  </div>;
}

export function BlocoReservas({ reservas, hoje, mudar }: { reservas: Reserva[]; hoje: string; mudar: Mudar<Reserva[]> }) {
  const mudarReserva = (id: string, mudanca: Partial<Reserva>) => mudar(lista => atualizarPorId(lista, id, mudanca));
  return <>
    <ul className="divide-y divide-[var(--sand)] border-y border-[var(--sand)]">
      {ordenarReservas(reservas, hoje).map(({ reserva, vencida }, indice) => <li key={reserva.id} data-vencida={vencida ? "true" : undefined}
        className={`grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 gap-y-1 py-3 sm:grid-cols-[10.5rem_minmax(0,1.4fr)_minmax(0,1fr)_auto_auto] ${vencida ? "border-l-4 border-l-[var(--marsala)] bg-[#7a1e330d] pl-3" : ""} ${reserva.feito ? "opacity-60" : ""}`}>
        <div>
          {vencida && <span className="mb-1 inline-block rounded bg-[var(--marsala)] px-1.5 py-0.5 text-[10px] uppercase tracking-[.1em] text-white">Vencida</span>}
          <Texto rotulo="Até" tipo="date" valor={reserva.ate} aoMudar={ate => mudarReserva(reserva.id, { ate })} />
        </div>
        <Texto className="col-span-2 sm:col-span-1" rotulo="O quê" valor={reserva.oque} placeholder="O que reservar" aoMudar={oque => mudarReserva(reserva.id, { oque })} />
        <Texto rotulo="Onde" valor={reserva.onde} placeholder="Site, telefone…" aoMudar={onde => mudarReserva(reserva.id, { onde })} />
        <Caixa rotulo="Feito" marcado={reserva.feito} aoMudar={feito => mudarReserva(reserva.id, { feito })} />
        <AcoesDaLinha nome={`reserva ${indice + 1}`} indice={indice} total={reservas.length} aoRemover={() => mudar(lista => removerPorId(lista, reserva.id))} />
      </li>)}
    </ul>
    {reservas.length === 0 && <p className="mt-2 text-[14px] text-[var(--muted)]">Nenhum prazo de reserva ainda.</p>}
    <Adicionar aoClicar={() => mudar(lista => [...lista, novo.reserva()])}>Adicionar prazo</Adicionar>
  </>;
}

export function BlocoGastos({ gastos, mudar }: { gastos: Gasto[]; mudar: Mudar<Gasto[]> }) {
  const mudarGasto = (id: string, mudanca: Partial<Gasto>) => mudar(lista => atualizarPorId(lista, id, mudanca));
  const totais = totaisGastos(gastos);
  const grupos = [...new Set(gastos.map(gasto => gasto.grupo.trim()).filter(Boolean))];
  return <>
    <datalist id="lua-de-mel-grupos">{grupos.map(grupo => <option key={grupo} value={grupo} />)}</datalist>
    <ul className="divide-y divide-[var(--sand)] border-y border-[var(--sand)]">
      {gastos.map((gasto, indice) => <li key={gasto.id} className="grid grid-cols-2 items-end gap-x-3 gap-y-1 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_8rem_8rem_auto_auto]">
        <label className="block min-w-0">
          <span className={estilo.rotulo}>Grupo</span>
          <input list="lua-de-mel-grupos" value={gasto.grupo} maxLength={LIMITES.texto} placeholder="Ex.: hospedagem" className={estilo.campo} onChange={evento => mudarGasto(gasto.id, { grupo: evento.target.value })} />
        </label>
        <Texto rotulo="Item" valor={gasto.item} placeholder="O que é" aoMudar={item => mudarGasto(gasto.id, { item })} />
        <CampoReais rotulo="Mínimo" centavos={gasto.minCentavos} aoMudar={valor => mudarGasto(gasto.id, { minCentavos: valor ?? 0 })} />
        <CampoReais rotulo="Máximo" centavos={gasto.maxCentavos} aoMudar={valor => mudarGasto(gasto.id, { maxCentavos: valor ?? 0 })} />
        <Caixa rotulo="Pago" marcado={gasto.pago} aoMudar={pago => mudarGasto(gasto.id, { pago })} />
        <AcoesDaLinha nome={`gasto ${indice + 1}`} indice={indice} total={gastos.length} aoRemover={() => mudar(lista => removerPorId(lista, gasto.id))} />
        {gasto.minCentavos > gasto.maxCentavos && <p className={`${estilo.aviso} col-span-full`}>O mínimo está maior que o máximo.</p>}
      </li>)}
    </ul>
    {gastos.length === 0 && <p className="mt-2 text-[14px] text-[var(--muted)]">Nenhum gasto ainda.</p>}
    <Adicionar aoClicar={() => mudar(lista => [...lista, novo.gasto()])}>Adicionar gasto</Adicionar>
    {gastos.length > 0 && <table className="mt-5 w-full border-collapse text-[14px]">
      <caption className={`${estilo.rotulo} pb-2 text-left`}>Totais (faixa mínima – máxima)</caption>
      <tbody>
        {totais.grupos.map(grupo => <tr key={grupo.grupo} className="border-b border-[var(--sand)]">
          <th scope="row" className="py-2 pr-3 text-left font-normal">{`${grupo.grupo} (${grupo.quantidade})`}</th>
          <td className="py-2 text-right tabular-nums">{faixa(grupo.minCentavos, grupo.maxCentavos)}</td>
        </tr>)}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" className="pt-3 pr-3 text-left font-serif text-[22px] font-medium">Total geral</th>
          <td className="pt-3 text-right font-serif text-[22px] tabular-nums text-[var(--marsala-deep)]">{faixa(totais.minCentavos, totais.maxCentavos)}</td>
        </tr>
      </tfoot>
    </table>}
  </>;
}

export function BlocoNotas({ notas, aoMudar }: { notas: string; aoMudar: (notas: string) => void }) {
  return <AreaTexto rotulo="Notas livres" rotuloVisivel={false} valor={notas} max={LIMITES.notas} linhas={6} placeholder="Qualquer coisa que valha guardar" aoMudar={aoMudar} />;
}

export function BlocoFontes({ fontes, mudar }: { fontes: Fonte[]; mudar: Mudar<Fonte[]> }) {
  const mudarFonte = (id: string, mudanca: Partial<Fonte>) => mudar(lista => atualizarPorId(lista, id, mudanca));
  return <>
    <ul className="divide-y divide-[var(--sand)]">
      {fontes.map((fonte, indice) => {
        const segura = /^https:\/\/[^\s]+$/.test(fonte.url);
        return <li key={fonte.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto_auto]">
          <Texto rotulo="Nome" valor={fonte.nome} placeholder="De onde veio" aoMudar={nome => mudarFonte(fonte.id, { nome })} />
          <div className="col-span-2 min-w-0 sm:col-span-1">
            <Texto rotulo="Endereço (https)" tipo="url" valor={fonte.url} placeholder="https://" aoMudar={url => mudarFonte(fonte.id, { url: url.trim() })} />
            {fonte.url !== "" && !segura && <span className={estilo.aviso}>Use um endereço que comece com https://</span>}
          </div>
          {segura ? <a className="lua-de-mel-link inline-flex min-h-11 items-center text-[13px]" href={fonte.url} target="_blank" rel="noopener noreferrer">abrir ↗</a> : <span />}
          <AcoesDaLinha nome={`fonte ${indice + 1}`} indice={indice} total={fontes.length} aoRemover={() => mudar(lista => removerPorId(lista, fonte.id))} />
        </li>;
      })}
    </ul>
    <Adicionar aoClicar={() => mudar(lista => [...lista, novo.fonte()])}>Adicionar fonte</Adicionar>
  </>;
}
