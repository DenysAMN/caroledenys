export type GuestCsvRow = {
  name: string;
  phone: string | null;
  rsvp: "CONFIRMADO" | "NAO_VOU" | null;
  companions: number;
  rsvpNotes: string | null;
  rsvpAt: string | null;
};

export type RsvpMetrics = {
  confirmedGuests: number;
  companions: number;
  totalAttending: number;
  declined: number;
  unanswered: number;
};

export function calculateRsvpMetrics(rows: GuestCsvRow[]): RsvpMetrics {
  const confirmed = rows.filter((row) => row.rsvp === "CONFIRMADO");
  const confirmedGuests = confirmed.length;
  const companions = confirmed.reduce(
    (sum, row) =>
      sum +
      (Number.isSafeInteger(row.companions) && row.companions > 0
        ? row.companions
        : 0),
    0
  );

  return {
    confirmedGuests,
    companions,
    totalAttending: confirmedGuests + companions,
    declined: rows.filter((row) => row.rsvp === "NAO_VOU").length,
    unanswered: rows.filter((row) => row.rsvp === null).length,
  };
}

function protectSpreadsheetFormula(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number | null): string {
  const text = protectSpreadsheetFormula(value === null ? "" : String(value));
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildGuestsCsv(rows: GuestCsvRow[]): string {
  const header = [
    "Nome",
    "WhatsApp",
    "RSVP",
    "Acompanhantes",
    "Observações",
    "Respondido em",
  ];
  const lines = rows.map((row) =>
    [
      row.name,
      row.phone,
      row.rsvp === "CONFIRMADO"
        ? "Confirmado"
        : row.rsvp === "NAO_VOU"
          ? "Não vai"
          : "Sem resposta",
      row.companions,
      row.rsvpNotes,
      row.rsvpAt,
    ]
      .map(csvCell)
      .join(",")
  );

  return `\uFEFF${header.join(",")}\r\n${lines.join("\r\n")}\r\n`;
}
