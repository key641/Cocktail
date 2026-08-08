import { useId } from "react";
import type { CSSProperties } from "react";
import type { BubbleLevel, CocktailVisualSpec, FoamLevel, GarnishType } from "../domain/types";

type CocktailVisualProps = {
  spec: CocktailVisualSpec;
  title: string;
  motion?: "prepare" | "add" | "stir" | "shake" | "strain" | "garnish" | "finish";
  buildProgress?: number;
};

const garnishLabels: Record<GarnishType, string> = {
  mint: "薄荷",
  basil: "罗勒",
  lime_wedge: "青柠角",
  lemon_wheel: "柠檬片",
  lemon_peel: "柠檬皮",
  orange_peel: "橙皮",
  orange_slice: "橙片",
  cherry: "樱桃",
  blackberry: "黑莓",
  passion_fruit: "百香果",
  ginger_slice: "姜片",
  chili: "辣椒",
  bitters_drops: "苦精滴",
  olive: "橄榄",
  coffee_beans: "咖啡豆"
};

function GlassOutline({ glassType }: Pick<CocktailVisualSpec, "glassType">) {
  if (glassType === "coupe") {
    return (
      <>
        <path className="glass-line glass-back" d="M72 70 C80 101 96 114 120 114 C144 114 160 101 168 70" />
        <path className="glass-line" d="M62 66 C70 99 92 119 120 119 C148 119 170 99 178 66" />
        <path className="glass-line" d="M62 66 H178" />
        <path className="glass-line" d="M120 119 V188" />
        <path className="glass-line glass-base" d="M86 190 H154" />
      </>
    );
  }

  if (glassType === "martini") {
    return (
      <>
        <path className="glass-line glass-back" d="M54 60 H186 L126 136 H114 Z" />
        <path className="glass-line" d="M58 64 H182 L124 132 H116 Z" />
        <path className="glass-line" d="M120 132 V190" />
        <path className="glass-line glass-base" d="M88 192 H152" />
      </>
    );
  }

  if (glassType === "old_fashioned") {
    return (
      <>
        <path className="glass-line glass-back" d="M68 72 H172 L158 178 H82 Z" />
        <path className="glass-line" d="M72 76 H168 L155 176 H85 Z" />
        <path className="glass-line glass-base" d="M86 176 H154" />
      </>
    );
  }

  if (glassType === "collins") {
    return (
      <>
        <path className="glass-line glass-back" d="M82 42 H158 L150 190 H90 Z" />
        <path className="glass-line" d="M86 46 H154 L147 188 H93 Z" />
        <path className="glass-line glass-base" d="M94 188 H146" />
      </>
    );
  }

  if (glassType === "champagne_flute") {
    return (
      <>
        <path className="glass-line glass-back" d="M92 42 H148 C145 96 137 126 124 138 H116 C103 126 95 96 92 42" />
        <path className="glass-line" d="M96 46 H144 C141 94 134 121 123 134 H117 C106 121 99 94 96 46" />
        <path className="glass-line" d="M120 134 V190" />
        <path className="glass-line glass-base" d="M88 192 H152" />
      </>
    );
  }

  if (glassType === "wine") {
    return (
      <>
        <path className="glass-line glass-back" d="M74 56 C76 118 93 147 115 153 H125 C147 147 164 118 166 56" />
        <path className="glass-line" d="M78 58 C80 113 96 141 116 148 H124 C144 141 160 113 162 58" />
        <path className="glass-line" d="M78 58 C98 52 142 52 162 58" />
        <path className="glass-line" d="M120 150 V190" />
        <path className="glass-line glass-base" d="M88 192 H152" />
      </>
    );
  }

  if (glassType === "mule_mug") {
    return (
      <>
        <path className="glass-line glass-back" d="M70 70 H160 L154 178 H76 Z" />
        <path className="glass-line" d="M74 74 H156 L151 176 H79 Z" />
        <path className="glass-line" d="M156 94 C190 94 190 154 154 154" />
        <path className="glass-line" d="M160 108 C176 113 176 137 157 142" />
        <path className="glass-line glass-base" d="M80 176 H150" />
      </>
    );
  }

  if (glassType === "hurricane") {
    return (
      <>
        <path className="glass-line glass-back" d="M88 44 C81 68 105 83 89 110 C76 133 94 153 120 156 C146 153 164 133 151 110 C135 83 159 68 152 44" />
        <path className="glass-line" d="M92 48 C85 70 109 84 94 111 C80 132 98 151 120 154 C142 151 160 132 146 111 C131 84 155 70 148 48" />
        <path className="glass-line" d="M92 48 H148" />
        <path className="glass-line" d="M120 154 V188" />
        <path className="glass-line glass-base" d="M92 190 H148" />
      </>
    );
  }

  return (
    <>
      <path className="glass-line glass-back" d="M76 46 H164 L154 188 H86 Z" />
      <path className="glass-line" d="M80 50 H160 L151 186 H89 Z" />
      <path className="glass-line glass-base" d="M90 186 H150" />
    </>
  );
}

function Liquid({ spec, fill }: { spec: CocktailVisualSpec; fill: string }) {
  if (spec.glassType === "coupe") {
    return <path className="drink-liquid" style={{ fill, opacity: spec.opacity }} d="M74 83 H166 C158 104 142 112 120 112 C98 112 82 104 74 83Z" />;
  }

  if (spec.glassType === "martini") {
    return <path className="drink-liquid" style={{ fill, opacity: spec.opacity }} d="M70 74 H170 L124 126 H116 Z" />;
  }

  if (spec.glassType === "old_fashioned") {
    return <path className="drink-liquid" style={{ fill, opacity: spec.opacity }} d="M78 112 H162 L154 174 H86 Z" />;
  }

  if (spec.glassType === "collins") {
    return <path className="drink-liquid" style={{ fill, opacity: spec.opacity }} d="M91 92 H149 L145 184 H95 Z" />;
  }

  if (spec.glassType === "champagne_flute") {
    return <path className="drink-liquid" style={{ fill, opacity: spec.opacity }} d="M100 78 H140 C137 108 131 126 122 134 H118 C109 126 103 108 100 78Z" />;
  }

  if (spec.glassType === "wine") {
    return <path className="drink-liquid" style={{ fill, opacity: spec.opacity }} d="M82 86 C99 81 141 81 158 86 C155 121 143 139 124 146 H116 C97 139 85 121 82 86Z" />;
  }

  if (spec.glassType === "mule_mug") {
    return <path className="drink-liquid" style={{ fill, opacity: spec.opacity }} d="M80 104 H150 L147 174 H83 Z" />;
  }

  if (spec.glassType === "hurricane") {
    return <path className="drink-liquid" style={{ fill, opacity: spec.opacity }} d="M96 75 C108 80 132 80 144 75 C137 94 151 111 143 135 C137 147 129 152 120 154 C111 152 103 147 97 135 C89 111 103 94 96 75Z" />;
  }

  return <path className="drink-liquid" style={{ fill, opacity: spec.opacity }} d="M84 92 H156 L150 184 H90 Z" />;
}

function IceLayer({ spec }: { spec: CocktailVisualSpec }) {
  if (!spec.hasIce || spec.iceStyle === "none") {
    return null;
  }

  const large = spec.iceStyle === "large_cube";
  return (
    <g className="ice-layer">
      {large ? (
        <rect x="96" y="118" width="50" height="50" rx="8" transform="rotate(-7 121 143)" />
      ) : (
        <>
          <rect x="92" y="112" width="30" height="30" rx="6" transform="rotate(-10 107 127)" />
          <rect x="123" y="132" width="28" height="28" rx="6" transform="rotate(12 137 146)" />
          {spec.iceStyle === "crushed" && <rect x="104" y="154" width="20" height="20" rx="5" transform="rotate(18 114 164)" />}
        </>
      )}
    </g>
  );
}

function Foam({ level }: { level: FoamLevel }) {
  if (level === "none") {
    return null;
  }
  const height = level === "high" ? 16 : level === "medium" ? 11 : 7;
  return <ellipse className="foam-layer" cx="120" cy="88" rx="40" ry={height} />;
}

function Bubbles({ level }: { level: BubbleLevel }) {
  if (level === "none") {
    return null;
  }
  const count = level === "high" ? 9 : level === "medium" ? 6 : 3;
  return (
    <g className="bubble-layer">
      {Array.from({ length: count }, (_, index) => (
        <circle key={index} cx={98 + (index % 3) * 18} cy={156 - index * 10} r={index % 2 === 0 ? 2.6 : 1.8} />
      ))}
    </g>
  );
}

function Straw({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }
  return (
    <g className="straw-layer">
      <path d="M146 50 L130 166" />
      <path d="M146 50 L166 38" />
    </g>
  );
}

function Garnishes({ garnishes }: { garnishes: GarnishType[] }) {
  return (
    <g className="garnish-layer">
      {garnishes.map((garnish, index) => {
        const label = garnishLabels[garnish];
        if (garnish === "mint") {
          return (
            <g key={`${garnish}-${index}`} transform="translate(76 48) rotate(-15)">
              <title>{label}</title>
              <path className="mint-stem" d="M18 36 C21 23 20 12 16 0" />
              <ellipse className="mint-leaf" cx="10" cy="14" rx="8" ry="15" transform="rotate(-28 10 14)" />
              <ellipse className="mint-leaf" cx="24" cy="18" rx="8" ry="14" transform="rotate(30 24 18)" />
              <ellipse className="mint-leaf" cx="16" cy="2" rx="7" ry="12" transform="rotate(-4 16 2)" />
            </g>
          );
        }
        if (garnish === "basil") {
          return (
            <g key={`${garnish}-${index}`} transform="translate(76 50) rotate(-18)">
              <title>{label}</title>
              <path className="basil-stem" d="M18 38 C21 24 20 12 17 0" />
              <ellipse className="basil-leaf" cx="10" cy="13" rx="9" ry="16" transform="rotate(-24 10 13)" />
              <ellipse className="basil-leaf" cx="25" cy="17" rx="9" ry="15" transform="rotate(28 25 17)" />
              <ellipse className="basil-leaf" cx="17" cy="3" rx="8" ry="13" transform="rotate(-4 17 3)" />
            </g>
          );
        }
        if (garnish === "lime_wedge") {
          return (
            <g key={`${garnish}-${index}`} transform="translate(148 57) rotate(18)">
              <title>{label}</title>
              <path className="citrus-peel" d="M0 24 A24 24 0 0 1 42 8 L21 24 Z" />
              <path className="citrus-line" d="M21 24 L28 6 M21 24 L12 7" />
            </g>
          );
        }
        if (garnish === "lemon_wheel" || garnish === "orange_slice") {
          return (
            <g key={`${garnish}-${index}`} transform="translate(151 74)">
              <title>{label}</title>
              <circle className={garnish === "orange_slice" ? "orange-wheel" : "lemon-wheel"} cx="0" cy="0" r="18" />
              <path className="citrus-line" d="M0 -15 V15 M-13 -8 L13 8 M-13 8 L13 -8" />
            </g>
          );
        }
        if (garnish === "lemon_peel") {
          return (
            <g key={`${garnish}-${index}`} transform="translate(146 70)">
              <title>{label}</title>
              <path className="lemon-peel" d="M0 0 C22 8 0 26 20 36" />
            </g>
          );
        }
        if (garnish === "orange_peel") {
          return (
            <g key={`${garnish}-${index}`} transform="translate(146 70)">
              <title>{label}</title>
              <path className="orange-peel" d="M0 0 C22 8 0 26 20 36" />
            </g>
          );
        }
        if (garnish === "cherry") {
          return (
            <g key={`${garnish}-${index}`} transform="translate(99 71)">
              <title>{label}</title>
              <path className="cherry-stem" d="M10 4 C16 -8 26 -8 31 -18" />
              <circle className="cherry" cx="8" cy="10" r="8" />
            </g>
          );
        }
        if (garnish === "blackberry") {
          return (
            <g key={`${garnish}-${index}`} transform="translate(96 75)">
              <title>{label}</title>
              <circle className="blackberry" cx="0" cy="0" r="5" />
              <circle className="blackberry" cx="8" cy="1" r="5" />
              <circle className="blackberry" cx="4" cy="-7" r="5" />
              <circle className="blackberry" cx="4" cy="8" r="5" />
            </g>
          );
        }
        if (garnish === "passion_fruit") {
          return (
            <g key={`${garnish}-${index}`} transform="translate(142 72) rotate(10)">
              <title>{label}</title>
              <ellipse className="passion-fruit-shell" cx="0" cy="0" rx="18" ry="12" />
              <ellipse className="passion-fruit-pulp" cx="0" cy="0" rx="13" ry="8" />
              <circle className="passion-fruit-seed" cx="-5" cy="-1" r="1.8" />
              <circle className="passion-fruit-seed" cx="1" cy="3" r="1.8" />
              <circle className="passion-fruit-seed" cx="6" cy="-3" r="1.8" />
            </g>
          );
        }
        if (garnish === "ginger_slice") {
          return (
            <g key={`${garnish}-${index}`} transform="translate(98 72) rotate(-12)">
              <title>{label}</title>
              <ellipse className="ginger-slice" cx="0" cy="0" rx="14" ry="8" />
              <path className="ginger-line" d="M-8 -1 C-2 -5 6 -4 10 1" />
            </g>
          );
        }
        if (garnish === "chili") {
          return (
            <g key={`${garnish}-${index}`} transform="translate(146 66) rotate(22)">
              <title>{label}</title>
              <path className="chili" d="M0 4 C16 -5 32 1 40 15 C26 17 10 14 0 4Z" />
              <path className="chili-stem" d="M1 4 C-4 1 -6 -3 -7 -7" />
            </g>
          );
        }
        if (garnish === "bitters_drops") {
          return (
            <g key={`${garnish}-${index}`} transform="translate(108 86)">
              <title>{label}</title>
              <circle className="bitters-drop" cx="0" cy="0" r="2.8" />
              <circle className="bitters-drop" cx="12" cy="-2" r="2.8" />
              <circle className="bitters-drop" cx="24" cy="1" r="2.8" />
            </g>
          );
        }
        if (garnish === "olive") {
          return (
            <g key={`${garnish}-${index}`} transform="translate(123 103)">
              <title>{label}</title>
              <path className="pick" d="M-30 -8 L30 8" />
              <ellipse className="olive" cx="0" cy="0" rx="10" ry="7" transform="rotate(12)" />
            </g>
          );
        }
        return (
          <g key={`${garnish}-${index}`} transform="translate(104 82)">
            <title>{label}</title>
            <ellipse className="coffee-bean" cx={index * 12} cy="0" rx="5" ry="7" />
          </g>
        );
      })}
    </g>
  );
}

export function CocktailVisual({ spec, title, motion, buildProgress = 1 }: CocktailVisualProps) {
  const gradientId = `drink-gradient-${useId().replace(/:/g, "")}`;
  const fill = spec.drinkGradient ? `url(#${gradientId})` : spec.drinkColor;
  const isHorizontalGradient = spec.drinkGradient?.direction === "horizontal";
  const progress = Math.min(Math.max(buildProgress, 0), 1);
  const isBuilding = progress < 1;
  const motionClass = motion ? ` cocktail-motion-${motion}` : "";
  const buildClass = isBuilding ? " visual-stage-building" : "";

  return (
    <div className={`cocktail-visual ${spec.glassType}${motionClass}${buildClass}`} role="img" aria-label={`${title} 的酒图`} style={{ "--build-progress": `${Math.round(progress * 100)}%` } as CSSProperties}>
      <svg viewBox="0 0 240 230" xmlns="http://www.w3.org/2000/svg">
        <title>{title}</title>
        {spec.drinkGradient && (
          <defs>
            <linearGradient
              id={gradientId}
              x1="0%"
              y1={isHorizontalGradient ? "0%" : "100%"}
              x2={isHorizontalGradient ? "100%" : "0%"}
              y2="0%"
            >
              <stop offset="0%" stopColor={spec.drinkGradient.from} />
              {spec.drinkGradient.middle && <stop offset="48%" stopColor={spec.drinkGradient.middle} />}
              <stop offset="100%" stopColor={spec.drinkGradient.to} />
            </linearGradient>
          </defs>
        )}
        <ellipse className="visual-shadow" cx="120" cy="207" rx="68" ry="12" />
        {spec.rimStyle !== "none" && <path className={`${spec.rimStyle}-rim`} d={spec.glassType === "highball" ? "M80 50 H160" : "M62 66 H178"} />}
        <g className="progress-liquid-layer">
          <Liquid spec={spec} fill={fill} />
        </g>
        {progress >= 0.58 && <Foam level={spec.foamLevel} />}
        {progress >= 0.35 && <IceLayer spec={spec} />}
        {progress >= 0.84 && <Bubbles level={spec.bubbleLevel} />}
        {progress >= 0.7 && <Straw show={spec.straw} />}
        {progress >= 0.9 && <Garnishes garnishes={spec.garnish} />}
        <GlassOutline glassType={spec.glassType} />
        <path className="glass-highlight" d="M95 62 C88 103 88 147 96 177" />
      </svg>
    </div>
  );
}
