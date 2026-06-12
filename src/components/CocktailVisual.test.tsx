import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CocktailVisual } from "./CocktailVisual";
import type { CocktailVisualSpec } from "../domain/types";

const baseSpec: CocktailVisualSpec = {
  glassType: "highball",
  drinkColor: "#d9f3c7",
  opacity: 0.76,
  hasIce: true,
  iceStyle: "cube",
  foamLevel: "none",
  garnish: ["mint", "lime_wedge"],
  rimStyle: "none",
  straw: true,
  bubbleLevel: "medium"
};

describe("CocktailVisual", () => {
  it("renders the requested glass type and garnish layers", () => {
    const markup = renderToStaticMarkup(<CocktailVisual spec={baseSpec} title="Mojito" />);

    expect(markup).toContain("cocktail-visual highball");
    expect(markup).toContain("薄荷");
    expect(markup).toContain("青柠角");
    expect(markup).toContain("<svg");
  });

  it("renders extended garnish atoms", () => {
    const markup = renderToStaticMarkup(
      <CocktailVisual
        spec={{
          ...baseSpec,
          foamLevel: "high",
          garnish: ["basil", "blackberry", "passion_fruit", "ginger_slice", "chili", "bitters_drops", "lemon_peel"]
        }}
        title="Atom preview"
      />
    );

    for (const label of ["罗勒", "黑莓", "百香果", "姜片", "辣椒", "苦精滴", "柠檬皮"]) {
      expect(markup).toContain(label);
    }
  });

  it("renders rim and no-ice states from visual spec", () => {
    const markup = renderToStaticMarkup(
      <CocktailVisual
        title="Margarita"
        spec={{
          ...baseSpec,
          glassType: "coupe",
          hasIce: false,
          iceStyle: "none",
          rimStyle: "salt",
          garnish: ["lime_wedge"],
          straw: false,
          bubbleLevel: "none"
        }}
      />
    );

    expect(markup).toContain("cocktail-visual coupe");
    expect(markup).toContain("salt-rim");
    expect(markup).not.toContain("ice-layer");
    expect(markup).not.toContain("straw-layer");
  });

  it("renders an SVG gradient when the drink uses layered color", () => {
    const markup = renderToStaticMarkup(
      <CocktailVisual
        title="Tequila Sunrise"
        spec={{
          ...baseSpec,
          drinkGradient: {
            from: "#D94A3A",
            middle: "#F38B3D",
            to: "#F8D26A",
            direction: "vertical"
          }
        }}
      />
    );

    expect(markup).toContain("<linearGradient");
    expect(markup).toContain('stop-color="#D94A3A"');
    expect(markup).toContain('stop-color="#F8D26A"');
    expect(markup).toContain("url(#drink-gradient-");
  });

  it("renders the extended glass types", () => {
    for (const glassType of ["collins", "champagne_flute", "wine", "mule_mug", "hurricane"] as const) {
      const markup = renderToStaticMarkup(<CocktailVisual spec={{ ...baseSpec, glassType }} title={glassType} />);

      expect(markup).toContain(`cocktail-visual ${glassType}`);
      expect(markup).toContain("drink-liquid");
      expect(markup).toContain("glass-line");
    }
  });

  it("adds a motion class when a follow-along animation state is requested", () => {
    const markup = renderToStaticMarkup(<CocktailVisual spec={baseSpec} title="Mojito" motion="stir" buildProgress={0.66} />);

    expect(markup).toContain("cocktail-motion-stir");
    expect(markup).toContain("visual-stage-building");
    expect(markup).toContain("66%");
  });
});
