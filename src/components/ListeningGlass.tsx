type ListeningGlassProps = {
  state?: "idle" | "listening" | "thinking" | "revealing";
  liquidTone?: "amber" | "ruby" | "citrus";
};

function expressionFor(state: ListeningGlassProps["state"]) {
  if (state === "listening") {
    return {
      mouth: "M105 125 C112 120 128 120 135 125",
      leftEye: "M84 111 C90 105 100 105 106 111",
      rightEye: "M134 111 C140 105 151 105 157 111"
    };
  }

  if (state === "thinking") {
    return {
      mouth: "M109 128 C115 132 123 132 129 128",
      leftEye: "M84 111 C91 106 101 107 107 113",
      rightEye: "M133 113 C140 107 151 106 158 111"
    };
  }

  if (state === "revealing") {
    return {
      mouth: "M101 126 C109 137 131 137 139 126",
      leftEye: "M83 110 C91 104 101 104 109 110",
      rightEye: "M132 110 C140 104 151 104 159 110"
    };
  }

  return {
    mouth: "M103 126 C111 134 129 134 137 126",
    leftEye: "M84 111 C91 106 100 106 107 111",
    rightEye: "M133 111 C140 106 151 106 158 111"
  };
}

export function ListeningGlass({ state = "idle", liquidTone = "ruby" }: ListeningGlassProps) {
  const expression = expressionFor(state);

  return (
    <div className={`listening-glass bartender-glass ${state} ${liquidTone}`} aria-label="酒保杯">
      <svg viewBox="0 0 240 280" role="img" aria-labelledby="bartender-glass-title">
        <title id="bartender-glass-title">酒保杯</title>
        <defs>
          <linearGradient id="glassStroke" x1="48" y1="24" x2="188" y2="252" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#eee8d8" stopOpacity="0.95" />
            <stop offset="0.48" stopColor="#bfb9aa" stopOpacity="0.62" />
            <stop offset="1" stopColor="#fffdf6" stopOpacity="0.36" />
          </linearGradient>
          <linearGradient id="liquidGradient" x1="58" y1="105" x2="188" y2="182" gradientUnits="userSpaceOnUse">
            <stop className="liquid-stop-one" offset="0" />
            <stop className="liquid-stop-two" offset="0.58" />
            <stop className="liquid-stop-three" offset="1" />
          </linearGradient>
          <radialGradient id="glassGlow" cx="50%" cy="35%" r="62%">
            <stop offset="0" stopColor="#f1f5da" stopOpacity="0.54" />
            <stop offset="0.58" stopColor="#cbd9a5" stopOpacity="0.16" />
            <stop offset="1" stopColor="#0d0c0d" stopOpacity="0" />
          </radialGradient>
          <clipPath id="bowlClip">
            <path d="M49 53 C55 89 70 127 95 148 C108 159 132 159 145 148 C170 127 185 89 191 53 Z" />
          </clipPath>
        </defs>

        <ellipse className="glass-shadow" cx="120" cy="250" rx="58" ry="12" />
        <circle className="ambient-glow" cx="120" cy="104" r="94" fill="url(#glassGlow)" />

        <g className="glass-body">
          <path className="bowl" d="M49 53 C55 89 70 127 95 148 C108 159 132 159 145 148 C170 127 185 89 191 53" />
          <path className="rim-front" d="M50 53 C84 57 156 57 190 53" />
          <path className="stem" d="M120 154 C118 180 118 213 108 232 C115 235 125 235 132 232 C122 213 122 180 120 154 Z" />
          <path className="base" d="M77 246 C92 236 148 236 163 246 C148 256 92 256 77 246 Z" />
        </g>

        <g clipPath="url(#bowlClip)">
          <path className="liquid-fill" d="M54 106 C78 101 101 111 124 106 C149 101 171 101 187 108 L184 130 C172 146 151 156 125 158 C92 161 65 145 57 126 Z" />
          <path className="liquid-surface" d="M54 106 C78 101 101 111 124 106 C149 101 171 101 187 108" />
          <path className="liquid-shine" d="M71 116 C84 113 96 114 108 116" />
          <path className="thinking-swirl" d="M88 130 C104 118 136 119 149 132 C137 143 105 144 88 130" />
          <g className="ice-cubes">
            <path d="M76 84 C77 76 84 71 92 72 C101 73 107 80 106 89 C105 98 98 104 89 103 C81 102 75 94 76 84 Z" />
            <path d="M135 87 C136 79 143 74 151 75 C159 76 165 83 164 92 C163 101 156 107 147 106 C139 105 134 96 135 87 Z" />
          </g>
          <g className="bubbles">
            <circle cx="72" cy="127" r="2.2" />
            <circle cx="169" cy="124" r="2" />
            <circle cx="121" cy="139" r="2.1" />
          </g>
        </g>

        <g className="face-lines">
          <path className="smile-eye left" d={expression.leftEye} />
          <path className="smile-eye right" d={expression.rightEye} />
          <path className="glass-mouth" d={expression.mouth} />
        </g>

        <g className="leaf-garnish">
          <path className="leaf-stem" d="M149 50 C161 37 171 28 186 21" />
          <path className="leaf" d="M150 49 C157 27 174 16 194 15 C191 34 174 48 150 49 Z" />
          <path className="leaf-vein" d="M155 44 C166 35 177 26 190 18" />
        </g>

        <path className="rim-light" d="M55 53 C87 46 153 46 185 53" />
        <path className="reveal-arc" d="M74 152 C109 181 176 145 160 92" />
      </svg>
    </div>
  );
}
