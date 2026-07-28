"use server";

import { signClaimAccess } from "@/lib/claim-access";
import { isUuid } from "@/lib/guest-area-rules";
import { createAdminClient } from "@/lib/supabaseAdmin";
import type { GiftType } from "@/lib/types";

export type MyGiftClaim = {
  id: string;
  status: string;
  shares: number | null;
  amountCents: number | null;
  createdAt: string;
  expiresAt: string | null;
  accessToken: string;
  gift: {
    title: string;
    type: GiftType;
    imageUrl: string | null;
    externalUrl: string | null;
  };
};

export type MyGiftsResult =
  | { ok: true; guestName: string; claims: MyGiftClaim[] }
  | { ok: false; error: "SEM_IDENTIFICACAO" | "NAO_ENCONTRADO" | "ERRO" };

type ClaimRow = {
  id: string;
  status: string;
  shares: number | null;
  amount_cents: number | null;
  created_at: string;
  expires_at: string | null;
  gifts:
    | {
        title: string;
        type: GiftType;
        image_url: string | null;
        external_url: string | null;
      }
    | {
        title: string;
        type: GiftType;
        image_url: string | null;
        external_url: string | null;
      }[]
    | null;
};

export async function getMyGifts(token: unknown): Promise<MyGiftsResult> {
  if (!isUuid(token)) return { ok: false, error: "SEM_IDENTIFICACAO" };

  const admin = createAdminClient();
  const { data: guest, error: guestError } = await admin
    .from("guests")
    .select("id, name")
    .eq("token", token.trim().toLowerCase())
    .maybeSingle();

  if (guestError) {
    console.error("my gifts guest:", guestError.message);
    return { ok: false, error: "ERRO" };
  }
  if (!guest) return { ok: false, error: "NAO_ENCONTRADO" };

  const { data, error } = await admin
    .from("claims")
    .select(
      "id, status, shares, amount_cents, created_at, expires_at, gifts(title, type, image_url, external_url)"
    )
    .eq("guest_id", guest.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("my gifts claims:", error.message);
    return { ok: false, error: "ERRO" };
  }

  const claims = ((data ?? []) as ClaimRow[]).flatMap((row) => {
    const gift = Array.isArray(row.gifts) ? row.gifts[0] : row.gifts;
    if (!gift) return [];
    return [
      {
        id: row.id,
        status: row.status,
        shares: row.shares,
        amountCents: row.amount_cents,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        accessToken: signClaimAccess(row.id, guest.id),
        gift: {
          title: gift.title,
          type: gift.type,
          imageUrl: gift.image_url,
          externalUrl: gift.external_url,
        },
      },
    ];
  });

  return { ok: true, guestName: guest.name, claims };
}
