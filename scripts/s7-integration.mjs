import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !secretKey) {
  throw new Error("Variáveis do Supabase incompletas.");
}

const options = {
  auth: { autoRefreshToken: false, persistSession: false },
};
const admin = createClient(url, secretKey, options);
const anon = createClient(url, anonKey, options);
const marker = `S7-${randomUUID()}`;
const rateKey = createHash("sha256").update(marker).digest("hex");
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
  const audit = expectData(
    await admin.rpc("s7_security_status"),
    "consultar auditoria S7"
  );
  assert(audit.cron_scheduled === true, "cron de expiração não está ativo");
  assert(audit.guests_rls === true, "RLS de guests está desligado");
  assert(audit.claims_rls === true, "RLS de claims está desligado");
  assert(audit.rate_limits_rls === true, "RLS do rate limit está desligado");
  assert(audit.guests_policies === 0, "guests ganhou policy pública");
  assert(audit.claims_policies === 0, "claims ganhou policy pública");
  assert(audit.rate_limits_policies === 0, "rate limit ganhou policy pública");
  assert(audit.anon_can_expire === false, "anon pode executar expiração");
  assert(audit.anon_can_rate_limit === false, "anon pode consumir rate limit");
  assert(audit.anon_can_reserve_link === false, "anon pode chamar reserve_link");
  assert(audit.anon_can_reserve_shares === false, "anon pode chamar reserve_shares");

  const attempts = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    attempts.push(
      expectData(
        await admin.rpc("consume_reservation_rate_limit", {
          p_key_hash: rateKey,
          p_limit: 5,
          p_window_seconds: 60,
        }),
        `consumir rate limit ${attempt + 1}`
      )
    );
  }
  assert(
    attempts.slice(0, 5).every((allowed) => allowed === true),
    "uma das cinco primeiras tentativas foi bloqueada"
  );
  assert(attempts[5] === false, "sexta tentativa não foi bloqueada");

  const guest = expectData(
    await admin
      .from("guests")
      .insert({ name: marker })
      .select("id, token")
      .single(),
    "criar convidado temporário"
  );
  guestId = guest.id;

  const availableGift = expectData(
    await admin
      .from("gifts")
      .insert({
        title: `${marker} disponível`,
        type: "COTAS",
        status: "CONCLUIDO",
        share_cents: 100,
        total_cents: 300,
        total_shares: 3,
        shares_taken: 3,
      })
      .select("id")
      .single(),
    "criar presente para expiração"
  );
  giftIds.push(availableGift.id);

  const hiddenGift = expectData(
    await admin
      .from("gifts")
      .insert({
        title: `${marker} oculto`,
        type: "COTAS",
        status: "OCULTO",
        share_cents: 100,
        total_cents: 100,
        total_shares: 1,
        shares_taken: 1,
      })
      .select("id")
      .single(),
    "criar presente oculto para expiração"
  );
  giftIds.push(hiddenGift.id);

  const expiresAt = new Date(Date.now() - 60_000).toISOString();
  const claim = expectData(
    await admin
      .from("claims")
      .insert({
        gift_id: availableGift.id,
        guest_id: guestId,
        status: "AGUARDANDO_PAGAMENTO",
        shares: 2,
        amount_cents: 200,
        message: `${marker} mensagem`,
        message_approved: true,
        expires_at: expiresAt,
      })
      .select("id")
      .single(),
    "criar claim vencido"
  );
  expectData(
    await admin.from("claims").insert({
      gift_id: hiddenGift.id,
      guest_id: guestId,
      status: "AGUARDANDO_PAGAMENTO",
      shares: 1,
      amount_cents: 100,
      expires_at: expiresAt,
    }),
    "criar claim vencido oculto"
  );

  expectData(await admin.rpc("expire_stale_claims"), "executar expiração");

  const expired = expectData(
    await admin
      .from("claims")
      .select("status, gifts(status, shares_taken)")
      .eq("id", claim.id)
      .single(),
    "validar claim expirada"
  );
  const expiredGift = Array.isArray(expired.gifts)
    ? expired.gifts[0]
    : expired.gifts;
  assert(expired.status === "EXPIRADO", "claim não expirou");
  assert(expiredGift?.shares_taken === 1, "cotas não foram devolvidas");
  assert(expiredGift?.status === "DISPONIVEL", "presente não foi reaberto");

  const hiddenState = expectData(
    await admin
      .from("gifts")
      .select("status, shares_taken")
      .eq("id", hiddenGift.id)
      .single(),
    "validar presente oculto"
  );
  assert(hiddenState.shares_taken === 0, "cota oculta não foi devolvida");
  assert(hiddenState.status === "OCULTO", "expiração revelou presente oculto");

  const privateGuests = expectData(
    await anon.from("guests").select("*").eq("id", guestId),
    "ler guests como anon"
  );
  const privateClaims = expectData(
    await anon.from("claims").select("*").eq("id", claim.id),
    "ler claims como anon"
  );
  const privateLimits = await anon
    .from("reservation_rate_limits")
    .select("*")
    .eq("key_hash", rateKey);
  assert(privateGuests.length === 0, "anon leu guests");
  assert(privateClaims.length === 0, "anon leu claims");
  assert(
    Boolean(privateLimits.error) || privateLimits.data?.length === 0,
    "anon leu contadores"
  );

  const leakedInsert = await anon.from("guests").insert({ name: marker });
  assert(Boolean(leakedInsert.error), "anon inseriu guest");
  const leakedGiftUpdate = await anon
    .from("gifts")
    .update({ status: "DISPONIVEL" })
    .eq("id", hiddenGift.id)
    .select("id");
  assert(
    Boolean(leakedGiftUpdate.error) || leakedGiftUpdate.data?.length === 0,
    "anon alterou gift"
  );

  const anonymousRpcs = await Promise.all([
    anon.rpc("expire_stale_claims"),
    anon.rpc("consume_reservation_rate_limit", {
      p_key_hash: rateKey,
      p_limit: 5,
      p_window_seconds: 60,
    }),
    anon.rpc("reserve_link", {
      p_gift_id: availableGift.id,
      p_guest_id: guestId,
      p_message: null,
    }),
    anon.rpc("reserve_shares", {
      p_gift_id: availableGift.id,
      p_guest_id: guestId,
      p_shares: 1,
    }),
    anon.rpc("s7_security_status"),
  ]);
  assert(
    anonymousRpcs.every((result) => Boolean(result.error)),
    "anon executou uma RPC interna"
  );

  const publicMessages = expectData(
    await anon.from("public_messages").select("*").eq("name", marker),
    "ler projeção pública"
  );
  assert(publicMessages.length === 1, "mensagem aprovada não apareceu");
  assert(
    Object.keys(publicMessages[0]).sort().join(",") ===
      "created_at,message,name,source",
    "mural público expôs coluna indevida"
  );
  assert(
    !JSON.stringify(publicMessages).includes(guest.token),
    "mural público vazou token"
  );

  console.log("S7_INTEGRATION_OK");
} finally {
  if (giftIds.length > 0) await admin.from("gifts").delete().in("id", giftIds);
  if (guestId) await admin.from("guests").delete().eq("id", guestId);
  await admin
    .from("reservation_rate_limits")
    .delete()
    .eq("key_hash", rateKey);
}
