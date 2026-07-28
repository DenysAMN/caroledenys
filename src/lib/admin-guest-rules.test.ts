import { describe, expect, it } from "vitest";
import {
  buildGuestsCsv,
  calculateRsvpMetrics,
  type GuestCsvRow,
} from "./admin-guest-rules";

const rows: GuestCsvRow[] = [
  {
    name: "Ana, Maria",
    phone: "+5522999999999",
    rsvp: "CONFIRMADO",
    companions: 2,
    rsvpNotes: "Vegetariana",
    rsvpAt: "2026-07-27T12:00:00.000Z",
  },
  {
    name: '=IMPORTXML("x")',
    phone: null,
    rsvp: "NAO_VOU",
    companions: 0,
    rsvpNotes: 'Disse "obrigado"',
    rsvpAt: null,
  },
  {
    name: "Sem resposta",
    phone: null,
    rsvp: null,
    companions: 0,
    rsvpNotes: null,
    rsvpAt: null,
  },
];

describe("calculateRsvpMetrics", () => {
  it("conta convidados, acompanhantes, recusas e pendentes", () => {
    expect(calculateRsvpMetrics(rows)).toEqual({
      confirmedGuests: 1,
      companions: 2,
      totalAttending: 3,
      declined: 1,
      unanswered: 1,
    });
  });
});

describe("buildGuestsCsv", () => {
  it("gera CSV com BOM, escaping e proteção contra fórmula", () => {
    const csv = buildGuestsCsv(rows);
    expect(csv.startsWith("\uFEFFNome,WhatsApp")).toBe(true);
    expect(csv).toContain('"Ana, Maria"');
    expect(csv).toContain(`"'=IMPORTXML(""x"")"`);
    expect(csv).toContain('"Disse ""obrigado"""');
  });
});
