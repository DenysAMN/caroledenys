"use client";

import { useEffect, useRef, useState } from "react";
import { parsePlanoJson, type Plano } from "../../lib/honeymoon-plan";
import { estilo } from "./campos";

/** Copia o plano em JSON; se o navegador não deixar, mostra o texto já selecionado. */
export function Exportar({ plano, rotulo = "Exportar" }: { plano: Plano; rotulo?: string }) {
  const [texto, setTexto] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const [selecionar, setSelecionar] = useState(0);
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (selecionar === 0) return;
    area.current?.focus();
    area.current?.select();
  }, [selecionar]);
  async function exportar() {
    const json = JSON.stringify(plano, null, 2);
    setTexto(json);
    try {
      await navigator.clipboard.writeText(json);
      setAviso("JSON copiado para a área de transferência.");
    } catch {
      setAviso("O navegador não deixou copiar sozinho. O texto abaixo está selecionado: use Ctrl+C (no celular, toque e segure → Copiar).");
      setSelecionar(vez => vez + 1);
    }
  }
  return <div className="min-w-0">
    <button type="button" className="btn btn-ghost" onClick={exportar}>{rotulo}</button>
    <p className="mt-2 text-[13px] text-[var(--ink-soft)]" aria-live="polite">{aviso}</p>
    {texto !== null && <label className="mt-2 block">
      <span className="sr-only">Plano em JSON</span>
      <textarea ref={area} readOnly value={texto} rows={8} onFocus={evento => evento.currentTarget.select()}
        className="block w-full border border-[var(--sand-2)] bg-[var(--ivory)] p-3 font-mono text-[12px]" />
    </label>}
  </div>;
}

/** Valida o JSON colado e troca o conteúdo da tela; só grava quando clicarem em Salvar. */
export function Importar({ temConteudo, aoImportar, inicial = "" }: { temConteudo: boolean; aoImportar: (plano: Plano) => void; inicial?: string }) {
  const [texto, setTexto] = useState(inicial);
  const [erros, setErros] = useState<string[]>([]);
  const [aviso, setAviso] = useState("");
  function carregar() {
    const lido = parsePlanoJson(texto);
    if (!lido.ok) { setErros(lido.erros); setAviso(""); return; }
    if (temConteudo && !window.confirm("Substituir todo o conteúdo da tela pelo JSON colado? Nada é gravado até você clicar em Salvar.")) return;
    aoImportar(lido.plano);
    setErros([]);
    setTexto("");
    setAviso("Conteúdo carregado na tela. Confira e clique em Salvar para gravar.");
  }
  return <div className="min-w-0">
    <label className="block">
      <span className={estilo.rotulo}>Cole aqui o JSON do plano</span>
      <textarea value={texto} rows={6} spellCheck={false} placeholder='{ "versao": 1, "titulo": "…" }' onChange={evento => setTexto(evento.target.value)}
        className="mt-1 block w-full border border-[var(--sand-2)] bg-[var(--paper)] p-3 font-mono text-[12px]" />
    </label>
    <button type="button" className="btn mt-3" disabled={texto.trim() === ""} onClick={carregar}>Validar e carregar na tela</button>
    {erros.length > 0 && <div role="alert" className="mt-3 border border-[#E7C9C4] bg-[#F6E9E6] p-3 text-[13px] text-[var(--marsala-deep)]">
      <p className="font-medium">O JSON não foi carregado:</p>
      <ul className="mt-1 list-disc space-y-1 pl-5">{erros.map((erro, indice) => <li key={indice}>{erro}</li>)}</ul>
    </div>}
    <p className="mt-2 text-[13px] text-[var(--forest)]" aria-live="polite">{aviso}</p>
  </div>;
}
