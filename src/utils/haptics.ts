export type HapticKind = "selection" | "action" | "success";

const patterns: Record<HapticKind, number | number[]> = {
  selection: 7,
  action: 12,
  success: [12, 24, 16]
};

export function triggerHaptic(kind: HapticKind) {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  if (!("vibrate" in navigator)) return;
  if (!window.matchMedia("(pointer: coarse)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  navigator.vibrate(patterns[kind]);
}
