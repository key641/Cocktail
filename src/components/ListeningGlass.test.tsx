import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ListeningGlass } from "./ListeningGlass";

describe("ListeningGlass", () => {
  it("renders the living glass SVG identity", () => {
    const markup = renderToStaticMarkup(<ListeningGlass state="thinking" />);

    expect(markup).toContain("聆听之杯");
    expect(markup).toContain("listening-glass thinking");
    expect(markup).toContain("<svg");
  });
});
