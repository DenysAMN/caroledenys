"use client";

import { atualizarPorId, moverNaLista, novo, removerPorId, type Dia } from "../../lib/honeymoon-plan";
import { AcoesDaLinha, Adicionar, AreaTexto, Caixa, Texto, estilo, type Mudar } from "./campos";

function temConteudo(dia: Dia) {
  return Boolean(dia.titulo || dia.tema || dia.fixo || dia.nota || dia.itens.length);
}

export default function BlocoDias({ dias, mudar }: { dias: Dia[]; mudar: Mudar<Dia[]> }) {
  const mudarDia = (id: string, mudanca: Partial<Dia>) => mudar(lista => atualizarPorId(lista, id, mudanca));
  return <>
    <div className="grid gap-4 xl:grid-cols-2">
      {dias.map((dia, indice) => {
        const nome = `dia ${indice + 1}`;
        return <article key={dia.id} className={estilo.cartao}>
          <header className="flex items-start justify-between gap-2">
            <p className="eyebrow pt-3">{`Dia ${indice + 1}`}</p>
            <AcoesDaLinha nome={nome} indice={indice} total={dias.length}
              aoMover={delta => mudar(lista => moverNaLista(lista, indice, delta))}
              aoRemover={() => { if (!temConteudo(dia) || window.confirm(`Remover o ${nome} e tudo o que está nele?`)) mudar(lista => removerPorId(lista, dia.id)); }} />
          </header>
          <Texto rotulo="Título do dia" rotuloVisivel={false} destaque valor={dia.titulo} placeholder="Título do dia" aoMudar={titulo => mudarDia(dia.id, { titulo })} />
          <div className="mt-3 grid gap-3 sm:grid-cols-[11rem_minmax(0,1fr)]">
            <Texto rotulo="Data" tipo="date" valor={dia.data} aoMudar={data => mudarDia(dia.id, { data })} />
            <Texto rotulo="Tema" valor={dia.tema} placeholder="Ex.: natureza e descanso" aoMudar={tema => mudarDia(dia.id, { tema })} />
          </div>
          <Texto className="mt-3" rotulo="Horário fixo" valor={dia.fixo} placeholder="O que tem hora marcada" aoMudar={fixo => mudarDia(dia.id, { fixo })} />
          <p className={`${estilo.rotulo} mt-4`}>Itens</p>
          <ul className="mt-1">
            {dia.itens.map((item, posicao) => <li key={item.id} className="flex items-center gap-1">
              <Caixa rotulo={`Feito: ${item.texto || `item ${posicao + 1}`}`} rotuloVisivel={false} marcado={item.feito}
                aoMudar={feito => mudarDia(dia.id, { itens: atualizarPorId(dia.itens, item.id, { feito }) })} />
              <Texto className={`flex-1 ${item.feito ? "opacity-60 [&_input]:line-through" : ""}`} rotulo={`Item ${posicao + 1} do ${nome}`} rotuloVisivel={false} valor={item.texto} placeholder="O que fazer"
                aoMudar={texto => mudarDia(dia.id, { itens: atualizarPorId(dia.itens, item.id, { texto }) })} />
              <AcoesDaLinha nome={`item ${posicao + 1}`} indice={posicao} total={dia.itens.length}
                aoMover={delta => mudarDia(dia.id, { itens: moverNaLista(dia.itens, posicao, delta) })}
                aoRemover={() => mudarDia(dia.id, { itens: removerPorId(dia.itens, item.id) })} />
            </li>)}
          </ul>
          <Adicionar aoClicar={() => mudarDia(dia.id, { itens: [...dia.itens, novo.item()] })}>Adicionar item</Adicionar>
          <AreaTexto className="mt-3" rotulo="Nota" valor={dia.nota} placeholder="Observações do dia" aoMudar={nota => mudarDia(dia.id, { nota })} />
        </article>;
      })}
    </div>
    {dias.length === 0 && <p className="text-[14px] text-[var(--muted)]">Nenhum dia ainda.</p>}
    <Adicionar aoClicar={() => mudar(lista => [...lista, novo.dia()])}>Adicionar dia</Adicionar>
  </>;
}
