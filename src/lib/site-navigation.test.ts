import { describe, expect, it } from "vitest";

import { PRIMARY_NAV_ITEMS } from "./site-navigation";

describe("PRIMARY_NAV_ITEMS", () => {
  it("keeps the public menu focused on the one-page experience without RSVP", () => {
    expect(PRIMARY_NAV_ITEMS).toEqual([
      { label: "Nós", href: "/#nos" },
      { label: "Presentes", href: "/#presentes" },
      { label: "Recados", href: "/#recados" },
      { label: "Meus", href: "/meus" },
    ]);
  });
});
