import type { GlassType } from "../domain/types";

export type BartendingMotion =
  | "prepare"
  | "combine"
  | "build"
  | "muddle"
  | "stir"
  | "stir-in-glass"
  | "dry-shake"
  | "shake"
  | "strain"
  | "transfer"
  | "blend"
  | "rim"
  | "layer"
  | "side-serve";

export type BartendingVessel = "shaker" | "mixing-glass" | "serving-glass";

type BartendingProcessVisualProps = {
  motion: BartendingMotion;
  glassType: GlassType;
  title: string;
  vessel?: BartendingVessel;
};

function ServingGlass({ glassType }: { glassType: GlassType }) {
  if (glassType === "collins" || glassType === "highball" || glassType === "hurricane") {
    return <path className="process-glass" d="M151 91h42l-5 74h-32Z" />;
  }

  if (glassType === "old_fashioned" || glassType === "mule_mug") {
    return <path className="process-glass" d="M148 116h48l-5 48h-38Z" />;
  }

  if (glassType === "wine") {
    return <path className="process-glass" d="M147 91c0 30 9 43 25 43s25-13 25-43Zm25 43v28m-15 4h30" />;
  }

  return <path className="process-glass" d="M143 104h58c-4 23-13 31-29 31s-25-8-29-31Zm29 31v28m-16 3h32" />;
}

function Shaker({ withIce = true }: { withIce?: boolean }) {
  return (
    <g className="process-shaker">
      <path d="M88 59h64l-8 88c-1 12-9 18-24 18s-23-6-24-18Z" />
      <path d="M83 59h74l-7-17H90Z" />
      <path d="M96 91h49" />
      {withIce && <circle className="process-ice" cx="109" cy="112" r="5" />}
      {withIce && <circle className="process-ice" cx="132" cy="127" r="6" />}
    </g>
  );
}

export function BartendingProcessVisual({ motion, glassType, title, vessel = "serving-glass" }: BartendingProcessVisualProps) {
  return (
    <div className={`bartending-process-visual process-${motion}`} role="img" aria-label={`${title}：${motion} 制作示意`}>
      <svg viewBox="0 0 240 210" aria-hidden="true">
        <ellipse className="process-shadow" cx="120" cy="185" rx="72" ry="9" />

        {motion === "prepare" && (
          <g className="process-tools">
            <g className="prepare-shaker"><Shaker /></g>
            <g className="process-jigger"><path d="M39 87h30l-7 22 7 22H39l7-22Z" /></g>
            <g className="prepare-ice"><rect x="171" y="87" width="25" height="25" rx="5" /><rect x="159" y="115" width="27" height="27" rx="5" /></g>
          </g>
        )}

        {motion === "dry-shake" && <Shaker withIce={false} />}

        {motion === "shake" && <Shaker />}

        {motion === "strain" && (
          <>
            <g className="process-strain-shaker"><Shaker /></g>
            <g className="process-serving-glass"><ServingGlass glassType={glassType} /><path className="process-target-liquid" d="M154 145h35" /></g>
            <path className="process-stream" d="M126 102c12 8 24 17 37 31" />
          </>
        )}

        {motion === "transfer" && (
          <>
            <g className="process-transfer-source">
              <path className="process-glass" d="M68 55h66l-7 94H75Z" />
              <path className="process-liquid" d="M77 103h49l-3 38H80Z" />
            </g>
            <g className="process-serving-glass"><ServingGlass glassType={glassType} /><path className="process-target-liquid" d="M154 145h35" /></g>
            <path className="process-stream" d="M116 105c17 7 30 17 46 29" />
          </>
        )}

        {motion === "stir" && (
          <g className="process-mixing-glass">
            <path className="process-glass" d="M78 62h84l-8 102H86Z" />
            <path className="process-liquid" d="M88 110h64l-4 46H92Z" />
            <rect className="process-ice" x="101" y="118" width="18" height="18" rx="4" />
            <rect className="process-ice" x="126" y="131" width="18" height="18" rx="4" />
            <g className="process-spoon"><path d="M138 39 116 148" /><ellipse cx="114" cy="154" rx="5" ry="9" /></g>
          </g>
        )}

        {motion === "stir-in-glass" && (
          <g className="process-built-glass">
            <ServingGlass glassType={glassType} />
            <path className="process-liquid" d="M154 132h36l-2 28h-32Z" />
            <rect className="process-ice" x="160" y="128" width="13" height="13" rx="3" />
            <rect className="process-ice" x="174" y="139" width="13" height="13" rx="3" />
            <g className="process-spoon"><path d="M185 70 169 151" /><ellipse cx="168" cy="157" rx="4" ry="7" /></g>
          </g>
        )}

        {motion === "muddle" && (
          <g className="process-muddle-glass">
            <ServingGlass glassType={glassType} />
            <path className="process-herbs" d="m157 151 8-7 7 7 8-8 7 8" />
            <g className="process-muddler"><path d="m187 62-19 91" /><path d="m163 151 11 3" /></g>
          </g>
        )}

        {motion === "combine" && (
          <>
            {vessel === "mixing-glass" ? (
              <g className="process-combine-mixing-glass"><path className="process-glass" d="M88 62h72l-7 101H95Z" /></g>
            ) : (
              <g className="process-combine-shaker"><Shaker withIce={false} /></g>
            )}
            <g className="process-pour-jigger"><path d="M53 65h36l-8 24 8 24H53l8-24Z" /></g>
            <path className="process-stream" d="M87 93c12 4 20 10 29 19" />
          </>
        )}

        {motion === "build" && (
          <>
            <g className="process-pour-jigger"><path d="M63 68h42l-9 28 9 28H63l9-28Z" /></g>
            <path className="process-stream" d="M102 101c20 5 34 17 52 34" />
            <g className="process-serving-glass"><ServingGlass glassType={glassType} /><path className="process-target-liquid" d="M154 145h35" /></g>
          </>
        )}

        {motion === "blend" && (
          <g className="process-blender">
            <path className="process-glass" d="M80 55h80l-10 88H90Z" />
            <path className="process-liquid" d="M91 91h58l-6 43H97Z" />
            <path d="M104 143h32l9 19H95Z" />
            <path d="m106 112 13-9 12 13 12-11" />
          </g>
        )}

        {motion === "rim" && (
          <g className="process-rim-glass">
            <ServingGlass glassType={glassType} />
            <path className="process-rim" d="M143 104h58" />
            <ellipse className="process-salt-dish" cx="86" cy="157" rx="38" ry="8" />
            <path className="process-wedge" d="m75 86 22 8-16 18Z" />
          </g>
        )}

        {motion === "layer" && (
          <>
            <g className="process-layer-bottle"><path d="M61 55h30v18l9 10-15 43H55L40 83l9-10V55Z" /></g>
            <path className="process-stream" d="M82 113c25 4 46 13 73 28" />
            <g className="process-serving-glass"><ServingGlass glassType={glassType} /><path className="process-target-liquid" d="M154 145h35" /><path className="process-layer-liquid" d="M155 137h34" /></g>
          </>
        )}

        {motion === "side-serve" && (
          <>
            <g className="process-side-bottle"><path d="M58 49h28v20l9 11-12 48H55L43 80l9-11V49Z" /></g>
            <path className="process-stream" d="M83 113c17 5 29 13 42 25" />
            <g className="process-side-glass">
              <path className="process-glass" d="M119 112h31l-4 48h-23Z" />
              <path className="process-target-liquid" d="M123 150h23" />
            </g>
            <g className="process-main-cocktail"><ServingGlass glassType={glassType} /></g>
          </>
        )}
      </svg>
    </div>
  );
}
