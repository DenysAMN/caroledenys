import { describe, expect, it } from "vitest";
import { csvCell, managementError, parseMessageEdit, parseReservationAction, reservationActions } from "./admin-management-rules";
const id = "08ee4652-8e80-4a3a-b9be-676b7f498d81";

describe("admin management input boundaries", () => {
  it("requires a known source and nonempty message with a bounded length", () => {
    expect(parseMessageEdit(id, "CLAIM", "  Obrigado!  ", "Original")?.text).toBe("Obrigado!");
    for (const text of ["", "   ", "a".repeat(2001), null]) expect(parseMessageEdit(id, "CLAIM", text, "Original")).toBeNull();
    expect(parseMessageEdit(id, "PUBLIC", "Novo", "Original")).toBeNull();
    expect(parseMessageEdit("not-uuid", "RSVP", "Novo", "Original")).toBeNull();
  });
  it("requires a valid reservation action and a reason", () => {
    expect(parseReservationAction(id, "CANCEL", "  Duplicada  ")).toEqual({ id, action: "CANCEL", reason: "Duplicada" });
    for (const reason of ["", "ok", "a".repeat(301), null]) expect(parseReservationAction(id, "CANCEL", reason)).toBeNull();
    expect(parseReservationAction(id, "REFUND", "Pedido do cliente")).toBeNull();
  });
  it("does not offer cancellation for settled, received or expired contributions", () => {
    expect(reservationActions("LINK", "RESERVADO")).toEqual(["RECEIVE", "CANCEL"]);
    expect(reservationActions("LINK", "RECEBIDO")).toEqual(["REOPEN"]);
    for (const status of ["PAGO", "CANCELADO", "EXPIRADO", "RECEBIDO"]) expect(reservationActions("COTAS", status)).toEqual([]);
    expect(reservationActions("COTAS", "EM_ANALISE")).toEqual(["CANCEL"]);
  });
  it("neutralizes spreadsheet formulas and quotes literal cell contents", () => {
    expect(csvCell('Maria "Silva"')).toBe('"Maria ""Silva"""');
    for (const text of ["=1+1", "+5522999999999", " @SUM(A1)", "\t-42"]) expect(csvCell(text)).toBe(`"'${text}"`);
  });
  it("does not expose database errors and identifies missing migration and concurrent editing", () => {
    expect(managementError({ code: "PGRST202" })).toContain("atualização do banco");
    expect(managementError({ message: "CONFLITO_EDICAO" })).toContain("outra sessão");
    expect(managementError({ message: "secret endpoint detail" })).toBe("Não foi possível salvar. Tente novamente.");
  });
});
