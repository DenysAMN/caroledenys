import { randomUUID } from "node:crypto";
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
const marker = `S6-${randomUUID()}`;
const phone = `+5522${String(Date.now()).slice(-9)}`;
let guestId = null;
let giftId = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectData(result, context) {
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  return result.data;
}

try {
  const guest = expectData(
    await admin
      .from("guests")
      .insert({
        name: marker,
        phone,
        rsvp: "CONFIRMADO",
        companions: 2,
        rsvp_notes: `${marker} RSVP`,
        rsvp_at: new Date().toISOString(),
      })
      .select("id, token")
      .single(),
    "criar convidado temporário"
  );
  guestId = guest.id;

  const gift = expectData(
    await admin
      .from("gifts")
      .insert({
        title: `${marker} Presente`,
        type: "LINK",
        status: "DISPONIVEL",
        external_url: "https://example.com",
      })
      .select("id")
      .single(),
    "criar presente temporário"
  );
  giftId = gift.id;

  const claim = expectData(
    await admin
      .from("claims")
      .insert({
        gift_id: giftId,
        guest_id: guestId,
        status: "RESERVADO",
        message: `${marker} PRESENTE`,
      })
      .select("id")
      .single(),
    "criar recado temporário"
  );

  const privateGuests = await anon
    .from("guests")
    .select("*")
    .eq("id", guestId);
  assert(!privateGuests.error, "consulta RLS de guests deveria responder sem erro");
  assert(privateGuests.data?.length === 0, "anon conseguiu ler guests");

  const privateClaims = await anon
    .from("claims")
    .select("*")
    .eq("id", claim.id);
  assert(!privateClaims.error, "consulta RLS de claims deveria responder sem erro");
  assert(privateClaims.data?.length === 0, "anon conseguiu ler claims");

  const beforeApproval = expectData(
    await anon.from("public_messages").select("*").eq("name", marker),
    "consultar mural antes da aprovação"
  );
  assert(beforeApproval.length === 0, "mural exibiu recado pendente");

  expectData(
    await admin
      .from("claims")
      .update({ message_approved: true })
      .eq("id", claim.id),
    "aprovar recado do presente"
  );
  expectData(
    await admin
      .from("guests")
      .update({ notes_approved: true })
      .eq("id", guestId),
    "aprovar recado do RSVP"
  );

  const approved = expectData(
    await anon
      .from("public_messages")
      .select("*")
      .eq("name", marker)
      .order("source"),
    "consultar mural aprovado"
  );
  assert(approved.length === 2, "mural não retornou os dois recados aprovados");
  assert(
    approved.every(
      (row) =>
        Object.keys(row).sort().join(",") ===
        "created_at,message,name,source"
    ),
    "view pública expôs coluna além do contrato"
  );
  assert(
    !JSON.stringify(approved).includes(phone) &&
      !JSON.stringify(approved).includes(guest.token),
    "mural vazou telefone ou token"
  );

  console.log("S6_INTEGRATION_OK");
} finally {
  if (giftId) await admin.from("gifts").delete().eq("id", giftId);
  if (guestId) await admin.from("guests").delete().eq("id", guestId);
}
