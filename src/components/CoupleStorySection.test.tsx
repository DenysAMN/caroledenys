import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import CoupleStorySection from "./CoupleStorySection";

describe("CoupleStorySection", () => {
  it("renders both complete perspectives and the relationship chronology without hidden controls", () => {
    const html = renderToStaticMarkup(<CoupleStorySection id="nos" />);

    expect(html).toContain('id="nos"');
    expect(html).toContain("Pelo olhar do noivo");
    expect(html).toContain("Pelo olhar da noiva");
    expect(html).toContain("06 SET 2025");
    expect(html).toContain("07 OUT 2025");
    expect(html).toContain("31 JAN 2027");
    expect(html).toContain("Hummm, bonita");
    expect(html).toContain("moooonte de amigos");
    expect(html).toContain("Para o homem que mudou a profecia");
    expect(html).toContain("principal-3.jpg");
    expect(html).toContain("Carol sorrindo para Denys durante o ensaio");
    expect(html.match(/<article/g)).toHaveLength(2);
    expect(html).not.toContain("<button");
  });
});
