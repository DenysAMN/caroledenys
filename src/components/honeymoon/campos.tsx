"use client";

// Campos que parecem texto: sem caixa, só um traço fino que acende ao tocar.
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { LIMITES, centavosParaEntrada, formatarCoordenadas, parseCoordenadas, reaisParaCentavos } from "../../lib/honeymoon-plan";

export type Mudar<T> = (mudanca: (atual: T) => T) => void;

export const estilo = {
  campo: "block w-full min-w-0 rounded-none border-0 border-b border-dashed border-[var(--sand-2)] bg-transparent px-0 py-1.5 text-[15px] leading-snug text-[var(--ink)] placeholder:text-[#a99b8b] hover:border-[var(--gold)] focus:border-solid focus:border-[var(--marsala)] aria-[invalid=true]:border-solid aria-[invalid=true]:border-[var(--marsala)]",
  rotulo: "block text-[11px] uppercase tracking-[.12em] text-[var(--muted)]",
  cartao: "min-w-0 border border-[var(--sand-2)] bg-[var(--paper)] p-4 sm:p-5",
  acao: "inline-flex min-h-11 cursor-pointer items-center gap-1 px-1 text-[13px] text-[var(--marsala)] underline decoration-[var(--gold)] underline-offset-4 hover:text-[var(--marsala-deep)] disabled:cursor-default disabled:opacity-40",
  icone: "inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded text-[16px] text-[var(--ink-soft)] hover:bg-[var(--sand)] disabled:cursor-default disabled:opacity-30",
  aviso: "mt-1 text-[12px] text-[var(--marsala)]",
};

/** `"celular"`: rótulo visível só em tela estreita (no computador o cabeçalho da tabela explica). */
type Visibilidade = boolean | "celular";
type Base = { rotulo: string; rotuloVisivel?: Visibilidade; className?: string };

function Rotulo({ rotulo, visivel = true }: { rotulo: string; visivel?: Visibilidade }) {
  const classe = visivel === "celular" ? `${estilo.rotulo} md:sr-only` : visivel ? estilo.rotulo : "sr-only";
  return <span className={classe}>{rotulo}</span>;
}

export function Texto({ rotulo, rotuloVisivel, className = "", valor, aoMudar, placeholder, tipo = "text", destaque = false, max = LIMITES.texto }:
  Base & { valor: string; aoMudar: (valor: string) => void; placeholder?: string; tipo?: "text" | "date" | "url"; destaque?: boolean; max?: number }) {
  const area = useRef<HTMLTextAreaElement>(null);
  // Texto comum quebra em várias linhas no celular, sem cortar: a altura acompanha o conteúdo.
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    const ajustar = () => { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; };
    ajustar();
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, [valor]);
  if (tipo === "text" && !destaque) return <label className={`block min-w-0 ${className}`}>
    <Rotulo rotulo={rotulo} visivel={rotuloVisivel} />
    <textarea ref={area} rows={1} value={valor} maxLength={max} placeholder={placeholder} onChange={evento => aoMudar(evento.target.value.replace(/\n/g, " "))}
      onKeyDown={evento => { if (evento.key === "Enter") evento.preventDefault(); }}
      className={`${estilo.campo} resize-none overflow-hidden`} />
  </label>;
  return <label className={`block min-w-0 ${className}`}>
    <Rotulo rotulo={rotulo} visivel={rotuloVisivel} />
    <input type={tipo} value={valor} maxLength={max} placeholder={placeholder} onChange={evento => aoMudar(evento.target.value)}
      className={`${estilo.campo} ${destaque ? "font-serif text-[clamp(24px,4vw,32px)] leading-tight" : ""}`} />
  </label>;
}

export function AreaTexto({ rotulo, rotuloVisivel, className = "", valor, aoMudar, placeholder, max = LIMITES.texto, linhas = 2 }:
  Base & { valor: string; aoMudar: (valor: string) => void; placeholder?: string; max?: number; linhas?: number }) {
  return <label className={`block min-w-0 ${className}`}>
    <Rotulo rotulo={rotulo} visivel={rotuloVisivel} />
    <textarea value={valor} maxLength={max} rows={linhas} placeholder={placeholder} onChange={evento => aoMudar(evento.target.value)}
      className={`${estilo.campo} resize-y [field-sizing:content] min-h-[2.6em]`} />
  </label>;
}

export function Caixa({ rotulo, marcado, aoMudar, rotuloVisivel = true }: { rotulo: string; marcado: boolean; aoMudar: (valor: boolean) => void; rotuloVisivel?: boolean }) {
  return <label className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 text-[13px] text-[var(--ink-soft)]">
    <input type="checkbox" checked={marcado} onChange={evento => aoMudar(evento.target.checked)} className="size-5 accent-[var(--wine)]" />
    <span className={rotuloVisivel ? "" : "sr-only"}>{rotulo}</span>
  </label>;
}

/** Recebe e mostra reais; entrega centavos inteiros. Texto que não é valor fica marcado e não muda o plano. */
export function CampoReais({ rotulo, rotuloVisivel, className = "", centavos, aoMudar, anulavel = false }:
  Base & { centavos: number | null; aoMudar: (centavos: number | null) => void; anulavel?: boolean }) {
  const [texto, setTexto] = useState(() => centavosParaEntrada(centavos));
  const [ultimo, setUltimo] = useState(centavos);
  const [invalido, setInvalido] = useState(false);
  if (centavos !== ultimo) {
    // O valor mudou por fora (importação, outra linha): mostra o novo.
    setUltimo(centavos);
    setTexto(centavosParaEntrada(centavos));
    setInvalido(false);
  }
  return <label className={`block min-w-0 ${className}`}>
    <Rotulo rotulo={rotulo} visivel={rotuloVisivel} />
    <span className="flex items-baseline gap-1">
      <span aria-hidden="true" className="text-[12px] text-[var(--muted)]">R$</span>
      <input inputMode="decimal" value={texto} aria-invalid={invalido} placeholder={anulavel ? "—" : "0,00"} className={estilo.campo}
        onChange={evento => {
          const digitado = evento.target.value;
          setTexto(digitado);
          const lido = reaisParaCentavos(digitado);
          if (!lido.ok) { setInvalido(true); return; }
          const valor = lido.centavos ?? (anulavel ? null : 0);
          setInvalido(false);
          setUltimo(valor);
          aoMudar(valor);
        }}
        onBlur={() => { if (!invalido) setTexto(centavosParaEntrada(ultimo)); }} />
    </span>
    {invalido && <span className={estilo.aviso}>Use reais, ex.: 1.250,00</span>}
  </label>;
}

/** Aceita colar "-12.34, -45.67" (vírgula, ponto e vírgula ou espaço). */
export function CampoCoordenadas({ rotulo, rotuloVisivel, className = "", lat, lon, aoMudar }:
  Base & { lat: number | null; lon: number | null; aoMudar: (lat: number | null, lon: number | null) => void }) {
  const atual = formatarCoordenadas(lat, lon);
  const [texto, setTexto] = useState(atual);
  const [ultimo, setUltimo] = useState(atual);
  const [erro, setErro] = useState("");
  if (atual !== ultimo) {
    setUltimo(atual);
    setTexto(atual);
    setErro("");
  }
  return <label className={`block min-w-0 ${className}`}>
    <Rotulo rotulo={rotulo} visivel={rotuloVisivel} />
    <input value={texto} inputMode="decimal" placeholder="-12.34, -45.67" aria-invalid={erro !== ""} className={estilo.campo}
      onChange={evento => {
        const digitado = evento.target.value;
        setTexto(digitado);
        const lido = parseCoordenadas(digitado);
        if (!lido.ok) { setErro(lido.erro); return; }
        setErro("");
        setUltimo(formatarCoordenadas(lido.lat, lido.lon));
        aoMudar(lido.lat, lido.lon);
      }}
      onBlur={() => { if (!erro) setTexto(ultimo); }} />
    {erro && <span className={estilo.aviso}>{erro}</span>}
  </label>;
}

export function BotaoIcone({ rotulo, aoClicar, desativado, children }: { rotulo: string; aoClicar: () => void; desativado?: boolean; children: ReactNode }) {
  return <button type="button" className={estilo.icone} aria-label={rotulo} title={rotulo} disabled={desativado} onClick={aoClicar}>{children}</button>;
}

export function Adicionar({ aoClicar, children }: { aoClicar: () => void; children: ReactNode }) {
  return <button type="button" className={estilo.acao} onClick={aoClicar}><span aria-hidden="true">+</span> {children}</button>;
}

export function Bloco({ id, numero, titulo, descricao, children }: { id: string; numero: string; titulo: string; descricao?: string; children: ReactNode }) {
  return <section id={id} aria-labelledby={`${id}-titulo`} className="mt-14 scroll-mt-28">
    <header className="mb-5 border-b border-[var(--sand-2)] pb-3">
      <p className="eyebrow">{numero}</p>
      <h2 id={`${id}-titulo`} className="mt-1 text-[clamp(30px,5vw,44px)]">{titulo}</h2>
      {descricao && <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[var(--muted)]">{descricao}</p>}
    </header>
    {children}
  </section>;
}

/** Botões ↑ ↓ ✕ de uma linha da lista. */
export function AcoesDaLinha({ nome, indice, total, aoMover, aoRemover }: { nome: string; indice: number; total: number; aoMover?: (delta: number) => void; aoRemover: () => void }) {
  return <span className="flex shrink-0 items-center">
    {aoMover && <BotaoIcone rotulo={`Subir ${nome}`} desativado={indice === 0} aoClicar={() => aoMover(-1)}>↑</BotaoIcone>}
    {aoMover && <BotaoIcone rotulo={`Descer ${nome}`} desativado={indice === total - 1} aoClicar={() => aoMover(1)}>↓</BotaoIcone>}
    <BotaoIcone rotulo={`Remover ${nome}`} aoClicar={aoRemover}>✕</BotaoIcone>
  </span>;
}
