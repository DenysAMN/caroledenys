import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// PostgreSQL local em memória; nunca usa URL ou credencial do Supabase.
let db: PGlite;
const actor = randomUUID();
let guest: string;
async function fixture(type = "LINK", status = "RESERVADO", hidden = false) {
  const gift = randomUUID(); const claim = randomUUID();
  await db.query(`insert into gifts(id, title, type, status, external_url, total_cents, share_cents, total_shares, shares_taken)
    values($1, 'Presente teste', $2::gift_type, $3::gift_status, 'https://example.com', 10000, 1000, 10, $4)`,
    [gift, type, hidden ? "OCULTO" : type === "LINK" ? "RESERVADO" : "DISPONIVEL", type === "COTAS" ? 5 : 0]);
  await db.query(`insert into claims(id, gift_id, guest_id, status, shares, amount_cents, message, receipt_url)
    values($1,$2,$3,$4::claim_status,$5,3000,'Original','private/receipt.png')`, [claim, gift, guest, status, type === "COTAS" ? 3 : null]);
  return { gift, claim };
}
async function manage(claim: string, action = "CANCEL") {
  return db.query("select admin_manage_reservation($1,$2,$3,$4)", [claim, action, "Pedido do convidado", actor]);
}
async function state(gift: string, claim: string) {
  const result = await db.query<{ status: string; shares_taken: number; claim_status: string; message: string; receipt_url: string }>(
    "select g.status,g.shares_taken,c.status as claim_status,c.message,c.receipt_url from gifts g join claims c on c.gift_id=g.id where g.id=$1 and c.id=$2", [gift, claim]);
  return result.rows[0];
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec("create role anon; create role authenticated; create role service_role;");
  await db.exec(await readFile(join(process.cwd(), "supabase/migrations/20260713000000_init.sql"), "utf8"));
  await db.exec(await readFile(join(process.cwd(), "supabase/migrations/20261003000000_admin_management.sql"), "utf8"));
  guest = randomUUID();
  await db.query("insert into guests(id,name,phone) values($1,'Convidado teste','+5522999999999')", [guest]);
}, 30000);
afterAll(async () => { await db?.close(); });

describe("atomic administrative changes on isolated PostgreSQL", () => {
  it("cancels LINK and releases the gift while preserving the historical claim", async () => {
    const { gift, claim } = await fixture(); await manage(claim);
    expect(await state(gift, claim)).toMatchObject({ status: "DISPONIVEL", claim_status: "CANCELADO", message: "Original", receipt_url: "private/receipt.png" });
  });
  it("returns exactly the canceled shares and rejects a second cancellation", async () => {
    const { gift, claim } = await fixture("COTAS", "EM_ANALISE"); await manage(claim);
    await expect(manage(claim)).rejects.toThrow("STATUS_INVALIDO");
    expect(await state(gift, claim)).toMatchObject({ shares_taken: 2, claim_status: "CANCELADO" });
  });
  it("two simultaneous cancellation requests cannot return shares twice", async () => {
    const { gift, claim } = await fixture("COTAS", "AGUARDANDO_PAGAMENTO");
    const results = await Promise.allSettled([manage(claim), manage(claim)]);
    expect(results.filter(row => row.status === "fulfilled")).toHaveLength(1);
    expect((await state(gift, claim)).shares_taken).toBe(2);
  });
  it("does not reveal an intentionally hidden gift when releasing shares", async () => {
    const { gift, claim } = await fixture("COTAS", "AGUARDANDO_PAGAMENTO", true); await manage(claim);
    expect(await state(gift, claim)).toMatchObject({ status: "OCULTO", shares_taken: 2 });
  });
  it("blocks paid claims and rolls back inconsistent share counts", async () => {
    const paid = await fixture("COTAS", "PAGO");
    await expect(manage(paid.claim)).rejects.toThrow("STATUS_INVALIDO");
    expect(await state(paid.gift, paid.claim)).toMatchObject({ shares_taken: 5, claim_status: "PAGO" });
    const broken = await fixture("COTAS", "AGUARDANDO_PAGAMENTO");
    await db.query("update gifts set shares_taken=1 where id=$1", [broken.gift]);
    await expect(manage(broken.claim)).rejects.toThrow("COTAS_INCONSISTENTES");
    expect(await state(broken.gift, broken.claim)).toMatchObject({ shares_taken: 1, claim_status: "AGUARDANDO_PAGAMENTO" });
  });
  it("confirms and undoes only physical LINK receipts", async () => {
    const { gift, claim } = await fixture(); await manage(claim, "RECEIVE");
    expect(await state(gift, claim)).toMatchObject({ status: "CONCLUIDO", claim_status: "RECEBIDO" });
    await manage(claim, "REOPEN");
    expect(await state(gift, claim)).toMatchObject({ status: "RESERVADO", claim_status: "RESERVADO" });
    const quota = await fixture("COTAS"); await expect(manage(quota.claim, "RECEIVE")).rejects.toThrow("STATUS_INVALIDO");
  });
  it("preserves the previous message and refuses a stale edit", async () => {
    const { claim } = await fixture();
    await db.query("select admin_edit_message($1,'CLAIM','Novo recado','Original',$2)", [claim, actor]);
    await expect(db.query("select admin_edit_message($1,'CLAIM','Sobrescrito','Original',$2)", [claim, actor])).rejects.toThrow("CONFLITO_EDICAO");
    const result = await db.query<{ before_data: { message: string }; after_data: { message: string } }>("select before_data,after_data from admin_activity where entity_id=$1", [claim]);
    expect(result.rows[0]).toMatchObject({ before_data: { message: "Original" }, after_data: { message: "Novo recado" } });
  });
  it("also edits historical RSVP messages without exposing RSVP publicly", async () => {
    await db.query("update guests set rsvp_notes='Nota original' where id=$1", [guest]);
    await db.query("select admin_edit_message($1,'RSVP','Nota corrigida','Nota original',$2)", [guest, actor]);
    const result = await db.query<{ rsvp_notes: string }>("select rsvp_notes from guests where id=$1", [guest]);
    expect(result.rows[0].rsvp_notes).toBe("Nota corrigida");
  });
  it("blocks gift deletion that would cascade and erase reservations", async () => {
    const { gift, claim } = await fixture();
    await expect(db.query("delete from gifts where id=$1", [gift])).rejects.toThrow("PRESENTE_COM_HISTORICO");
    expect((await state(gift, claim)).claim_status).toBe("RESERVADO");
  });
  it("denies public RPC execution and private audit reads", async () => {
    const { claim } = await fixture();
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      try {
        await expect(db.query("select admin_management_ready()")).rejects.toThrow("permission denied");
        await expect(manage(claim)).rejects.toThrow("permission denied");
        await expect(db.query("select admin_edit_message($1,'CLAIM','Malicioso','Original',$2)", [claim, actor])).rejects.toThrow("permission denied");
        await expect(db.query("select * from admin_activity")).rejects.toThrow("permission denied");
      } finally { await db.exec("reset role"); }
    }
    await db.exec("set role service_role");
    try { expect((await db.query<{ ready: boolean }>("select admin_management_ready() as ready")).rows[0].ready).toBe(true); }
    finally { await db.exec("reset role"); }
  });
});
