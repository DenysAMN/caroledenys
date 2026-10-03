import { describe, expect, it } from "vitest";

import { PRIMARY_NAV_ITEMS } from "./site-navigation";

describe("PRIMARY_NAV_ITEMS", () => {
  it("keeps the public menu focused on the one-page experience without RSVP", () => {
    expect(PRIMARY_NAV_ITEMS).toEqual([
      { label: "Nós", href: "/#nos" },
      { label: "Nossa inspiração", href: "/#inspiracao" },
      { label: "Dress code", href: "/#dress-code" },
      { label: "Presentes", href: "/#presentes" },
      { label: "Localização", href: "/#local" },
      { label: "Recados", href: "/#recados" },
      { label: "Fotos", href: "/#galeria" },
      { label: "Meus", href: "/meus" },
    ]);
  });
});
