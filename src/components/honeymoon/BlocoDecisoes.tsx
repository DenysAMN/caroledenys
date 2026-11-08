"use client";

import { formatBRL } from "../../lib/format";
import { atualizarPorId, novo, removerOpcao, removerPorId, type Decisao, type Opcao } from "../../lib/honeymoon-plan";
import { AcoesDaLinha, Adicionar, AreaTexto, CampoReais, Texto, estilo, type Mudar } from "./campos";

function faixa(opcao: Opcao) {
  const { minCentavos: min, maxCentavos: max } = opcao;
  if (min === null && max === null) return "";
  if (min !== null && max !== null) return min === max ? formatBRL(min) : `${formatBRL(min)} – ${formatBRL(max)}`;
  return min !== null ? `a partir de ${formatBRL(min)}` : `até ${formatBRL(max as number)}`;
}

export default function BlocoDecisoes({ decisoes, mudar }: { decisoes: Decisao[]; mudar: Mudar<Decisao[]> }) {
  const mudarDecisao = (id: string, mudanca: (decisao: Decisao) => Decisao) => mudar(lista => lista.map(d => d.id === id ? mudanca(d) : d));
  return <>
    <div className="grid gap-4 xl:grid-cols-2">
      {decisoes.map((decisao, indice) => {
        const escolhida = decisao.opcoes.find(opcao => opcao.id === decisao.escolhaId);
        return <article key={decisao.id} className={`${estilo.cartao} ${decisao.estado === "decidida" ? "border-l-4 border-l-[var(--forest)]" : "border-l-4 border-l-[var(--gold)]"}`}>
          <header className="flex items-start gap-2">
            <Texto className="flex-1" rotulo={`Decisão ${indice + 1}`} rotuloVisivel={false} destaque valor={decisao.titulo} placeholder="O que decidir"
              aoMudar={titulo => mudarDecisao(decisao.id, d => ({ ...d, titulo }))} />
            <AcoesDaLinha nome={`decisão ${indice + 1}`} indice={indice} total={decisoes.length}
              aoRemover={() => { if ((!decisao.titulo && !decisao.opcoes.length) || window.confirm("Remover esta decisão e as opções dela?")) mudar(lista => removerPorId(lista, decisao.id)); }} />
          </header>
          <label className="mt-2 inline-flex items-center gap-2 text-[13px]">
            <span className={estilo.rotulo}>Estado</span>
            <select value={decisao.estado} className={`${estilo.campo} w-auto`}
              onChange={evento => mudarDecisao(decisao.id, d => ({ ...d, estado: evento.target.value === "decidida" ? "decidida" : "aberta" }))}>
              <option value="aberta">Aberta</option>
              <option value="decidida">Decidida</option>
            </select>
          </label>
          <fieldset className="mt-4">
            <legend className={estilo.rotulo}>Opções</legend>
            <ul className="mt-1 divide-y divide-[var(--sand)]">
              {decisao.opcoes.map((opcao, posicao) => <li key={opcao.id} className={`py-2 ${decisao.escolhaId === opcao.id ? "bg-[#43552510]" : ""}`}>
                <div className="flex items-center gap-2">
                  <label className="inline-flex min-h-11 shrink-0 items-center gap-1 text-[12px] text-[var(--ink-soft)]">
                    <input type="radio" name={`escolha-${decisao.id}`} className="size-5 accent-[var(--forest)]" checked={decisao.escolhaId === opcao.id}
                      onChange={() => mudarDecisao(decisao.id, d => ({ ...d, escolhaId: opcao.id }))} />
                    <span className="sr-only">{`Escolher ${opcao.nome || `opção ${posicao + 1}`}`}</span>
                  </label>
                  <Texto className="flex-1" rotulo={`Opção ${posicao + 1}`} rotuloVisivel={false} valor={opcao.nome} placeholder="Nome da opção"
                    aoMudar={nome => mudarDecisao(decisao.id, d => ({ ...d, opcoes: atualizarPorId(d.opcoes, opcao.id, { nome }) }))} />
                  <AcoesDaLinha nome={`opção ${posicao + 1}`} indice={posicao} total={decisao.opcoes.length} aoRemover={() => mudarDecisao(decisao.id, d => removerOpcao(d, opcao.id))} />
                </div>
                <div className="grid grid-cols-2 gap-3 pl-8 sm:grid-cols-[8rem_8rem_minmax(0,1fr)]">
                  <CampoReais rotulo="Mínimo" anulavel centavos={opcao.minCentavos} aoMudar={minCentavos => mudarDecisao(decisao.id, d => ({ ...d, opcoes: atualizarPorId(d.opcoes, opcao.id, { minCentavos }) }))} />
                  <CampoReais rotulo="Máximo" anulavel centavos={opcao.maxCentavos} aoMudar={maxCentavos => mudarDecisao(decisao.id, d => ({ ...d, opcoes: atualizarPorId(d.opcoes, opcao.id, { maxCentavos }) }))} />
                  <Texto className="col-span-2 sm:col-span-1" rotulo="Detalhe" valor={opcao.detalhe} aoMudar={detalhe => mudarDecisao(decisao.id, d => ({ ...d, opcoes: atualizarPorId(d.opcoes, opcao.id, { detalhe }) }))} />
                </div>
                {opcao.minCentavos !== null && opcao.maxCentavos !== null && opcao.minCentavos > opcao.maxCentavos && <p className={`${estilo.aviso} pl-8`}>O mínimo está maior que o máximo.</p>}
              </li>)}
            </ul>
            <Adicionar aoClicar={() => mudarDecisao(decisao.id, d => ({ ...d, opcoes: [...d.opcoes, novo.opcao()] }))}>Adicionar opção</Adicionar>
          </fieldset>
          <AreaTexto className="mt-3" rotulo="Recomendação" valor={decisao.recomendacao} placeholder="O que parece melhor e por quê" aoMudar={recomendacao => mudarDecisao(decisao.id, d => ({ ...d, recomendacao }))} />
          <p className="mt-3 flex flex-wrap items-center gap-x-2 text-[13px] text-[var(--ink-soft)]">
            <span className={estilo.rotulo}>Escolha</span>
            {escolhida ? <>
              <strong className="font-medium">{`${escolhida.nome || "Opção sem nome"}${faixa(escolhida) ? ` · ${faixa(escolhida)}` : ""}`}</strong>
              <button type="button" className={estilo.acao} onClick={() => mudarDecisao(decisao.id, d => ({ ...d, escolhaId: null }))}>limpar</button>
            </> : <span>nenhuma ainda (marque o círculo de uma opção)</span>}
          </p>
        </article>;
      })}
    </div>
    {decisoes.length === 0 && <p className="text-[14px] text-[var(--muted)]">Nenhuma decisão em aberto.</p>}
    <Adicionar aoClicar={() => mudar(lista => [...lista, novo.decisao()])}>Adicionar decisão</Adicionar>
  </>;
}
