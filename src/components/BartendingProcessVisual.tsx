import type { GlassType } from "../domain/types";

export type BartendingMotion = "prepare" | "add" | "stir" | "shake" | "strain";

type BartendingProcessVisualProps = {
  motion: BartendingMotion;
  glassType: GlassType;
  title: string;
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

function Shaker() {
  return (
    <g className="process-shaker">
      <path d="M88 59h64l-8 88c-1 12-9 18-24 18s-23-6-24-18Z" />
      <path d="M83 59h74l-7-17H90Z" />
      <path d="M96 91h49" />
      <circle className="process-ice" cx="109" cy="112" r="5" />
      <circle className="process-ice" cx="132" cy="127" r="6" />
    </g>
  );
}

export function BartendingProcessVisual({ motion, glassType, title }: BartendingProcessVisualProps) {
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

        {motion === "shake" && <Shaker />}

        {motion === "strain" && (
          <>
            <g className="process-strain-shaker"><Shaker /></g>
            <g className="process-serving-glass"><ServingGlass glassType={glassType} /><path className="process-target-liquid" d="M154 145h35" /></g>
            <path className="process-stream" d="M126 102c12 8 24 17 37 31" />
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

        {motion === "add" && (
          <>
            <g className="process-pour-jigger"><path d="M63 68h42l-9 28 9 28H63l9-28Z" /></g>
            <path className="process-stream" d="M102 101c20 5 34 17 52 34" />
            <g className="process-serving-glass"><ServingGlass glassType={glassType} /><path className="process-target-liquid" d="M154 145h35" /></g>
          </>
        )}
      </svg>
    </div>
  );
}
