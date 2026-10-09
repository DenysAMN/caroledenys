"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { GALLERY_BUCKET } from "@/lib/gallery";
import { galleryError, parsePhotoFields, validOrder, validRevision } from "@/lib/gallery-rules";
import { isUuid } from "@/lib/guest-area-rules";
import { optimizeGalleryImage } from "@/lib/gallery-image";

export type GalleryResult = { ok: boolean; message: string; revision?: number };
async function mutate(action: string, payload: Record<string, unknown>, revision: number): Promise<GalleryResult> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("admin_mutate_gallery", { p_action: action, p_payload: payload, p_revision: revision });
  if (error) return { ok: false, message: galleryError(error) };
  let message = "Galeria atualizada.";
  if (data.removed_path) {
    const { error: storageError } = await admin.storage.from(GALLERY_BUCKET).remove([data.removed_path]);
    if (storageError) { console.error("gallery cleanup:", storageError.message); message = "Alteração salva. Um arquivo antigo ficou pendente de limpeza no armazenamento."; }
  }
  for (const path of ["/", "/nos", "/galeria", "/admin/galeria"]) revalidatePath(path);
  return { ok: true, message, revision: data.revision };
}
export async function saveGalleryPhoto(id: string | null, form: FormData, revision: number): Promise<GalleryResult> {
  await requireAdmin();
  if ((id !== null && !isUuid(id)) || !validRevision(revision)) return { ok: false, message: "Foto inválida. Atualize a página." };
  const fields = parsePhotoFields(form);
  if (!fields) return { ok: false, message: "Informe uma descrição de 2 a 240 caracteres e um local válido." };
  const photoId = id ?? randomUUID();
  const file = form.get("image");
  const image = file instanceof File && file.size > 0 ? file : null;
  if (!id && !image) return { ok: false, message: "Escolha a foto que deseja enviar." };
  let uploadPath: string | null = null;
  const payload: Record<string, unknown> = { id: photoId, ...fields };
  if (image) {
    let optimized;
    try { optimized = await optimizeGalleryImage(image); }
    catch { return { ok: false, message: "Não foi possível ler a foto. Use JPG, PNG ou WebP de até 4 MB após compressão, com pelo menos 100 pixels de cada lado." }; }
    const admin = createAdminClient();
    uploadPath = `${photoId}/${randomUUID()}.webp`;
    const { error } = await admin.storage.from(GALLERY_BUCKET).upload(uploadPath, optimized.data, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
    if (error) return { ok: false, message: "Não foi possível enviar a foto. Confira se a atualização da galeria foi aplicada no banco." };
    const { data } = admin.storage.from(GALLERY_BUCKET).getPublicUrl(uploadPath);
    Object.assign(payload, { src: data.publicUrl, storage_path: uploadPath, width: optimized.width, height: optimized.height });
  }
  const result = await mutate("SAVE", payload, revision);
  if (!result.ok && uploadPath) {
    const { error } = await createAdminClient().storage.from(GALLERY_BUCKET).remove([uploadPath]);
    if (error) console.error("gallery rollback cleanup:", error.message);
  }
  return result;
}
export async function deleteGalleryPhoto(id: string, revision: number): Promise<GalleryResult> {
  await requireAdmin();
  if (!isUuid(id) || !validRevision(revision)) return { ok: false, message: "Foto inválida." };
  return mutate("DELETE", { id }, revision);
}
export async function reorderGalleryPhotos(ids: string[], revision: number): Promise<GalleryResult> {
  await requireAdmin();
  if (!validOrder(ids) || !validRevision(revision)) return { ok: false, message: "Ordem inválida." };
  return mutate("ORDER", { ids }, revision);
}
export async function setGalleryHomeLimit(limit: number, revision: number): Promise<GalleryResult> {
  await requireAdmin();
  if (!Number.isInteger(limit) || limit < 0 || limit > 12 || !validRevision(revision)) return { ok: false, message: "Escolha de 0 a 12 fotos para a home." };
  return mutate("SETTINGS", { home_limit: limit }, revision);
}
