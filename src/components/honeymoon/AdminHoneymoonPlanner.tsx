"use client";

import { useEffect, useState, useTransition } from "react";
import { parsePlano, planoVazio, type Plano } from "../../lib/honeymoon-plan";
import { MENSAGEM_CONFLITO, type SalvarPlanoResultado } from "../../lib/honeymoon-save";
import { Exportar, Importar } from "./Avancado";
import BlocoDecisoes from "./BlocoDecisoes";
import BlocoDias from "./BlocoDias";
import { BlocoFontes, BlocoGastos, BlocoNotas, BlocoReservas, BlocoResumo } from "./blocos";
import { Bloco, type Mudar } from "./campos";
import MapaLugares from "./MapaLugares";
import MapaMental from "./MapaMental";
import TabelaLugares from "./TabelaLugares";

type Props = {
  inicial: Plano | null;
  revisao: number;
  /** AAAA-MM-DD no fuso do casal, calculado no servidor (igual no servidor e no navegador). */
  hoje: string;
  ultimaGravacao: string | null;
  errosLeitura?: string[];
  bruto?: string;
  salvar: (dados: Plano, revisao: number) => Promise<SalvarPlanoResultado>;
};
type Situacao = { tipo: "parado" } | { tipo: "salvo"; hora: string } | { tipo: "conflito" } | { tipo: "erro"; mensagens: string[] };
type ListaDoPlano = "resolvidos" | "dias" | "decisoes" | "reservas" | "lugares" | "gastos" | "fontes";

const AVISO_SAIR = "Há alterações não salvas na lua de mel. Sair mesmo assim?";
const SUMARIO = [["lua-resumo", "Resumo"], ["lua-mapa-mental", "Mapa mental"], ["lua-lugares", "Lugares"], ["lua-dias", "Dia a dia"], ["lua-decisoes", "Decisões"],
  ["lua-reservas", "Reservar até"], ["lua-gastos", "Gastos"], ["lua-notas", "Notas"], ["lua-fontes", "Fontes"]] as const;

/** Avisa antes de sair (fechar, recarregar, clicar num link do painel ou em Sair) com mudança não salva. */
function useAvisoAoSair(ativo: boolean) {
  useEffect(() => {
    if (!ativo) return;
    const antesDeSair = (evento: BeforeUnloadEvent) => { evento.preventDefault(); evento.returnValue = ""; };
    const clique = (evento: MouseEvent) => {
      if (evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
      const link = evento.target instanceof Element ? evento.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const destino = new URL(link.href, window.location.href);
      if (destino.origin !== window.location.origin) return;
      if (destino.pathname === window.location.pathname && destino.hash) return;
      if (!window.confirm(AVISO_SAIR)) { evento.preventDefault(); evento.stopPropagation(); }
    };
    const envio = (evento: SubmitEvent) => {
      if (!window.confirm(AVISO_SAIR)) { evento.preventDefault(); evento.stopPropagation(); }
    };
    window.addEventListener("beforeunload", antesDeSair);
    document.addEventListener("click", clique, true);
    document.addEventListener("submit", envio, true);
    return () => {
      window.removeEventListener("beforeunload", antesDeSair);
      document.removeEventListener("click", clique, true);
      document.removeEventListener("submit", envio, true);
    };
  }, [ativo]);
}

export default function AdminHoneymoonPlanner({ inicial, revisao: revisaoInicial, hoje, ultimaGravacao, errosLeitura = [], bruto = "", salvar }: Props) {
  const [plano, setPlano] = useState<Plano | null>(inicial);
  const [revisao, setRevisao] = useState(revisaoInicial);
  // Cada edição soma 1; "salvo" guarda o número da edição que o banco confirmou.
  const [edicao, setEdicao] = useState(0);
  const [edicaoSalva, setEdicaoSalva] = useState(0);
  const [situacao, setSituacao] = useState<Situacao>({ tipo: "parado" });
  const [salvando, iniciar] = useTransition();
  const sujo = edicao !== edicaoSalva;
  useAvisoAoSair(sujo);

  const atualizar: Mudar<Plano> = mudanca => { setPlano(atual => atual && mudanca(atual)); setEdicao(n => n + 1); };
  const substituir = (novo: Plano) => { setPlano(novo); setEdicao(n => n + 1); };
  const lista = <K extends ListaDoPlano>(chave: K): Mudar<Plano[K]> => mudanca => atualizar(atual => ({ ...atual, [chave]: mudanca(atual[chave]) }) as Plano);

  function salvarAgora() {
    if (!plano || salvando) return;
    const validado = parsePlano(plano);
    if (!validado.ok) { setSituacao({ tipo: "erro", mensagens: validado.erros }); return; }
    const alvo = edicao;
    iniciar(async () => {
      try {
        const resultado = await salvar(validado.plano, revisao);
        if (resultado.ok) {
          setRevisao(resultado.revision);
          setEdicaoSalva(alvo);
          setSituacao({ tipo: "salvo", hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) });
        } else if (resultado.erro === "STALE") {
          setSituacao({ tipo: "conflito" });
        } else {
          setSituacao({ tipo: "erro", mensagens: resultado.mensagens });
        }
      } catch {
        setSituacao({ tipo: "erro", mensagens: ["Não foi possível falar com o servidor. Suas mudanças continuam na tela; tente de novo."] });
      }
    });
  }

  if (!plano) {
    return <section className="admin-form-sheet mt-8" data-lua-de-mel>
      <h2 className="text-[36px]">Planejador da lua de mel</h2>
      <p className="mt-3 max-w-2xl leading-relaxed text-[var(--ink-soft)]">
        Aqui fica o roteiro da viagem: resumo, mapa mental, lugares no mapa, dia a dia, decisões, prazos de reserva, gastos e notas.
        Só quem entra no painel vê. Tudo é editado na própria página e só é gravado quando vocês clicam em Salvar; se duas pessoas
        editarem ao mesmo tempo, a segunda é avisada em vez de apagar o que a primeira fez.
      </p>
      {errosLeitura.length > 0 && <div role="alert" className="mt-4 border border-[#E7C9C4] bg-[#F6E9E6] p-3 text-[13px] text-[var(--marsala-deep)]">
        <p className="font-medium">O conteúdo salvo no banco não passou na validação. Ele foi colocado no Importar abaixo para ser corrigido:</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">{errosLeitura.map((erro, indice) => <li key={indice}>{erro}</li>)}</ul>
      </div>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn" onClick={() => substituir(planoVazio())}>Começar em branco</button>
      </div>
      <h3 className="mt-8 text-[26px]">Importar</h3>
      <p className="mt-1 text-[13px] text-[var(--muted)]">Já tem o plano em JSON? Cole abaixo; ele aparece na tela para conferir antes de salvar.</p>
      <div className="mt-3"><Importar temConteudo={false} inicial={bruto} aoImportar={substituir} /></div>
    </section>;
  }

  const status = salvando ? "Salvando…"
    : sujo ? "Alterações não salvas"
      : situacao.tipo === "salvo" ? `Salvo às ${situacao.hora}`
        : ultimaGravacao ? `Salvo em ${ultimaGravacao}` : "Nada salvo ainda";

  return <div data-lua-de-mel>
    <nav aria-label="Blocos da página" className="-mx-1 mt-6 flex gap-2 overflow-x-auto pb-1">
      {SUMARIO.map(([id, nome]) => <a key={id} href={`#${id}`} className="admin-catalog-chip shrink-0">{nome}</a>)}
    </nav>

    <Bloco id="lua-resumo" numero="01" titulo="Resumo"><BlocoResumo plano={plano} atualizar={atualizar} /></Bloco>
    <Bloco id="lua-mapa-mental" numero="02" titulo="Mapa mental" descricao="Montado sozinho a partir do resto da página. Para mudar, edite os blocos abaixo."><MapaMental plano={plano} /></Bloco>
    <Bloco id="lua-lugares" numero="03" titulo="Mapa dos lugares" descricao="O mapa se enquadra sozinho a partir das coordenadas. O anel marca 10 km do hotel; lugares a mais de 60 km aparecem em “Longe”.">
      <MapaLugares lugares={plano.lugares} />
      <TabelaLugares lugares={plano.lugares} mudar={lista("lugares")} />
    </Bloco>
    <Bloco id="lua-dias" numero="04" titulo="Dia a dia"><BlocoDias dias={plano.dias} mudar={lista("dias")} /></Bloco>
    <Bloco id="lua-decisoes" numero="05" titulo="Decisões" descricao="Valores em reais; ficam guardados em centavos."><BlocoDecisoes decisoes={plano.decisoes} mudar={lista("decisoes")} /></Bloco>
    <Bloco id="lua-reservas" numero="06" titulo="Reservar até" descricao="Em ordem de data. Prazo vencido e não feito fica em destaque."><BlocoReservas reservas={plano.reservas} hoje={hoje} mudar={lista("reservas")} /></Bloco>
    <Bloco id="lua-gastos" numero="07" titulo="Gastos" descricao="Mínimo e máximo de cada item; os totais são calculados."><BlocoGastos gastos={plano.gastos} mudar={lista("gastos")} /></Bloco>
    <Bloco id="lua-notas" numero="08" titulo="Notas"><BlocoNotas notas={plano.notas} aoMudar={notas => atualizar(atual => ({ ...atual, notas }))} /></Bloco>
    <Bloco id="lua-fontes" numero="09" titulo="Fontes"><BlocoFontes fontes={plano.fontes} mudar={lista("fontes")} /></Bloco>

    <details className="admin-form-sheet mt-14">
      <summary className="cursor-pointer font-serif text-[24px]">Avançado</summary>
      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-[22px]">Exportar</h3>
          <p className="mb-3 mt-1 text-[13px] text-[var(--muted)]">Copia todo o conteúdo da tela (inclusive o que ainda não foi salvo) em JSON.</p>
          <Exportar plano={plano} />
        </div>
        <div>
          <h3 className="text-[22px]">Importar</h3>
          <p className="mb-3 mt-1 text-[13px] text-[var(--muted)]">Substitui o conteúdo da tela pelo JSON colado. Só grava quando clicar em Salvar.</p>
          <Importar temConteudo aoImportar={substituir} />
        </div>
      </div>
    </details>

    <div className="sticky bottom-0 z-10 mt-10 border-t border-[var(--gold)] bg-[var(--ivory)] py-3 shadow-[0_-8px_20px_rgba(42,35,32,.06)]">
      {situacao.tipo === "conflito" && <div role="alert" className="mb-3 border border-[#E7C9C4] bg-[#F6E9E6] p-3 text-[14px] text-[var(--marsala-deep)]">
        <p>{MENSAGEM_CONFLITO}</p>
        <div className="mt-2 flex flex-wrap items-start gap-3">
          <Exportar plano={plano} rotulo="Copiar meu conteúdo" />
          <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>Recarregar</button>
        </div>
      </div>}
      {situacao.tipo === "erro" && <div role="alert" className="mb-3 max-h-48 overflow-y-auto border border-[#E7C9C4] bg-[#F6E9E6] p-3 text-[13px] text-[var(--marsala-deep)]">
        <p className="font-medium">Não foi salvo:</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">{situacao.mensagens.map((mensagem, indice) => <li key={indice}>{mensagem}</li>)}</ul>
      </div>}
      <div className="flex items-center justify-between gap-3">
        <p className={`text-[13px] ${sujo ? "font-medium text-[var(--marsala)]" : "text-[var(--muted)]"}`} aria-live="polite">{status}</p>
        <button type="button" className="btn min-w-32" onClick={salvarAgora} disabled={salvando || !sujo || situacao.tipo === "conflito"}>Salvar</button>
      </div>
    </div>
  </div>;
}
