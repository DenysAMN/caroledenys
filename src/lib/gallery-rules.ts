import type { WeddingPhoto } from "../content/wedding-photos";
import { isUuid } from "./guest-area-rules";

export const GALLERY_PLACEMENTS = ["GALLERY", "COVER", "STORY", "TRANSITION", "INSPIRATION"] as const;
export type GalleryPlacement = typeof GALLERY_PLACEMENTS[number];
export const PLACEMENT_LABELS: Record<GalleryPlacement, string> = {
  GALLERY: "Galeria de fotos", COVER: "Capa principal", STORY: "Nossa história", TRANSITION: "Transição antes da galeria", INSPIRATION: "Nossa inspiração",
};
export type GalleryPhoto = WeddingPhoto & { id: string; caption: string; placement: GalleryPlacement; published: boolean; sortOrder: number; storagePath: string | null };
export type GallerySnapshot = { photos: GalleryPhoto[]; homeLimit: number; revision: number; ready: boolean };

export function gallerySelection(snapshot: GallerySnapshot) {
  const photos = snapshot.photos.filter(photo => photo.published).sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  const gallery = photos.filter(photo => photo.placement === "GALLERY");
  return { gallery, home: gallery.slice(0, snapshot.homeLimit), inspiration: photos.filter(photo => photo.placement === "INSPIRATION"),
    cover: photos.find(photo => photo.placement === "COVER") ?? null, story: photos.find(photo => photo.placement === "STORY") ?? null, transition: photos.find(photo => photo.placement === "TRANSITION") ?? null };
}
export function parsePhotoFields(form: FormData) {
  const alt = typeof form.get("alt") === "string" ? (form.get("alt") as string).trim() : "";
  const caption = typeof form.get("caption") === "string" ? (form.get("caption") as string).trim() : "";
  const placement = form.get("placement");
  if (alt.length < 2 || alt.length > 240 || caption.length > 240 || !GALLERY_PLACEMENTS.includes(placement as GalleryPlacement)) return null;
  return { alt, caption, placement: placement as GalleryPlacement, published: form.get("published") === "on" };
}
export function validRevision(value: unknown): value is number { return Number.isSafeInteger(value) && (value as number) >= 0; }
export function validOrder(ids: unknown): ids is string[] {
  return Array.isArray(ids) && ids.length <= 500 && ids.every(isUuid) && new Set(ids).size === ids.length;
}
export function galleryError(error: { code?: string; message?: string }) {
  if (["PGRST202", "PGRST205", "42P01"].includes(error.code ?? "")) return "A gestão de fotos precisa da atualização do banco indicada no painel.";
  if (error.message?.includes("GALERIA_ALTERADA")) return "A galeria mudou em outra sessão. Atualize a página antes de tentar novamente.";
  if (error.message?.includes("LIMITE_FOTOS")) return "O limite desta galeria é de 500 fotos. Exclua uma foto antes de enviar outra.";
  return "Não foi possível salvar a galeria. Tente novamente.";
}
