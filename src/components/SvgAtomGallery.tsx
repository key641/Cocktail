import { CocktailVisual } from "./CocktailVisual";
import type { BubbleLevel, CocktailVisualSpec, FoamLevel, GarnishType, GlassType, IceStyle, RimStyle } from "../domain/types";

type SvgAtomGalleryProps = {
  onBack: () => void;
};

type AtomCard = {
  key: string;
  title: string;
  subtitle: string;
  spec: CocktailVisualSpec;
};

const baseSpec: CocktailVisualSpec = {
  glassType: "old_fashioned",
  drinkColor: "#D8C28A",
  opacity: 0.72,
  hasIce: true,
  iceStyle: "cube",
  foamLevel: "none",
  garnish: [],
  rimStyle: "none",
  straw: false,
  bubbleLevel: "none"
};

const glassTypes: GlassType[] = ["old_fashioned", "coupe", "martini", "collins", "champagne_flute", "wine", "mule_mug", "hurricane"];
const iceStyles: IceStyle[] = ["none", "cube", "large_cube", "crushed"];
const foamLevels: FoamLevel[] = ["none", "low", "medium", "high"];
const bubbleLevels: BubbleLevel[] = ["none", "low", "medium", "high"];
const rimStyles: RimStyle[] = ["none", "salt", "sugar"];
const garnishTypes: GarnishType[] = [
  "mint",
  "basil",
  "lime_wedge",
  "lemon_wheel",
  "lemon_peel",
  "orange_peel",
  "orange_slice",
  "cherry",
  "blackberry",
  "passion_fruit",
  "ginger_slice",
  "chili",
  "bitters_drops",
  "olive",
  "coffee_beans"
];

const gradientCards: AtomCard[] = [
  {
    key: "gradient-tequila-sunrise",
    title: "垂直渐变",
    subtitle: "Tequila Sunrise",
    spec: {
      ...baseSpec,
      glassType: "collins",
      drinkColor: "#F3A342",
      drinkGradient: { from: "#D94A3A", middle: "#F38B3D", to: "#F8D26A", direction: "vertical" },
      garnish: ["orange_slice"],
      straw: true
    }
  },
  {
    key: "gradient-dark-n-stormy",
    title: "深色渐变",
    subtitle: "Dark 'n Stormy",
    spec: {
      ...baseSpec,
      glassType: "collins",
      drinkColor: "#3C2A1E",
      drinkGradient: { from: "#5C3A20", to: "#2A1A0E", direction: "vertical" },
      garnish: ["lime_wedge"],
      bubbleLevel: "medium"
    }
  }
];

const atomSections = [
  {
    title: "杯型",
    cards: glassTypes.map((glassType): AtomCard => ({
      key: `glass-${glassType}`,
      title: glassType,
      subtitle: "glassType",
      spec: { ...baseSpec, glassType, hasIce: glassType === "old_fashioned" || glassType === "collins", iceStyle: "cube" }
    }))
  },
  {
    title: "冰块",
    cards: iceStyles.map((iceStyle): AtomCard => ({
      key: `ice-${iceStyle}`,
      title: iceStyle,
      subtitle: "iceStyle",
      spec: { ...baseSpec, hasIce: iceStyle !== "none", iceStyle }
    }))
  },
  {
    title: "泡沫",
    cards: foamLevels.map((foamLevel): AtomCard => ({
      key: `foam-${foamLevel}`,
      title: foamLevel,
      subtitle: "foamLevel",
      spec: { ...baseSpec, glassType: "coupe", hasIce: false, iceStyle: "none", foamLevel }
    }))
  },
  {
    title: "气泡",
    cards: bubbleLevels.map((bubbleLevel): AtomCard => ({
      key: `bubble-${bubbleLevel}`,
      title: bubbleLevel,
      subtitle: "bubbleLevel",
      spec: { ...baseSpec, glassType: "collins", drinkColor: "#EEF4D6", bubbleLevel }
    }))
  },
  {
    title: "杯口",
    cards: rimStyles.map((rimStyle): AtomCard => ({
      key: `rim-${rimStyle}`,
      title: rimStyle,
      subtitle: "rimStyle",
      spec: { ...baseSpec, glassType: "coupe", hasIce: false, iceStyle: "none", rimStyle, garnish: ["lime_wedge"] }
    }))
  },
  {
    title: "辅助层",
    cards: [
      {
        key: "straw",
        title: "straw",
        subtitle: "吸管",
        spec: { ...baseSpec, glassType: "collins", straw: true, bubbleLevel: "medium", garnish: ["lime_wedge"] }
      },
      ...gradientCards
    ] satisfies AtomCard[]
  },
  {
    title: "装饰",
    cards: garnishTypes.map((garnish): AtomCard => ({
      key: `garnish-${garnish}`,
      title: garnish,
      subtitle: "garnish",
      spec: {
        ...baseSpec,
        glassType: garnish === "olive" ? "martini" : garnish === "passion_fruit" ? "coupe" : "old_fashioned",
        hasIce: garnish !== "olive" && garnish !== "passion_fruit",
        iceStyle: garnish === "olive" || garnish === "passion_fruit" ? "none" : "cube",
        foamLevel: garnish === "bitters_drops" ? "high" : "none",
        garnish: [garnish]
      }
    }))
  }
];

export function SvgAtomGallery({ onBack: _onBack }: SvgAtomGalleryProps) {
  return (
    <section className="screen atom-screen">
      <div className="section-heading centered">
        <span className="eyebrow">VISUAL LIBRARY</span>
        <h2>SVG 原子层</h2>
        <p>杯型、酒液、冰块、装饰与表情的视觉基准。</p>
      </div>

      <div className="atom-section-list">
        {atomSections.map((section) => (
          <section className="atom-section" key={section.title}>
            <h3>{section.title}</h3>
            <div className="atom-grid">
              {section.cards.map((card) => (
                <article className="atom-card" key={card.key}>
                  <CocktailVisual spec={card.spec} title={card.title} />
                  <strong>{card.title}</strong>
                  <span>{card.subtitle}</span>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
