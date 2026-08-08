import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ListeningGlass } from "./ListeningGlass";

describe("ListeningGlass", () => {
  it("renders the living glass SVG identity", () => {
    const markup = renderToStaticMarkup(<ListeningGlass state="thinking" />);

    expect(markup).toContain("酒保杯");
    expect(markup).toContain("listening-glass bartender-glass thinking");
    expect(markup).toContain("ice-cubes");
    expect(markup).toContain("smile-eye");
    expect(markup).toContain("leaf-garnish");
    expect(markup).toContain("<svg");
  });
});
