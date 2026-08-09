import { afterEach, describe, expect, it, vi } from "vitest";
import { triggerHaptic } from "./haptics";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("triggerHaptic", () => {
  it("uses a short selection pulse on touch devices", () => {
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });
    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({ matches: query === "(pointer: coarse)" })
    });

    triggerHaptic("selection");

    expect(vibrate).toHaveBeenCalledWith(7);
  });

  it("stays silent for fine pointers", () => {
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: false })
    });

    triggerHaptic("action");

    expect(vibrate).not.toHaveBeenCalled();
  });

  it("respects reduced motion preferences", () => {
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });
    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({ matches: query !== "(pointer: fine)" })
    });

    triggerHaptic("success");

    expect(vibrate).not.toHaveBeenCalled();
  });
});
