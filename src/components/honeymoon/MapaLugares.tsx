// Mapa desenhado na própria página (SVG), sem bibliotecas nem imagens externas.
import { COR_TIPO, ROTULO_TIPO, TELA_MAPA, TIPOS_LUGAR, enquadrarMapa, formatarKm, type Lugar } from "../../lib/honeymoon-plan";

const TINTA = "#2A2320";
const FUNDO = "#F7F1E6";
const GRANADA = "#7A1E33";

export default function MapaLugares({ lugares }: { lugares: Lugar[] }) {
  const quadro = enquadrarMapa(lugares, TELA_MAPA);
  const { largura, altura } = TELA_MAPA;
  if (!quadro.referencia) {
    return <p className="border border-dashed border-[var(--sand-2)] p-5 text-[14px] leading-relaxed text-[var(--muted)]">
      Nenhum lugar com coordenadas ainda. Cole as coordenadas de cada lugar na tabela abaixo (ex.: -12.34, -45.67) e o mapa aparece aqui.
    </p>;
  }
  const tipos = TIPOS_LUGAR.filter(tipo => quadro.pontos.some(ponto => ponto.lugar.tipo === tipo));
  const { anel, escala } = quadro;
  return <div>
    <svg viewBox={`0 0 ${largura} ${altura}`} role="img" aria-labelledby="mapa-lugares-titulo" className="block h-auto w-full border border-[var(--sand-2)]" style={{ background: FUNDO }}>
      <title id="mapa-lugares-titulo">{`Mapa com ${quadro.pontos.length} lugar(es); ${quadro.longe.length} longe demais para aparecer`}</title>
      <defs>
        <pattern id="mapa-lugares-grade" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E8DCC7" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={largura} height={altura} fill="url(#mapa-lugares-grade)" />
      {anel && <g data-anel="10km">
        <circle cx={anel.x} cy={anel.y} r={anel.raio} fill={GRANADA} fillOpacity="0.04" stroke={GRANADA} strokeOpacity="0.55" strokeDasharray="6 6" />
        <text x={anel.x} y={anel.y - anel.raio - 6} textAnchor="middle" fontSize="12" fill={GRANADA}>10 km do hotel</text>
      </g>}
      {quadro.pontos.map(ponto => {
        const aDireita = ponto.x < largura * 0.7;
        return <g key={ponto.lugar.id} data-pino={ponto.numero}>
          <circle cx={ponto.x} cy={ponto.y} r="12" fill={COR_TIPO[ponto.lugar.tipo]} stroke="#fff" strokeWidth="2" />
          <text x={ponto.x} y={ponto.y + 4} textAnchor="middle" fontSize="12" fontWeight="600" fill="#fff">{String(ponto.numero)}</text>
          <text x={aDireita ? ponto.x + 17 : ponto.x - 17} y={ponto.y + 4} textAnchor={aDireita ? "start" : "end"} fontSize="13" fill={TINTA}
            stroke={FUNDO} strokeWidth="4" strokeLinejoin="round" paintOrder="stroke">{ponto.lugar.nome.trim() || "Sem nome"}</text>
        </g>;
      })}
      {escala && <g transform={`translate(20 ${altura - 22})`}>
        <path d={`M0 -6 V0 H${escala.px} V-6`} fill="none" stroke={TINTA} strokeWidth="2" />
        <text x={escala.px / 2} y="-10" textAnchor="middle" fontSize="12" fill={TINTA}>{`${escala.km} km`}</text>
      </g>}
      <g transform={`translate(${largura - 28} 26)`}>
        <path d="M0 -14 L8 8 L0 3 L-8 8 Z" fill="#532337" />
        <text y="24" textAnchor="middle" fontSize="12" fontWeight="600" fill={TINTA}>N</text>
      </g>
    </svg>
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--ink-soft)]" aria-label="Legenda">
      {tipos.map(tipo => <li key={tipo} className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="inline-block size-3 rounded-full" style={{ background: COR_TIPO[tipo] }} />{ROTULO_TIPO[tipo]}
      </li>)}
    </ul>
    {quadro.referencia.tipo === "centro" && <p className="mt-2 text-[12px] text-[var(--muted)]">Sem hotel com coordenadas: o mapa usa o centro dos lugares como referência.</p>}
    {quadro.longe.length > 0 && <div className="mt-4 border-l-2 border-[var(--gold)] pl-3">
      <h3 className="text-[22px]">Longe</h3>
      <p className="text-[12px] text-[var(--muted)]">{`Mais de 60 km do ${quadro.referencia.tipo === "hotel" ? "hotel" : "centro"}; ficam fora do mapa para não achatar o resto.`}</p>
      <ul className="mt-1 text-[14px]">
        {quadro.longe.map(item => <li key={item.lugar.id}>{`${item.numero}. ${item.lugar.nome.trim() || "Sem nome"} — ${formatarKm(item.distanciaKm)}`}</li>)}
      </ul>
    </div>}
    {quadro.semCoordenadas.length > 0 && <p className="mt-3 text-[12px] text-[var(--muted)]">
      {`Sem coordenadas: ${quadro.semCoordenadas.map(item => `${item.numero}. ${item.lugar.nome.trim() || "Sem nome"}`).join(" · ")}`}
    </p>}
  </div>;
}
