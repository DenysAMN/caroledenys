"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { GIFT_IMAGE_BUCKET } from "@/lib/admin-gifts";
import {
  parseGiftForm,
  validateGiftImageMetadata,
} from "@/lib/gift-validation";
import { createAdminClient } from "@/lib/supabaseAdmin";

export type GiftActionState = { error: string | null };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function imageFrom(formData: FormData): File | null {
  const value = formData.get("image");
  return value instanceof File && value.size > 0 ? value : null;
}

async function uploadGiftImage(giftId: string, file: File) {
  const metadata = validateGiftImageMetadata(file.type, file.size);
  if (!metadata.ok) {
    return { ok: false as const, error: "Use uma imagem JPG, PNG ou WebP de até 4 MB." };
  }

  const admin = createAdminClient();
  const path = `${giftId}/${Date.now()}-${randomUUID()}.${metadata.extension}`;
  const { error } = await admin.storage.from(GIFT_IMAGE_BUCKET).upload(
    path,
    Buffer.from(await file.arrayBuffer()),
    { contentType: file.type, cacheControl: "31536000", upsert: false }
  );
  if (error) return { ok: false as const, error: "Não foi possível enviar a imagem." };

  const { data } = admin.storage.from(GIFT_IMAGE_BUCKET).getPublicUrl(path);
  return { ok: true as const, path, publicUrl: data.publicUrl };
}

function storagePath(publicUrl: string | null): string | null {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${GIFT_IMAGE_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  return index >= 0 ? decodeURIComponent(publicUrl.slice(index + marker.length)) : null;
}

function revalidateCatalog(id?: string) {
  revalidatePath("/");
  revalidatePath("/presentes");
  revalidatePath("/admin");
  revalidatePath("/admin/presentes");
  if (id) revalidatePath(`/presentes/${id}`);
}

export async function criarPresente(
  _previousState: GiftActionState,
  formData: FormData
): Promise<GiftActionState> {
  await requireAdmin();
  const parsed = parseGiftForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const admin = createAdminClient();
  const { data: created, error } = await admin
    .from("gifts")
    .insert(parsed.gift)
    .select("id")
    .single();
  if (error || !created) return { error: error?.message ?? "Não foi possível criar." };

  const image = imageFrom(formData);
  if (image) {
    const uploaded = await uploadGiftImage(created.id, image);
    if (!uploaded.ok) {
      await admin.from("gifts").delete().eq("id", created.id);
      return { error: uploaded.error };
    }
    const { error: imageError } = await admin
      .from("gifts")
      .update({ image_url: uploaded.publicUrl })
      .eq("id", created.id);
    if (imageError) {
      await admin.storage.from(GIFT_IMAGE_BUCKET).remove([uploaded.path]);
      await admin.from("gifts").delete().eq("id", created.id);
      return { error: "Não foi possível salvar a imagem." };
    }
  }

  revalidateCatalog(created.id);
  redirect("/admin/presentes");
}

export async function editarPresente(
  giftId: string,
  _previousState: GiftActionState,
  formData: FormData
): Promise<GiftActionState> {
  await requireAdmin();
  if (!UUID_PATTERN.test(giftId)) return { error: "Presente inválido." };
  const parsed = parseGiftForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("gifts")
    .select("image_url")
    .eq("id", giftId)
    .maybeSingle();
  if (!current) return { error: "Presente não encontrado." };

  const image = imageFrom(formData);
  const uploaded = image ? await uploadGiftImage(giftId, image) : null;
  if (uploaded && !uploaded.ok) return { error: uploaded.error };

  const payload = uploaded?.ok
    ? { ...parsed.gift, image_url: uploaded.publicUrl }
    : parsed.gift;
  const { error } = await admin.from("gifts").update(payload).eq("id", giftId);
  if (error) {
    if (uploaded?.ok) {
      await admin.storage.from(GIFT_IMAGE_BUCKET).remove([uploaded.path]);
    }
    return { error: error.message };
  }

  if (uploaded?.ok) {
    const oldPath = storagePath(current.image_url);
    if (oldPath) await admin.storage.from(GIFT_IMAGE_BUCKET).remove([oldPath]);
  }

  revalidateCatalog(giftId);
  redirect("/admin/presentes");
}

export async function excluirPresente(giftId: string) {
  await requireAdmin();
  if (!UUID_PATTERN.test(giftId)) return { ok: false, message: "Presente inválido." };

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("gifts")
    .select("image_url")
    .eq("id", giftId)
    .maybeSingle();
  const { error } = await admin.from("gifts").delete().eq("id", giftId);
  if (error) return { ok: false, message: error.message };

  const oldPath = storagePath(current?.image_url ?? null);
  if (oldPath) await admin.storage.from(GIFT_IMAGE_BUCKET).remove([oldPath]);
  revalidateCatalog(giftId);
  return { ok: true, message: "Presente excluído." };
}
