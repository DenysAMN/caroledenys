import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

if (!url || !anonKey || !secretKey || !adminEmail) {
  throw new Error("Variáveis do Supabase/Admin incompletas.");
}

const options = {
  auth: { autoRefreshToken: false, persistSession: false },
};
const admin = createClient(url, secretKey, options);
const anon = createClient(url, anonKey, options);
const marker = `S5-${randomUUID()}`;
const giftIds = [];
let guestId = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectData(result, context) {
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  return result.data;
}

try {
  const users = expectData(
    await admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    "listar usuários"
  );
  assert(
    users.users.some((user) => user.email?.toLowerCase() === adminEmail),
    `usuário admin ${adminEmail} não encontrado`
  );

  const bucket = expectData(
    await admin.storage.getBucket("gift-images"),
    "consultar bucket gift-images"
  );
  assert(bucket.public === true, "bucket gift-images não está público");
  assert(bucket.file_size_limit === 4_000_000, "limite do bucket não é 4 MB");

  const guest = expectData(
    await admin
      .from("guests")
      .insert({ name: marker })
      .select("id")
      .single(),
    "criar convidado temporário"
  );
  guestId = guest.id;

  const rejectedGift = expectData(
    await admin
      .from("gifts")
      .insert({
        title: `${marker}-rejeitar`,
        type: "COTAS",
        status: "CONCLUIDO",
        share_cents: 100,
        total_cents: 1000,
        total_shares: 10,
        shares_taken: 3,
      })
      .select("id")
      .single(),
    "criar presente para rejeição"
  );
  giftIds.push(rejectedGift.id);

  const rejectedClaim = expectData(
    await admin
      .from("claims")
      .insert({
        gift_id: rejectedGift.id,
        guest_id: guestId,
        status: "EM_ANALISE",
        shares: 3,
        amount_cents: 300,
        receipt_url: `${marker}/receipt.webp`,
      })
      .select("id")
      .single(),
    "criar contribuição para rejeição"
  );

  expectData(
    await admin.rpc("reject_payment", { p_claim_id: rejectedClaim.id }),
    "rejeitar pagamento"
  );

  const rejectedState = expectData(
    await admin
      .from("claims")
      .select("status, receipt_url, gifts(shares_taken, status)")
      .eq("id", rejectedClaim.id)
      .single(),
    "validar rejeição"
  );
  const rejectedGiftState = Array.isArray(rejectedState.gifts)
    ? rejectedState.gifts[0]
    : rejectedState.gifts;
  assert(rejectedState.status === "CANCELADO", "claim rejeitada não foi cancelada");
  assert(rejectedState.receipt_url === null, "comprovante rejeitado não foi desvinculado");
  assert(rejectedGiftState?.shares_taken === 0, "cotas rejeitadas não foram devolvidas");
  assert(rejectedGiftState?.status === "DISPONIVEL", "presente rejeitado não foi liberado");

  const confirmedGift = expectData(
    await admin
      .from("gifts")
      .insert({
        title: `${marker}-confirmar`,
        type: "LIVRE",
        status: "DISPONIVEL",
        min_cents: 100,
      })
      .select("id")
      .single(),
    "criar presente para confirmação"
  );
  giftIds.push(confirmedGift.id);

  const confirmedClaim = expectData(
    await admin
      .from("claims")
      .insert({
        gift_id: confirmedGift.id,
        guest_id: guestId,
        status: "EM_ANALISE",
        amount_cents: 250,
      })
      .select("id")
      .single(),
    "criar contribuição para confirmação"
  );

  expectData(
    await admin.rpc("confirm_payment", { p_claim_id: confirmedClaim.id }),
    "confirmar pagamento"
  );

  const confirmedState = expectData(
    await admin
      .from("claims")
      .select("status, paid_at")
      .eq("id", confirmedClaim.id)
      .single(),
    "validar confirmação"
  );
  assert(confirmedState.status === "PAGO", "claim confirmada não ficou PAGO");
  assert(Boolean(confirmedState.paid_at), "claim confirmada ficou sem paid_at");

  const anonymousCall = await anon.rpc("confirm_payment", {
    p_claim_id: confirmedClaim.id,
  });
  assert(Boolean(anonymousCall.error), "RPC administrativa está acessível anonimamente");

  console.log("S5_INTEGRATION_OK");
} finally {
  if (giftIds.length > 0) {
    await admin.from("gifts").delete().in("id", giftIds);
  }
  if (guestId) {
    await admin.from("guests").delete().eq("id", guestId);
  }
}
