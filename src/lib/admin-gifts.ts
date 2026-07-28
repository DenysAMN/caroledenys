import "server-only";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabaseAdmin";
import type { Gift } from "@/lib/types";

export const GIFT_IMAGE_BUCKET = "gift-images";

export async function getAdminGifts(): Promise<Gift[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("gifts")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`Presentes: ${error.message}`);
  return (data ?? []) as Gift[];
}

export async function getAdminGift(id: string): Promise<Gift | null> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("gifts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Presente: ${error.message}`);
  return (data as Gift | null) ?? null;
}
