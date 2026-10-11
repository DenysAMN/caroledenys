import type { Gift } from "./types";
type AvailabilityGift = Pick<Gift,"type" | "status" | "shares_taken" | "total_shares">;
export function giftAvailable(gift: AvailabilityGift) {
  if (gift.status === "OCULTO") return false;
  if (gift.type === "LIVRE") return true;
  if (gift.type === "LINK") return gift.status === "DISPONIVEL";
  return gift.status !== "CONCLUIDO" && gift.shares_taken < (gift.total_shares ?? 0);
}
export function giftHasReservation(gift: AvailabilityGift) {
  return gift.status !== "OCULTO" && (gift.status === "RESERVADO" || gift.status === "CONCLUIDO" || gift.type === "COTAS" && gift.shares_taken > 0);
}
export function giftSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}
export type AdminCatalogGift = Pick<Gift,"id" | "title" | "image_url" | "type" | "status" | "category" | "sort_order" | "price_cents" | "min_cents" | "shares_taken" | "total_shares"> & {
  reservedBy: string[]; paidShares: number; hasReceived: boolean; hasReservations: boolean; hasPending: boolean;
};
export const ADMIN_GIFT_FILTERS = [["ALL","Todos"],["AVAILABLE","Disponíveis"],["RESERVED","Reservados"],["RECEIVED","Recebidos"],["HIDDEN","Ocultos"]] as const;
export type AdminGiftFilter = typeof ADMIN_GIFT_FILTERS[number][0];
export function adminGiftReceived(gift: AdminCatalogGift) {
  if (gift.type === "COTAS") return (gift.total_shares ?? 0) > 0 && gift.paidShares >= gift.total_shares!;
  return gift.hasReceived || gift.type === "LINK" && gift.status === "CONCLUIDO";
}
export function adminGiftMatches(gift: AdminCatalogGift, filter: AdminGiftFilter) {
  if (filter === "ALL") return true;
  if (filter === "HIDDEN") return gift.status === "OCULTO";
  if (gift.status === "OCULTO") return false;
  if (filter === "AVAILABLE") return giftAvailable(gift);
  if (filter === "RECEIVED") return adminGiftReceived(gift);
  return gift.hasPending || !adminGiftReceived(gift) && (gift.hasReservations || giftHasReservation(gift));
}
export function filterAdminCatalog(gifts: AdminCatalogGift[], filter: AdminGiftFilter, q: string, type = "ALL", category = "ALL") {
  const query = giftSearch(q.trim());
  return gifts.filter(gift => adminGiftMatches(gift,filter) && (type === "ALL" || gift.type === type) && (category === "ALL" || (gift.category ?? "Sem categoria") === category)
    && (!query || giftSearch(`${gift.title} ${gift.reservedBy.join(" ")}`).includes(query)));
}
