import "server-only";
import { cache } from "react";
import { WEDDING_GALLERY, WEDDING_INSPIRATION } from "@/content/wedding-photos";
import { createPublicClient, supabaseConfigured } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabaseAdmin";
import type { GalleryPhoto, GallerySnapshot, GalleryPlacement } from "@/lib/gallery-rules";

export const GALLERY_BUCKET = "gallery-images";
const legacyMain = [
  { src: "/images/ensaio/principal-1.jpg", alt: "Carol e Denys juntos no campo durante o ensaio", placement: "COVER" },
  { src: "/images/ensaio/principal-3.jpg", alt: "Carol sorrindo para Denys durante o ensaio", placement: "STORY" },
  { src: "/images/ensaio/principal-2.jpg", alt: "Carol e Denys dançando juntos no campo", placement: "TRANSITION" },
];
export function legacyGallery(): GallerySnapshot {
  const photos = [...legacyMain.map(photo => ({ ...photo, width: 1365, height: 2048, orientation: "portrait" as const })),
    ...WEDDING_GALLERY.map(photo => ({ ...photo, placement: "GALLERY" })), ...WEDDING_INSPIRATION.map(photo => ({ ...photo, placement: "INSPIRATION" }))];
  return { photos: photos.map((photo, i) => ({ ...photo, id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, caption: photo.src.includes("foto-engracada") ? "Essa também somos nós." : "", placement: photo.placement as GalleryPlacement, published: true, sortOrder: i, storagePath: null })), homeLimit: 6, revision: 0, ready: false };
}
type PhotoRow = { id: string; src: string; alt: string; caption: string; width: number; height: number; placement: GalleryPlacement; published: boolean; sort_order: number; storage_path: string | null };
function mapRows(rows: PhotoRow[]): GalleryPhoto[] {
  return rows.map(row => ({ id: row.id, src: row.src, alt: row.alt, caption: row.caption, width: row.width, height: row.height,
    orientation: row.width > row.height ? "landscape" : "portrait", placement: row.placement, published: row.published, sortOrder: row.sort_order, storagePath: row.storage_path }));
}
export const getPublicGallery = cache(async (): Promise<GallerySnapshot> => {
  if (!supabaseConfigured) return legacyGallery();
  const { data, error } = await createPublicClient().rpc("public_gallery_snapshot");
  if (error) {
    if (["PGRST202", "PGRST205", "42P01"].includes(error.code)) return legacyGallery();
    console.error("gallery read:", error.code);
    // Uma falha transitória não deve republicar fotos que foram ocultadas.
    return { photos: [], homeLimit: 6, revision: 0, ready: false };
  }
  return { photos: mapRows(data.photos ?? []), homeLimit: data.home_limit, revision: data.revision, ready: true };
});
export async function getAdminGallery(): Promise<GallerySnapshot> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("admin_gallery_snapshot");
  if (error) {
    if (["PGRST202", "PGRST205", "42P01"].includes(error.code)) return legacyGallery();
    throw new Error("Não foi possível carregar a gestão de fotos.");
  }
  return { photos: mapRows(data.photos ?? []), homeLimit: data.home_limit, revision: data.revision, ready: true };
}
