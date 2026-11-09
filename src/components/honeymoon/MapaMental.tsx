// Mapa mental só de leitura, derivado do plano a cada mudança.
import { mapaMental, type NoMapa, type Plano } from "../../lib/honeymoon-plan";

const CORES_RAMOS = ["#435525", "#7A1E33", "#C0A050", "#532337", "#2F5D7C"];

function Ramos({ nos }: { nos: NoMapa[] }) {
  return <ul className="mt-2 space-y-1.5 text-[14px] leading-snug">
    {nos.map((no, indice) => <li key={`${indice}-${no.rotulo}`} className="relative pl-4 before:absolute before:left-0 before:top-[0.6em] before:h-px before:w-2.5 before:bg-[var(--sand-2)]">
      {no.rotulo}
      {no.filhos.length > 0 && <div className="border-l border-[var(--sand-2)] pl-2"><Ramos nos={no.filhos} /></div>}
    </li>)}
  </ul>;
}

export default function MapaMental({ plano }: { plano: Plano }) {
  const raiz = mapaMental(plano);
  return <div className="border border-[var(--sand-2)] bg-[var(--paper)] p-4 sm:p-6">
    <p className="mx-auto w-fit max-w-full rounded-full bg-[var(--wine)] px-5 py-2 text-center font-serif text-[22px] leading-tight text-white">{raiz.rotulo}</p>
    <div className="mx-auto h-5 w-px bg-[var(--sand-2)]" aria-hidden="true" />
    <div className="grid gap-5 border-t border-[var(--sand-2)] pt-5 sm:grid-cols-2 xl:grid-cols-3">
      {raiz.filhos.map((ramo, indice) => <section key={ramo.rotulo} className="min-w-0 border-l-2 pl-3" style={{ borderColor: CORES_RAMOS[indice % CORES_RAMOS.length] }}>
        <h3 className="flex items-baseline justify-between gap-2 text-[22px]">{ramo.rotulo}<small className="font-sans text-[12px] text-[var(--muted)]">{String(ramo.filhos.length)}</small></h3>
        {ramo.filhos.length > 0 ? <Ramos nos={ramo.filhos} /> : <p className="mt-1 text-[13px] text-[var(--muted)]">Nada por aqui ainda.</p>}
      </section>)}
    </div>
  </div>;
}
