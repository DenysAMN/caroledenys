"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { verifyClaimAccess } from "@/lib/claim-access";
import {
  buildReceiptPath,
  isAcceptedReceipt,
  isClaimPayable,
  isReceiptPathForClaim,
  RECEIPT_BUCKET,
  validateReceiptMetadata,
} from "@/lib/receipt-validation";

type ReceiptError =
  | "DADOS_INVALIDOS"
  | "NAO_AUTORIZADO"
  | "RESERVA_EXPIRADA"
  | "ARQUIVO_INVALIDO"
  | "ERRO";

export type PrepareReceiptResult =
  | { ok: true; path: string; uploadToken: string | null }
  | { ok: false; error: ReceiptError };

export type FinishReceiptResult =
  | { ok: true }
  | { ok: false; error: ReceiptError };

type OwnedClaim = {
  id: string;
  guest_id: string;
  status: string;
  expires_at: string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getOwnedClaim(
  claimId: string,
  claimAccessToken: string
): Promise<OwnedClaim | null> {
  if (!UUID_PATTERN.test(claimId) || !/^[A-Za-z0-9_-]{43}$/.test(claimAccessToken)) {
    return null;
  }

  const admin = createAdminClient();
  const { data: claim } = await admin
    .from("claims")
    .select("id, guest_id, status, expires_at")
    .eq("id", claimId)
    .maybeSingle();

  if (!claim || !verifyClaimAccess(claim.id, claim.guest_id, claimAccessToken)) {
    return null;
  }
  return claim as OwnedClaim;
}

export async function prepararUploadComprovante(input: {
  claimId: string;
  claimAccessToken: string;
  payerName: string;
  mimeType: string;
  size: number;
}): Promise<PrepareReceiptResult> {
  const metadata = validateReceiptMetadata(input);
  if (!metadata.ok) {
    return {
      ok: false,
      error:
        metadata.error === "PAYER_NAME_INVALID"
          ? "DADOS_INVALIDOS"
          : "ARQUIVO_INVALIDO",
    };
  }

  const claim = await getOwnedClaim(input.claimId, input.claimAccessToken);
  if (!claim) return { ok: false, error: "NAO_AUTORIZADO" };
  if (!isClaimPayable(claim.status, claim.expires_at)) {
    return { ok: false, error: "RESERVA_EXPIRADA" };
  }

  const path = buildReceiptPath(claim.id);
  const admin = createAdminClient();
  const receipt = admin.storage.from(RECEIPT_BUCKET);
  const { data: exists, error: existsError } = await receipt.exists(path);
  if (existsError) {
    console.error("receipt exists:", existsError.message);
    return { ok: false, error: "ERRO" };
  }
  if (exists) return { ok: true, path, uploadToken: null };

  const { data, error } = await receipt.createSignedUploadUrl(path);

  if (error || !data) {
    console.error("createSignedUploadUrl:", error?.message);
    return { ok: false, error: "ERRO" };
  }

  return { ok: true, path: data.path, uploadToken: data.token };
}

export async function finalizarComprovante(input: {
  claimId: string;
  claimAccessToken: string;
  payerName: string;
  path: string;
}): Promise<FinishReceiptResult> {
  if (!isReceiptPathForClaim(input.path, input.claimId)) {
    return { ok: false, error: "DADOS_INVALIDOS" };
  }

  const claim = await getOwnedClaim(input.claimId, input.claimAccessToken);
  if (!claim) return { ok: false, error: "NAO_AUTORIZADO" };
  if (!isClaimPayable(claim.status, claim.expires_at)) {
    return { ok: false, error: "RESERVA_EXPIRADA" };
  }

  const admin = createAdminClient();
  const receipt = admin.storage.from(RECEIPT_BUCKET);
  const { data: fileInfo, error: fileError } = await receipt.info(input.path);
  if (fileError || !fileInfo) {
    return { ok: false, error: "ARQUIVO_INVALIDO" };
  }

  const metadata = validateReceiptMetadata({
    payerName: input.payerName,
    mimeType: fileInfo.contentType ?? "",
    size: fileInfo.size ?? 0,
  });
  if (!metadata.ok) {
    await receipt.remove([input.path]);
    return {
      ok: false,
      error:
        metadata.error === "PAYER_NAME_INVALID"
          ? "DADOS_INVALIDOS"
          : "ARQUIVO_INVALIDO",
    };
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await admin
    .from("claims")
    .update({
      payer_name: metadata.payerName,
      receipt_url: input.path,
      status: "EM_ANALISE",
    })
    .eq("id", claim.id)
    .eq("guest_id", claim.guest_id)
    .eq("status", "AGUARDANDO_PAGAMENTO")
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("finalizarComprovante:", error.message);
    return { ok: false, error: "ERRO" };
  }

  if (!updated) {
    const { data: current } = await admin
      .from("claims")
      .select("status, receipt_url")
      .eq("id", claim.id)
      .maybeSingle();

    if (
      current &&
      isAcceptedReceipt(current.status, current.receipt_url, input.path)
    ) {
      revalidatePath(`/pagamento/${claim.id}`);
      return { ok: true };
    }

    if (current) await receipt.remove([input.path]);
    return { ok: false, error: "RESERVA_EXPIRADA" };
  }

  revalidatePath(`/pagamento/${claim.id}`);
  return { ok: true };
}
