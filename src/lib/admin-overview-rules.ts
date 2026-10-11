import type { Gift } from "./types";

export type OverviewClaim = { gift_id: string; status: string; amount_cents: number | null; shares: number | null; name: string };
export type OverviewRow = {
  id: string; title: string; type: Gift["type"]; category: string; hidden: boolean;
  target: number | null; received: number; pending: number; review: number; waiting: number;
  available: number | null; totalShares: number | null; takenShares: number; names: string[];
  reserved: boolean; complete: boolean; percent: number | null;
};
const active = new Set(["RESERVADO", "AGUARDANDO_PAGAMENTO", "EM_ANALISE", "PAGO", "RECEBIDO"]);
const pending = new Set(["RESERVADO", "AGUARDANDO_PAGAMENTO", "EM_ANALISE"]);
const cents = (value: number | null) => Number.isSafeInteger(value) && value! > 0 ? value! : 0;
export const percentOf = (value: number, total: number): number | null => total > 0 ? Math.min(100, Math.max(0, Math.round(value / total * 1000) / 10)) : null;

export function buildOverview(gifts: Gift[], claims: OverviewClaim[]) {
  const groups = new Map<string, OverviewClaim[]>();
  for (const claim of claims) {
    const group = groups.get(claim.gift_id) ?? [];
    group.push(claim); groups.set(claim.gift_id, group);
  }
  const rows: OverviewRow[] = gifts.map(gift => {
    const records = groups.get(gift.id) ?? [];
    const valid = records.filter(claim => active.has(claim.status));
    const linkReceived = gift.type === "LINK" && (gift.status === "CONCLUIDO" || valid.some(claim => claim.status === "RECEBIDO"));
    const linkReserved = linkReceived || gift.status === "RESERVADO" || valid.some(claim => claim.status === "RESERVADO");
    const target = gift.type === "LINK" ? cents(gift.price_cents) || null : gift.type === "COTAS" ? cents(gift.total_shares) * cents(gift.share_cents) || null : null;
    const sum = (statuses: Set<string>) => records.reduce((total, claim) => total + (statuses.has(claim.status) ? cents(claim.amount_cents) : 0), 0);
    const received = gift.type === "LINK" ? linkReceived ? target ?? 0 : 0 : sum(new Set(["PAGO"]));
    const promised = gift.type === "LINK" ? linkReserved && !linkReceived ? target ?? 0 : 0 : sum(pending);
    const totalShares = gift.type === "COTAS" ? gift.total_shares ?? 0 : null;
    const takenShares = gift.type === "COTAS" ? Math.max(0, Math.min(totalShares!, gift.shares_taken)) : 0;
    const available = gift.type === "COTAS" ? Math.max(0, totalShares! - takenShares) : gift.type === "LINK" ? linkReserved ? 0 : 1 : null;
    return { id: gift.id, title: gift.title, type: gift.type, category: gift.category ?? "Sem categoria", hidden: gift.status === "OCULTO",
      target, received, pending: promised, review: sum(new Set(["EM_ANALISE"])), waiting: sum(new Set(["AGUARDANDO_PAGAMENTO"])),
      available, totalShares, takenShares, names: [...new Set(valid.map(claim => claim.name).filter(Boolean))],
      reserved: gift.type === "LINK" ? linkReserved : valid.length > 0 || takenShares > 0,
      complete: gift.type === "LINK" ? linkReceived : gift.type === "COTAS" && target !== null && received >= target,
      percent: target ? percentOf(received, target) : null };
  });
  const visible = rows.filter(row => !row.hidden);
  const finite = visible.filter(row => row.target !== null);
  const target = finite.reduce((sum, row) => sum + row.target!, 0);
  const received = finite.reduce((sum, row) => sum + Math.min(row.target!, row.received), 0);
  const reserved = finite.reduce((sum, row) => sum + Math.min(row.target!, row.received + row.pending), 0);
  return { rows, target, received, reserved, receivedPercent: percentOf(received, target), reservedPercent: percentOf(reserved, target),
    missing: Math.max(0, target - received), unreserved: Math.max(0, target - reserved),
    pixReceived: claims.reduce((sum, claim) => sum + (claim.status === "PAGO" ? cents(claim.amount_cents) : 0), 0),
    pixReview: claims.reduce((sum, claim) => sum + (claim.status === "EM_ANALISE" ? cents(claim.amount_cents) : 0), 0),
    pixWaiting: claims.reduce((sum, claim) => sum + (claim.status === "AGUARDANDO_PAGAMENTO" ? cents(claim.amount_cents) : 0), 0),
    reviewCount: claims.filter(claim => claim.status === "EM_ANALISE").length,
    linkReceived: rows.filter(row => row.type === "LINK").reduce((sum, row) => sum + row.received, 0),
    visibleCount: visible.length, completeCount: visible.filter(row => row.complete).length,
    reservedCount: visible.filter(row => row.reserved).length, availableCount: visible.filter(row => row.available !== null && row.available > 0).length,
    unknownPriceCount: visible.filter(row => row.type !== "LIVRE" && row.target === null).length };
}
export type OverviewFilters = { q: string; state: string; type: string; category: string; sort: string };
export function filterOverview(rows: OverviewRow[], filters: OverviewFilters) {
  const q = filters.q.trim().toLocaleLowerCase("pt-BR");
  const result = rows.filter(row => (!q || `${row.title} ${row.names.join(" ")}`.toLocaleLowerCase("pt-BR").includes(q))
    && (filters.type === "ALL" || row.type === filters.type) && (filters.category === "ALL" || row.category === filters.category)
    && (filters.state === "HIDDEN" ? row.hidden : !row.hidden && (filters.state === "ALL"
      || filters.state === "RESERVED" && row.reserved || filters.state === "AVAILABLE" && row.available !== null && row.available > 0
      || filters.state === "COMPLETE" && row.complete || filters.state === "REVIEW" && row.review > 0
      || filters.state === "MISSING" && row.target !== null && row.received < row.target)));
  if (filters.sort === "MISSING") result.sort((a,b) => Math.max(0,(b.target ?? 0)-b.received)-Math.max(0,(a.target ?? 0)-a.received));
  else if (filters.sort === "RECEIVED") result.sort((a,b) => b.received-a.received);
  else if (filters.sort === "TITLE") result.sort((a,b) => a.title.localeCompare(b.title,"pt-BR"));
  return result;
}
