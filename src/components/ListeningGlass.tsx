type ListeningGlassProps = {
  state?: "idle" | "listening" | "thinking" | "revealing";
  liquidTone?: "amber" | "ruby" | "citrus";
};

export function ListeningGlass({ state = "idle", liquidTone = "ruby" }: ListeningGlassProps) {
  return (
    <div className={`listening-glass ${state} ${liquidTone}`} aria-label="聆听之杯">
      <svg viewBox="0 0 240 280" role="img" aria-labelledby="listening-glass-title">
        <title id="listening-glass-title">聆听之杯</title>
        <defs>
          <linearGradient id="glassStroke" x1="45" y1="20" x2="190" y2="250" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff8e8" stopOpacity="0.85" />
            <stop offset="0.45" stopColor="#d9b776" stopOpacity="0.32" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id="liquidGradient" x1="54" y1="110" x2="185" y2="220" gradientUnits="userSpaceOnUse">
            <stop className="liquid-stop-one" offset="0" />
            <stop className="liquid-stop-two" offset="0.58" />
            <stop className="liquid-stop-three" offset="1" />
          </linearGradient>
          <radialGradient id="glassGlow" cx="50%" cy="35%" r="62%">
            <stop offset="0" stopColor="#f5cf8a" stopOpacity="0.42" />
            <stop offset="0.55" stopColor="#9b4939" stopOpacity="0.12" />
            <stop offset="1" stopColor="#0d0c0d" stopOpacity="0" />
          </radialGradient>
          <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="bowlClip">
            <path d="M54 57 C58 126 71 180 96 204 C108 216 132 216 144 204 C169 180 182 126 186 57 Z" />
          </clipPath>
        </defs>

        <ellipse className="glass-shadow" cx="120" cy="250" rx="62" ry="14" />
        <circle className="ambient-glow" cx="120" cy="116" r="96" fill="url(#glassGlow)" />

        <g className="glass-body">
          <ellipse className="rim-back" cx="120" cy="58" rx="67" ry="18" />
          <path className="bowl" d="M54 57 C58 126 71 180 96 204 C108 216 132 216 144 204 C169 180 182 126 186 57" />
          <ellipse className="rim-front" cx="120" cy="58" rx="67" ry="18" />
          <path className="stem" d="M120 207 C118 226 116 236 104 244 L136 244 C124 236 122 226 120 207 Z" />
          <path className="base" d="M82 248 C96 239 144 239 158 248 C144 258 96 258 82 248 Z" />
        </g>

        <g clipPath="url(#bowlClip)">
          <path className="liquid-surface" d="M63 137 C87 125 111 146 137 134 C154 126 171 130 181 138 L176 195 C161 215 84 216 68 195 Z" />
          <path className="liquid-fill" d="M62 139 C89 128 112 147 139 134 C156 126 173 131 182 140 L176 202 C158 221 85 222 67 202 Z" />
          <path className="liquid-shine" d="M78 151 C99 143 122 154 145 144" />
          <path className="spirit-thread" d="M82 178 C98 143 133 158 118 121 C108 96 145 90 155 69" />
          <path className="thinking-swirl" d="M84 166 C105 143 148 145 158 166 C168 187 123 199 104 183" />
          <g className="ice">
            <rect x="93" y="142" width="28" height="28" rx="7" transform="rotate(-18 107 156)" />
            <rect x="126" y="152" width="23" height="23" rx="6" transform="rotate(14 137 164)" />
          </g>
          <g className="bubbles">
            <circle cx="88" cy="180" r="3" />
            <circle cx="103" cy="165" r="2.3" />
            <circle cx="145" cy="174" r="2.7" />
            <circle cx="156" cy="150" r="2" />
            <circle cx="121" cy="188" r="2.2" />
          </g>
        </g>

        <path className="rim-light" d="M64 54 C88 42 144 40 177 56" />
        <path className="reveal-arc" d="M76 210 C122 238 188 184 158 106" />
      </svg>
    </div>
  );
}
