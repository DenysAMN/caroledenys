import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import WeddingGallery from "./WeddingGallery";

describe("WeddingGallery", () => {
  it("shows the complete secondary essay as an accessible gallery", () => {
    const html = renderToStaticMarkup(<WeddingGallery />);
    const altTexts = [...html.matchAll(/alt="([^"]*)"/g)].map((match) => match[1]);

    expect(html.match(/<figure/g)).toHaveLength(10);
    expect(html).toContain("Essa também somos nós.");
    expect(altTexts).toHaveLength(10);
    expect(altTexts.every(Boolean)).toBe(true);
  });
});
