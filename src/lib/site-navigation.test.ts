import { describe, expect, it } from "vitest";

import { PRIMARY_NAV_ITEMS } from "./site-navigation";

describe("PRIMARY_NAV_ITEMS", () => {
  it("keeps editorial navigation on home sections and only Meus as a route", () => {
    expect(PRIMARY_NAV_ITEMS).toEqual([
      { label: "Nós", href: "/#nos" },
      { label: "Presentes", href: "/#presentes" },
      { label: "Presença", href: "/#presenca" },
      { label: "Recados", href: "/#recados" },
      { label: "Meus", href: "/meus" },
    ]);
  });
});
